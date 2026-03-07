import React, { useState } from 'react';
import WaterLevelSection from './WaterLevelSection';

const formatTime = (ts) => new Date(ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

const OperationsSectionOperator = ({ sensors, onNavigateReports, shiftLogs, onSubmitShiftLog, operatorName }) => {
  const [noteText, setNoteText] = useState('');
  const [noteMsg, setNoteMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitNote = async () => {
    if (!noteText.trim()) return;
    setSubmitting(true);
    await onSubmitShiftLog(noteText.trim(), operatorName);
    setNoteText('');
    setNoteMsg('Shift note saved.');
    setSubmitting(false);
    setTimeout(() => setNoteMsg(''), 3000);
  };

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

      <article className="analysis-card utility-card shift-log-card">
        <h3 className="mini-label">Shift Log</h3>
        <p className="water-level-meta" style={{ marginBottom: '12px' }}>Log notes about your shift — visible to admin.</p>
        <div className="shift-log-compose">
          <textarea
            className="reply-textarea"
            placeholder="What happened during your shift? Notes, observations, actions taken..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
            maxLength={1000}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
            <button
              className="btn-solid"
              type="button"
              onClick={handleSubmitNote}
              disabled={submitting || !noteText.trim()}
            >
              {submitting ? 'Saving...' : 'Save Note'}
            </button>
            {noteMsg && <span className="profile-msg profile-msg-success" style={{ margin: 0 }}>{noteMsg}</span>}
          </div>
        </div>

        {shiftLogs && shiftLogs.length > 0 && (
          <div className="shift-log-history">
            <span className="mini-label" style={{ marginBottom: '8px', display: 'block' }}>Your Recent Notes</span>
            {shiftLogs.slice(0, 5).map((entry) => (
              <div key={entry.id} className="shift-log-entry">
                <div className="shift-log-entry-top">
                  <span className="shift-log-time">{formatTime(entry.ts)}</span>
                </div>
                <p className="shift-log-note">{entry.note}</p>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
};

export default OperationsSectionOperator;
