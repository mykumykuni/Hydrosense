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

const MAX_PHOTO_LENGTH = 1_400_000;

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
    await saveState(state);
    res.status(401).send(JSON.stringify({ ok: false, error: auth.error }));
    return;
  }

  const user = auth.user;

  if (req.method === 'GET') {
    await saveState(state);
    res.status(200).send(JSON.stringify({ ok: true, user: sanitizeUser(user) }));
    return;
  }

  if (req.method !== 'PATCH') {
    await saveState(state);
    res.status(405).send(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
    return;
  }

  if (user.role !== 'operator') {
    await saveState(state);
    res.status(403).send(JSON.stringify({ ok: false, error: 'operators_only' }));
    return;
  }

  const payload = parseBody(req).payload || {};
  const profile = user.profile || {};

  const nextPhoto = String(payload.photoDataUrl || profile.photoDataUrl || '');
  if (nextPhoto.length > MAX_PHOTO_LENGTH) {
    await saveState(state);
    res.status(400).send(JSON.stringify({ ok: false, error: 'photo_too_large' }));
    return;
  }

  user.profile = {
    displayName: String(payload.displayName || profile.displayName || '').slice(0, 80),
    photoDataUrl: nextPhoto,
    phone: String(payload.phone || profile.phone || '').slice(0, 40),
    address: String(payload.address || profile.address || '').slice(0, 200),
    bio: String(payload.bio || profile.bio || '').slice(0, 300),
    position: String(payload.position || profile.position || '').slice(0, 80),
    emergencyContact: String(payload.emergencyContact || profile.emergencyContact || '').slice(0, 120)
  };
  user.updatedAt = Date.now();

  await saveState(state);
  res.status(200).send(JSON.stringify({ ok: true, user: sanitizeUser(user) }));
};
