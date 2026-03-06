import React from 'react';

const DashboardTopbar = ({
  isAdmin,
  authDisplayName,
  syncState,
  historyWindow,
  themeMode,
  setThemeMode,
  unreadCount,
  setAlertModalOpen,
  exportAlertHistory,
  onLogout
}) => {
  return (
    <header className="dashboard-topbar">
      <div>
        <h1 className="command-title">Command Center</h1>
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
        <button className="btn-secondary topbar-fixed theme-btn" onClick={() => setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))}>
          {themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
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
