import React from 'react';

export default function Churn({ data = [] }) {
  return (
    <div className="card analytics-card">
      <h3 className="title" style={{ marginBottom: '12px' }}>Churn Risk</h3>
      {(Array.isArray(data) ? data : []).length === 0 ? (
        <div className="muted">No churn risk detected</div>
      ) : (
        (Array.isArray(data) ? data : []).map((user, i) => (
          <div key={i} className="churn-item">
            <div className="churn-name">{user.name || 'Unknown'}</div>
            <div className="churn-date">
              {user.last_checkin_at 
                ? new Date(user.last_checkin_at).toLocaleDateString() 
                : 'No data'}
            </div>
            <div className={`churn-risk ${(user.risk || '').toLowerCase()}`}>
              {user.risk || 'UNKNOWN'}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
