import React from 'react';

function fmt(v) {
  if (v == null) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(v);
}

export default function RevenueCard({ amount }) {
  return (
    <div className="card revenue-card">
      <div className="muted-label">Today's Revenue</div>
      <div className="revenue-value">{fmt(amount)}</div>
    </div>
  );
}
