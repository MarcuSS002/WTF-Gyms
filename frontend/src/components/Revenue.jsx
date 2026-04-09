import React from 'react';

export default function Revenue({ data = [] }) {
  return (
    <div className="card analytics-card">
      <h3 className="title" style={{ marginBottom: '12px' }}>Revenue</h3>
      {(Array.isArray(data) ? data : []).length === 0 ? (
        <div className="muted">No revenue data</div>
      ) : (
        (Array.isArray(data) ? data : []).map((r, i) => (
          <div key={i} className="revenue-item">
            <span className="revenue-label">{r.plan || 'Unknown'}</span>
            <span className="revenue-amount">Rs {(r.total || 0).toLocaleString()}</span>
          </div>
        ))
      )}
    </div>
  );
}
