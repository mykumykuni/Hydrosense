import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import { setAuthSession } from '../utils/authStorage';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const API_BASE = process.env.REACT_APP_API_BASE || '';

  const errorMap = {
    missing_fields: 'Please enter email and password.',
    invalid_credentials: 'Email or password is incorrect.',
    pending_approval: 'Registration pending admin approval.',
    deactivated: 'Your account is deactivated. Contact admin.',
    invalid_token: 'Session expired. Please login again.',
    invalid_response: 'Server returned an invalid response. Please try again.',
    auth_service_unavailable: 'Login service is unavailable. Please try again.'
  };

  const readJsonSafe = async (response) => {
    try {
      return await response.json();
    } catch {
      return { ok: false, error: 'invalid_response' };
    }
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
    <div className="app-container">
      <header className="water-header">
        <div className="brand-tag">IOT MONITORING</div>
        <img className="brand-logo-image" src="/adjusted%20dd.png" alt="Hydrosense" />
        <p className="project-sub">
          Real-Time Water Quality Monitoring System for <br />
          <strong>Milkfish (Chanos chanos)</strong> Aquaculture.
        </p>
      </header>

      <main className="form-section">
        <div className="glass-card">
          <form onSubmit={handleLoginSubmit}>
            <div className="login-header">
              <h2>OPERATOR LOGIN</h2>
              <p>Access hatchery management terminal.</p>
            </div>

            <div style={{ marginBottom: '18px' }}>
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

            <div style={{ marginBottom: '30px' }}>
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

            {error && <p className="project-sub" style={{ color: '#de8a7f', marginBottom: '14px' }}>{error}</p>}

            <button type="submit" className="btn-solid" disabled={isSubmitting}>
              {isSubmitting ? 'Signing In...' : 'Initialize Session'}
            </button>
            
            <button type="button" className="register-link-btn" onClick={() => navigate('/signup')}>
              Register New Operator
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;