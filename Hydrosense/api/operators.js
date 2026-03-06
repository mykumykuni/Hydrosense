const { getState, saveState } = require('../backend/database/store');
const { ensureAdminSeed, sanitizeUser, getAuthenticatedUser } = require('../backend/database/auth');

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

const listOperators = (state, searchQuery) => {
  const term = String(searchQuery || '').trim().toLowerCase();

  return state.users
    .filter((user) => user.role === 'operator')
    .filter((user) => {
      if (!term) return true;
      const name = String(user.profile?.displayName || '').toLowerCase();
      return user.email.includes(term) || name.includes(term);
    })
    .map((user) => sanitizeUser(user))
    .sort((a, b) => b.createdAt - a.createdAt);
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  let state = await getState();
  ensureAdminSeed(state);

  const auth = getAuthenticatedUser(state, req);
  if (!auth.ok) {
    res.status(401).send(JSON.stringify({ ok: false, error: auth.error }));
    return;
  }

  if (auth.user.role !== 'admin') {
    res.status(403).send(JSON.stringify({ ok: false, error: 'admin_only' }));
    return;
  }

  if (req.method === 'GET') {
    const search = req.query?.search || '';
    const operators = listOperators(state, search);
    const pendingCount = operators.filter((user) => user.status === 'pending').length;
    // Never saveState on a GET — writing stale state back overwrites concurrent mutations.
    res.status(200).send(JSON.stringify({ ok: true, operators, pendingCount }));
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
    return;
  }

  const body = parseBody(req);
  const action = String(body.action || '');
  const targetId = String(body.payload?.userId || '');

  const target = state.users.find((user) => user.id === targetId && user.role === 'operator');
  if (!target) {
    res.status(404).send(JSON.stringify({ ok: false, error: 'operator_not_found' }));
    return;
  }

  if (action === 'approve_operator') {
    target.status = 'active';
    target.approvedAt = Date.now();
    target.deactivatedAt = null;
    target.updatedAt = Date.now();
  } else if (action === 'deactivate_operator') {
    target.status = 'deactivated';
    target.deactivatedAt = Date.now();
    target.updatedAt = Date.now();

    // Invalidate existing sessions for this operator.
    Object.keys(state.sessions || {}).forEach((token) => {
      const session = state.sessions[token];
      if (session?.userId === target.id) {
        delete state.sessions[token];
      }
    });
  } else if (action === 'reactivate_operator') {
    target.status = 'active';
    target.deactivatedAt = null;
    if (!target.approvedAt) target.approvedAt = Date.now();
    target.updatedAt = Date.now();
  } else {
    res.status(400).send(JSON.stringify({ ok: false, error: 'unknown_action' }));
    return;
  }

  const operators = listOperators(state, '');
  const pendingCount = operators.filter((user) => user.status === 'pending').length;

  await saveState(state);
  res.status(200).send(JSON.stringify({ ok: true, operators, pendingCount }));
};
