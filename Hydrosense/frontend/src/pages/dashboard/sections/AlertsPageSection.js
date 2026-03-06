import React from 'react';

const AlertsPageSection = ({ filteredAlerts, extractSensorKey, formatAlertTime, toggleRead, openRelatedSensor }) => {
  return (
    <section className="mobile-alerts-pane">
      <div className="analysis-card utility-card">
        <h3 className="mini-label">Recent Alerts</h3>
        {filteredAlerts.length === 0 ? (
          <p className="water-level-meta">No alerts for selected filter.</p>
        ) : (
          filteredAlerts.slice(0, 8).map((item) => {
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
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};

export default AlertsPageSection;
