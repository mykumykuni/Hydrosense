import React from 'react';

const getTrend = (histValues) => {
  if (!histValues || histValues.length < 2) return { arrow: '\u2192', cls: 'trend-stable' };
  const last5 = histValues.slice(-5);
  const diff = last5[last5.length - 1] - last5[0];
  if (diff > 0.01) return { arrow: '\u2191', cls: 'trend-up' };
  if (diff < -0.01) return { arrow: '\u2193', cls: 'trend-down' };
  return { arrow: '\u2192', cls: 'trend-stable' };
};

const SensorsSection = ({
  prioritySensors,
  secondarySensors,
  limits,
  sensors,
  history,
  getRange,
  getSensorState,
  getSensorInsight,
  renderSparkline,
  focusSensorKey,
  sensorRefs,
  isAdmin,
  onSensorClick,
  onReportSensorIssue
}) => {
  return (
    <section className="sensor-layout">
      <div className="priority-sensor-grid">
        {prioritySensors.map((key) => {
          const range = getRange(key);
          const status = getSensorState(key, sensors[key]);
          const precision = key === 'do' ? 2 : 1;
          const value = sensors[key].toFixed(precision);
          const trendColor = status.state === 'critical' ? '#de8a7f' : status.state === 'warning' ? '#eabf82' : '#8fd3d7';
          const trend = getTrend(history[key]);

          return (
            <article
              key={key}
              ref={(node) => { sensorRefs.current[key] = node; }}
              className={`glass-kpi-card sensor-card priority-card ${status.cls} ${focusSensorKey === key ? 'focus-sensor' : ''} ${isAdmin ? 'sensor-card-clickable' : ''}`}
              onClick={() => isAdmin && onSensorClick(key)}
              title={isAdmin ? `Click to view ${limits[key].label} details` : undefined}
            >
              <div className="sensor-head">
                <span className="mini-label">{limits[key].label}</span>
                <span className={`sensor-badge ${status.state}`}>{status.label}</span>
              </div>
              <div className="kpi-value priority-value">
                {value}
                <span className="kpi-unit">{limits[key].unit}</span>
                <span className={`trend-arrow ${trend.cls}`}>{trend.arrow}</span>
              </div>
              <p className="sensor-range">Range: {range.min} - {range.max} {limits[key].unit}</p>
              <p className="sensor-insight">{getSensorInsight(key, sensors[key])}</p>
              {renderSparkline(history[key], trendColor)}
              <div className="sensor-mini-stats">
                <span>Min {range.min}</span>
                <span>Max {range.max}</span>
                <span>Now {value}</span>
              </div>
              {!isAdmin && (
                <button
                  type="button"
                  className="btn-secondary sensor-report-btn"
                  onClick={(e) => { e.stopPropagation(); onReportSensorIssue(key, limits[key].label); }}
                >
                  Report Issue
                </button>
              )}
            </article>
          );
        })}
      </div>

      <div className="secondary-sensor-grid">
        {secondarySensors.map((key) => {
          const range = getRange(key);
          const status = getSensorState(key, sensors[key]);
          const value = sensors[key].toFixed(3);
          const trendColor = status.state === 'critical' ? '#de8a7f' : status.state === 'warning' ? '#eabf82' : '#8fd3d7';
          const trend = getTrend(history[key]);

          return (
            <article
              key={key}
              ref={(node) => { sensorRefs.current[key] = node; }}
              className={`glass-kpi-card sensor-card compact-sensor-card ${status.cls} ${focusSensorKey === key ? 'focus-sensor' : ''} ${isAdmin ? 'sensor-card-clickable' : ''}`}
              onClick={() => isAdmin && onSensorClick(key)}
              title={isAdmin ? `Click to view ${limits[key].label} details` : undefined}
            >
              <div className="sensor-head">
                <span className="mini-label">{limits[key].label}</span>
                <span className={`sensor-badge ${status.state}`}>{status.label}</span>
              </div>
              <div className="kpi-value compact-value">
                {value}
                <span className="kpi-unit">{limits[key].unit}</span>
                <span className={`trend-arrow ${trend.cls}`}>{trend.arrow}</span>
              </div>
              <p className="sensor-range">Range: {range.min} - {range.max} {limits[key].unit}</p>
              {renderSparkline(history[key], trendColor)}
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default SensorsSection;
