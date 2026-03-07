import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createApiClient } from '../utils/apiClient';
import {
  createInitialHistory,
  createInitialSensors,
  createInitialThresholds,
  DEFAULT_HISTORY_POINTS,
  limits
} from '../constants/monitoring';

export const useDashboardData = ({ apiBase, authToken, isAdmin }) => {
  const [thresholds, setThresholds] = useState(createInitialThresholds);
  const [sensors, setSensors] = useState(createInitialSensors);
  const [history, setHistory] = useState(createInitialHistory);
  const [historyWindow, setHistoryWindow] = useState(DEFAULT_HISTORY_POINTS);
  const [alertLog, setAlertLog] = useState([]);
  const [announcement, setAnnouncementState] = useState({ message: '', setAt: null, setByEmail: '' });
  const [auditLog, setAuditLog] = useState([]);
  const [shiftLogs, setShiftLogs] = useState([]);
  const [syncState, setSyncState] = useState('connecting');

  const pollTimerRef = useRef(null);

  const apiClient = useMemo(() => createApiClient(apiBase, authToken), [apiBase, authToken]);

  const applyServerState = useCallback((payload) => {
    if (!payload || typeof payload !== 'object') return;
    if (payload.thresholds) setThresholds(payload.thresholds);
    if (payload.sensors) setSensors(payload.sensors);
    if (payload.history) setHistory(payload.history);
    if (typeof payload.historyWindow === 'number') setHistoryWindow(payload.historyWindow);
    if (Array.isArray(payload.alertLog)) setAlertLog(payload.alertLog);
    if (payload.announcement) setAnnouncementState(payload.announcement);
    if (Array.isArray(payload.auditLog)) setAuditLog(payload.auditLog);
    if (Array.isArray(payload.shiftLogs)) setShiftLogs(payload.shiftLogs);
    setSyncState(payload.syncMode || 'vercel-api-live');
  }, []);

  const fetchServerState = useCallback(async () => {
    try {
      const { response, data } = await apiClient.getJson('/api/state');
      if (!response.ok) throw new Error('Failed to fetch state');
      applyServerState(data);
    } catch {
      setSyncState('offline');
    }
  }, [apiClient, applyServerState]);

  const callAction = useCallback(async (action, payload = {}) => {
    try {
      const { response, data } = await apiClient.postJson('/api/state', { action, payload });
      if (!response.ok || data?.ok === false) throw new Error('Action failed');
      applyServerState(data);
    } catch {
      setSyncState('offline');
    }
  }, [apiClient, applyServerState]);

  useEffect(() => {
    fetchServerState();

    pollTimerRef.current = setInterval(() => {
      fetchServerState();
    }, 1000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchServerState]);

  const getRange = useCallback((key) => thresholds[key] || { min: limits[key].min, max: limits[key].max }, [thresholds]);

  const getSensorState = useCallback((key, val) => {
    const range = getRange(key);
    const limit = limits[key];
    if (limit.critical && (key === 'do' ? val <= limit.critical : val >= limit.critical)) {
      return { state: 'critical', label: 'Critical', cls: 'state-critical' };
    }
    if (val < range.min || val > range.max) {
      return { state: 'warning', label: 'Warning', cls: 'state-warning' };
    }
    return { state: 'normal', label: 'Optimal', cls: 'state-normal' };
  }, [getRange]);

  const getSensorInsight = useCallback((key, value) => {
    const range = getRange(key);
    const limit = limits[key];
    if (value < range.min) return `Below target by ${(range.min - value).toFixed(2)} ${limit.unit}`;
    if (value > range.max) return `Above target by ${(value - range.max).toFixed(2)} ${limit.unit}`;
    return 'Operating inside ideal range';
  }, [getRange]);

  const getWaterClarity = useCallback(() => {
    const pressure = sensors.ammonia + sensors.nitrite + sensors.chlorine;
    if (sensors.do < 4 || pressure > 0.08) {
      return { label: 'UNSAFE', hint: 'Potential turbidity and stress detected', tone: 'clarity-danger' };
    }
    if (sensors.do < 5 || pressure > 0.04) {
      return { label: 'WATCH', hint: 'Slight quality drift, monitor frequently', tone: 'clarity-watch' };
    }
    return { label: 'CLEAR', hint: 'Water body is in stable condition', tone: 'clarity-clear' };
  }, [sensors]);

  const extractSensorKey = useCallback((source) => {
    const key = source.split('-')[0];
    return Object.prototype.hasOwnProperty.call(limits, key) ? key : null;
  }, []);

  const markAllRead = useCallback(() => callAction('mark_all_read'), [callAction]);
  const toggleRead = useCallback((id) => callAction('toggle_read', { id }), [callAction]);
  const clearAllAlerts = useCallback(() => {
    if (!isAdmin) return;
    callAction('clear_all_alerts');
  }, [callAction, isAdmin]);
  const resolveAlert = useCallback((id) => {
    if (!isAdmin) return;
    callAction('resolve_alert', { id });
  }, [callAction, isAdmin]);
  const createManualAlert = useCallback(() => {
    if (!isAdmin) return;
    callAction('create_manual_alert');
  }, [callAction, isAdmin]);
  const reportOperatorIssue = useCallback(() => callAction('report_operator_issue'), [callAction]);
  const reportSensorIssue = useCallback((sensorKey, sensorLabel) => {
    callAction('report_sensor_issue', { sensorKey, sensorLabel });
  }, [callAction]);
  const updateThreshold = useCallback((key, field, nextValue) => {
    if (!isAdmin || Number.isNaN(nextValue)) return;
    callAction('update_threshold', { key, field, value: nextValue });
  }, [callAction, isAdmin]);
  const updateHistoryWindow = useCallback((nextValue) => {
    if (!isAdmin || Number.isNaN(nextValue)) return;
    callAction('set_history_window', { value: nextValue });
  }, [callAction, isAdmin]);
  const setAnnouncement = useCallback((message) => {
    if (!isAdmin) return;
    callAction('set_announcement', { message });
  }, [callAction, isAdmin]);
  const clearAnnouncementAction = useCallback(() => {
    if (!isAdmin) return;
    callAction('clear_announcement');
  }, [callAction, isAdmin]);
  const submitShiftLog = useCallback((note, operatorName) => {
    callAction('submit_shift_log', { note, operatorName });
  }, [callAction]);

  return {
    limits,
    thresholds,
    sensors,
    history,
    historyWindow,
    alertLog,
    announcement,
    auditLog,
    shiftLogs,
    syncState,
    getRange,
    getSensorState,
    getSensorInsight,
    getWaterClarity,
    extractSensorKey,
    markAllRead,
    toggleRead,
    clearAllAlerts,
    resolveAlert,
    createManualAlert,
    reportOperatorIssue,
    reportSensorIssue,
    updateThreshold,
    updateHistoryWindow,
    setAnnouncementMsg: setAnnouncement,
    clearAnnouncementMsg: clearAnnouncementAction,
    submitShiftLog,
    callAction
  };
};
