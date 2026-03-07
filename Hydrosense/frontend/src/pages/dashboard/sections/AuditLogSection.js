import React, { useState } from 'react';

const ACTION_LABELS = {
  approve_operator: 'Approved Operator',
  deactivate_operator: 'Deactivated Operator',
  reactivate_operator: 'Reactivated Operator',
  remove_operator: 'Removed Operator',
  update_threshold: 'Threshold Updated',
  set_history_window: 'History Window Changed',
  resolve_alert: 'Alert Resolved',
  clear_all_alerts: 'Alerts Cleared',
  create_manual_alert: 'Manual Alert Created',
  set_announcement: 'Announcement Posted',
  clear_announcement: 'Announcement Cleared',
};

const ACTION_TONE = {
  approve_operator: '#6eb5b7',
  deactivate_operator: '#eabf82',
  reactivate_operator: '#6eb5b7',
  remove_operator: '#de8a7f',
  update_threshold: '#b5a8d4',
  set_history_window: '#b5a8d4',
  resolve_alert: '#6eb5b7',
  clear_all_alerts: '#eabf82',
  create_manual_alert: '#eabf82',
  set_announcement: '#6eb5b7',
  clear_announcement: '#eabf82',
};

const formatTime = (ts) => new Date(ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

const PAGE_SIZE = 25;

const AuditLogSection = ({ auditLog = [], shiftLogs = [] }) => {
  const [tab, setTab] = useState('audit');
  const [page, setPage] = useState(0);

  const activeLog = tab === 'audit' ? auditLog : shiftLogs;
  const totalPages = Math.max(1, Math.ceil(activeLog.length / PAGE_SIZE));
  const pageItems = activeLog.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <section className="page-fill-section">
      <article className="analysis-card utility-card">
        <div className="audit-header">
          <div>
            <h3 className="mini-label">Admin Audit &amp; Activity</h3>
            <p className="water-level-meta" style={{ marginTop: '4px' }}>
              {activeLog.length} {tab === 'audit' ? 'audit entries' : 'shift log entries'}
            </p>
          </div>
          <div className="audit-tabs">
            <button
              type="button"
              className={`filter-chip ${tab === 'audit' ? 'active' : ''}`}
              onClick={() => { setTab('audit'); setPage(0); }}
            >
              Audit Log
            </button>
            <button
              type="button"
              className={`filter-chip ${tab === 'shift' ? 'active' : ''}`}
              onClick={() => { setTab('shift'); setPage(0); }}
            >
              Shift Logs
            </button>
          </div>
        </div>

        {activeLog.length === 0 ? (
          <div className="empty-state empty-state-small" style={{ marginTop: '24px' }}>
            <svg viewBox="0 0 60 60" fill="none" className="empty-state-icon" aria-hidden="true">
              <rect x="10" y="14" width="40" height="35" rx="4" stroke="rgba(110,181,183,0.4)" strokeWidth="2" />
              <path d="M18 25h24M18 32h18" stroke="rgba(110,181,183,0.4)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="empty-state-label">No entries yet</p>
          </div>
        ) : (
          <>
            <div className="audit-list">
              {tab === 'audit' ? (
                pageItems.map((entry) => (
                  <div key={entry.id} className="audit-entry">
                    <div
                      className="audit-dot"
                      style={{ background: ACTION_TONE[entry.action] || '#6eb5b7' }}
                    />
                    <div className="audit-entry-body">
                      <div className="audit-entry-top">
                        <span className="audit-action-label">{ACTION_LABELS[entry.action] || entry.action}</span>
                        <span className="audit-time">{formatTime(entry.ts)}</span>
                      </div>
                      <p className="audit-detail">{entry.detail}</p>
                      <span className="audit-actor">{entry.actorEmail}</span>
                    </div>
                  </div>
                ))
              ) : (
                pageItems.map((entry) => (
                  <div key={entry.id} className="audit-entry">
                    <div className="audit-dot" style={{ background: '#6eb5b7' }} />
                    <div className="audit-entry-body">
                      <div className="audit-entry-top">
                        <span className="audit-action-label">
                          {entry.operatorName || entry.operatorEmail}
                        </span>
                        <span className="audit-time">{formatTime(entry.ts)}</span>
                      </div>
                      <p className="audit-detail">{entry.note}</p>
                      <span className="audit-actor">{entry.operatorEmail}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="audit-pagination">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  ←
                </button>
                <span className="water-level-meta">
                  {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </article>
    </section>
  );
};

export default AuditLogSection;
