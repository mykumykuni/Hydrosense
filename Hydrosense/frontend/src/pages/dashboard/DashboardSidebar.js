import React from 'react';

const DashboardSidebar = ({ currentPage, isAdmin, navigate, pendingCount, reportUnreadCount, isOpen, onClose }) => {
  const go = (path) => {
    navigate(path);
    onClose?.();
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`workspace-sidebar ${isOpen ? 'sidebar-mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <img className="sidebar-logo-image" src="/adjusted.png" alt="Hydrosense" />
        </div>
        <nav>
          <div className={`workspace-nav-item ${currentPage === 'live' ? 'active' : ''}`} onClick={() => go('/dashboard/live')}>
            Live Monitoring
          </div>
          <div className={`workspace-nav-item ${currentPage === 'operations' ? 'active' : ''}`} onClick={() => go('/dashboard/operations')}>
            {isAdmin ? 'Admin Controls' : 'Operator Tasks'}
          </div>
          <div className={`workspace-nav-item ${currentPage === 'alerts' ? 'active' : ''}`} onClick={() => go('/dashboard/alerts')}>
            {isAdmin ? 'Compliance Console' : 'Incident Reporting'}
          </div>
          <div className={`workspace-nav-item ${currentPage === 'reports' ? 'active' : ''}`} onClick={() => go('/dashboard/reports')}>
            {isAdmin ? 'Report Inbox' : 'Operator Reports'}
            {isAdmin && reportUnreadCount > 0 && <span className="nav-badge">{reportUnreadCount}</span>}
          </div>
          <div className={`workspace-nav-item ${currentPage === 'profile' ? 'active' : ''}`} onClick={() => go('/dashboard/profile')}>
            My Profile
          </div>
          {isAdmin && (
            <div className={`workspace-nav-item ${currentPage === 'operators' ? 'active' : ''}`} onClick={() => go('/dashboard/operators')}>
              Operator Profiles
              {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
};

export default DashboardSidebar;
