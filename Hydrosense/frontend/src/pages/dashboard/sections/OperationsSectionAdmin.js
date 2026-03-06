import React from 'react';
import WaterLevelSection from './WaterLevelSection';

const OperationsSectionAdmin = ({ sensors, limits, activeThresholdAlerts, alertLog, sensorKeys, getRange, updateThreshold }) => {
  return (
    <section className="operations-grid">
      <article className="analysis-card utility-card">
        <h3 className="mini-label">ADMP Compliance Checklist</h3>
        <div className="compliance-item">
          <div className="status-dot" style={{ background: sensors.do < limits.do.min ? '#de8a7f' : '#6eb5b7' }}></div>
          <span>DO level status [Standard: {'>'} 4.0]</span>
        </div>
        <div className="compliance-item">
          <div className="status-dot" style={{ background: (sensors.ph < limits.ph.min || sensors.ph > limits.ph.max) ? '#eabf82' : '#6eb5b7' }}></div>
          <span>pH buffering range check</span>
        </div>
        <div className="compliance-item">
          <div className="status-dot" style={{ background: sensors.nitrite > 0.1 ? '#de8a7f' : '#6eb5b7' }}></div>
          <span>Nitrogenous waste limit</span>
        </div>
      </article>

      <WaterLevelSection sensors={sensors} />

      <article className="analysis-card utility-card">
        <h3 className="mini-label">Advanced Diagnostics</h3>
        <div className="compliance-item">
          <div className="status-dot" style={{ background: activeThresholdAlerts.length ? '#eabf82' : '#6eb5b7' }}></div>
          <span>Out-of-range sensors: {activeThresholdAlerts.length}</span>
        </div>
        <div className="compliance-item">
          <div className="status-dot" style={{ background: (sensors.ammonia + sensors.nitrite + sensors.chlorine) > 0.04 ? '#eabf82' : '#6eb5b7' }}></div>
          <span>Waste pressure: {(sensors.ammonia + sensors.nitrite + sensors.chlorine).toFixed(3)} mg/L</span>
        </div>
        <div className="compliance-item">
          <div className="status-dot" style={{ background: '#6eb5b7' }}></div>
          <span>System/internal alerts: {alertLog.filter((a) => a.source === 'system').length}</span>
        </div>
      </article>

      <article className="analysis-card utility-card">
        <h3 className="mini-label">Operator Activity Log</h3>
        {(alertLog.length === 0 ? [] : alertLog.slice(0, 4)).map((item) => (
          <div className="compliance-item" key={`activity-${item.id}`}>
            <div className="status-dot" style={{ background: item.severity === 'critical' ? '#de8a7f' : item.severity === 'warning' ? '#eabf82' : '#6eb5b7' }}></div>
            <span>{item.title}</span>
          </div>
        ))}
      </article>

      <article className="analysis-card utility-card threshold-card">
        <h3 className="mini-label">Admin Threshold Manager</h3>
        <div className="threshold-grid">
          {sensorKeys.map((key) => (
            <div key={`threshold-${key}`} className="threshold-row">
              <span className="threshold-label">{limits[key].label}</span>
              <input
                className="threshold-input"
                type="number"
                step="0.001"
                value={getRange(key).min}
                onChange={(e) => updateThreshold(key, 'min', Number(e.target.value))}
              />
              <input
                className="threshold-input"
                type="number"
                step="0.001"
                value={getRange(key).max}
                onChange={(e) => updateThreshold(key, 'max', Number(e.target.value))}
              />
            </div>
          ))}
        </div>
      </article>
    </section>
  );
};

export default OperationsSectionAdmin;
