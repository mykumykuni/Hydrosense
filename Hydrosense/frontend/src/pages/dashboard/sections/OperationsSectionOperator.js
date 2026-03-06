import React from 'react';
import WaterLevelSection from './WaterLevelSection';

const OperationsSectionOperator = ({ sensors, onNavigateReports }) => {
  return (
    <section className="operations-grid">
      <WaterLevelSection sensors={sensors} />

      <article className="analysis-card utility-card">
        <h3 className="mini-label">Operator Workflow</h3>
        <div className="compliance-item">
          <div className="status-dot" style={{ background: '#6eb5b7' }}></div>
          <span>Monitor live sensors and alert trends.</span>
        </div>
        <div className="compliance-item">
          <div className="status-dot" style={{ background: '#6eb5b7' }}></div>
          <span>Mark alerts read/unread and escalate anomalies.</span>
        </div>
        <div className="compliance-item">
          <div className="status-dot" style={{ background: '#6eb5b7' }}></div>
          <span>Escalate to admin for threshold or compliance actions.</span>
        </div>
        <button className="btn-secondary operator-issue-btn" type="button" onClick={onNavigateReports}>
          Go to Operator Reports
        </button>
      </article>
    </section>
  );
};

export default OperationsSectionOperator;
