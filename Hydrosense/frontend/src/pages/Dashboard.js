import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import SummarySection from './dashboard/sections/SummarySection';
import SensorsSection from './dashboard/sections/SensorsSection';
import OperationsSectionAdmin from './dashboard/sections/OperationsSectionAdmin';
import OperationsSectionOperator from './dashboard/sections/OperationsSectionOperator';
import AlertsPageSection from './dashboard/sections/AlertsPageSection';
import AlertModal from './dashboard/AlertModal';
import ProfileSection from './dashboard/sections/ProfileSection';
import OperatorManagementSection from './dashboard/sections/OperatorManagementSection';
import DashboardSidebar from './dashboard/DashboardSidebar';
import DashboardTopbar from './dashboard/DashboardTopbar';
import DashboardMobileTabs from './dashboard/DashboardMobileTabs';
import { clearAuthSession, getAuthToken, getAuthUser } from '../utils/authStorage';
import { useDashboardData } from '../hooks/useDashboardData';
import { useProfileAndOperators } from '../hooks/useProfileAndOperators';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [themeMode, setThemeMode] = useState('dark');
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertFilter, setAlertFilter] = useState('all');
  const [focusSensorKey, setFocusSensorKey] = useState('');

  const authToken = getAuthToken();
  const initialAuthUser = getAuthUser();

  const role = initialAuthUser?.role || 'operator';
  const isAdmin = role === 'admin';
  const currentPage = location.pathname.split('/')[2] || 'live';
  const API_BASE = process.env.REACT_APP_API_BASE || '';

  const sensorRefs = useRef({});

  const {
    limits,
    sensors,
    history,
    historyWindow,
    alertLog,
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
    updateThreshold,
    updateHistoryWindow
  } = useDashboardData({
    apiBase: API_BASE,
    authToken,
    isAdmin
  });

  const {
    authUser,
    profileDraft,
    setProfileDraft,
    profileSaveError,
    profileSaveMessage,
    profileSaving,
    saveProfile,
    operators,
    pendingCount,
    operatorSearch,
    setOperatorSearch,
    operatorError,
    operatorsLoading,
    mutateOperator
  } = useProfileAndOperators({
    apiBase: API_BASE,
    authToken,
    isAdmin
  });

  useEffect(() => {
    if (!authToken || !initialAuthUser) {
      navigate('/login');
    }
  }, [authToken, initialAuthUser, navigate]);

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

  const profileSection = (
    <ProfileSection
      profile={profileDraft}
      onChange={(field, value) => setProfileDraft((prev) => ({ ...prev, [field]: value }))}
      onPhotoChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          setProfileDraft((prev) => ({ ...prev, photoDataUrl: String(reader.result || '') }));
        };
        reader.readAsDataURL(file);
      }}
      onSave={saveProfile}
      isSaving={profileSaving}
      saveMessage={profileSaveMessage}
      saveError={profileSaveError}
    />
  );

  const operatorsSection = (
    <OperatorManagementSection
      operators={operators}
      pendingCount={pendingCount}
      search={operatorSearch}
      onSearch={setOperatorSearch}
      onApprove={(userId) => mutateOperator('approve_operator', userId)}
      onDeactivate={(userId) => mutateOperator('deactivate_operator', userId)}
      onReactivate={(userId) => mutateOperator('reactivate_operator', userId)}
      error={operatorError}
      loading={operatorsLoading}
    />
  );

  const pageContent = currentPage === 'operations'
    ? utilitySection
    : currentPage === 'profile'
      ? profileSection
      : currentPage === 'operators'
        ? operatorsSection
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
      <DashboardSidebar currentPage={currentPage} isAdmin={isAdmin} navigate={navigate} />

      <main className="main-canvas">
        <DashboardTopbar
          isAdmin={isAdmin}
          authDisplayName={authUser?.profile?.displayName || (isAdmin ? 'Admin' : 'Operator')}
          syncState={syncState}
          historyWindow={historyWindow}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          unreadCount={unreadCount}
          setAlertModalOpen={setAlertModalOpen}
          exportAlertHistory={exportAlertHistory}
          onLogout={() => {
            clearAuthSession();
            navigate('/login');
          }}
        />

        <DashboardMobileTabs currentPage={currentPage} isAdmin={isAdmin} navigate={navigate} />

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
