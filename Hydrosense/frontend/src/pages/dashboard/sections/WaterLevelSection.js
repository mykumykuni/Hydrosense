import React from 'react';

const WaterLevelSection = ({ sensors }) => {
  return (
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
  );
};

export default WaterLevelSection;
