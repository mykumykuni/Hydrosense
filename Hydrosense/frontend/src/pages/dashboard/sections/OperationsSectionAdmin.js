import React, { useState } from 'react';
import WaterLevelSection from './WaterLevelSection';

const OperationsSectionAdmin = ({
  sensors,
  limits,
  activeThresholdAlerts,
  alertLog,
  historyWindow,
  updateHistoryWindow,
  formatAlertTime,
  announcement,
  onSetAnnouncement,
  onClearAnnouncement
}) => {
  const [announceDraft, setAnnounceDraft] = useState('');
  const [announceMsg, setAnnounceMsg] = useState('');

  const handlePost = () => {
    if (!announceDraft.trim()) return;
    onSetAnnouncement(announceDraft.trim());
    setAnnounceMsg('Announcement posted.');
    setAnnounceDraft('');
    setTimeout(() => setAnnounceMsg(''), 3000);
  };

  return (
    <section className="operations-grid">
      <article className="analysis-card utility-card">
        <h3 className="mini-label">ADMP Compliance Checklist</h3>
        <div className="compliance-item">
          <div className="status-dot" style={{ background: sensors.do < limits.do.min ? '#de8a7f' : '#6eb5b7' }}></div>
          <span>DO level status [Standard: &gt; 4.0]</span>
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
        <div className="threshold-row" style={{ marginTop: '14px' }}>
          <span className="threshold-label">History Window (points)</span>
          <input
            className="threshold-input"
            type="number"
            min="12"
            max="180"
            step="1"
            value={historyWindow}
            onChange={(e) => updateHistoryWindow(Number(e.target.value))}
          />
        </div>
        <p className="water-level-meta" style={{ marginTop: '10px' }}>Click any sensor card to view and edit thresholds.</p>
      </article>

      <article className="analysis-card utility-card">
        <h3 className="mini-label">Operator Activity Log</h3>
        {alertLog.length === 0 ? (
          <div className="empty-state empty-state-small">
            <svg viewBox="0 0 60 60" fill="none" className="empty-state-icon" aria-hidden="true">
              <rect x="10" y="14" width="40" height="35" rx="4" stroke="rgba(110,181,183,0.4)" strokeWidth="2" />
              <path d="M18 25h24M18 32h18" stroke="rgba(110,181,183,0.4)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="empty-state-label">No activity yet</p>
          </div>
        ) : (
          alertLog.slice(0, 5).map((item) => (
            <div className="compliance-item" key={`activity-${item.id}`}>
              <div className="status-dot" style={{ background: item.severity === 'critical' ? '#de8a7f' : item.severity === 'warning' ? '#eabf82' : '#6eb5b7' }}></div>
              <span>
                {item.title}
                {formatAlertTime && <span className="alert-time-small"> · {formatAlertTime(item.ts)}</span>}
              </span>
            </div>
          ))
        )}
      </article>

      <article className="analysis-card utility-card announcement-card">
        <h3 className="mini-label">Broadcast Announcement</h3>
        {announcement?.message ? (
          <div className="current-announcement">
            <p className="announcement-preview">Current: &ldquo;{announcement.message}&rdquo;</p>
            <button className="btn-danger" type="button" onClick={onClearAnnouncement} style={{ marginTop: '10px' }}>
              Clear Announcement
            </button>
          </div>
        ) : (
          <p className="water-level-meta" style={{ marginBottom: '10px' }}>No active announcement.</p>
        )}
        <div className="announce-compose">
          <textarea
            className="reply-textarea"
            placeholder="Write a message for all operators..."
            value={announceDraft}
            onChange={(e) => setAnnounceDraft(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
            <button className="btn-solid" type="button" onClick={handlePost} disabled={!announceDraft.trim()}>
              Post Announcement
            </button>
            {announceMsg && <span className="profile-msg profile-msg-success" style={{ margin: 0 }}>{announceMsg}</span>}
          </div>
        </div>
      </article>
    </section>
  );
};

export default OperationsSectionAdmin;
