import React from 'react';

function formatType(type) {
  return String(type || 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDetectedAt(ts) {
  const d = new Date(ts);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function AnomalyTable({ anomalies = [] }) {
  const unreadCount = anomalies.filter((a) => !a.dismissed && !a.resolved).length;

  return (
    <div className="card">

      {/* HEADER */}
      <div className="table-header">
        <div>
          <h3 className="title">Active Anomalies</h3>
          <p className="muted">Live system alerts</p>
        </div>

        {unreadCount > 0 && (
          <span className="badge info">{unreadCount} Active</span>
        )}
      </div>

      {/* EMPTY */}
      {anomalies.length === 0 ? (
        <div className="empty-state">
          No active anomalies
        </div>
      ) : (

        <div className="table-wrap">
          <table className="table">

            <thead>
              <tr>
                <th>Gym</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Detected</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {anomalies.map((a) => (
                <tr key={a.id}>

                  <td className="gym-name">
                    {a.gym_name || a.gym_id}
                  </td>

                  <td className="type">
                    {formatType(a.type)}
                  </td>

                  <td>
                    <span className={`badge ${a.severity === 'critical' ? 'critical' : 'warning'}`}>
                      {a.severity}
                    </span>
                  </td>

                  <td className="time">
                    {formatDetectedAt(a.detected_at)}
                  </td>

                  <td>
                    <span className={`badge ${a.resolved ? 'resolved' : 'active'}`}>
                      {a.resolved ? 'Resolved' : 'Active'}
                    </span>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}
    </div>
  );
}