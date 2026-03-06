import React from 'react';

const SummarySection = ({ clarity, activeThresholdAlerts, healthPercent, healthySensorCount, sensorCount }) => {
  return (
    <section className="summary-strip">
      <article className={`summary-card utility-card ${clarity.tone}`}>
        <span className="mini-label">Water Color / Clarity</span>
        <p className="summary-value">{clarity.label}</p>
        <p className="summary-note">{clarity.hint}</p>
      </article>
      <article className="summary-card utility-card">
        <span className="mini-label">Active Alerts</span>
        <p className="summary-value">{activeThresholdAlerts.length}</p>
        <p className="summary-note">
          {activeThresholdAlerts.length === 0 ? 'No active alarms in this cycle' : 'Immediate checks are recommended'}
        </p>
      </article>
      <article className="summary-card utility-card health-card">
        <span className="mini-label">Sensor Health</span>
        <p className="summary-value">{healthPercent}%</p>
        <p className="summary-note">{healthySensorCount} / {sensorCount} sensors are in optimal range</p>
      </article>
    </section>
  );
};

export default SummarySection;
