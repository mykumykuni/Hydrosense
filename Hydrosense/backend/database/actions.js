const { limits } = require('./stateFactory');
const { MIN_HISTORY_POINTS, MAX_HISTORY_POINTS } = require('./engine');

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalizeThreshold = (state, key) => {
  const fallback = { min: limits[key].min, max: limits[key].max };
  const current = state.thresholds[key] || fallback;
  return {
    min: Number.isFinite(Number(current.min)) ? Number(current.min) : fallback.min,
    max: Number.isFinite(Number(current.max)) ? Number(current.max) : fallback.max
  };
};

const requireAdmin = (role) => role === 'admin';

const applyAction = (state, action, payload, role) => {
  const nextPayload = payload && typeof payload === 'object' ? payload : {};

  switch (action) {
    case 'mark_all_read': {
      state.alertLog = state.alertLog.map((item) => ({ ...item, read: true }));
      break;
    }

    case 'toggle_read': {
      const id = String(nextPayload.id || '');
      if (!id) break;
      state.alertLog = state.alertLog.map((item) => (item.id === id ? { ...item, read: !item.read } : item));
      break;
    }

    case 'clear_all_alerts': {
      if (!requireAdmin(role)) break;
      state.alertLog = [];
      break;
    }

    case 'resolve_alert': {
      if (!requireAdmin(role)) break;
      const id = String(nextPayload.id || '');
      if (!id) break;
      state.alertLog = state.alertLog.map((item) => (item.id === id ? { ...item, read: true, resolved: true } : item));
      break;
    }

    case 'create_manual_alert': {
      if (!requireAdmin(role)) break;
      const now = Date.now();
      state.alertLog.unshift({
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        severity: 'info',
        title: 'Manual Operator Alert',
        message: 'Operator created a manual checkpoint alert.',
        source: 'manual-operator',
        read: false,
        resolved: false,
        ts: now
      });
      break;
    }

    case 'report_operator_issue': {
      const now = Date.now();
      state.alertLog.unshift({
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        severity: 'warning',
        title: 'Operator Issue Reported',
        message: 'Operator requested admin review on live conditions.',
        source: 'operator-report',
        read: false,
        resolved: false,
        ts: now
      });
      break;
    }

    case 'update_threshold': {
      if (!requireAdmin(role)) break;
      const key = String(nextPayload.key || '');
      const field = String(nextPayload.field || '');
      const value = Number(nextPayload.value);

      if (!Object.prototype.hasOwnProperty.call(limits, key)) break;
      if (!['min', 'max'].includes(field)) break;
      if (Number.isNaN(value)) break;

      const current = normalizeThreshold(state, key);
      const updated = { ...current, [field]: value };
      if (field === 'min' && updated.min >= updated.max) updated.min = +(updated.max - 0.01).toFixed(3);
      if (field === 'max' && updated.max <= updated.min) updated.max = +(updated.min + 0.01).toFixed(3);
      state.thresholds[key] = updated;
      break;
    }

    case 'set_history_window': {
      if (!requireAdmin(role)) break;
      const value = Number(nextPayload.value);
      if (Number.isNaN(value)) break;
      state.historyWindow = clamp(Math.round(value), MIN_HISTORY_POINTS, MAX_HISTORY_POINTS);
      Object.keys(state.history).forEach((key) => {
        const entries = Array.isArray(state.history[key]) ? state.history[key] : [];
        state.history[key] = entries.slice(-state.historyWindow);
      });
      break;
    }

    default:
      break;
  }

  if (state.alertLog.length > 300) {
    state.alertLog = state.alertLog.slice(0, 300);
  }

  return state;
};

module.exports = {
  applyAction
};
