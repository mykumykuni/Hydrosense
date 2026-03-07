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

const pushAudit = (state, actorEmail, action, detail) => {
  const now = Date.now();
  if (!Array.isArray(state.auditLog)) state.auditLog = [];
  state.auditLog.unshift({
    id: `aud-${now}-${Math.random().toString(36).slice(2, 6)}`,
    action,
    actorEmail: actorEmail || 'unknown',
    detail,
    ts: now
  });
  if (state.auditLog.length > 200) state.auditLog = state.auditLog.slice(0, 200);
};

const applyAction = (state, action, payload, role, actorEmail) => {
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
      pushAudit(state, actorEmail, 'clear_all_alerts', 'Cleared all alerts');
      break;
    }

    case 'resolve_alert': {
      if (!requireAdmin(role)) break;
      const id = String(nextPayload.id || '');
      if (!id) break;
      state.alertLog = state.alertLog.map((item) => (item.id === id ? { ...item, read: true, resolved: true } : item));
      pushAudit(state, actorEmail, 'resolve_alert', `Resolved alert ${id}`);
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
      pushAudit(state, actorEmail, 'create_manual_alert', 'Created manual checkpoint alert');
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

    case 'report_sensor_issue': {
      const sensorKey = String(nextPayload.sensorKey || '');
      const sensorLabel = String(nextPayload.sensorLabel || sensorKey);
      const now = Date.now();
      state.alertLog.unshift({
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        severity: 'warning',
        title: `Sensor Issue: ${sensorLabel}`,
        message: `${actorEmail || 'Operator'} reported an issue with the ${sensorLabel} sensor.`,
        source: `${sensorKey}-operator-report`,
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
      pushAudit(state, actorEmail, 'update_threshold', `Updated ${key} ${field} threshold to ${value}`);
      break;
    }

    case 'set_history_window': {
      if (!requireAdmin(role)) break;
      const value = Number(nextPayload.value);
      if (Number.isNaN(value)) break;
      const prev = state.historyWindow;
      state.historyWindow = clamp(Math.round(value), MIN_HISTORY_POINTS, MAX_HISTORY_POINTS);
      Object.keys(state.history).forEach((key) => {
        const entries = Array.isArray(state.history[key]) ? state.history[key] : [];
        state.history[key] = entries.slice(-state.historyWindow);
      });
      pushAudit(state, actorEmail, 'set_history_window', `Changed history window from ${prev} to ${state.historyWindow} points`);
      break;
    }

    case 'set_announcement': {
      if (!requireAdmin(role)) break;
      const message = String(nextPayload.message || '').trim().slice(0, 500);
      if (!message) break;
      if (!state.announcement) state.announcement = {};
      state.announcement = { message, setAt: Date.now(), setByEmail: actorEmail || 'admin' };
      pushAudit(state, actorEmail, 'set_announcement', `Set announcement: "${message.slice(0, 60)}${message.length > 60 ? '...' : ''}"`);
      break;
    }

    case 'clear_announcement': {
      if (!requireAdmin(role)) break;
      state.announcement = { message: '', setAt: null, setByEmail: '' };
      pushAudit(state, actorEmail, 'clear_announcement', 'Cleared announcement banner');
      break;
    }

    case 'submit_shift_log': {
      const note = String(nextPayload.note || '').trim().slice(0, 1000);
      if (!note) break;
      const now = Date.now();
      if (!Array.isArray(state.shiftLogs)) state.shiftLogs = [];
      state.shiftLogs.unshift({
        id: `sl-${now}-${Math.random().toString(36).slice(2, 8)}`,
        operatorEmail: actorEmail || 'unknown',
        operatorName: String(nextPayload.operatorName || ''),
        note,
        ts: now
      });
      if (state.shiftLogs.length > 100) state.shiftLogs = state.shiftLogs.slice(0, 100);
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
  applyAction,
  pushAudit
};
