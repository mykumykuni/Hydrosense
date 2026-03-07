import React from 'react';

const SummarySection = ({ clarity, activeThresholdAlerts, healthPercent, healthySensorCount, sensorCount, isAdmin, totalOperators, pendingOperators, openReportsCount }) => {
  return (
    <>
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

      {isAdmin && (
        <section className="summary-strip admin-stats-strip">
          <article className="summary-card utility-card">
            <span className="mini-label">Total Operators</span>
            <p className="summary-value">{totalOperators}</p>
            <p className="summary-note">
              {pendingOperators > 0 ? `${pendingOperators} awaiting approval` : 'All operators reviewed'}
            </p>
          </article>
          <article className="summary-card utility-card">
            <span className="mini-label">Pending Approvals</span>
            <p className="summary-value" style={{ color: pendingOperators > 0 ? '#eabf82' : 'var(--text-high)' }}>
              {pendingOperators}
            </p>
            <p className="summary-note">{pendingOperators > 0 ? 'Review in Operator Profiles' : 'No pending requests'}</p>
          </article>
          <article className="summary-card utility-card">
            <span className="mini-label">Open Reports</span>
            <p className="summary-value" style={{ color: openReportsCount > 0 ? '#eabf82' : 'var(--text-high)' }}>
              {openReportsCount}
            </p>
            <p className="summary-note">{openReportsCount > 0 ? 'Requires attention' : 'Report inbox clear'}</p>
          </article>
        </section>
      )}
    </>
  );
};

export default SummarySection;
