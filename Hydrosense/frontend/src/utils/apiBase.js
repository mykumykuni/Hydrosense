const FALLBACK_API_BASE_BY_HOST = {
  // This deployment currently serves API with Vercel auth wall; route API calls to working alias.
  'hydrosense-ck159x2q9-mykumykunis-projects.vercel.app': 'https://hydrosense-omega.vercel.app'
};

export const getApiBase = () => {
  const envBase = String(process.env.REACT_APP_API_BASE || '').trim();
  if (envBase) return envBase;

  if (typeof window === 'undefined') return '';

  const host = String(window.location.host || '').toLowerCase();
  return FALLBACK_API_BASE_BY_HOST[host] || '';
};
