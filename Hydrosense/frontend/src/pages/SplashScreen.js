import React, { useEffect, useState } from 'react';
import '../styles/Splash.css';

const SplashScreen = ({ onComplete }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 2000);
    const t2 = setTimeout(onComplete, 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <div className={`splash-screen${exiting ? ' splash-exit' : ''}`}>
      <div className="splash-ripples">
        <div className="splash-ripple r1" />
        <div className="splash-ripple r2" />
        <div className="splash-ripple r3" />
        <div className="splash-ripple r4" />
      </div>
      <div className="splash-panel">
        <img src="/adjusted%20dd.png" alt="Hydrosense" className="splash-logo" />
        <p className="splash-tagline">Real-Time Water Quality Monitoring</p>
      </div>
    </div>
  );
};

export default SplashScreen;
