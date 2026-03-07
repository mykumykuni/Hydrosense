const limits = {
  do: { min: 4.0, max: 9.0, critical: 1.4, unit: 'mg/L', label: 'Dissolved Oxygen' },
  ph: { min: 6.0, max: 8.0, unit: 'pH', label: 'pH Level' },
  temp: { min: 28.0, max: 32.0, unit: 'deg C', label: 'Temperature' },
  salinity: { min: 28.0, max: 33.0, unit: 'ppt', label: 'Salinity' },
  ammonia: { min: 0, max: 0.02, critical: 0.05, unit: 'mg/L', label: 'Ammonia' },
  nitrite: { min: 0, max: 0.01, critical: 0.15, unit: 'mg/L', label: 'Nitrite' },
  chlorine: { min: 0, max: 0.02, critical: 0.1, unit: 'mg/L', label: 'Chlorine' }
};

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

const createRealtimeState = () => {
  const sensors = createInitialSensors();
  return {
    thresholds: createInitialThresholds(),
    sensors,
    history: createInitialHistory(),
    historyWindow: 32,
    alertLog: [],
    runtime: {
      targets: { ...sensors },
      conditionFlags: {},
      cooldownByKey: {},
      targetUpdatedAt: Date.now(),
      lastTickAt: Date.now(),
      initialized: false
    },
    users: [],
    sessions: {},
    reports: [],
    announcement: { message: '', setAt: null, setByEmail: '' },
    auditLog: [],
    shiftLogs: [],
    updatedAt: Date.now()
  };
};

module.exports = {
  limits,
  createRealtimeState
};
