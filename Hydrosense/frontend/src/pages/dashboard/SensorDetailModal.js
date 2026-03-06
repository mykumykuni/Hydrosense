import React, { useEffect, useState } from 'react';

const SensorDetailModal = ({
  sensorKey,
  onClose,
  limits,
  sensors,
  history,
  getRange,
  getSensorState,
  getSensorInsight,
  alertLog,
  updateThreshold,
  formatAlertTime
}) => {
  const limit = limits[sensorKey];
  const range = getRange(sensorKey);
  const value = sensors[sensorKey];
  const precision = sensorKey === 'do' ? 2
    : (sensorKey === 'ammonia' || sensorKey === 'nitrite' || sensorKey === 'chlorine') ? 3
    : 1;
  const displayValue = value != null ? value.toFixed(precision) : '—';
  const status = getSensorState(sensorKey, value);
  const insight = getSensorInsight(sensorKey, value);
  const historyValues = history[sensorKey] || [];
  const sensorAlerts = alertLog.filter((a) => a.source.startsWith(sensorKey));

  const [minDraft, setMinDraft] = useState(String(range.min));
  const [maxDraft, setMaxDraft] = useState(String(range.max));
  const [thresholdMsg, setThresholdMsg] = useState('');

  useEffect(() => {
    setMinDraft(String(range.min));
    setMaxDraft(String(range.max));
    setThresholdMsg('');
  }, [range.min, range.max]);

  const handleThresholdSave = () => {
    const min = parseFloat(minDraft);
    const max = parseFloat(maxDraft);
    if (isNaN(min) || isNaN(max) || min >= max) {
      setThresholdMsg('Min must be less than Max.');
      return;
    }
    updateThreshold(sensorKey, 'min', min);
    updateThreshold(sensorKey, 'max', max);
    setThresholdMsg('Thresholds updated.');
  };

  const renderBigSparkline = (values) => {
    if (!values || values.length < 2) {
      return <svg className="sensor-modal-sparkline" viewBox="0 0 200 60" aria-hidden="true" />;
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const r = max - min || 1;
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * 200;
      const y = 56 - ((v - min) / r) * 52;
      return `${x},${y}`;
    }).join(' ');
    const stroke = status.state === 'critical' ? '#de8a7f' : status.state === 'warning' ? '#eabf82' : '#8fd3d7';
    return (
      <svg className="sensor-modal-sparkline" viewBox="0 0 200 60" aria-hidden="true" preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div className="alert-modal-backdrop" onClick={onClose}>
      <div className="sensor-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sensor-modal-header">
          <div>
            <span className="mini-label">Sensor Detail</span>
            <h2>{limit.label}</h2>
          </div>
          <button className="btn-secondary modal-close-btn" type="button" onClick={onClose}>✕</button>
        </div>

        <div className="sensor-modal-body">
          <div className="sensor-modal-reading">
            <div className={`sensor-modal-value-card ${status.cls}`}>
              <span className="mini-label">Live Reading</span>
              <div className="sensor-modal-value">
                {displayValue}
                <span className="kpi-unit">{limit.unit}</span>
              </div>
              <span className={`sensor-badge ${status.state}`}>{status.label}</span>
              <p className="sensor-insight" style={{ marginTop: '8px' }}>{insight}</p>
            </div>

            <div className="sensor-modal-chart">
              <span className="mini-label">History ({historyValues.length} points)</span>
              {renderBigSparkline(historyValues)}
              <div className="sensor-modal-chart-meta">
                <span>Min {historyValues.length ? Math.min(...historyValues).toFixed(precision) : '—'}</span>
                <span>Max {historyValues.length ? Math.max(...historyValues).toFixed(precision) : '—'}</span>
                <span>Threshold {range.min} – {range.max}</span>
              </div>
            </div>
          </div>

          <div className="sensor-modal-section">
            <span className="mini-label">Threshold Settings</span>
            <div className="threshold-edit-row">
              <div className="threshold-edit-field">
                <label className="threshold-label">Min ({limit.unit})</label>
                <input
                  className="threshold-input"
                  type="number"
                  step="0.001"
                  value={minDraft}
                  onChange={(e) => { setMinDraft(e.target.value); setThresholdMsg(''); }}
                />
              </div>
              <div className="threshold-edit-field">
                <label className="threshold-label">Max ({limit.unit})</label>
                <input
                  className="threshold-input"
                  type="number"
                  step="0.001"
                  value={maxDraft}
                  onChange={(e) => { setMaxDraft(e.target.value); setThresholdMsg(''); }}
                />
              </div>
              <button className="btn-secondary" type="button" onClick={handleThresholdSave}>
                Save
              </button>
            </div>
            {thresholdMsg && <p className="threshold-msg">{thresholdMsg}</p>}
          </div>

          <div className="sensor-modal-section">
            <span className="mini-label">Alert History ({sensorAlerts.length})</span>
            {sensorAlerts.length === 0 ? (
              <div className="empty-state empty-state-small">
                <svg viewBox="0 0 60 60" fill="none" className="empty-state-icon" aria-hidden="true">
                  <circle cx="30" cy="30" r="18" stroke="rgba(110,181,183,0.4)" strokeWidth="2" />
                  <path d="M30 22v10M30 36v2" stroke="rgba(110,181,183,0.4)" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p className="empty-state-label">No alerts for this sensor</p>
              </div>
            ) : (
              <div className="sensor-alert-list">
                {sensorAlerts.slice(0, 10).map((item) => (
                  <div key={item.id} className={`compliance-item ${item.read ? '' : 'unread-alert'}`}>
                    <div className="status-dot" style={{
                      background: item.severity === 'critical' ? '#de8a7f' : item.severity === 'warning' ? '#eabf82' : '#6eb5b7'
                    }} />
                    <span className="alert-item-text">
                      <strong>{item.title}</strong>
                      {formatAlertTime && <span className="alert-time-small"> · {formatAlertTime(item.ts)}</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorDetailModal;
