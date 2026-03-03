import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/App.css';

const Welcome = () => {
  const navigate = useNavigate();
  return (
    <div className="app-shell">
      <div className="device-container" style={{background: 'var(--primary-blue)', color: 'white', justifyContent: 'space-between', padding: '60px 40px'}}>
        <div style={{fontWeight: 900, fontSize: '1.2rem'}}>wwater</div>
        <div>
          <h1 style={{fontSize: '3rem', lineHeight: 1}}>Water delivery</h1>
          <p style={{opacity: 0.8}}>We deliver water at any point of the Earth in 30 minutes</p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap: '10px'}}>
          <button className="btn-main" style={{background:'white', color:'var(--primary-blue)'}} onClick={() => navigate('/login')}>Log in</button>
          <button className="btn-main" style={{background:'transparent', border:'1px solid white', color:'white'}} onClick={() => navigate('/signup')}>Sign up</button>
        </div>
      </div>
    </div>
  );
};
export default Welcome;