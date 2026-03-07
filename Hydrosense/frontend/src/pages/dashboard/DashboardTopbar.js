import React, { useState, useEffect, useRef } from 'react';

const getPageTitle = (currentPage, isAdmin) => {
  switch (currentPage) {
    case 'live': return 'Live Monitoring';
    case 'operations': return isAdmin ? 'Admin Controls' : 'Operator Tasks';
    case 'alerts': return isAdmin ? 'Compliance Console' : 'Incident Reporting';
    case 'reports': return isAdmin ? 'Report Inbox' : 'Operator Reports';
    case 'profile': return 'My Profile';
    case 'operators': return 'Operator Profiles';
    case 'audit-log': return 'Audit Log';
    default: return 'Dashboard';
  }
};

const NotificationBell = ({ isAdmin, unreadCount, pendingCount, reportUnreadCount, recentUnreadAlerts, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const totalCount = isAdmin ? (pendingCount + reportUnreadCount) : unreadCount;

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const go = (path) => { onNavigate(path); setOpen(false); };

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button
        type="button"
        className="btn-secondary topbar-fixed notif-bell-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        🔔
        {totalCount > 0 && <span className="alert-count-pill">{totalCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          {isAdmin ? (
            <>
              <div className="notif-section-label">Admin</div>
              <button type="button" className="notif-item" onClick={() => go('/dashboard/operators')}>
                <span className="notif-item-dot" style={{ background: pendingCount > 0 ? '#eabf82' : '#6eb5b7' }} />
                <span>{pendingCount > 0 ? `${pendingCount} operators pending approval` : 'No pending operators'}</span>
              </button>
              <button type="button" className="notif-item" onClick={() => go('/dashboard/reports')}>
                <span className="notif-item-dot" style={{ background: reportUnreadCount > 0 ? '#eabf82' : '#6eb5b7' }} />
                <span>{reportUnreadCount > 0 ? `${reportUnreadCount} unread reports` : 'No unread reports'}</span>
              </button>
              {recentUnreadAlerts.slice(0, 3).length > 0 && (
                <>
                  <div className="notif-section-label" style={{ marginTop: '8px' }}>Recent Alerts</div>
                  {recentUnreadAlerts.slice(0, 3).map((a) => (
                    <button key={a.id} type="button" className="notif-item" onClick={() => go('/dashboard/alerts')}>
                      <span className="notif-item-dot" style={{ background: a.severity === 'critical' ? '#de8a7f' : '#eabf82' }} />
                      <span className="notif-item-text">{a.title}</span>
                    </button>
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              <button type="button" className="notif-item" onClick={() => go('/dashboard/alerts')}>
                <span className="notif-item-dot" style={{ background: unreadCount > 0 ? '#eabf82' : '#6eb5b7' }} />
                <span>{unreadCount > 0 ? `${unreadCount} unread alerts` : 'No unread alerts'}</span>
              </button>
              <button type="button" className="notif-item" onClick={() => go('/dashboard/reports')}>
                <span className="notif-item-dot" style={{ background: reportUnreadCount > 0 ? '#eabf82' : '#6eb5b7' }} />
                <span>{reportUnreadCount > 0 ? `${reportUnreadCount} updates on your reports` : 'No report updates'}</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const DashboardTopbar = ({
  currentPage,
  isAdmin,
  authDisplayName,
  syncState,
  historyWindow,
  unreadCount,
  pendingCount,
  reportUnreadCount,
  recentUnreadAlerts,
  setAlertModalOpen,
  exportAlertHistory,
  onLogout,
  onMenuToggle,
  onNavigate
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
        <NotificationBell
          isAdmin={isAdmin}
          unreadCount={unreadCount}
          pendingCount={pendingCount}
          reportUnreadCount={reportUnreadCount}
          recentUnreadAlerts={recentUnreadAlerts}
          onNavigate={onNavigate}
        />
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
