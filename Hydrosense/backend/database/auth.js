const crypto = require('crypto');

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const ADMIN_SEED_EMAIL = String(process.env.HYDROSENSE_ADMIN_EMAIL || 'admin.hydrosense@gmail.com').trim().toLowerCase();
const ADMIN_SEED_PASSWORD = String(process.env.HYDROSENSE_ADMIN_PASSWORD || 'admin@123');
const AUTH_TOKEN_SECRET = String(process.env.HYDROSENSE_AUTH_TOKEN_SECRET || 'hydrosense-dev-token-secret');

const now = () => Date.now();

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const hashPassword = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
};

const createPasswordRecord = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  return { salt, hash };
};

const verifyPassword = (password, salt, hash) => {
  const computed = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
};

const toBase64Url = (input) => Buffer.from(input).toString('base64url');

const fromBase64Url = (input) => {
  try {
    return Buffer.from(String(input || ''), 'base64url').toString('utf8');
  } catch {
    return '';
  }
};

const signPayload = (encodedPayload) => {
  return crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(encodedPayload).digest('base64url');
};

const createSignedSessionToken = (userId) => {
  const issuedAt = now();
  const payload = {
    v: 1,
    uid: userId,
    iat: issuedAt,
    exp: issuedAt + SESSION_TTL_MS
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

const verifySignedSessionToken = (token) => {
  const [encodedPayload, signature] = String(token || '').split('.');
  if (!encodedPayload || !signature) return { ok: false };

  const expected = signPayload(encodedPayload);
  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return { ok: false };
    }
  } catch {
    return { ok: false };
  }

  const rawPayload = fromBase64Url(encodedPayload);
  if (!rawPayload) return { ok: false };

  try {
    const payload = JSON.parse(rawPayload);
    if (!payload || payload.v !== 1 || !payload.uid || !payload.exp) {
      return { ok: false };
    }
    if (payload.exp <= now()) {
      return { ok: false, expired: true };
    }
    return { ok: true, userId: String(payload.uid) };
  } catch {
    return { ok: false };
  }
};

const sanitizeUser = (user) => {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    profile: user.profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    approvedAt: user.approvedAt || null,
    deactivatedAt: user.deactivatedAt || null,
    lastLoginAt: user.lastLoginAt || null
  };
};

const ensureUserState = (state) => {
  if (!Array.isArray(state.users)) state.users = [];
  if (!state.sessions || typeof state.sessions !== 'object') state.sessions = {};
};

const ensureAdminSeed = (state) => {
  ensureUserState(state);
  const hasAdmin = state.users.some((user) => user.role === 'admin');
  if (hasAdmin) return;

  // Env vars can override defaults for production deployments.
  if (!ADMIN_SEED_EMAIL || !ADMIN_SEED_PASSWORD) return;
  if (ADMIN_SEED_PASSWORD.length < 8) return;

  const email = normalizeEmail(ADMIN_SEED_EMAIL);
  const credentials = createPasswordRecord(ADMIN_SEED_PASSWORD);
  const timestamp = now();

  state.users.push({
    id: `user-${crypto.randomUUID()}`,
    email,
    role: 'admin',
    status: 'active',
    passwordSalt: credentials.salt,
    passwordHash: credentials.hash,
    profile: {
      displayName: 'Hydrosense Admin',
      photoDataUrl: '',
      phone: '',
      address: '',
      bio: '',
      position: 'Administrator',
      emergencyContact: ''
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    approvedAt: timestamp,
    deactivatedAt: null,
    lastLoginAt: null
  });
};

const cleanupSessions = (state) => {
  ensureUserState(state);
  const timestamp = now();
  Object.keys(state.sessions).forEach((token) => {
    const session = state.sessions[token];
    if (!session || session.expiresAt <= timestamp) {
      delete state.sessions[token];
    }
  });
};

const registerOperator = (state, payload) => {
  ensureAdminSeed(state);
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || '');
  const fullName = String(payload.fullName || '').trim();

  if (!email || !password || !fullName) {
    return { ok: false, error: 'missing_fields' };
  }

  if (password.length < 8) {
    return { ok: false, error: 'weak_password' };
  }

  const exists = state.users.some((user) => user.email === email);
  if (exists) {
    return { ok: false, error: 'email_exists' };
  }

  const credentials = createPasswordRecord(password);
  const timestamp = now();

  const user = {
    id: `user-${crypto.randomUUID()}`,
    email,
    role: 'operator',
    status: 'pending',
    passwordSalt: credentials.salt,
    passwordHash: credentials.hash,
    profile: {
      displayName: fullName,
      photoDataUrl: '',
      phone: '',
      address: '',
      bio: '',
      position: '',
      emergencyContact: ''
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    approvedAt: null,
    deactivatedAt: null,
    lastLoginAt: null
  };

  state.users.push(user);
  return { ok: true, user: sanitizeUser(user) };
};

const createSession = (state, userId) => {
  ensureUserState(state);
  cleanupSessions(state);
  return createSignedSessionToken(userId);
};

const loginUser = (state, payload) => {
  ensureAdminSeed(state);
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || '');

  if (!email || !password) {
    return { ok: false, error: 'missing_fields' };
  }

  const user = state.users.find((item) => item.email === email);
  if (!user) {
    return { ok: false, error: 'invalid_credentials' };
  }

  const passwordMatches = verifyPassword(password, user.passwordSalt, user.passwordHash);
  if (!passwordMatches) {
    return { ok: false, error: 'invalid_credentials' };
  }

  if (user.role === 'operator' && user.status === 'pending') {
    return { ok: false, error: 'pending_approval' };
  }

  if (user.status === 'deactivated') {
    return { ok: false, error: 'deactivated' };
  }

  const token = createSession(state, user.id);
  user.lastLoginAt = now();
  user.updatedAt = now();

  return {
    ok: true,
    token,
    user: sanitizeUser(user)
  };
};

const getTokenFromRequest = (req) => {
  const header = String(req.headers?.authorization || '');
  if (!header.toLowerCase().startsWith('bearer ')) return '';
  return header.slice(7).trim();
};

const getAuthenticatedUser = (state, req) => {
  ensureAdminSeed(state);
  cleanupSessions(state);

  const token = getTokenFromRequest(req);
  if (!token) {
    return { ok: false, error: 'missing_token' };
  }

  const signed = verifySignedSessionToken(token);
  if (signed.ok) {
    const user = state.users.find((item) => item.id === signed.userId);
    if (!user || user.status === 'deactivated') {
      return { ok: false, error: 'invalid_user' };
    }
    return { ok: true, token, user };
  }

  // Legacy session token fallback.
  const session = state.sessions[token];
  if (!session || session.expiresAt <= now()) {
    if (session) delete state.sessions[token];
    return { ok: false, error: 'invalid_token' };
  }

  const user = state.users.find((item) => item.id === session.userId);
  if (!user || user.status === 'deactivated') {
    delete state.sessions[token];
    return { ok: false, error: 'invalid_user' };
  }

  // Sliding expiration.
  session.expiresAt = now() + SESSION_TTL_MS;

  return { ok: true, token, user };
};

module.exports = {
  ensureAdminSeed,
  sanitizeUser,
  registerOperator,
  loginUser,
  getAuthenticatedUser
};
