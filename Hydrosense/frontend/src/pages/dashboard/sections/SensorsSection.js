import React from 'react';

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
  sensorRefs
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
              <p className="sensor-range">Range: {range.min} - {range.max} {limits[key].unit}</p>
              <p className="sensor-insight">{getSensorInsight(key, sensors[key])}</p>
              {renderSparkline(history[key], trendColor)}
              <div className="sensor-mini-stats">
                <span>Min {range.min}</span>
                <span>Max {range.max}</span>
                <span>Now {value}</span>
              </div>
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
