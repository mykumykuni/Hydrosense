import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import SummarySection from './dashboard/sections/SummarySection';
import SensorsSection from './dashboard/sections/SensorsSection';
import OperationsSectionAdmin from './dashboard/sections/OperationsSectionAdmin';
import OperationsSectionOperator from './dashboard/sections/OperationsSectionOperator';
import AlertsPageSection from './dashboard/sections/AlertsPageSection';
import AlertModal from './dashboard/AlertModal';

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
  const location = useLocation();

  const [themeMode, setThemeMode] = useState('dark');
  const [role] = useState(() => (localStorage.getItem('hydrosenseRole') === 'admin' ? 'admin' : 'operator'));
  const [thresholds, setThresholds] = useState(
    Object.fromEntries(
      Object.keys(limits).map((key) => [key, { min: limits[key].min, max: limits[key].max }])
    )
  );

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
  const isAdmin = role === 'admin';
  const currentPage = location.pathname.split('/')[2] || 'live';

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
        resolved: false,
        ts: now
      },
      ...prev
    ]);
  };

  const getRange = (key) => thresholds[key] || { min: limits[key].min, max: limits[key].max };

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
      const range = thresholds[key] || { min: limits[key].min, max: limits[key].max };
      const limit = limits[key];
      const value = sensors[key];

      const isOut = value < range.min || value > range.max;
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
  }, [sensors, thresholds]);

  const getSensorState = (key, val) => {
    const range = getRange(key);
    const limit = limits[key];
    if (limit.critical && (key === 'do' ? val <= limit.critical : val >= limit.critical)) {
      return { state: 'critical', label: 'Critical', cls: 'state-critical' };
    }
    if (val < range.min || val > range.max) {
      return { state: 'warning', label: 'Warning', cls: 'state-warning' };
    }
    return { state: 'normal', label: 'Optimal', cls: 'state-normal' };
  };

  const getSensorInsight = (key, value) => {
    const range = getRange(key);
    const limit = limits[key];
    if (value < range.min) {
      return `Below target by ${(range.min - value).toFixed(2)} ${limit.unit}`;
    }
    if (value > range.max) {
      return `Above target by ${(value - range.max).toFixed(2)} ${limit.unit}`;
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

  const resolveAlert = (id) => {
    setAlertLog((prev) => prev.map((a) => (a.id === id ? { ...a, read: true, resolved: true } : a)));
  };

  const createManualAlert = () => {
    pushAlert('info', 'Manual Operator Alert', 'Operator created a manual checkpoint alert.', 'manual-operator');
  };

  const reportOperatorIssue = () => {
    pushAlert('warning', 'Operator Issue Reported', 'Operator requested admin review on live conditions.', 'operator-report');
  };

  const exportAlertHistory = () => {
    const rows = [
      ['time', 'severity', 'source', 'title', 'message', 'read', 'resolved'],
      ...visibleAlerts.map((a) => [
        new Date(a.ts).toISOString(),
        a.severity,
        a.source,
        a.title,
        a.message,
        a.read ? 'true' : 'false',
        a.resolved ? 'true' : 'false'
      ])
    ];
    const csv = rows.map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hydrosense-alerts-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const updateThreshold = (key, field, nextValue) => {
    if (!isAdmin || Number.isNaN(nextValue)) return;
    setThresholds((prev) => {
      const current = prev[key] || { min: limits[key].min, max: limits[key].max };
      const next = { ...current, [field]: nextValue };
      if (field === 'min' && next.min >= next.max) next.min = +(next.max - 0.01).toFixed(3);
      if (field === 'max' && next.max <= next.min) next.max = +(next.min + 0.01).toFixed(3);
      return { ...prev, [key]: next };
    });
  };

  const formatAlertTime = (ts) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const openRelatedSensor = (sensorKey) => {
    if (!sensorKey) return;
    setAlertModalOpen(false);
    navigate('/dashboard/live');
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

  const visibleAlerts = isAdmin ? alertLog : alertLog.filter((a) => a.source !== 'system');
  const unreadCount = visibleAlerts.filter((a) => !a.read).length;
  const filteredAlerts = alertFilter === 'all'
    ? visibleAlerts
    : visibleAlerts.filter((a) => a.severity === alertFilter);

  const themeClass = themeMode === 'light' ? 'theme-light' : 'theme-dark';
  const roleClass = isAdmin ? 'role-admin' : 'role-operator';

  const utilitySection = isAdmin
    ? (
      <OperationsSectionAdmin
        sensors={sensors}
        limits={limits}
        activeThresholdAlerts={activeThresholdAlerts}
        alertLog={alertLog}
        sensorKeys={sensorKeys}
        getRange={getRange}
        updateThreshold={updateThreshold}
      />
    )
    : (
      <OperationsSectionOperator
        sensors={sensors}
        onReportIssue={reportOperatorIssue}
      />
    );

  const pageContent = currentPage === 'operations'
    ? utilitySection
    : currentPage === 'alerts'
      ? (
        <AlertsPageSection
          filteredAlerts={filteredAlerts}
          extractSensorKey={extractSensorKey}
          formatAlertTime={formatAlertTime}
          toggleRead={toggleRead}
          openRelatedSensor={openRelatedSensor}
        />
      )
      : (
        <>
          <SummarySection
            clarity={clarity}
            activeThresholdAlerts={activeThresholdAlerts}
            healthPercent={healthPercent}
            healthySensorCount={healthySensorCount}
            sensorCount={sensorKeys.length}
          />
          <SensorsSection
            prioritySensors={prioritySensors}
            secondarySensors={secondarySensors}
            limits={limits}
            sensors={sensors}
            history={history}
            getRange={getRange}
            getSensorState={getSensorState}
            getSensorInsight={getSensorInsight}
            renderSparkline={renderSparkline}
            focusSensorKey={focusSensorKey}
            sensorRefs={sensorRefs}
          />
        </>
      );

  return (
    <div className={`dashboard-workspace ${themeClass} ${roleClass}`}>
      <aside className="workspace-sidebar">
        <div className="sidebar-logo">
          <img className="sidebar-logo-image" src="/adjusted.png" alt="Hydrosense" />
        </div>
        <nav>
          <div
            className={`workspace-nav-item ${currentPage === 'live' ? 'active' : ''}`}
            onClick={() => navigate('/dashboard/live')}
          >
            Live Monitoring
          </div>
          <div
            className={`workspace-nav-item ${currentPage === 'operations' ? 'active' : ''}`}
            onClick={() => navigate('/dashboard/operations')}
          >
            {isAdmin ? 'Admin Controls' : 'Operator Tasks'}
          </div>
          <div
            className={`workspace-nav-item ${currentPage === 'alerts' ? 'active' : ''}`}
            onClick={() => navigate('/dashboard/alerts')}
          >
            {isAdmin ? 'Compliance Console' : 'Incident Reporting'}
          </div>
        </nav>
      </aside>

      <main className="main-canvas">
        <header className="dashboard-topbar">
          <div>
            <h1 className="command-title">Command Center</h1>
            <p className="command-subtitle">
              Node: BFAR-10 Hatchery | Species: Milkfish (Fry) | Mode: {isAdmin ? 'Admin Console' : 'Operator Console'}
            </p>
          </div>
          <div className="topbar-actions">
            <div className={`uptime-widget topbar-fixed role-widget role-chip-display ${isAdmin ? 'admin' : 'operator'}`}>
              <span className="mini-label">Role: {isAdmin ? 'Admin' : 'Operator'}</span>
            </div>
            <button className="btn-secondary topbar-fixed theme-btn" onClick={() => setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))}>
              {themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button className="btn-secondary topbar-fixed alert-btn" onClick={() => setAlertModalOpen(true)}>
              Alerts
              {unreadCount > 0 && <span className="alert-count-pill">{unreadCount}</span>}
            </button>
            {isAdmin && (
              <button className="btn-secondary topbar-fixed export-btn" onClick={exportAlertHistory}>
                Export Alerts
              </button>
            )}
            <button className="btn-secondary topbar-fixed logout-btn" onClick={() => { localStorage.removeItem('hydrosenseRole'); navigate('/login'); }}>Logout</button>
          </div>
        </header>

        <div className="mobile-tabs" role="tablist" aria-label="Dashboard sections">
          <button type="button" className={`mobile-tab-btn ${currentPage === 'live' ? 'active' : ''}`} onClick={() => navigate('/dashboard/live')}>Live</button>
          <button type="button" className={`mobile-tab-btn ${currentPage === 'operations' ? 'active' : ''}`} onClick={() => navigate('/dashboard/operations')}>Ops</button>
          <button type="button" className={`mobile-tab-btn ${currentPage === 'alerts' ? 'active' : ''}`} onClick={() => navigate('/dashboard/alerts')}>Alerts</button>
        </div>

        <div className="dashboard-page-content">{pageContent}</div>

        <AlertModal
          isOpen={alertModalOpen}
          onClose={() => setAlertModalOpen(false)}
          visibleAlerts={visibleAlerts}
          alertFilter={alertFilter}
          setAlertFilter={setAlertFilter}
          isAdmin={isAdmin}
          createManualAlert={createManualAlert}
          markAllRead={markAllRead}
          clearAllAlerts={clearAllAlerts}
          filteredAlerts={filteredAlerts}
          extractSensorKey={extractSensorKey}
          formatAlertTime={formatAlertTime}
          toggleRead={toggleRead}
          resolveAlert={resolveAlert}
          openRelatedSensor={openRelatedSensor}
        />
      </main>
    </div>
  );
};

export default Dashboard;
