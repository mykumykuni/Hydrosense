const { getState, saveState } = require('../backend/database/store');
const { advanceState } = require('../backend/database/engine');
const { applyAction } = require('../backend/database/actions');

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

const toPublicState = (state) => ({
  thresholds: state.thresholds,
  sensors: state.sensors,
  history: state.history,
  historyWindow: state.historyWindow,
  alertLog: state.alertLog,
  updatedAt: state.updatedAt,
  syncMode: 'vercel-api-live'
});

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  let state = getState();
  state = advanceState(state);

  if (req.method === 'POST') {
    const body = parseBody(req);
    const action = String(body.action || '');
    const payload = body.payload || {};
    const role = body.role === 'admin' ? 'admin' : 'operator';

    if (action) {
      state = applyAction(state, action, payload, role);
      state = advanceState(state);
    }
  }

  const saved = saveState(state);
  res.status(200).send(JSON.stringify(toPublicState(saved)));
};
