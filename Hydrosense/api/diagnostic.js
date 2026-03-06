// Simple diagnostic endpoint to check configuration and state
const { getState } = require('../backend/database/store');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.status(405).send(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  const state = await getState();
  
  // Check KV configuration from environment
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

  const diagnostic = {
    timestamp: new Date().toISOString(),
    environment: {
      kvConfigured: Boolean(kvUrl && kvToken),
      kvUrlSet: Boolean(kvUrl),
      kvTokenSet: Boolean(kvToken),
      upstashRedisUrl: Boolean(process.env.UPSTASH_REDIS_REST_URL),
      upstashRedisToken: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
      kvRestApiUrl: Boolean(process.env.KV_REST_API_URL),
      kvRestApiToken: Boolean(process.env.KV_REST_API_TOKEN),
    },
    state: {
      totalUsers: state.users.length,
      admins: state.users.filter(u => u.role === 'admin').length,
      operators: state.users.filter(u => u.role === 'operator').length,
      pendingOperators: state.users.filter(u => u.role === 'operator' && u.status === 'pending').length,
      activeOperators: state.users.filter(u => u.role === 'operator' && u.status === 'active').length,
      deactivatedOperators: state.users.filter(u => u.role === 'operator' && u.status === 'deactivated').length,
    },
    warning: kvUrl && kvToken ? null : '⚠️ KV NOT CONFIGURED - State will not persist across Vercel instances!',
    message: kvUrl && kvToken ? '✓ KV is configured and should persist state' : '✗ KV is NOT configured - add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to Vercel environment variables'
  };

  res.status(200).send(JSON.stringify(diagnostic, null, 2));
};
