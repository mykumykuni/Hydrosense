import React from 'react';

const ProfileSection = ({
  profile,
  onChange,
  onPhotoChange,
  onSave,
  isSaving,
  saveMessage,
  saveError
}) => {
  return (
    <section className="operations-grid">
      <article className="analysis-card utility-card">
        <h3 className="mini-label">Operator Profile</h3>
        <p className="water-level-meta">Customize your account details visible to admin.</p>

        <div style={{ marginTop: '14px', marginBottom: '14px' }}>
          {profile.photoDataUrl ? (
            <img
              src={profile.photoDataUrl}
              alt="Profile"
              style={{ width: '96px', height: '96px', borderRadius: '14px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }}
            />
          ) : (
            <div style={{ width: '96px', height: '96px', borderRadius: '14px', background: 'rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center' }}>
              No Photo
            </div>
          )}
        </div>

        <label className="input-label">Photo</label>
        <input className="input-field" type="file" accept="image/*" onChange={onPhotoChange} />

        <div style={{ marginTop: '14px' }}>
          <label className="input-label">Display Name</label>
          <input className="input-field" value={profile.displayName || ''} onChange={(e) => onChange('displayName', e.target.value)} />
        </div>

        <div style={{ marginTop: '14px' }}>
          <label className="input-label">Phone</label>
          <input className="input-field" value={profile.phone || ''} onChange={(e) => onChange('phone', e.target.value)} />
        </div>

        <div style={{ marginTop: '14px' }}>
          <label className="input-label">Address</label>
          <input className="input-field" value={profile.address || ''} onChange={(e) => onChange('address', e.target.value)} />
        </div>

        <div style={{ marginTop: '14px' }}>
          <label className="input-label">Position/Title</label>
          <input className="input-field" value={profile.position || ''} onChange={(e) => onChange('position', e.target.value)} />
        </div>

        <div style={{ marginTop: '14px' }}>
          <label className="input-label">Emergency Contact</label>
          <input className="input-field" value={profile.emergencyContact || ''} onChange={(e) => onChange('emergencyContact', e.target.value)} />
        </div>

        <div style={{ marginTop: '14px' }}>
          <label className="input-label">Bio</label>
          <textarea
            className="input-field"
            rows={4}
            value={profile.bio || ''}
            onChange={(e) => onChange('bio', e.target.value)}
            style={{ resize: 'vertical', paddingTop: '10px' }}
          />
        </div>

        {saveError && <p className="water-level-meta" style={{ color: '#de8a7f', marginTop: '12px' }}>{saveError}</p>}
        {saveMessage && <p className="water-level-meta" style={{ color: '#6eb5b7', marginTop: '12px' }}>{saveMessage}</p>}

        <button className="btn-secondary" style={{ marginTop: '16px' }} onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </article>
    </section>
  );
};

export default ProfileSection;
