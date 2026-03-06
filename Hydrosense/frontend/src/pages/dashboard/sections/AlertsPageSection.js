import React from 'react';

const AlertsPageSection = ({ filteredAlerts, alertFilter, setAlertFilter, extractSensorKey, formatAlertTime, toggleRead, openRelatedSensor }) => {
  return (
    <section className="page-fill-section">
      <article className="analysis-card utility-card">
        <div className="alerts-page-header">
          <div>
            <h3 className="mini-label">Alert Log</h3>
            <p className="water-level-meta">{filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="alert-filters">
            {['all', 'info', 'warning', 'critical'].map((f) => (
              <button
                key={f}
                type="button"
                className={`filter-chip ${alertFilter === f ? 'active' : ''}`}
                onClick={() => setAlertFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="alerts-page-list">
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
                  <div className="mobile-alert-actions">
                    <button className="btn-secondary" type="button" onClick={() => toggleRead(item.id)}>
                      {item.read ? 'Mark Unread' : 'Mark Read'}
                    </button>
                    {sensorKey && (
                      <button className="btn-secondary" type="button" onClick={() => openRelatedSensor(sensorKey)}>
                        Open Sensor
                      </button>
                    )}
                  </div>
                  {item.resolved && <p className="resolved-flag">✓ Resolved by Admin</p>}
                </article>
              );
            })
          )}
        </div>
      </article>
    </section>
  );
};

export default AlertsPageSection;
