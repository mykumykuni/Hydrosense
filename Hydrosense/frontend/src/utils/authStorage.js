export const AUTH_TOKEN_KEY = 'hydrosenseAuthToken';
export const ROLE_KEY = 'hydrosenseRole';
export const USER_KEY = 'hydrosenseUser';

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY) || '';

export const getAuthUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setAuthSession = ({ token, user }) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, user.role);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
};
