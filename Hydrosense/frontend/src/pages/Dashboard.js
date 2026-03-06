import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const limits = {
  do: { min: 4.0, max: 9.0, critical: 1.4, unit: 'mg/L', label: 'Dissolved Oxygen' },
  ph: { min: 6.0, max: 8.0, unit: 'pH', label: 'pH Level' },
  temp: { min: 28.0, max: 32.0, unit: 'deg C', label: 'Temperature' },
  salinity: { min: 28.0, max: 33.0, unit: 'ppt', label: 'Salinity' },
  ammonia: { min: 0, max: 0.02, critical: 0.05, unit: 'mg/L', label: 'Ammonia' },
  nitrite: { min: 0, max: 0.01, critical: 0.15, unit: 'mg/L', label: 'Nitrite' },
  chlorine: { min: 0, max: 0.02, critical: 0.1, unit: 'mg/L', label: 'Chlorine' }
};

const HISTORY_POINTS = 32;

const Dashboard = () => {
  const navigate = useNavigate();

  const [themeMode, setThemeMode] = useState('dark');
  const [role, setRole] = useState('operator');
  const [mobileTab, setMobileTab] = useState('summary');

  const [sensors, setSensors] = useState({
    do: 6.27,
    ph: 7.9,
    temp: 29.7,
    salinity: 32.2,
    ammonia: 0.007,
    nitrite: 0.025,
    chlorine: 0.012,
    waterLevel: 82,
    uptime: 5166
  });

  const [history, setHistory] = useState(
    Object.fromEntries(Object.keys(limits).map((key) => [key, []]))
  );

  const targets = useRef({ ...sensors });
  const conditionRef = useRef({});
  const cooldownRef = useRef({});
  const sensorRefs = useRef({});

  const [alertLog, setAlertLog] = useState([]);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertFilter, setAlertFilter] = useState('all');
  const [focusSensorKey, setFocusSensorKey] = useState('');

  const pushAlert = (severity, title, message, source) => {
    const key = `${source}-${severity}`;
    const now = Date.now();
    const last = cooldownRef.current[key] || 0;
    if (now - last < 8000) return;
    cooldownRef.current[key] = now;

    setAlertLog((prev) => [
      {
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        severity,
        title,
        message,
        source,
        read: false,
        ts: now
      },
      ...prev
    ]);
  };

  useEffect(() => {
    pushAlert('info', 'System Initialized', 'Live sensor monitoring session started.', 'system');

    const targetInterval = setInterval(() => {
      Object.keys(targets.current).forEach((key) => {
        if (key === 'uptime' || key === 'waterLevel') return;
        const limit = limits[key];
        const chance = Math.random();
        if (chance < 0.2) {
          targets.current[key] = key === 'do'
            ? +(Math.random() * 1.6).toFixed(2)
            : +(limit.critical + 0.05).toFixed(3);
        } else {
          targets.current[key] = +(limit.min + Math.random() * (limit.max - limit.min)).toFixed(3);
        }
      });
    }, 8000);

    const driftInterval = setInterval(() => {
      setSensors((prev) => {
        const next = { ...prev };
        Object.keys(targets.current).forEach((key) => {
          if (key === 'uptime' || key === 'waterLevel') return;
          const diff = targets.current[key] - prev[key];
          next[key] = +(prev[key] + diff * 0.02).toFixed(4);
        });
        next.uptime = prev.uptime + 1;

        setHistory((prevHistory) => {
          const nextHistory = { ...prevHistory };
          Object.keys(limits).forEach((key) => {
            const entries = [...(prevHistory[key] || []), next[key]];
            nextHistory[key] = entries.slice(-HISTORY_POINTS);
          });
          return nextHistory;
        });

        return next;
      });
    }, 150);

    return () => {
      clearInterval(targetInterval);
      clearInterval(driftInterval);
    };
  }, []);

  useEffect(() => {
    Object.keys(limits).forEach((key) => {
      const limit = limits[key];
      const value = sensors[key];

      const isOut = value < limit.min || value > limit.max;
      const wasOut = Boolean(conditionRef.current[`${key}-out`]);
      if (isOut && !wasOut) {
        pushAlert('warning', `${limit.label} Out of Range`, `${limit.label} is ${value.toFixed(3)} ${limit.unit}.`, `${key}-out`);
      }
      conditionRef.current[`${key}-out`] = isOut;

      if (limit.critical) {
        const isCritical = key === 'do' ? value <= limit.critical : value >= limit.critical;
        const wasCritical = Boolean(conditionRef.current[`${key}-critical`]);
        if (isCritical && !wasCritical) {
          pushAlert('critical', `${limit.label} Critical`, `${limit.label} hit critical threshold at ${value.toFixed(3)} ${limit.unit}.`, `${key}-critical`);
        }
        conditionRef.current[`${key}-critical`] = isCritical;
      }
    });

    const lowWater = sensors.waterLevel <= 55;
    const highWater = sensors.waterLevel >= 95;

    if (lowWater && !conditionRef.current['water-low']) {
      pushAlert('warning', 'Water Level Low', `Tank level is ${sensors.waterLevel}%. Check inlet flow.`, 'water-low');
    }
    if (highWater && !conditionRef.current['water-high']) {
      pushAlert('warning', 'Water Level High', `Tank level is ${sensors.waterLevel}%. Check drainage.`, 'water-high');
    }

    conditionRef.current['water-low'] = lowWater;
    conditionRef.current['water-high'] = highWater;
  }, [sensors]);

  const getSensorState = (key, val) => {
    const limit = limits[key];
    if (limit.critical && (key === 'do' ? val <= limit.critical : val >= limit.critical)) {
      return { state: 'critical', label: 'Critical', cls: 'state-critical' };
    }
    if (val < limit.min || val > limit.max) {
      return { state: 'warning', label: 'Warning', cls: 'state-warning' };
    }
    return { state: 'normal', label: 'Optimal', cls: 'state-normal' };
  };

  const getSensorInsight = (key, value) => {
    const limit = limits[key];
    if (value < limit.min) {
      return `Below target by ${(limit.min - value).toFixed(2)} ${limit.unit}`;
    }
    if (value > limit.max) {
      return `Above target by ${(value - limit.max).toFixed(2)} ${limit.unit}`;
    }
    return 'Operating inside ideal range';
  };

  const getWaterClarity = () => {
    const pressure = sensors.ammonia + sensors.nitrite + sensors.chlorine;
    if (sensors.do < 4 || pressure > 0.08) {
      return { label: 'UNSAFE', hint: 'Potential turbidity and stress detected', tone: 'clarity-danger' };
    }
    if (sensors.do < 5 || pressure > 0.04) {
      return { label: 'WATCH', hint: 'Slight quality drift, monitor frequently', tone: 'clarity-watch' };
    }
    return { label: 'CLEAR', hint: 'Water body is in stable condition', tone: 'clarity-clear' };
  };

  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const extractSensorKey = (source) => {
    const key = source.split('-')[0];
    return Object.prototype.hasOwnProperty.call(limits, key) ? key : null;
  };

  const markAllRead = () => {
    setAlertLog((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const toggleRead = (id) => {
    setAlertLog((prev) => prev.map((a) => (a.id === id ? { ...a, read: !a.read } : a)));
  };

  const clearAllAlerts = () => {
    setAlertLog([]);
  };

  const createManualAlert = () => {
    pushAlert('info', 'Manual Operator Alert', 'Operator created a manual checkpoint alert.', 'manual-operator');
  };

  const formatAlertTime = (ts) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const openRelatedSensor = (sensorKey) => {
    if (!sensorKey) return;
    setAlertModalOpen(false);
    setMobileTab('sensors');
    setFocusSensorKey(sensorKey);

    setTimeout(() => {
      const node = sensorRefs.current[sensorKey];
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 180);

    setTimeout(() => setFocusSensorKey(''), 1800);
  };

  const renderSparkline = (values, stroke) => {
    if (!values || values.length < 2) {
      return <svg className="sparkline" viewBox="0 0 100 32" aria-hidden="true" />;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * 100;
        const y = 28 - ((value - min) / range) * 24;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg className="sparkline" viewBox="0 0 100 32" aria-hidden="true" preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke={stroke} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const clarity = getWaterClarity();
  const sensorKeys = Object.keys(limits);
  const prioritySensors = ['do', 'ph', 'temp'];
  const secondarySensors = sensorKeys.filter((key) => !prioritySensors.includes(key));
  const activeThresholdAlerts = sensorKeys
    .map((key) => ({ key, ...getSensorState(key, sensors[key]) }))
    .filter((item) => item.state !== 'normal');
  const healthySensorCount = sensorKeys.length - activeThresholdAlerts.length;
  const healthPercent = Math.round((healthySensorCount / sensorKeys.length) * 100);

  const unreadCount = alertLog.filter((a) => !a.read).length;
  const filteredAlerts = alertFilter === 'all'
    ? alertLog
    : alertLog.filter((a) => a.severity === alertFilter);

  const themeClass = themeMode === 'light' ? 'theme-light' : 'theme-dark';

  const summarySection = (
    <section className="summary-strip">
      <article className={`summary-card utility-card ${clarity.tone}`}>
        <span className="mini-label">Water Color / Clarity</span>
        <p className="summary-value">{clarity.label}</p>
        <p className="summary-note">{clarity.hint}</p>
      </article>
      <article className="summary-card utility-card">
        <span className="mini-label">Active Alerts</span>
        <p className="summary-value">{activeThresholdAlerts.length}</p>
        <p className="summary-note">
          {activeThresholdAlerts.length === 0 ? 'No active alarms in this cycle' : 'Immediate checks are recommended'}
        </p>
      </article>
      <article className="summary-card utility-card health-card">
        <span className="mini-label">Sensor Health</span>
        <p className="summary-value">{healthPercent}%</p>
        <p className="summary-note">{healthySensorCount} / {sensorKeys.length} sensors are in optimal range</p>
      </article>
    </section>
  );

  const sensorsSection = (
    <section className="sensor-layout">
      <div className="priority-sensor-grid">
        {prioritySensors.map((key) => {
          const status = getSensorState(key, sensors[key]);
          const precision = key === 'do' ? 2 : 1;
          const value = sensors[key].toFixed(precision);
          const trendColor = status.state === 'critical' ? '#de8a7f' : status.state === 'warning' ? '#eabf82' : '#8fd3d7';

          return (
            <article
              key={key}
              ref={(node) => {
                sensorRefs.current[key] = node;
              }}
              className={`glass-kpi-card sensor-card priority-card ${status.cls} ${focusSensorKey === key ? 'focus-sensor' : ''}`}
            >
              <div className="sensor-head">
                <span className="mini-label">{limits[key].label}</span>
                <span className={`sensor-badge ${status.state}`}>{status.label}</span>
              </div>
              <div className="kpi-value priority-value">
                {value}
                <span className="kpi-unit">{limits[key].unit}</span>
              </div>
              <p className="sensor-range">Range: {limits[key].min} - {limits[key].max} {limits[key].unit}</p>
              <p className="sensor-insight">{getSensorInsight(key, sensors[key])}</p>
              {renderSparkline(history[key], trendColor)}
              <div className="sensor-mini-stats">
                <span>Min {limits[key].min}</span>
                <span>Max {limits[key].max}</span>
                <span>Now {value}</span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="secondary-sensor-grid">
        {secondarySensors.map((key) => {
          const status = getSensorState(key, sensors[key]);
          const value = sensors[key].toFixed(3);
          const trendColor = status.state === 'critical' ? '#de8a7f' : status.state === 'warning' ? '#eabf82' : '#8fd3d7';

          return (
            <article
              key={key}
              ref={(node) => {
                sensorRefs.current[key] = node;
              }}
              className={`glass-kpi-card sensor-card compact-sensor-card ${status.cls} ${focusSensorKey === key ? 'focus-sensor' : ''}`}
            >
              <div className="sensor-head">
                <span className="mini-label">{limits[key].label}</span>
                <span className={`sensor-badge ${status.state}`}>{status.label}</span>
              </div>
              <div className="kpi-value compact-value">
                {value}
                <span className="kpi-unit">{limits[key].unit}</span>
              </div>
              {renderSparkline(history[key], trendColor)}
            </article>
          );
        })}
      </div>
    </section>
  );

  const operationsSection = (
    <section className="operations-grid">
      <article className="analysis-card utility-card">
        <h3 className="mini-label">ADMP Compliance Checklist</h3>
        <div className="compliance-item">
          <div className="status-dot" style={{ background: sensors.do < limits.do.min ? '#de8a7f' : '#6eb5b7' }}></div>
          <span>DO level status [Standard: {'>'} 4.0]</span>
        </div>
        <div className="compliance-item">
          <div className="status-dot" style={{ background: (sensors.ph < limits.ph.min || sensors.ph > limits.ph.max) ? '#eabf82' : '#6eb5b7' }}></div>
          <span>pH buffering range check</span>
        </div>
        <div className="compliance-item">
          <div className="status-dot" style={{ background: sensors.nitrite > 0.1 ? '#de8a7f' : '#6eb5b7' }}></div>
          <span>Nitrogenous waste limit</span>
        </div>
      </article>

      <article className="analysis-card utility-card">
        <h3 className="mini-label">Water Level Control</h3>
        <div className="water-level-visual">
          <div className="water-tank">
            <div className="water-tank-fill" style={{ height: `${sensors.waterLevel}%` }}>
              <div className="water-wave water-wave-a"></div>
              <div className="water-wave water-wave-b"></div>
            </div>
          </div>
          <div className="water-level-meta-block">
            <div className="water-level-value">{sensors.waterLevel}%</div>
            <div className="water-level-markers">
              <span>High: 95%</span>
              <span>Target: 80%</span>
              <span>Low: 55%</span>
            </div>
          </div>
        </div>
        <p className="water-level-meta">Inlet flow: ACTIVE | Drainage: CLOSED</p>
      </article>
    </section>
  );

  const mobileAlertsPane = (
    <section className="mobile-alerts-pane">
      <div className="analysis-card utility-card">
        <h3 className="mini-label">Recent Alerts</h3>
        {filteredAlerts.length === 0 ? (
          <p className="water-level-meta">No alerts for selected filter.</p>
        ) : (
          filteredAlerts.slice(0, 8).map((item) => {
            const sensorKey = extractSensorKey(item.source);
            return (
              <article key={item.id} className={`alert-item ${item.read ? 'read' : 'unread'}`}>
                <div className="alert-item-head">
                  <span className={`sensor-badge ${item.severity}`}>{item.severity}</span>
                  <span className="water-level-meta">{formatAlertTime(item.ts)}</span>
                </div>
                <h4>{item.title}</h4>
                <p>{item.message}</p>
                <div className="mobile-alert-actions">
                  <button className="btn-secondary" type="button" onClick={() => toggleRead(item.id)}>
                    {item.read ? 'Mark Unread' : 'Mark Read'}
                  </button>
                  {sensorKey && (
                    <button className="btn-secondary" type="button" onClick={() => openRelatedSensor(sensorKey)}>
                      Open Sensor
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );

  return (
    <div className={`dashboard-workspace ${themeClass}`}>
      <aside className="workspace-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-dot"></div>
          <span className="sidebar-logo-text">HYDROSENSE</span>
        </div>
        <nav>
          <div className="workspace-nav-item active">Live Monitoring</div>
          <div className="workspace-nav-item">Rearing Schedule</div>
          <div className="workspace-nav-item">ADMP Compliance</div>
        </nav>
      </aside>

      <main className="main-canvas">
        <header className="dashboard-topbar">
          <div>
            <h1 className="command-title">Command Center</h1>
            <p className="command-subtitle">Node: BFAR-10 Hatchery | Species: Milkfish (Fry)</p>
          </div>
          <div className="topbar-actions">
            <div className="role-toggle">
              <button type="button" className={`role-chip ${role === 'operator' ? 'active' : ''}`} onClick={() => setRole('operator')}>Operator</button>
              <button type="button" className={`role-chip ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>Admin</button>
            </div>
            <button className="btn-secondary" onClick={() => setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))}>
              {themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button className="btn-secondary alert-btn" onClick={() => setAlertModalOpen(true)}>
              Alerts
              {unreadCount > 0 && <span className="alert-count-pill">{unreadCount}</span>}
            </button>
            <div className="uptime-widget">
              <span className="mini-label">Runtime: {formatUptime(sensors.uptime)}</span>
            </div>
            <button className="btn-secondary" onClick={() => navigate('/login')}>Logout</button>
          </div>
        </header>

        <div className="mobile-tabs" role="tablist" aria-label="Dashboard sections">
          <button type="button" className={`mobile-tab-btn ${mobileTab === 'summary' ? 'active' : ''}`} onClick={() => setMobileTab('summary')}>Summary</button>
          <button type="button" className={`mobile-tab-btn ${mobileTab === 'sensors' ? 'active' : ''}`} onClick={() => setMobileTab('sensors')}>Sensors</button>
          <button type="button" className={`mobile-tab-btn ${mobileTab === 'alerts' ? 'active' : ''}`} onClick={() => setMobileTab('alerts')}>Alerts</button>
        </div>

        <div className="desktop-only">
          {summarySection}
          {sensorsSection}
          {operationsSection}
        </div>

        <div className="mobile-only">
          {mobileTab === 'summary' && (
            <>
              {summarySection}
              {operationsSection}
            </>
          )}
          {mobileTab === 'sensors' && sensorsSection}
          {mobileTab === 'alerts' && mobileAlertsPane}
        </div>

        {alertModalOpen && (
          <div className="alert-modal-backdrop" onClick={() => setAlertModalOpen(false)}>
            <section className="alert-modal" onClick={(e) => e.stopPropagation()}>
              <header className="alert-modal-header">
                <div>
                  <h2>Alert Center</h2>
                  <p>{alertLog.length} total alerts</p>
                </div>
                <button className="btn-secondary" onClick={() => setAlertModalOpen(false)}>Close</button>
              </header>

              <div className="alert-toolbar">
                <div className="alert-filters">
                  {['all', 'info', 'warning', 'critical'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`filter-chip ${alertFilter === item ? 'active' : ''}`}
                      onClick={() => setAlertFilter(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="alert-actions">
                  {role === 'admin' && <button className="btn-secondary" type="button" onClick={createManualAlert}>Manual Alert</button>}
                  <button className="btn-secondary" type="button" onClick={markAllRead}>Mark All Read</button>
                  {role === 'admin' && <button className="btn-secondary" type="button" onClick={clearAllAlerts}>Clear All</button>}
                </div>
              </div>

              <div className="alert-list">
                {filteredAlerts.length === 0 ? (
                  <p className="water-level-meta">No alerts for selected filter.</p>
                ) : (
                  filteredAlerts.map((item) => {
                    const sensorKey = extractSensorKey(item.source);
                    return (
                      <article key={item.id} className={`alert-item ${item.read ? 'read' : 'unread'}`}>
                        <div className="alert-item-head">
                          <span className={`sensor-badge ${item.severity}`}>{item.severity}</span>
                          <span className="water-level-meta">{formatAlertTime(item.ts)}</span>
                        </div>
                        <h4>{item.title}</h4>
                        <p>{item.message}</p>
                        <div className="modal-alert-actions">
                          <button className="btn-secondary" type="button" onClick={() => toggleRead(item.id)}>
                            {item.read ? 'Mark Unread' : 'Mark Read'}
                          </button>
                          {sensorKey && (
                            <button className="btn-secondary" type="button" onClick={() => openRelatedSensor(sensorKey)}>
                              Open Sensor
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
