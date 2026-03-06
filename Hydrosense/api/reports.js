const { getState, saveState } = require('../backend/database/store');
const { ensureAdminSeed, getAuthenticatedUser } = require('../backend/database/auth');

const parseBody = (req) => {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const VALID_TYPES = ['equipment', 'water_quality', 'general', 'custom'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_STATUSES = ['open', 'acknowledged', 'resolved', 'closed'];
const REPLYABLE_TYPES = ['general', 'custom'];

const TYPE_SUBJECTS = {
  equipment: 'Equipment Malfunction Report',
  water_quality: 'Water Quality Concern',
  general: 'General Request',
  custom: null
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  try {

  if (!['GET', 'POST'].includes(req.method)) {
    res.status(405).send(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
    return;
  }

  let state = await getState();
  ensureAdminSeed(state);

  const auth = getAuthenticatedUser(state, req);
  if (!auth.ok) {
    res.status(401).send(JSON.stringify({ ok: false, error: auth.error }));
    return;
  }

  const user = auth.user;
  const isAdmin = user.role === 'admin';

  if (!Array.isArray(state.reports)) state.reports = [];

  if (req.method === 'GET') {
    const reports = isAdmin
      ? [...state.reports].sort((a, b) => b.createdAt - a.createdAt)
      : state.reports.filter((r) => r.submittedBy === user.id).sort((a, b) => b.createdAt - a.createdAt);
    const unreadCount = isAdmin ? reports.filter((r) => r.status === 'open').length : 0;
    res.status(200).send(JSON.stringify({ ok: true, reports, unreadCount }));
    return;
  }

  const body = parseBody(req);
  const action = String(body.action || 'submit_report');
  const payload = body.payload || {};

  if (action === 'submit_report') {
    const { type, priority, subject, message } = payload;

    if (!VALID_TYPES.includes(type)) {
      res.status(400).send(JSON.stringify({ ok: false, error: 'invalid_type' }));
      return;
    }
    if (!VALID_PRIORITIES.includes(priority)) {
      res.status(400).send(JSON.stringify({ ok: false, error: 'invalid_priority' }));
      return;
    }
    const msg = String(message || '').trim();
    if (!msg) {
      res.status(400).send(JSON.stringify({ ok: false, error: 'message_required' }));
      return;
    }

    const reportSubject = type === 'custom'
      ? (String(subject || '').trim() || 'Custom Report')
      : TYPE_SUBJECTS[type];

    const report = {
      id: generateId(),
      type,
      priority,
      subject: reportSubject,
      message: msg,
      status: 'open',
      submittedBy: user.id,
      submittedByEmail: user.email,
      submittedByName: user.profile?.displayName || user.email,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      replies: []
    };

    state.reports.push(report);
    await saveState(state);

    const reports = state.reports.filter((r) => r.submittedBy === user.id).sort((a, b) => b.createdAt - a.createdAt);
    res.status(200).send(JSON.stringify({ ok: true, reports }));
    return;
  }

  if (action === 'reply') {
    if (!isAdmin) {
      res.status(403).send(JSON.stringify({ ok: false, error: 'admin_only' }));
      return;
    }
    const { reportId, message } = payload;
    const report = state.reports.find((r) => r.id === String(reportId || ''));
    if (!report) {
      res.status(404).send(JSON.stringify({ ok: false, error: 'report_not_found' }));
      return;
    }
    if (!REPLYABLE_TYPES.includes(report.type)) {
      res.status(400).send(JSON.stringify({ ok: false, error: 'reply_not_supported_for_type' }));
      return;
    }
    const msg = String(message || '').trim();
    if (!msg) {
      res.status(400).send(JSON.stringify({ ok: false, error: 'message_required' }));
      return;
    }

    if (!Array.isArray(report.replies)) report.replies = [];
    report.replies.push({
      id: generateId(),
      authorId: user.id,
      authorEmail: user.email,
      authorRole: user.role,
      message: msg,
      createdAt: Date.now()
    });
    report.updatedAt = Date.now();

    await saveState(state);

    const reports = [...state.reports].sort((a, b) => b.createdAt - a.createdAt);
    res.status(200).send(JSON.stringify({ ok: true, reports }));
    return;
  }

  if (action === 'update_status') {
    if (!isAdmin) {
      res.status(403).send(JSON.stringify({ ok: false, error: 'admin_only' }));
      return;
    }
    const { reportId, status } = payload;
    if (!VALID_STATUSES.includes(status)) {
      res.status(400).send(JSON.stringify({ ok: false, error: 'invalid_status' }));
      return;
    }
    const report = state.reports.find((r) => r.id === String(reportId || ''));
    if (!report) {
      res.status(404).send(JSON.stringify({ ok: false, error: 'report_not_found' }));
      return;
    }

    report.status = status;
    report.updatedAt = Date.now();

    await saveState(state);

    const reports = [...state.reports].sort((a, b) => b.createdAt - a.createdAt);
    res.status(200).send(JSON.stringify({ ok: true, reports }));
    return;
  }

  res.status(400).send(JSON.stringify({ ok: false, error: 'unknown_action' }));
  } catch (err) {
    console.error('[reports] unhandled error:', err);
    res.status(500).send(JSON.stringify({ ok: false, error: 'server_error', detail: String(err?.message || err) }));
  }
};
