import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import { getApiBase } from '../utils/apiBase';
import { readJsonSafe } from '../utils/apiClient';

const SignUp = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const API_BASE = getApiBase();

  const errorMap = {
    missing_fields: 'Please complete all required fields.',
    weak_password: 'Password must be at least 8 characters.',
    email_exists: 'This email is already registered.',
    invalid_response: 'Server returned an invalid response. Please try again.',
    auth_service_unavailable: 'Registration service is unavailable. Please try again.'
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          action: 'register',
          payload: {
            fullName,
            email,
            password
          }
        })
      });
      const data = await readJsonSafe(response);
      if (!response.ok || !data.ok) {
        setError(errorMap[data.error] || 'Unable to register now.');
        return;
      }

      setSuccess('Registration submitted. Wait for admin approval before login.');
      setFullName('');
      setEmail('');
      setPassword('');
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
          <p className="auth-tagline">Create a new operator account to access the terminal.</p>
        </div>

        <svg className="auth-wave" viewBox="0 0 400 28" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,14 C50,2 100,26 160,14 C220,2 270,26 330,14 C370,4 390,20 400,14"
            fill="none" stroke="rgba(110,181,183,0.38)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M0,14 C60,22 120,6 180,14 C240,22 300,6 360,14 C380,18 395,12 400,14"
            fill="none" stroke="rgba(110,181,183,0.18)" strokeWidth="1" strokeLinecap="round" />
          <circle cx="0" cy="14" r="2.5" fill="rgba(110,181,183,0.5)" />
          <circle cx="400" cy="14" r="2.5" fill="rgba(110,181,183,0.5)" />
        </svg>

        <form onSubmit={handleRegister}>
          <h2 className="auth-form-title">NEW OPERATOR</h2>
          <p className="auth-form-sub">Create secure credentials for hatchery terminal access.</p>

          <div className="auth-field">
            <label className="input-label">Full Name</label>
            <input
              className="input-field"
              type="text"
              placeholder="Juan Dela Cruz"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label className="input-label">Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="juan@hydrosense.ph"
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
          {success && <p className="auth-success">{success}</p>}

          <button type="submit" className="btn-solid" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Account'}
          </button>

          <button type="button" className="register-link-btn" onClick={() => navigate('/login')}>
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUp;