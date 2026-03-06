import React from 'react';

const DashboardMobileTabs = ({ currentPage, isAdmin, navigate, pendingCount, reportUnreadCount }) => {
  return (
    <div className="mobile-tabs" role="tablist" aria-label="Dashboard sections">
      <button type="button" className={`mobile-tab-btn ${currentPage === 'live' ? 'active' : ''}`} onClick={() => navigate('/dashboard/live')}>Live</button>
      <button type="button" className={`mobile-tab-btn ${currentPage === 'operations' ? 'active' : ''}`} onClick={() => navigate('/dashboard/operations')}>Ops</button>
      <button type="button" className={`mobile-tab-btn ${currentPage === 'alerts' ? 'active' : ''}`} onClick={() => navigate('/dashboard/alerts')}>Alerts</button>
      <button type="button" className={`mobile-tab-btn ${currentPage === 'reports' ? 'active' : ''}`} onClick={() => navigate('/dashboard/reports')}>
        Reports{isAdmin && reportUnreadCount > 0 && <span className="nav-badge">{reportUnreadCount}</span>}
      </button>
      <button type="button" className={`mobile-tab-btn ${currentPage === 'profile' ? 'active' : ''}`} onClick={() => navigate('/dashboard/profile')}>Profile</button>
      {isAdmin && (
        <button type="button" className={`mobile-tab-btn ${currentPage === 'operators' ? 'active' : ''}`} onClick={() => navigate('/dashboard/operators')}>
          Users{pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
        </button>
      )}
    </div>
  );
};

export default DashboardMobileTabs;
