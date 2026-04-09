const db = require('../db/pool');
const socket = require('../websocket/socket');

let intervalId = null;

const COOLDOWN_MINUTES = {
  zero_checkins: 30,
  capacity_breach: 30,
  revenue_drop: 60,
};

async function shouldCreateAnomaly(gymId, type) {
  const cooldownMinutes = COOLDOWN_MINUTES[type] || 30;
  const cur = await db.query(
    `SELECT 1
     FROM anomalies
     WHERE gym_id = $1
       AND type = $2
       AND detected_at >= NOW() - (($3::text) || ' minutes')::interval
     LIMIT 1`,
    [gymId, type, cooldownMinutes]
  );
  return !cur.rows[0];
}

async function createAnomaly(gymId, gymName, type, severity, message) {
  const insert = await db.query(
    'INSERT INTO anomalies (gym_id, type, severity, message) VALUES ($1,$2,$3,$4) RETURNING id, detected_at',
    [gymId, type, severity, message]
  );
  const id = insert.rows[0].id;
  socket.emitEvent({
    type: 'ANOMALY_DETECTED',
    anomaly_id: id,
    gym_id: gymId,
    gym_name: gymName,
    anomaly_type: type,
    severity,
    message,
    detected_at: insert.rows[0].detected_at
  });
}

async function resolveAnomalies(gymId, type) {
  const cur = await db.query('SELECT id FROM anomalies WHERE gym_id = $1 AND type = $2 AND resolved = false', [gymId, type]);
  for (const row of cur.rows) {
    await db.query('UPDATE anomalies SET resolved = true, resolved_at = NOW() WHERE id = $1', [row.id]);
    socket.emitEvent({ type: 'ANOMALY_RESOLVED', anomaly_id: row.id, gym_id: gymId, resolved_at: new Date().toISOString() });
  }
}

async function detectOnce() {
  try {
    const gymsRes = await db.query("SELECT id, name, capacity, status FROM gyms WHERE status = 'active'");
    const gyms = gymsRes.rows;
    for (const g of gyms) {
      const gymId = g.id;
      const gymName = g.name;

      // occupancy
      const occRes = await db.query('SELECT COUNT(*) AS count FROM checkins WHERE gym_id = $1 AND checked_out IS NULL', [gymId]);
      const count = Number(occRes.rows[0].count || 0);
      const capacity = Number(g.capacity || 0);
      const pct = capacity ? (count / capacity) : 0;

      // recent activity (last 2 hours)
      const recentRes = await db.query('SELECT COUNT(*) AS cnt FROM checkins WHERE gym_id = $1 AND checked_in >= NOW() - INTERVAL \'2 hours\'', [gymId]);
      const recentCount = Number(recentRes.rows[0].cnt || 0);

      // revenue: today vs same day last week
      const todayRes = await db.query('SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE gym_id = $1 AND paid_at::date = CURRENT_DATE', [gymId]);
      const todayRevenue = Number(todayRes.rows[0].total || 0);
      const lastWeekRes = await db.query('SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE gym_id = $1 AND paid_at::date = CURRENT_DATE - INTERVAL \'7 days\'', [gymId]);
      const lastWeekRevenue = Number(lastWeekRes.rows[0].total || 0);

      // 1) Zero check-ins: no checkin in last 2 hours
      if (recentCount === 0) {
        const existing = await db.query('SELECT id FROM anomalies WHERE gym_id = $1 AND type = $2 AND resolved = false LIMIT 1', [gymId, 'zero_checkins']);
        if (!existing.rows[0] && await shouldCreateAnomaly(gymId, 'zero_checkins')) {
          await createAnomaly(gymId, gymName, 'zero_checkins', 'warning', 'No check-ins in the last 2 hours');
        }
      } else {
        // resolved when activity returns
        await resolveAnomalies(gymId, 'zero_checkins');
      }

      // 2) Capacity breach: occupancy > 90% -> critical, resolve when <85%
      if (capacity > 0 && pct > 0.9) {
        const existing = await db.query('SELECT id FROM anomalies WHERE gym_id = $1 AND type = $2 AND resolved = false LIMIT 1', [gymId, 'capacity_breach']);
        if (!existing.rows[0] && await shouldCreateAnomaly(gymId, 'capacity_breach')) {
          await createAnomaly(gymId, gymName, 'capacity_breach', 'critical', `Occupancy at ${Math.round(pct * 100)}% (capacity ${capacity})`);
        }
      } else if (capacity > 0 && pct < 0.85) {
        await resolveAnomalies(gymId, 'capacity_breach');
      }

      // 3) Revenue drop: today < 70% of same day last week
      if (lastWeekRevenue > 0 && todayRevenue < 0.7 * lastWeekRevenue) {
        const existing = await db.query('SELECT id FROM anomalies WHERE gym_id = $1 AND type = $2 AND resolved = false LIMIT 1', [gymId, 'revenue_drop']);
        if (!existing.rows[0] && await shouldCreateAnomaly(gymId, 'revenue_drop')) {
          await createAnomaly(gymId, gymName, 'revenue_drop', 'warning', `Today revenue ${todayRevenue} is <70% of last week's ${lastWeekRevenue}`);
        }
      } else {
        await resolveAnomalies(gymId, 'revenue_drop');
      }
    }
  } catch (err) {
    console.error('Anomaly detector error', err);
  }
}

async function start() {
  if (intervalId) return { status: 'running' };
  // run immediately then every 30s
  await detectOnce();
  intervalId = setInterval(detectOnce, 30 * 1000);
  return { status: 'running' };
}

function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  return { status: 'stopped' };
}

module.exports = { start, stop, detectOnce };
