import React, { useState, useEffect, useRef } from 'react';
import '../styles/Dashboard.css';

const limits = {
  do: { min: 4.0, max: 9.0, critical: 1.4, unit: 'mg/L', label: 'Dissolved Oxygen' },
  ph: { min: 6.0, max: 8.0, unit: 'pH', label: 'pH Level' },
  temp: { min: 28.0, max: 32.0, unit: '°C', label: 'Temperature' },
  salinity: { min: 28.0, max: 33.0, unit: 'ppt', label: 'Salinity' },
  ammonia: { min: 0, max: 0.02, critical: 0.05, label: 'Ammonia' },
  nitrite: { min: 0, max: 0.01, critical: 0.15, label: 'Nitrite' },
  chlorine: { min: 0, max: 0.02, critical: 0.10, label: 'Chlorine' }
};

const Dashboard = () => {
  const [sensors, setSensors] = useState({
    do: 6.27, ph: 7.9, temp: 29.7, salinity: 32.2,
    ammonia: 0.007, nitrite: 0.025, chlorine: 0.012,
    waterLevel: 82, uptime: 5166
  });

  const targets = useRef({ ...sensors });

  useEffect(() => {
    const targetInterval = setInterval(() => {
      Object.keys(targets.current).forEach(key => {
        if (key === 'uptime' || key === 'waterLevel') return;
        const limit = limits[key];
        const chance = Math.random();
        if (chance < 0.2) {
          targets.current[key] = key === 'do' ? +(Math.random() * 1.6).toFixed(2) : +(limit.critical + 0.05).toFixed(3);
        } else {
          targets.current[key] = +(limit.min + Math.random() * (limit.max - limit.min)).toFixed(3);
        }
      });
    }, 8000);

    const driftInterval = setInterval(() => {
      setSensors(prev => {
        const next = { ...prev };
        Object.keys(targets.current).forEach(key => {
          if (key === 'uptime' || key === 'waterLevel') return;
          const diff = targets.current[key] - prev[key];
          next[key] = +(prev[key] + diff * 0.02).toFixed(4);
        });
        next.uptime = prev.uptime + 1;
        return next;
      });
    }, 150);

    return () => {
      clearInterval(targetInterval);
      clearInterval(driftInterval);
    };
  }, []);

  const getRiskStatus = (doVal) => {
    if (doVal <= 1.5) return { label: 'EXTREME', color: '#ff4b2b', desc: 'Immediate Asphyxiation Risk' };
    if (doVal <= 3.0) return { label: 'HIGH', color: '#f39c12', desc: 'Hypoxia Imminent' };
    if (doVal <= 4.5) return { label: 'MEDIUM', color: '#f1c40f', desc: 'Monitor Aeration' };
    return { label: 'LOW', color: '#2ecc71', desc: 'Stable Environment' };
  };

  const risk = getRiskStatus(sensors.do);

  const getGlowState = (key, val) => {
    const limit = limits[key];
    if (limit.critical && (key === 'do' ? val <= limit.critical : val >= limit.critical)) return 'state-critical';
    if (val < limit.min || val > limit.max) return 'state-warning';
    return 'state-normal';
  };

  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="dashboard-workspace">
      <aside className="workspace-sidebar">
        <div className="sidebar-logo">
          <div style={{ width: '20px', height: '20px', background: '#2ecc71', borderRadius: '4px' }}></div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '1px' }}>HYDROSENSE</span>
        </div>
        <nav>
          <div className="workspace-nav-item active">Live Monitoring</div>
          <div className="workspace-nav-item">Rearing Schedule</div>
          <div className="workspace-nav-item">ADMP Compliance</div>
        </nav>
      </aside>

      <main className="main-canvas">
        <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0 }}>Command Center</h1>
            <p style={{ opacity: 0.5, fontSize: '0.8rem' }}>Node: BFAR-10 Hatchery | Species: Milkfish (Fry)</p>
          </div>
          <div className="uptime-widget" style={{padding: '10px 20px', height: 'fit-content'}}>
             <span className="mini-label" style={{margin: 0}}>RUNTIME: {formatUptime(sensors.uptime)}</span>
          </div>
        </header>

        {/* PRIMARY KPI GRID */}
        <div className="kpi-grid">
          {['do', 'ph', 'temp', 'salinity'].map((key) => {
            const state = getGlowState(key, sensors[key]);
            return (
              <div key={key} className={`glass-kpi-card ${state}`}>
                <div className="mini-label">{limits[key].label}</div>
                <div className="kpi-value">
                  {sensors[key].toFixed(key === 'do' ? 2 : 1)}
                  <span style={{fontSize: '0.7rem', opacity: 0.4, marginLeft: '5px'}}>{limits[key].unit}</span>
                </div>
                <div style={{ fontSize: '0.6rem', fontWeight: 900 }}>
                  {state === 'state-normal' ? '✓ OPTIMAL' : '⚠ ALERT'}
                </div>
              </div>
            );
          })}
        </div>

        {/* SECONDARY GRID */}
        <div className="secondary-sensor-grid">
          {['ammonia', 'nitrite', 'chlorine'].map((key) => {
             const state = getGlowState(key, sensors[key]);
             return (
              <div key={key} className={`mini-glass-card ${state}`}>
                <div>
                  <div className="mini-label">{key}</div>
                  <div className="mini-value" style={{fontSize: '1.1rem', fontWeight: 700}}>{sensors[key].toFixed(3)}</div>
                </div>
                <div style={{ fontSize: '0.6rem', fontWeight: 900 }}>
                  {state === 'state-normal' ? 'SAFE' : 'TOXIC'}
                </div>
              </div>
             )
          })}
          {/* Reverted System Status Card */}
          <div className="mini-glass-card" style={{justifyContent: 'center', background: 'rgba(255,255,255,0.03)'}}>
            <div style={{textAlign: 'center'}}>
              <div className="mini-label">System Status</div>
              <span style={{fontSize: '0.75rem', fontWeight: 800, color: '#3498db'}}>NODE ENCRYPTED</span>
            </div>
          </div>
        </div>

        {/* ANALYSIS ROW */}
        <div className="analysis-row">
          <div className="analysis-card">
            <h3 className="mini-label">ADMP Compliance Checklist</h3>
            <div className="compliance-item">
              <div className="status-dot" style={{background: sensors.do < limits.do.min ? '#ff4b2b' : '#2ecc71'}}></div>
              <span>DO Level Status [Standard: {'>'}4.0]</span>
            </div>
            <div className="compliance-item">
              <div className="status-dot" style={{background: (sensors.ph < limits.ph.min || sensors.ph > limits.ph.max) ? '#f39c12' : '#2ecc71'}}></div>
              <span>pH Buffering Range Check</span>
            </div>
            <div className="compliance-item">
              <div className="status-dot" style={{background: sensors.nitrite > 0.1 ? '#ff4b2b' : '#2ecc71'}}></div>
              <span>Nitrogenous Waste Limit</span>
            </div>
          </div>

          <div className="analysis-card">
            <h3 className="mini-label">Water Level Control</h3>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '10px 0' }}>{sensors.waterLevel}%</div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${sensors.waterLevel}%`, height: '100%', background: 'linear-gradient(90deg, #2ecc71, #3498db)' }}></div>
            </div>
            <p style={{fontSize: '0.6rem', opacity: 0.5, marginTop: '10px'}}>Inlet Flow: STABLE | Drainage: CLOSED</p>
          </div>

          <div className="analysis-card" style={{border: `1px solid ${risk.color}44`, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center'}}>
             <h3 className="mini-label">Predictive Risk Analysis</h3>
             <div style={{fontSize: '2.2rem', fontWeight: 900, color: risk.color, transition: 'color 1s ease'}}>
                {risk.label}
             </div>
             <p style={{fontSize: '0.65rem', fontWeight: 600, marginTop: '5px'}}>{risk.desc}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
