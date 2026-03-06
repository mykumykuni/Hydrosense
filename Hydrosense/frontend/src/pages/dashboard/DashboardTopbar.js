import React from 'react';

const getPageTitle = (currentPage, isAdmin) => {
  switch (currentPage) {
    case 'live': return 'Live Monitoring';
    case 'operations': return isAdmin ? 'Admin Controls' : 'Operator Tasks';
    case 'alerts': return isAdmin ? 'Compliance Console' : 'Incident Reporting';
    case 'reports': return isAdmin ? 'Report Inbox' : 'Operator Reports';
    case 'profile': return 'My Profile';
    case 'operators': return 'Operator Profiles';
    default: return 'Dashboard';
  }
};

const DashboardTopbar = ({
  currentPage,
  isAdmin,
  authDisplayName,
  syncState,
  historyWindow,
  unreadCount,
  setAlertModalOpen,
  exportAlertHistory,
  onLogout,
  onMenuToggle
}) => {
  return (
    <header className="dashboard-topbar">
      <div className="topbar-title-group">
        <div className="topbar-title-row">
          <button
            className="hamburger-btn btn-secondary topbar-fixed"
            type="button"
            onClick={onMenuToggle}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <h1 className="command-title">{getPageTitle(currentPage, isAdmin)}</h1>
        </div>
        <p className="command-subtitle">
          Node: BFAR-10 Hatchery | Species: Milkfish (Fry) | Mode: {isAdmin ? 'Admin Console' : 'Operator Console'}
        </p>
        <p className="command-subtitle">
          Sync: {syncState === 'offline' ? 'Offline' : 'Vercel API Live'} | History: {historyWindow} points
        </p>
      </div>
      <div className="topbar-actions">
        <div className={`uptime-widget topbar-fixed role-widget role-chip-display ${isAdmin ? 'admin' : 'operator'}`}>
          <span className="mini-label">{authDisplayName}</span>
        </div>
        <button className="btn-secondary topbar-fixed alert-btn" onClick={() => setAlertModalOpen(true)}>
          Alerts
          {unreadCount > 0 && <span className="alert-count-pill">{unreadCount}</span>}
        </button>
        {isAdmin && (
          <button className="btn-secondary topbar-fixed export-btn" onClick={exportAlertHistory}>
            Export Alerts
          </button>
        )}
        <button className="btn-secondary topbar-fixed logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default DashboardTopbar;
