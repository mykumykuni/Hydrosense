import { useCallback, useEffect, useMemo, useState } from 'react';
import { createApiClient } from '../utils/apiClient';

export const useReports = ({ apiBase, authToken, isAdmin }) => {
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState('');
  const [reportUnreadCount, setReportUnreadCount] = useState(0);

  const apiClient = useMemo(() => createApiClient(apiBase, authToken), [apiBase, authToken]);

  const loadReports = useCallback(async () => {
    if (!authToken) return;
    setReportsLoading(true);
    setReportsError('');
    try {
      const { response, data } = await apiClient.getJson('/api/reports');
      if (!response.ok || !data.ok) {
        setReportsError(data.error || 'Unable to load reports.');
        return;
      }
      setReports(data.reports || []);
      setReportUnreadCount(data.unreadCount || 0);
    } catch {
      setReportsError('Network error while loading reports.');
    } finally {
      setReportsLoading(false);
    }
  }, [apiClient, authToken]);

  const submitReport = useCallback(async (formData) => {
    try {
      const { response, data } = await apiClient.postJson('/api/reports', {
        action: 'submit_report',
        payload: formData
      });
      if (!response.ok || !data.ok) return { ok: false, error: data.error || 'Submit failed.' };
      setReports(data.reports || []);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error.' };
    }
  }, [apiClient]);

  const replyToReport = useCallback(async (reportId, message) => {
    if (!isAdmin) return { ok: false, error: 'admin_only' };
    try {
      const { response, data } = await apiClient.postJson('/api/reports', {
        action: 'reply',
        payload: { reportId, message }
      });
      if (!response.ok || !data.ok) return { ok: false, error: data.error || 'Reply failed.' };
      setReports(data.reports || []);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error.' };
    }
  }, [apiClient, isAdmin]);

  const updateReportStatus = useCallback(async (reportId, status) => {
    if (!isAdmin) return { ok: false, error: 'admin_only' };
    try {
      const { response, data } = await apiClient.postJson('/api/reports', {
        action: 'update_status',
        payload: { reportId, status }
      });
      if (!response.ok || !data.ok) return { ok: false, error: data.error || 'Update failed.' };
      setReports(data.reports || []);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error.' };
    }
  }, [apiClient, isAdmin]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    if (!authToken) return;
    const interval = setInterval(() => loadReports(), 10000);
    return () => clearInterval(interval);
  }, [authToken, loadReports]);

  return {
    reports,
    reportsLoading,
    reportsError,
    reportUnreadCount,
    submitReport,
    replyToReport,
    updateReportStatus,
    refreshReports: loadReports
  };
};
