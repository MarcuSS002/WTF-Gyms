const db = require('../db/pool');
const socket = require('../websocket/socket');

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
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

function getDisplayName(member) {
  if (!member) return 'Rahul Sharma';
  const raw = String(member.name || '').trim();
  if (raw && !/^User\s+\d+$/i.test(raw)) return raw;
  return indianNameFromId(member.id || raw);
}

async function pickRandomGym() {
  const res = await db.query('SELECT id, name, capacity FROM gyms');
  return res.rows;
}

async function pickRandomMember(gymId) {
  const res = await db.query('SELECT id, name FROM members WHERE gym_id = $1 ORDER BY random() LIMIT 1', [gymId]);
  return res.rows[0];
}

async function doCheckin(gym) {
  const member = await pickRandomMember(gym.id);
  if (!member) return;
  await db.query('INSERT INTO checkins (member_id, gym_id, checked_in) VALUES ($1,$2,NOW())', [member.id, gym.id]);
  const occRes = await db.query('SELECT COUNT(*) FROM checkins WHERE gym_id = $1 AND checked_out IS NULL', [gym.id]);
  const count = Number(occRes.rows[0].count || 0);
  const capRes = await db.query('SELECT capacity FROM gyms WHERE id = $1', [gym.id]);
  const capacity = Number(capRes.rows[0].capacity || 0);
  const pct = capacity ? Math.round((count / capacity) * 100) : 0;
  const event = {
    type: 'CHECKIN_EVENT',
    gym_id: gym.id,
    gym_name: gym.name,
    member_name: getDisplayName(member),
    timestamp: new Date().toISOString(),
    current_occupancy: count,
    capacity_pct: pct
  };
  socket.emitEvent(event);
}

async function doCheckout(gym) {
  // find an open checkin
  const open = await db.query('SELECT id, member_id FROM checkins WHERE gym_id = $1 AND checked_out IS NULL ORDER BY checked_in DESC LIMIT 1', [gym.id]);
  if (!open.rows[0]) return;
  const row = open.rows[0];
  await db.query('UPDATE checkins SET checked_out = NOW() WHERE id = $1', [row.id]);
  const memberRes = await db.query('SELECT name FROM members WHERE id = $1', [row.member_id]);
  const member = memberRes.rows[0];
  const occRes = await db.query('SELECT COUNT(*) FROM checkins WHERE gym_id = $1 AND checked_out IS NULL', [gym.id]);
  const count = Number(occRes.rows[0].count || 0);
  const capRes = await db.query('SELECT capacity FROM gyms WHERE id = $1', [gym.id]);
  const capacity = Number(capRes.rows[0].capacity || 0);
  const pct = capacity ? Number(((count / capacity) * 100).toFixed(1)) : 0;
  const event = {
    type: 'CHECKOUT_EVENT',
    gym_id: gym.id,
    gym_name: gym.name,
    member_name: getDisplayName(member),
    timestamp: new Date().toISOString(),
    current_occupancy: count,
    capacity_pct: pct
  };
  socket.emitEvent(event);
}

async function getGymOccupancy(gymId) {
  const res = await db.query(
    `SELECT COUNT(*)::int AS current_occupancy,
            (SELECT capacity FROM gyms WHERE id = $1)::int AS capacity
     FROM checkins
     WHERE gym_id = $1 AND checked_out IS NULL`,
    [gymId]
  );
  const current = Number(res.rows[0]?.current_occupancy || 0);
  const capacity = Number(res.rows[0]?.capacity || 0);
  const pct = capacity ? (current / capacity) * 100 : 0;
  return { current, capacity, pct };
}

function getIndiaHour(date = new Date()) {
  const indiaTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    hour12: false,
  }).format(date);
  return Number(indiaTime);
}

function isPeakHour(hour) {
  // From docs/SEEDING_STRATEGY.md:
  // Morning peak: 06:00-09:00, Evening peak: 17:00-21:00
  return (hour >= 6 && hour < 10) || (hour >= 17 && hour < 21);
}

function getOccupancyActionProbabilities(hour) {
  if (isPeakHour(hour)) {
    return { checkin: 0.7, checkout: 0.2, noop: 0.1 };
  }
  return { checkin: 0.2, checkout: 0.1, noop: 0.7 };
}

function getTargetOccupancyProfile(hour) {
  if (hour >= 6 && hour < 10) {
    return { targetPct: 72, tolerance: 8 };
  }
  if (hour >= 10 && hour < 14) {
    return { targetPct: 38, tolerance: 7 };
  }
  if (hour >= 14 && hour < 17) {
    return { targetPct: 22, tolerance: 5 };
  }
  if (hour >= 17 && hour < 21) {
    return { targetPct: 78, tolerance: 8 };
  }
  if (hour >= 21) {
    return { targetPct: 20, tolerance: 7 };
  }
  return { targetPct: 10, tolerance: 5 };
}

function adjustProbabilitiesForTarget(baseProbs, occupancy, targetProfile) {
  let checkinProb = baseProbs.checkin;
  let checkoutProb = baseProbs.checkout;
  let noopProb = baseProbs.noop;

  const gap = targetProfile.targetPct - occupancy.pct;

  if (gap > targetProfile.tolerance) {
    // Below target: push occupancy up.
    checkinProb = Math.min(0.9, checkinProb + Math.min(0.25, gap / 100));
    checkoutProb = Math.max(0.03, checkoutProb - 0.05);
  } else if (gap < -targetProfile.tolerance) {
    // Above target: pull occupancy down (important for afternoon realism).
    checkoutProb = Math.min(0.8, checkoutProb + Math.min(0.35, Math.abs(gap) / 100));
    checkinProb = Math.max(0.05, checkinProb - 0.12);
  }

  const sum = checkinProb + checkoutProb;
  noopProb = Math.max(0, 1 - sum);
  return { checkin: checkinProb, checkout: checkoutProb, noop: noopProb };
}

