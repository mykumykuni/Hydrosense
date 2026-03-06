import React from 'react';

const statusTone = {
  pending: '#eabf82',
  active: '#6eb5b7',
  deactivated: '#de8a7f'
};

const OperatorManagementSection = ({
  operators,
  pendingCount,
  search,
  onSearch,
  onApprove,
  onDeactivate,
  onReactivate,
  onRefresh,
  error,
  loading
}) => {
  return (
    <section className="operations-grid">
      <article className="analysis-card utility-card">
        <h3 className="mini-label">Operator Profiles</h3>
        <p className="water-level-meta">Pending approvals: {pendingCount}</p>

        <div style={{ marginTop: '10px', marginBottom: '4px' }}>
          <button className="btn-secondary" onClick={onRefresh} disabled={loading}>Refresh List</button>
        </div>

        <div style={{ marginTop: '12px', marginBottom: '12px' }}>
          <label className="input-label">Search by name/email</label>
          <input className="input-field" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search operators" />
        </div>

        {loading && <p className="water-level-meta">Loading operators...</p>}
        {error && <p className="water-level-meta" style={{ color: '#de8a7f' }}>{error}</p>}

        {operators.map((operator) => (
          <article key={operator.id} className="alert-item" style={{ marginTop: '12px' }}>
            <div className="alert-item-head">
              <span className="sensor-badge" style={{ backgroundColor: statusTone[operator.status] || '#6eb5b7' }}>{operator.status}</span>
              <span className="water-level-meta">{operator.email}</span>
            </div>
            <h4>{operator.profile?.displayName || 'Unnamed Operator'}</h4>
            <p>{operator.profile?.position || 'No position set'}</p>
            <div className="mobile-alert-actions">
              {operator.status === 'pending' && (
                <button className="btn-secondary" onClick={() => onApprove(operator.id)}>Approve</button>
              )}
              {operator.status === 'active' && (
                <button className="btn-secondary" onClick={() => onDeactivate(operator.id)}>Deactivate</button>
              )}
              {operator.status === 'deactivated' && (
                <button className="btn-secondary" onClick={() => onReactivate(operator.id)}>Reactivate</button>
              )}
            </div>
          </article>
        ))}

        {!loading && operators.length === 0 && (
          <p className="water-level-meta">No operators found.</p>
        )}
      </article>
    </section>
  );
};

export default OperatorManagementSection;
