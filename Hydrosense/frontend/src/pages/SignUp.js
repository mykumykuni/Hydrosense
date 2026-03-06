import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import { getApiBase } from '../utils/apiBase';

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

  const readJsonSafe = async (response) => {
    try {
      return await response.json();
    } catch {
      return { ok: false, error: 'invalid_response' };
    }
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
    <div className="app-container">
      <header className="water-header">
        <div className="brand-tag">IOT MONITORING</div>
        <img className="brand-logo-image" src="/adjusted%20dd.png" alt="Hydrosense" />
        <p className="project-sub">Create a new operator account to access the terminal.</p>
      </header>

      <main className="form-section">
        <div className="glass-card">
          <form onSubmit={handleRegister}>
            <div className="login-header">
              <h2>NEW OPERATOR</h2>
              <p>Create secure credentials for hatchery terminal access.</p>
            </div>
            
            <label className="input-label">Full Name</label>
            <input
              className="input-field"
              type="text"
              placeholder="Juan Dela Cruz"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            
            <div style={{margin: '20px 0'}}>
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

            <div style={{marginBottom: '30px'}}>
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
            {success && <p className="project-sub" style={{ color: '#6eb5b7', marginBottom: '14px' }}>{success}</p>}

            <button type="submit" className="btn-solid" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
            
            <button type="button" className="register-link-btn" onClick={() => navigate('/login')}>
              Back to Login
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default SignUp;