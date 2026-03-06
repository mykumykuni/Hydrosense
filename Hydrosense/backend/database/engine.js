const { limits } = require('./stateFactory');

const STEP_MS = 150;
const TARGET_UPDATE_MS = 8000;
const ALERT_COOLDOWN_MS = 8000;
const MAX_STEPS_PER_REQUEST = 120;
const MIN_HISTORY_POINTS = 12;
const MAX_HISTORY_POINTS = 180;

const toNumber = (value, fallback) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalizeRuntime = (state, now) => {
  if (!state.runtime || typeof state.runtime !== 'object') {
    state.runtime = {};
  }
  if (!state.runtime.targets || typeof state.runtime.targets !== 'object') {
    state.runtime.targets = { ...state.sensors };
  }
  if (!state.runtime.conditionFlags || typeof state.runtime.conditionFlags !== 'object') {
    state.runtime.conditionFlags = {};
  }
  if (!state.runtime.cooldownByKey || typeof state.runtime.cooldownByKey !== 'object') {
    state.runtime.cooldownByKey = {};
  }

  state.runtime.targetUpdatedAt = toNumber(state.runtime.targetUpdatedAt, now);
  state.runtime.lastTickAt = toNumber(state.runtime.lastTickAt, now);
  state.historyWindow = clamp(toNumber(state.historyWindow, 32), MIN_HISTORY_POINTS, MAX_HISTORY_POINTS);
};

const pushAlert = (state, severity, title, message, source, now) => {
  const key = `${source}-${severity}`;
  const last = state.runtime.cooldownByKey[key] || 0;
  if (now - last < ALERT_COOLDOWN_MS) return;

  state.runtime.cooldownByKey[key] = now;
  state.alertLog.unshift({
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    severity,
    title,
    message,
    source,
    read: false,
    resolved: false,
    ts: now
  });

  if (state.alertLog.length > 300) {
    state.alertLog = state.alertLog.slice(0, 300);
  }
};

const updateTargets = (state) => {
  Object.keys(limits).forEach((key) => {
    const limit = limits[key];
    const chance = Math.random();
    if (chance < 0.2) {
      state.runtime.targets[key] = key === 'do'
        ? +(Math.random() * 1.6).toFixed(2)
        : +(limit.critical + 0.05).toFixed(3);
    } else {
      state.runtime.targets[key] = +(limit.min + Math.random() * (limit.max - limit.min)).toFixed(3);
    }
  });
};

const driftSensors = (state) => {
  const next = { ...state.sensors };

  Object.keys(limits).forEach((key) => {
    const target = toNumber(state.runtime.targets[key], next[key]);
    const diff = target - next[key];
    next[key] = +(next[key] + diff * 0.02).toFixed(4);
  });

  // Water level is system-driven and moves slowly over time.
  const waterDelta = (Math.random() - 0.5) * 0.3;
  next.waterLevel = +clamp(next.waterLevel + waterDelta, 45, 98).toFixed(2);
  next.uptime = toNumber(next.uptime, 0) + 1;

  state.sensors = next;

  Object.keys(limits).forEach((key) => {
    const entries = Array.isArray(state.history[key]) ? state.history[key] : [];
    entries.push(next[key]);
    state.history[key] = entries.slice(-state.historyWindow);
  });
};

const evaluateAlerts = (state, now) => {
  Object.keys(limits).forEach((key) => {
    const range = state.thresholds[key] || { min: limits[key].min, max: limits[key].max };
    const limit = limits[key];
    const value = toNumber(state.sensors[key], limit.min);

    const outFlagKey = `${key}-out`;
    const isOut = value < range.min || value > range.max;
    const wasOut = Boolean(state.runtime.conditionFlags[outFlagKey]);
    if (isOut && !wasOut) {
      pushAlert(state, 'warning', `${limit.label} Out of Range`, `${limit.label} is ${value.toFixed(3)} ${limit.unit}.`, outFlagKey, now);
    }
    state.runtime.conditionFlags[outFlagKey] = isOut;

    if (limit.critical) {
      const criticalFlagKey = `${key}-critical`;
      const isCritical = key === 'do' ? value <= limit.critical : value >= limit.critical;
      const wasCritical = Boolean(state.runtime.conditionFlags[criticalFlagKey]);
      if (isCritical && !wasCritical) {
        pushAlert(state, 'critical', `${limit.label} Critical`, `${limit.label} hit critical threshold at ${value.toFixed(3)} ${limit.unit}.`, criticalFlagKey, now);
      }
      state.runtime.conditionFlags[criticalFlagKey] = isCritical;
    }
  });

  const lowWater = state.sensors.waterLevel <= 55;
  const highWater = state.sensors.waterLevel >= 95;

  if (lowWater && !state.runtime.conditionFlags['water-low']) {
    pushAlert(state, 'warning', 'Water Level Low', `Tank level is ${state.sensors.waterLevel}%. Check inlet flow.`, 'water-low', now);
  }
  if (highWater && !state.runtime.conditionFlags['water-high']) {
    pushAlert(state, 'warning', 'Water Level High', `Tank level is ${state.sensors.waterLevel}%. Check drainage.`, 'water-high', now);
  }

  state.runtime.conditionFlags['water-low'] = lowWater;
  state.runtime.conditionFlags['water-high'] = highWater;
};

const advanceState = (state) => {
  const now = Date.now();
  normalizeRuntime(state, now);

  if (!state.runtime.initialized) {
    pushAlert(state, 'info', 'System Initialized', 'Live sensor monitoring session started.', 'system', now);
    state.runtime.initialized = true;
  }

  if (now - state.runtime.targetUpdatedAt >= TARGET_UPDATE_MS) {
    updateTargets(state);
    state.runtime.targetUpdatedAt = now;
  }

  const elapsed = Math.max(0, now - state.runtime.lastTickAt);
  const steps = Math.min(MAX_STEPS_PER_REQUEST, Math.floor(elapsed / STEP_MS));

  for (let i = 0; i < steps; i += 1) {
    driftSensors(state);
  }

  if (steps > 0) {
    state.runtime.lastTickAt += steps * STEP_MS;
  }

  evaluateAlerts(state, now);
  state.updatedAt = now;
  return state;
};

module.exports = {
  MIN_HISTORY_POINTS,
  MAX_HISTORY_POINTS,
  advanceState
};
