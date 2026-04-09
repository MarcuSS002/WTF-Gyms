import React from 'react';

export default function Heatmap({ data = [] }) {
  return (
    <div className="card analytics-card">
      <h3 className="title" style={{ marginBottom: '12px' }}>Peak Hours</h3>
      {(Array.isArray(data) ? data : []).length === 0 ? (
        <div className="muted">No heatmap data</div>
      ) : (
        <div className="heatmap-container">
          {(Array.isArray(data) ? data : []).slice(0, 20).map((item, i) => (
            <div key={i} className="heatmap-row">
              <span>Day {item.day || '?'} · Hour {item.hour || '?'}</span>
              <span style={{ marginLeft: '8px', fontWeight: '600', color: 'var(--accent)' }}>
                {item.count || 0}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