function getCorrectiveBurst(hour, occupancy, targetProfile) {
  if (occupancy.capacity <= 0) return { checkins: 0, checkouts: 0 };
  const targetCount = Math.round((occupancy.capacity * targetProfile.targetPct) / 100);
  const toleranceCount = Math.max(1, Math.round((occupancy.capacity * targetProfile.tolerance) / 100));
  const excess = occupancy.current - targetCount;
  const deficit = targetCount - occupancy.current;

  // Afternoon needs fast downshift to avoid unrealistically high occupancy.
  if (hour >= 14 && hour < 17 && excess > toleranceCount) {
    const checkouts = Math.min(12, Math.max(2, Math.ceil(excess * 0.18)));
    return { checkins: 0, checkouts };
  }

  // Morning/evening should ramp up quickly if occupancy is lagging too much.
  if (isPeakHour(hour) && deficit > toleranceCount) {
    const checkins = Math.min(8, Math.max(1, Math.ceil(deficit * 0.12)));
    return { checkins, checkouts: 0 };
  }

  return { checkins: 0, checkouts: 0 };
}

function pickOccupancyAction(occupancy, probs) {
  let checkinProb = probs.checkin;
  let checkoutProb = probs.checkout;
  let noopProb = probs.noop;

  if (occupancy.current <= 0) {
    noopProb += checkoutProb;
    checkoutProb = 0;
  }

  if (occupancy.capacity > 0 && occupancy.current >= occupancy.capacity) {
    noopProb += checkinProb;
    checkinProb = 0;
  }

  const r = Math.random();
  if (r < checkinProb) return 'checkin';
  if (r < checkinProb + checkoutProb) return 'checkout';
  if (r < checkinProb + checkoutProb + noopProb) return 'noop';
  return 'noop';
}

const fs = require('fs');
const path = require('path');

let intervalId = null;
let gymsCache = null;
let currentSpeed = 1;

async function ensureBaselineOccupancy() {
  const gyms = await loadGyms();
  for (const gym of gyms) {
    const occ = await getGymOccupancy(gym.id);
    if (occ.current === 0) {
      await doCheckin(gym);
    }
  }
}

async function loadGyms() {
  if (!gymsCache) {
    gymsCache = await pickRandomGym();
  }
  return gymsCache;
}

async function iteration() {
  try {
    const gyms = await loadGyms();
    if (!gyms || gyms.length === 0) return;
    const hour = getIndiaHour();
    const baseProbabilities = getOccupancyActionProbabilities(hour);
    const targetProfile = getTargetOccupancyProfile(hour);

    // Apply trend logic gym-by-gym so the time-of-day pattern is visible across all gyms.
    for (const gym of gyms) {
      const occ = await getGymOccupancy(gym.id);
      const burst = getCorrectiveBurst(hour, occ, targetProfile);

      if (burst.checkouts > 0) {
        for (let i = 0; i < burst.checkouts; i++) {
          await doCheckout(gym);
        }
        continue;
      }

      if (burst.checkins > 0) {
        for (let i = 0; i < burst.checkins; i++) {
          await doCheckin(gym);
        }
        continue;
      }

      const adjusted = adjustProbabilitiesForTarget(baseProbabilities, occ, targetProfile);
      const action = pickOccupancyAction(occ, adjusted);

      if (action === 'checkin') {
        await doCheckin(gym);
      } else if (action === 'checkout') {
        await doCheckout(gym);
      }
    }
  } catch (err) {
    console.error('Simulator iteration error', err);
  }
}

async function start(io, speed = 1) {
  const normalizedSpeed = [1, 5, 10].includes(Number(speed)) ? Number(speed) : 1;

  if (intervalId) {
    if (normalizedSpeed !== currentSpeed) {
      clearInterval(intervalId);
      intervalId = setInterval(iteration, Math.max(2000 / normalizedSpeed, 200));
      currentSpeed = normalizedSpeed;
    }
    return { status: 'running', speed: currentSpeed };
  }

  await ensureBaselineOccupancy();
  const intervalMs = Math.max(2000 / normalizedSpeed, 200);
  intervalId = setInterval(iteration, intervalMs);
  currentSpeed = normalizedSpeed;
  await iteration();
  return { status: 'running', speed: currentSpeed };
}

function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  return { status: 'paused' };
}

function status() {
  return { running: Boolean(intervalId), speed: currentSpeed };
}

async function reset() {
  try {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    currentSpeed = 1;
    await db.query('TRUNCATE TABLE anomalies, payments, checkins, members, gyms RESTART IDENTITY CASCADE');
    const file = path.join(__dirname, '..', 'db', 'migrations', '004_seed.sql');
    const sql = fs.readFileSync(file, 'utf8');
    await db.query(sql);
    socket.emitEvent({ type: 'SIMULATOR_RESET', timestamp: new Date().toISOString() });
    // clear cache
    gymsCache = null;
    return { status: 'reset', running: false, speed: currentSpeed };
  } catch (err) {
    console.error('Simulator reset failed', err);
    throw err;
  }
}

module.exports = { start, stop, reset, status };
