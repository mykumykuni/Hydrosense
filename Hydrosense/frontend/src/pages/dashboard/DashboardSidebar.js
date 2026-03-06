import React from 'react';

const DashboardSidebar = ({ currentPage, isAdmin, navigate }) => {
  return (
    <aside className="workspace-sidebar">
      <div className="sidebar-logo">
        <img className="sidebar-logo-image" src="/adjusted.png" alt="Hydrosense" />
      </div>
      <nav>
        <div className={`workspace-nav-item ${currentPage === 'live' ? 'active' : ''}`} onClick={() => navigate('/dashboard/live')}>
          Live Monitoring
        </div>
        <div className={`workspace-nav-item ${currentPage === 'operations' ? 'active' : ''}`} onClick={() => navigate('/dashboard/operations')}>
          {isAdmin ? 'Admin Controls' : 'Operator Tasks'}
        </div>
        <div className={`workspace-nav-item ${currentPage === 'alerts' ? 'active' : ''}`} onClick={() => navigate('/dashboard/alerts')}>
          {isAdmin ? 'Compliance Console' : 'Incident Reporting'}
        </div>
        {!isAdmin && (
          <div className={`workspace-nav-item ${currentPage === 'profile' ? 'active' : ''}`} onClick={() => navigate('/dashboard/profile')}>
            My Profile
          </div>
        )}
        {isAdmin && (
          <div className={`workspace-nav-item ${currentPage === 'operators' ? 'active' : ''}`} onClick={() => navigate('/dashboard/operators')}>
            Operator Profiles
          </div>
        )}
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
