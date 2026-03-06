const { getState, saveState } = require('../backend/database/store');
const { ensureAdminSeed, registerOperator, loginUser } = require('../backend/database/auth');

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

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  const body = parseBody(req);
  const action = String(body.action || '');

  let state = await getState();
  ensureAdminSeed(state);

  if (action === 'register') {
    const result = registerOperator(state, body.payload || {});
    state.updatedAt = Date.now();
    
    if (!result.ok) {
      console.log(`[AUTH:REGISTER] ✗ Registration failed: ${result.error}`);
      res.status(400).send(JSON.stringify({ ok: false, error: result.error }));
      return;
    }

    console.log(`[AUTH:REGISTER] ✓ Registered ${result.user.email} as operator. Total users now: ${state.users.length}`);
    
    const saved = await saveState(state);
    console.log(`[AUTH:REGISTER] State saved. Now have ${saved.users.filter(u => u.role === 'operator').length} operators in storage`);

    res.status(200).send(JSON.stringify({
      ok: true,
      message: 'Registration submitted. Await admin approval before login.',
      user: result.user
    }));
    return;
  }

  if (action === 'login') {
    const result = loginUser(state, body.payload || {});
    state.updatedAt = Date.now();
    await saveState(state);

    if (!result.ok) {
      res.status(401).send(JSON.stringify({ ok: false, error: result.error }));
      return;
    }

    res.status(200).send(JSON.stringify({
      ok: true,
      token: result.token,
      user: result.user
    }));
    return;
  }

  res.status(400).send(JSON.stringify({ ok: false, error: 'unknown_action' }));
};
