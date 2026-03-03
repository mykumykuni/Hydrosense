import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';

const Login = () => {
  const navigate = useNavigate();

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="app-container">
      {/* Left Branding Panel */}
      <header className="water-header">
        <div className="brand-tag">IOT MONITORING</div>
        <h1 className="brand-name">HYDROSENSE</h1>
        {/* FIXED: Balanced the <p> tag here */}
        <p className="project-sub">
          Real-Time Water Quality Monitoring System for <br />
          <strong>Milkfish (Chanos chanos)</strong> Aquaculture.
        </p>
      </header>

      {/* Right Form Panel */}
      <main className="form-section">
        <div className="glass-card">
          <form onSubmit={handleLoginSubmit}>
            <div className="login-header">
              <h2 style={{ fontWeight: 900, fontSize: '1.8rem' }}>OPERATOR LOGIN</h2>
              <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Access hatchery management terminal.</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="input-label">Email</label>
              <input className="input-field" type="email" placeholder="Email Address" required />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label className="input-label">Terminal Password</label>
              <input className="input-field" type="password" placeholder="••••••••" required />
            </div>

            <button type="submit" className="btn-solid">Initialize Session</button>
            
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