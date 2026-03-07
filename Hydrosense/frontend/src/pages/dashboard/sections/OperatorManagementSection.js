import React, { useState } from 'react';
import OperatorDetailModal from '../OperatorDetailModal';

const statusTone = {
  pending: '#eabf82',
  active: '#6eb5b7',
  deactivated: '#de8a7f'
};

const getInitials = (name, email) => {
  const n = String(name || '').trim();
  if (n) {
    const parts = n.split(' ').filter(Boolean);
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return String(email || '?')[0].toUpperCase();
};

const OperatorManagementSection = ({
  operators,
  pendingCount,
  search,
  onSearch,
  onApprove,
  onDeactivate,
  onReactivate,
  onRemove,
  onRefresh,
  error,
  loading
}) => {
  const [selectedOperator, setSelectedOperator] = useState(null);

  const handleRemove = (operator) => {
    const name = operator.profile?.displayName || operator.email;
    if (window.confirm(`Remove "${name}" permanently? This cannot be undone.`)) {
      onRemove(operator.id);
    }
  };

  return (
    <section className="page-fill-section">
      <article className="analysis-card utility-card operator-mgmt-card">
        <div className="operator-mgmt-header">
          <div>
            <h3 className="mini-label">Operator Management</h3>
            <p className="water-level-meta" style={{ marginTop: '4px' }}>
              {pendingCount > 0 ? `${pendingCount} pending approval` : 'All operators reviewed'}
            </p>
          </div>
          <button className="btn-secondary" onClick={onRefresh} disabled={loading}>
            {loading ? '…' : 'Refresh'}
          </button>
        </div>

        <div className="operator-search">
          <input
            className="input-field"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by name or email…"
          />
        </div>

        {error && <p className="profile-msg profile-msg-error">{error}</p>}
        {loading && operators.length === 0 && (
          <p className="water-level-meta">Loading operators…</p>
        )}

        <div className="operator-list">
          {operators.map((operator) => (
            <article
              key={operator.id}
              className="operator-card operator-card-clickable"
              onClick={() => setSelectedOperator(operator)}
              title="Click to view details"
            >
              <div className="operator-card-avatar">
                {operator.profile?.photoDataUrl ? (
                  <img className="operator-avatar-img" src={operator.profile.photoDataUrl} alt="avatar" />
                ) : (
                  <span className="operator-avatar-initials">
                    {getInitials(operator.profile?.displayName, operator.email)}
                  </span>
                )}
              </div>
              <div className="operator-card-body">
                <div className="operator-card-top">
                  <div className="operator-info">
                    <p className="operator-name">
                      {operator.profile?.displayName || 'Unnamed Operator'}
                    </p>
                    <p className="operator-email">{operator.email}</p>
                    {operator.profile?.position && (
                      <p className="operator-meta">{operator.profile.position}</p>
                    )}
                  </div>
                  <span
                    className="sensor-badge"
                    style={{ backgroundColor: statusTone[operator.status], color: '#0e1a1c', flexShrink: 0 }}
                  >
                    {operator.status}
                  </span>
                </div>
                <div className="operator-card-actions" onClick={(e) => e.stopPropagation()}>
                  {operator.status === 'pending' && (
                    <>
                      <button className="btn-secondary" onClick={() => onApprove(operator.id)}>
                        Approve
                      </button>
                      <button className="btn-danger" onClick={() => handleRemove(operator)}>
                        Reject
                      </button>
                    </>
                  )}
                  {operator.status === 'active' && (
                    <button className="btn-secondary" onClick={() => onDeactivate(operator.id)}>
                      Deactivate
                    </button>
                  )}
                  {operator.status === 'deactivated' && (
                    <>
                      <button className="btn-secondary" onClick={() => onReactivate(operator.id)}>
                        Reactivate
                      </button>
                      <button className="btn-danger" onClick={() => handleRemove(operator)}>
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {!loading && operators.length === 0 && (
          <p className="water-level-meta">No operators found.</p>
        )}
      </article>

      {selectedOperator && (
        <OperatorDetailModal
          operator={selectedOperator}
          onClose={() => setSelectedOperator(null)}
        />
      )}
    </section>
  );
};

export default OperatorManagementSection;

