import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

function Dashboard({ onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-content">
          <h1 className="logo">Hydrosense</h1>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome to Hydrosense Dashboard</h2>
          <p className="status">✓ You are officially logged in</p>
          
          <div className="info-grid">
            <div className="info-card">
              <h3>Water Monitoring</h3>
              <p>Monitor water quality and levels in real-time</p>
            </div>
            
            <div className="info-card">
              <h3>Analytics</h3>
              <p>View detailed analytics and reports</p>
            </div>
            
            <div className="info-card">
              <h3>Settings</h3>
              <p>Manage your account and preferences</p>
            </div>
            
            <div className="info-card">
              <h3>Notifications</h3>
              <p>Receive alerts for important events</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
