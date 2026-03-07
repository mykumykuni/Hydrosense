import React, { useState } from 'react';

const REPORT_TYPES = [
  { value: 'equipment', label: 'Equipment Malfunction' },
  { value: 'water_quality', label: 'Water Quality Concern' },
  { value: 'general', label: 'General Request' },
  { value: 'custom', label: 'Custom' }
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

const ALL_STATUSES = ['open', 'acknowledged', 'resolved', 'closed'];

const formatTime = (ts) => new Date(ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

const PriorityBadge = ({ priority }) => (
  <span className={`report-badge priority-badge priority-${priority}`}>{priority}</span>
);

const StatusBadge = ({ status }) => (
  <span className={`report-badge status-badge status-${status}`}>{status}</span>
);

const ReportCard = ({ report, isAdmin, onReply, onStatusChange }) => {
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    await onReply(report.id, replyText.trim());
    setReplyText('');
    setShowReply(false);
  };

  const canReply = report.type === 'general' || report.type === 'custom';

  return (
    <article className={`report-card status-${report.status}`}>
      <div className="report-card-header" onClick={() => setExpanded((e) => !e)}>
        <div className="report-card-title-row">
          <h4 className="report-subject">{report.subject}</h4>
          <div className="report-badges">
            <PriorityBadge priority={report.priority} />
            <StatusBadge status={report.status} />
          </div>
        </div>
        <p className="report-meta">
          {isAdmin ? (report.submittedByName || report.submittedByEmail) + ' · ' : ''}
          {formatTime(report.createdAt)}
          {expanded ? ' ▲' : ' ▼'}
        </p>
      </div>

      {expanded && (
        <div className="report-card-body">
          <p className="report-message">{report.message}</p>

          {report.replies && report.replies.length > 0 && (
            <div className="report-replies">
              <p className="mini-label" style={{ marginBottom: '8px' }}>Replies</p>
              {report.replies.map((reply) => (
                <div key={reply.id} className={`report-reply reply-${reply.authorRole}`}>
                  <span className="reply-author">{reply.authorEmail} · {reply.authorRole}</span>
                  <p className="reply-message">{reply.message}</p>
                  <span className="reply-time">{formatTime(reply.createdAt)}</span>
                </div>
              ))}
            </div>
          )}

          {isAdmin && (
            <div className="report-actions">
              <div className="status-controls">
                <p className="mini-label" style={{ marginBottom: '6px' }}>Update Status</p>
                <div className="status-buttons">
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`btn-secondary status-btn ${report.status === s ? 'active' : ''}`}
                      onClick={() => onStatusChange(report.id, s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {canReply && (
                <div className="reply-section">
                  {showReply ? (
                    <div className="reply-compose">
                      <textarea
                        className="reply-textarea"
                        placeholder="Write your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                      />
                      <div className="reply-compose-actions">
                        <button className="btn-solid reply-send-btn" type="button" onClick={handleReply}>
                          Send Reply
                        </button>
                        <button className="btn-secondary" type="button" onClick={() => setShowReply(false)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn-secondary" type="button" onClick={() => setShowReply(true)}>
                      Reply
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
};

const exportReportsCSV = (reports) => {
  const rows = [
    ['id', 'type', 'subject', 'priority', 'status', 'submittedBy', 'message', 'createdAt', 'replies'],
    ...reports.map((r) => [
      r.id,
      r.type,
      r.subject,
      r.priority,
      r.status,
      r.submittedByEmail || '',
      r.message,
      new Date(r.createdAt).toISOString(),
      (r.replies || []).map((rep) => `${rep.authorEmail}: ${rep.message}`).join(' | ')
    ])
  ];
  const csv = rows.map((row) => row.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hydrosense-reports-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const ReportsSection = ({
  isAdmin,
  reports,
  reportsLoading,
  reportsError,
  submitReport,
  replyToReport,
  updateReportStatus,
  onRefresh
}) => {
  const [formType, setFormType] = useState('equipment');
  const [formPriority, setFormPriority] = useState('medium');
  const [formSubject, setFormSubject] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    if (!formMessage.trim()) {
      setSubmitError('Message is required.');
      return;
    }
    setSubmitting(true);
    const result = await submitReport({
      type: formType,
      priority: formPriority,
      subject: formSubject,
      message: formMessage
    });
    setSubmitting(false);
    if (!result.ok) {
      setSubmitError(result.error || 'Failed to submit report.');
    } else {
      setSubmitSuccess('Report submitted successfully.');
      setFormMessage('');
      setFormSubject('');
      setFormType('equipment');
      setFormPriority('medium');
      if (onRefresh) onRefresh();
    }
  };

  if (isAdmin) {
    return (
      <section className="page-fill-section">
        <article className="analysis-card utility-card reports-inbox-card">
          <div className="reports-header">
            <div>
              <h3 className="mini-label">Report Inbox</h3>
              <p className="water-level-meta">
                {reports.length} report{reports.length !== 1 ? 's' : ''}
              </p>
            </div>
            {onRefresh && (
              <button
                type="button"
                className="btn-secondary"
                onClick={onRefresh}
                disabled={reportsLoading}
                style={{ height: '32px', padding: '0 12px', fontSize: '0.72rem' }}
              >
                {reportsLoading ? 'Loading…' : 'Refresh'}
              </button>
            )}
            {reports.length > 0 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => exportReportsCSV(reports)}
                style={{ height: '32px', padding: '0 12px', fontSize: '0.72rem' }}
              >
                Export CSV
              </button>
            )}
          </div>

          {reportsLoading && <p className="water-level-meta">Loading reports...</p>}
          {reportsError && <p className="report-error">{reportsError}</p>}

          {!reportsLoading && reports.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 80 80" fill="none" className="empty-state-icon" aria-hidden="true">
                <rect x="12" y="18" width="56" height="48" rx="6" stroke="rgba(110,181,183,0.4)" strokeWidth="2" />
                <path d="M24 32h32M24 42h24M24 52h16" stroke="rgba(110,181,183,0.4)" strokeWidth="2" strokeLinecap="round" />
                <circle cx="62" cy="20" r="10" fill="rgba(110,181,183,0.12)" stroke="rgba(110,181,183,0.4)" strokeWidth="2" />
                <path d="M58 20l2.5 2.5L66 16" stroke="rgba(110,181,183,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="empty-state-label">Inbox is clear</p>
              <p className="empty-state-hint">Operator submissions will appear here.</p>
            </div>
          )}

          <div className="reports-list">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                isAdmin
                onReply={replyToReport}
                onStatusChange={updateReportStatus}
              />
            ))}
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="page-fill-section">
      <article className="analysis-card utility-card reports-operator-card">
        <div className="reports-split">
          <div className="report-form-panel">
            <h3 className="mini-label" style={{ marginBottom: '14px' }}>Submit a Report</h3>
            <form className="report-form" onSubmit={handleSubmit}>
              <div className="report-form-group">
                <label className="input-label">Report Type</label>
                <div className="report-type-chips">
                  {REPORT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      className={`filter-chip ${formType === t.value ? 'active' : ''}`}
                      onClick={() => setFormType(t.value)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="report-form-group">
                <label className="input-label">Priority</label>
                <div className="report-type-chips">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      className={`filter-chip priority-chip priority-${p.value} ${formPriority === p.value ? 'active' : ''}`}
                      onClick={() => setFormPriority(p.value)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {formType === 'custom' && (
                <div className="report-form-group">
                  <label className="input-label">Subject</label>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="Enter report subject"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    maxLength={120}
                  />
                </div>
              )}

              <div className="report-form-group">
                <label className="input-label">Message</label>
                <textarea
                  className="input-field report-textarea"
                  placeholder="Describe the issue in detail..."
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              {submitError && <p className="report-error">{submitError}</p>}
              {submitSuccess && <p className="report-success">{submitSuccess}</p>}

              <button className="btn-solid" type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>

          <div className="report-history-panel">
            <h3 className="mini-label" style={{ marginBottom: '14px' }}>Your Submissions</h3>
            {reportsLoading && <p className="water-level-meta">Loading...</p>}
            {reportsError && <p className="report-error">{reportsError}</p>}

            {!reportsLoading && reports.length === 0 && (
              <div className="empty-state">
                <svg viewBox="0 0 80 80" fill="none" className="empty-state-icon" aria-hidden="true">
                  <rect x="12" y="18" width="56" height="48" rx="6" stroke="rgba(110,181,183,0.4)" strokeWidth="2" />
                  <path d="M24 32h32M24 42h24M24 52h16" stroke="rgba(110,181,183,0.4)" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p className="empty-state-label">No reports yet</p>
                <p className="empty-state-hint">Use the form to submit your first report.</p>
              </div>
            )}

            <div className="own-reports-list">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  isAdmin={false}
                  onReply={() => {}}
                  onStatusChange={() => {}}
                />
              ))}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
};

export default ReportsSection;
