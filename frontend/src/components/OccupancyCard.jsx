import React from 'react';

function occupancyColor(pct) {
  if (pct < 60) return 'var(--accent-green, #10B981)';
  if (pct <= 85) return 'var(--accent-yellow, #F59E0B)';
  return 'var(--accent-red, #EF4444)';
}

export default function OccupancyCard({ occupancy }) {
  const pct = occupancy?.percentage ?? 0;
  const count = occupancy?.count ?? '-';
  const capacity = occupancy?.capacity ?? '-';
  const color = occupancyColor(pct);

  return (
    <div className="card occupancy-card">
      <div>
        <div className="muted-label">Live Occupancy</div>
        <div className="kpi-number">{count}</div>
        <div className="muted-label">Members Inside</div>
      </div>
      <div className="occupancy-side">
        <div className="occupancy-pill">
          <div className="occupancy-dot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
          <div className="occupancy-pct" style={{ color }}>{pct}%</div>
        </div>
        <div className="muted-label">Capacity: {capacity}</div>
      </div>
    </div>
  );
}
