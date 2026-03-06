import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';

const SignUp = () => {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <header className="water-header">
        <div className="brand-tag">IOT MONITORING</div>
        <h1 className="brand-name">HYDROSENSE</h1>
        <p className="project-sub">Create a new operator account to access the terminal.</p>
      </header>

      <main className="form-section">
        <div className="glass-card">
          <form onSubmit={(e) => { e.preventDefault(); navigate('/login'); }}>
            <div className="login-header">
              <h2>NEW OPERATOR</h2>
              <p>Create secure credentials for hatchery terminal access.</p>
            </div>
            
            <label className="input-label">Full Name</label>
            <input className="input-field" type="text" placeholder="Juan Dela Cruz" required />
            
            <div style={{margin: '20px 0'}}>
              <label className="input-label">Email</label>
              <input className="input-field" type="email" placeholder="juan@hydrosense.ph" required />
            </div>

            <div style={{marginBottom: '30px'}}>
              <label className="input-label">Terminal Password</label>
              <input className="input-field" type="password" placeholder="••••••••" required />
            </div>

            <button type="submit" className="btn-solid">Create Account</button>
            
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