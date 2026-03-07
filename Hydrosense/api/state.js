const { getState, saveState } = require('../backend/database/store');
const { advanceState } = require('../backend/database/engine');
const { applyAction } = require('../backend/database/actions');
const { ensureAdminSeed, getAuthenticatedUser } = require('../backend/database/auth');

const parseBody = (req) => {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
};

const toPublicState = (state, user) => {
  const base = {
    thresholds: state.thresholds,
    sensors: state.sensors,
    history: state.history,
    historyWindow: state.historyWindow,
    alertLog: state.alertLog,
    announcement: state.announcement || { message: '', setAt: null, setByEmail: '' },
    updatedAt: state.updatedAt,
    syncMode: 'vercel-api-live'
  };
  if (user?.role === 'admin') {
    base.auditLog = state.auditLog || [];
    base.shiftLogs = state.shiftLogs || [];
  } else if (user) {
    base.shiftLogs = (state.shiftLogs || []).filter((l) => l.operatorEmail === user.email);
  }
  return base;
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!['GET', 'POST'].includes(req.method)) {
    res.status(405).send(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  let state = await getState();
  ensureAdminSeed(state);
  state = advanceState(state);

  // Resolve auth for both GET and POST (optional on GET — determines role-specific response)
  const auth = getAuthenticatedUser(state, req);
  const contextUser = auth.ok ? auth.user : null;

  if (req.method === 'POST') {
    if (!auth.ok) {
      await saveState(state);
      res.status(401).send(JSON.stringify({ ok: false, error: auth.error }));
      return;
    }

    const body = parseBody(req);
    const action = String(body.action || '');
    const payload = body.payload || {};
    const role = auth.user.role === 'admin' ? 'admin' : 'operator';

    if (action) {
      state = applyAction(state, action, payload, role, auth.user.email);
      state = advanceState(state);
    }
  }

  const saved = await saveState(state);
  res.status(200).send(JSON.stringify(toPublicState(saved, contextUser)));
};
