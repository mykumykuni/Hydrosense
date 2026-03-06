import React from 'react';

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

const ProfileSection = ({
  profile,
  authUser,
  isAdmin,
  onChange,
  onPhotoChange,
  onSave,
  isSaving,
  saveMessage,
  saveError
}) => {
  const initials = getInitials(profile.displayName, authUser?.email);
  const role = authUser?.role || (isAdmin ? 'admin' : 'operator');

  return (
    <section className="page-fill-section">
      <article className="analysis-card utility-card profile-card">
        <h3 className="mini-label">My Profile</h3>

        {/* Avatar + identity header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.photoDataUrl ? (
              <img className="profile-avatar-img" src={profile.photoDataUrl} alt="Profile" />
            ) : (
              <span className="profile-avatar-initials">{initials}</span>
            )}
          </div>
          <div className="profile-header-info">
            <p className="profile-display-name">
              {profile.displayName || 'No display name set'}
            </p>
            <p className="profile-email">{authUser?.email || ''}</p>
            {profile.position && (
              <p className="profile-position-text">{profile.position}</p>
            )}
            <span className={`sensor-badge profile-role-badge ${role}`}>{role}</span>
          </div>
        </div>

        {/* Photo upload */}
        <div className="profile-photo-upload">
          <label className="input-label">Profile Photo</label>
          <input className="input-field" type="file" accept="image/*" onChange={onPhotoChange} />
        </div>

        {/* Two-column field grid */}
        <div className="profile-fields-grid">
          <div className="profile-field">
            <label className="input-label">Display Name</label>
            <input
              className="input-field"
              value={profile.displayName || ''}
              onChange={(e) => onChange('displayName', e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div className="profile-field">
            <label className="input-label">Phone</label>
            <input
              className="input-field"
              value={profile.phone || ''}
              onChange={(e) => onChange('phone', e.target.value)}
              placeholder="+63 900 000 0000"
            />
          </div>

          <div className="profile-field">
            <label className="input-label">Position / Title</label>
            <input
              className="input-field"
              value={profile.position || ''}
              onChange={(e) => onChange('position', e.target.value)}
              placeholder="e.g. Senior Operator"
            />
          </div>

          <div className="profile-field">
            <label className="input-label">Emergency Contact</label>
            <input
              className="input-field"
              value={profile.emergencyContact || ''}
              onChange={(e) => onChange('emergencyContact', e.target.value)}
              placeholder="Name — number"
            />
          </div>

          <div className="profile-field profile-field-full">
            <label className="input-label">Address</label>
            <input
              className="input-field"
              value={profile.address || ''}
              onChange={(e) => onChange('address', e.target.value)}
              placeholder="Your address"
            />
          </div>

          <div className="profile-field profile-field-full">
            <label className="input-label">Bio</label>
            <textarea
              className="input-field"
              rows={3}
              value={profile.bio || ''}
              onChange={(e) => onChange('bio', e.target.value)}
              placeholder="Brief description about yourself…"
              style={{ resize: 'vertical', paddingTop: '12px' }}
            />
          </div>
        </div>

        {saveError && <p className="profile-msg profile-msg-error">{saveError}</p>}
        {saveMessage && <p className="profile-msg profile-msg-success">{saveMessage}</p>}

        <button className="btn-secondary profile-save-btn" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </article>
    </section>
  );
};

export default ProfileSection;

