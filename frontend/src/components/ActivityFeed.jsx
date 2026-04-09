import React from 'react';
import { useEffect, useRef } from 'react';

function getLabel(type) {
  if (type === 'CHECKIN_EVENT') return 'Check-in';
  if (type === 'CHECKOUT_EVENT') return 'Check-out';
  if (type === 'PAYMENT_EVENT') return 'Payment';
  return type || 'Event';
}

function getLabelColor(type) {
  if (type === 'CHECKIN_EVENT') return 'var(--accent-green, #10B981)';
  if (type === 'CHECKOUT_EVENT') return 'var(--accent-red, #EF4444)';
  if (type === 'PAYMENT_EVENT') return 'var(--accent-yellow, #F59E0B)';
  return 'var(--muted)';
}

function shortGymName(gymName) {
  const raw = String(gymName || 'Unknown Gym').trim();
  return raw.replace(/^WTF Gyms\s*[\u2014-]\s*/i, '').trim() || raw;
}

function formatEventTime(ts) {
  return new Date(ts || Date.now()).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatAmountINR(amount) {
  const value = Number(amount || 0);
  return `Rs ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)}`;
}

const INDIAN_FIRST_NAMES = [
  'Rahul', 'Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Rohan', 'Kunal', 'Siddharth', 'Ishaan', 'Aman',
  'Priya', 'Ananya', 'Diya', 'Kavya', 'Riya', 'Aisha', 'Sneha', 'Pooja', 'Meera', 'Ira'
];

const INDIAN_LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Khan', 'Iyer', 'Nair', 'Reddy', 'Rao',
  'Chopra', 'Mehta', 'Joshi', 'Kapoor', 'Mishra', 'Das', 'Ghosh', 'Yadav', 'Jain', 'Bose'
];

function hashText(text) {
  const str = String(text || '0');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function indianNameFromId(memberId) {
  const h = hashText(memberId);
  const first = INDIAN_FIRST_NAMES[h % INDIAN_FIRST_NAMES.length];
  const last = INDIAN_LAST_NAMES[Math.floor(h / INDIAN_FIRST_NAMES.length) % INDIAN_LAST_NAMES.length];
  return `${first} ${last}`;
}

function displayMemberName(event) {
  const raw = String(event.member_name || event.member || event.memberId || event.member_id || 'Guest').trim();
  if (!/^User\s+\d+$/i.test(raw)) return raw;
  return indianNameFromId(event.member_id || raw);
}

function eventSentence(event) {
  const name = displayMemberName(event);
  const gym = shortGymName(event.gym_name || event.gym_id);
  const time = formatEventTime(event.timestamp || event.ts);

  if (event.type === 'CHECKIN_EVENT') return `${name} checked in at ${gym} - ${time}`;
  if (event.type === 'CHECKOUT_EVENT') return `${name} checked out at ${gym} - ${time}`;
  if (event.type === 'PAYMENT_EVENT') {
    const amount = formatAmountINR(event.amount);
    const plan = String(event.plan_type || 'monthly').toLowerCase();
    return `${name} paid ${amount} (${plan}) at ${gym} - ${time}`;
  }
  return `${name} activity at ${gym} - ${time}`;
}

export default function ActivityFeed({ items = [] }) {
  const containerRef = useRef(null);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [items]);

  return (
    <div className="card activity-feed" ref={containerRef}>
      <h3 className="card-title side-title">Activity Feed</h3>
      <div className="activity-list">
        {items.length === 0 ? (
          <div className="empty-state">No recent events</div>
        ) : items.map((f, i) => (
          <div key={i} className="event-item">
            <div className="event-row">
              <div className="event-message">{eventSentence(f)}</div>
              <div className="event-type" style={{ color: getLabelColor(f.type) }}>{getLabel(f.type)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
