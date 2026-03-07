import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import { setAuthSession } from '../utils/authStorage';
import { getApiBase } from '../utils/apiBase';
import { readJsonSafe } from '../utils/apiClient';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const API_BASE = getApiBase();

  const errorMap = {
    missing_fields: 'Please enter email and password.',
    invalid_credentials: 'Email or password is incorrect.',
    pending_approval: 'Registration pending admin approval.',
    deactivated: 'Your account is deactivated. Contact admin.',
    invalid_token: 'Session expired. Please login again.',
    invalid_response: 'Server returned an invalid response. Please try again.',
    auth_service_unavailable: 'Login service is unavailable. Please try again.'
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          action: 'login',
          payload: {
            email,
            password
          }
        })
      });

      const data = await readJsonSafe(response);
      if (!response.ok || !data.ok) {
        setError(errorMap[data.error] || 'Unable to login right now.');
        return;
      }

      setAuthSession({ token: data.token, user: data.user });
      navigate('/dashboard/live');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-tag">IOT MONITORING</span>
          <img className="auth-logo" src="/adjusted%20dd.png" alt="Hydrosense" />
          <p className="auth-tagline">
            Real-Time Water Quality Monitoring System for <br />
            <strong>Milkfish (Chanos chanos)</strong> Aquaculture.
          </p>
        </div>

        <svg className="auth-wave" viewBox="0 0 400 28" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,14 C50,2 100,26 160,14 C220,2 270,26 330,14 C370,4 390,20 400,14"
            fill="none" stroke="rgba(110,181,183,0.38)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M0,14 C60,22 120,6 180,14 C240,22 300,6 360,14 C380,18 395,12 400,14"
            fill="none" stroke="rgba(110,181,183,0.18)" strokeWidth="1" strokeLinecap="round" />
          <circle cx="0" cy="14" r="2.5" fill="rgba(110,181,183,0.5)" />
          <circle cx="400" cy="14" r="2.5" fill="rgba(110,181,183,0.5)" />
        </svg>

        <form onSubmit={handleLoginSubmit}>
          <h2 className="auth-form-title">OPERATOR LOGIN</h2>
          <p className="auth-form-sub">Access hatchery management terminal.</p>

          <div className="auth-field">
            <label className="input-label">Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field-last">
            <label className="input-label">Terminal Password</label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn-solid" disabled={isSubmitting}>
            {isSubmitting ? 'Signing In...' : 'Initialize Session'}
          </button>

          <button type="button" className="register-link-btn" onClick={() => navigate('/signup')}>
            Register New Operator
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;