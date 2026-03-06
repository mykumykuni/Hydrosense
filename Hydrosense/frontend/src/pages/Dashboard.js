import React, { useCallback, useEffect, useRef, useState } from 'react';
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

const DEFAULT_HISTORY_POINTS = 32;

const createInitialThresholds = () => Object.fromEntries(
  Object.keys(limits).map((key) => [key, { min: limits[key].min, max: limits[key].max }])
);

const createInitialSensors = () => ({
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

const createInitialHistory = () => Object.fromEntries(Object.keys(limits).map((key) => [key, []]));

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [themeMode, setThemeMode] = useState('dark');
  const [role] = useState(() => (localStorage.getItem('hydrosenseRole') === 'admin' ? 'admin' : 'operator'));
  const [thresholds, setThresholds] = useState(createInitialThresholds);
  const [sensors, setSensors] = useState(createInitialSensors);
  const [history, setHistory] = useState(createInitialHistory);
  const [historyWindow, setHistoryWindow] = useState(DEFAULT_HISTORY_POINTS);
  const [alertLog, setAlertLog] = useState([]);
  const [syncState, setSyncState] = useState('connecting');

  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertFilter, setAlertFilter] = useState('all');
  const [focusSensorKey, setFocusSensorKey] = useState('');

  const sensorRefs = useRef({});
  const pollTimerRef = useRef(null);

  const isAdmin = role === 'admin';
  const currentPage = location.pathname.split('/')[2] || 'live';
  const API_BASE = process.env.REACT_APP_API_BASE || '';

  const applyServerState = useCallback((payload) => {
    if (!payload || typeof payload !== 'object') return;
    if (payload.thresholds) setThresholds(payload.thresholds);
    if (payload.sensors) setSensors(payload.sensors);
    if (payload.history) setHistory(payload.history);
    if (typeof payload.historyWindow === 'number') setHistoryWindow(payload.historyWindow);
    if (Array.isArray(payload.alertLog)) setAlertLog(payload.alertLog);
    setSyncState(payload.syncMode || 'vercel-api-live');
  }, []);

  const fetchServerState = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/state`, {
        method: 'GET',
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to fetch state');
      const data = await response.json();
      applyServerState(data);
    } catch {
      setSyncState('offline');
    }
  }, [API_BASE, applyServerState]);

  const callAction = useCallback(async (action, payload = {}) => {
    try {
      const response = await fetch(`${API_BASE}/api/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ action, payload, role })
      });
      if (!response.ok) throw new Error('Action failed');
      const data = await response.json();
      applyServerState(data);
    } catch {
      setSyncState('offline');
    }
  }, [API_BASE, applyServerState, role]);

  useEffect(() => {
    fetchServerState();

    pollTimerRef.current = setInterval(() => {
      fetchServerState();
    }, 1000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchServerState]);

  const getRange = (key) => thresholds[key] || { min: limits[key].min, max: limits[key].max };

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

  const markAllRead = () => callAction('mark_all_read');
  const toggleRead = (id) => callAction('toggle_read', { id });
  const clearAllAlerts = () => {
    if (!isAdmin) return;
    callAction('clear_all_alerts');
  };
  const resolveAlert = (id) => {
    if (!isAdmin) return;
    callAction('resolve_alert', { id });
  };
  const createManualAlert = () => {
    if (!isAdmin) return;
    callAction('create_manual_alert');
  };
  const reportOperatorIssue = () => callAction('report_operator_issue');

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
    callAction('update_threshold', { key, field, value: nextValue });
  };

  const updateHistoryWindow = (nextValue) => {
    if (!isAdmin || Number.isNaN(nextValue)) return;
    callAction('set_history_window', { value: nextValue });
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

  const visibleAlerts = alertLog;
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
        historyWindow={historyWindow}
        updateHistoryWindow={updateHistoryWindow}
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
            <p className="command-subtitle">
              Sync: {syncState === 'offline' ? 'Offline' : 'Vercel API Live'} | History: {historyWindow} points
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
