import React, { useState, useEffect } from 'react';

const formatTime = (ts) => {
  if (!ts) return '';
  return new Date(ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
};

const AnnouncementBanner = ({ announcement, isAdmin, onClear }) => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (announcement?.setAt) {
      const key = `announcement-dismissed-${announcement.setAt}`;
      if (localStorage.getItem(key)) {
        setDismissed(true);
      } else {
        setDismissed(false);
      }
    }
  }, [announcement?.setAt]);

  if (!announcement?.message) return null;
  if (!isAdmin && dismissed) return null;

  const handleDismiss = () => {
    const key = `announcement-dismissed-${announcement.setAt}`;
    localStorage.setItem(key, '1');
    setDismissed(true);
  };

  return (
    <div className="announcement-banner">
      <div className="announcement-banner-content">

        <div className="announcement-body">
          <p className="announcement-message">{announcement.message}</p>
          {announcement.setAt && (
            <span className="announcement-meta">
              Posted by {announcement.setByEmail} · {formatTime(announcement.setAt)}
            </span>
          )}
        </div>
      </div>
      <div className="announcement-actions">
        {isAdmin && (
          <button className="btn-danger announcement-clear-btn" type="button" onClick={onClear}>
            Clear
          </button>
        )}
        {!isAdmin && (
          <button className="btn-secondary announcement-dismiss-btn" type="button" onClick={handleDismiss}>
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

export default AnnouncementBanner;
