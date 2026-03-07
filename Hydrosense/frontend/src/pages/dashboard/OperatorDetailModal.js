import React from 'react';

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

const formatDate = (ts) => {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const DetailField = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="op-detail-field">
      <span className="mini-label">{label}</span>
      <p className="op-detail-value">{value}</p>
    </div>
  );
};

const OperatorDetailModal = ({ operator, onClose }) => {
  if (!operator) return null;

  const { profile = {}, email, status, createdAt, approvedAt, lastLoginAt } = operator;
  const { displayName, photoDataUrl, phone, position, address, bio, emergencyContact } = profile;

  return (
    <div className="alert-modal-backdrop" onClick={onClose}>
      <div className="sensor-detail-modal op-detail-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header — mirrors SensorDetailModal */}
        <div className="sensor-modal-header">
          <div>
            <span className="mini-label">Operator Profile</span>
            <h2 style={{ marginTop: '4px' }}>{displayName || 'Unnamed Operator'}</h2>
          </div>
          <button className="btn-secondary modal-close-btn" type="button" onClick={onClose}>✕</button>
        </div>

        <div className="sensor-modal-body">

          {/* Hero: avatar + identity */}
          <div className="sensor-modal-section op-detail-hero">
            <div className="op-detail-avatar">
              {photoDataUrl ? (
                <img className="op-detail-avatar-img" src={photoDataUrl} alt="profile" />
              ) : (
                <span className="op-detail-avatar-initials">
                  {getInitials(displayName, email)}
                </span>
              )}
            </div>
            <div className="op-detail-identity">
              <p className="op-detail-email">{email}</p>
              {position && <p className="op-detail-position">{position}</p>}
              <span
                className="sensor-badge"
                style={{ backgroundColor: statusTone[status] || 'rgba(110,181,183,0.25)', color: '#0e1a1c', marginTop: '10px', display: 'inline-block' }}
              >
                {status}
              </span>
            </div>
          </div>

          {/* Details grid */}
          <div className="sensor-modal-section">
            <span className="mini-label">Details</span>
            <div className="op-detail-grid" style={{ marginTop: '12px' }}>
              <DetailField label="Phone" value={phone} />
              <DetailField label="Emergency Contact" value={emergencyContact} />
              <DetailField label="Joined" value={formatDate(createdAt)} />
              {approvedAt && <DetailField label="Approved" value={formatDate(approvedAt)} />}
              {lastLoginAt && <DetailField label="Last Login" value={formatDate(lastLoginAt)} />}
              {address && (
                <div className="op-detail-field op-detail-field-wide">
                  <span className="mini-label">Address</span>
                  <p className="op-detail-value">{address}</p>
                </div>
              )}
              {bio && (
                <div className="op-detail-field op-detail-field-wide">
                  <span className="mini-label">Bio</span>
                  <p className="op-detail-value op-detail-bio">{bio}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OperatorDetailModal;
