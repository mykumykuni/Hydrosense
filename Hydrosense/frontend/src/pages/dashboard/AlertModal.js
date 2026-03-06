import React from 'react';

const AlertModal = ({
  isOpen,
  onClose,
  visibleAlerts,
  alertFilter,
  setAlertFilter,
  isAdmin,
  createManualAlert,
  markAllRead,
  clearAllAlerts,
  filteredAlerts,
  extractSensorKey,
  formatAlertTime,
  toggleRead,
  resolveAlert,
  openRelatedSensor
}) => {
  if (!isOpen) return null;

  return (
    <div className="alert-modal-backdrop" onClick={onClose}>
      <section className="alert-modal" onClick={(e) => e.stopPropagation()}>
        <header className="alert-modal-header">
          <div>
            <h2>Alert Center</h2>
            <p>{visibleAlerts.length} total alerts</p>
          </div>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </header>

        <div className="alert-toolbar">
          <div className="alert-filters">
            {['all', 'info', 'warning', 'critical'].map((item) => (
              <button
                key={item}
                type="button"
                className={`filter-chip ${alertFilter === item ? 'active' : ''}`}
                onClick={() => setAlertFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="alert-actions">
            {isAdmin && <button className="btn-secondary" type="button" onClick={createManualAlert}>Manual Alert</button>}
            <button className="btn-secondary" type="button" onClick={markAllRead}>Mark All Read</button>
            {isAdmin && <button className="btn-secondary" type="button" onClick={clearAllAlerts}>Clear All</button>}
          </div>
        </div>

        <div className="alert-list">
          {filteredAlerts.length === 0 ? (
            <p className="water-level-meta">No alerts for selected filter.</p>
          ) : (
            filteredAlerts.map((item) => {
              const sensorKey = extractSensorKey(item.source);
              return (
                <article key={item.id} className={`alert-item ${item.read ? 'read' : 'unread'}`}>
                  <div className="alert-item-head">
                    <span className={`sensor-badge ${item.severity}`}>{item.severity}</span>
                    <span className="water-level-meta">{formatAlertTime(item.ts)}</span>
                  </div>
                  <h4>{item.title}</h4>
                  <p>{item.message}</p>
                  <div className="modal-alert-actions">
                    <button className="btn-secondary" type="button" onClick={() => toggleRead(item.id)}>
                      {item.read ? 'Mark Unread' : 'Mark Read'}
                    </button>
                    {isAdmin && !item.resolved && (
                      <button className="btn-secondary" type="button" onClick={() => resolveAlert(item.id)}>
                        Resolve
                      </button>
                    )}
                    {sensorKey && (
                      <button className="btn-secondary" type="button" onClick={() => openRelatedSensor(sensorKey)}>
                        Open Sensor
                      </button>
                    )}
                  </div>
                  {item.resolved && <p className="resolved-flag">Resolved by Admin</p>}
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

export default AlertModal;
