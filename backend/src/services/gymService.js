const db = require('../db/pool');
const { getHardcodedAnomalyForGym } = require('./hardcodedAnomalies');

exports.getLiveOccupancy = async (gymId) => {
  const occupancyRes = await db.query(
    `SELECT COUNT(*) AS count
     FROM checkins
     WHERE gym_id = $1 AND checked_out IS NULL`,
    [gymId]
  );

  const gymRes = await db.query(
    `SELECT capacity FROM gyms WHERE id = $1`,
    [gymId]
  );

  const count = Number(occupancyRes.rows[0]?.count || 0);
  const capacity = Number(gymRes.rows[0]?.capacity || 0);
  const percentage = capacity ? Number(((count / capacity) * 100).toFixed(1)) : 0;

  return {
    current: count,
    capacity,
    percentage
  };
};

exports.getGyms = async () => {
  const sql = `
    SELECT g.id, g.name, g.city, g.capacity, g.status,
      COALESCE((SELECT COUNT(*) FROM checkins c WHERE c.gym_id = g.id AND c.checked_out IS NULL), 0) AS current_occupancy,
      COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.gym_id = g.id AND p.paid_at::date = CURRENT_DATE),0) AS today_revenue
    FROM gyms g
    ORDER BY g.name
  `;
  const res = await db.query(sql);
  return res.rows.map(r => ({
    id: r.id,
    name: r.name,
    city: r.city,
    capacity: r.capacity,
    status: r.status,
    current_occupancy: Number(r.current_occupancy),
    capacity_pct: r.capacity ? Number(((Number(r.current_occupancy) / r.capacity) * 100).toFixed(1)) : 0,
    today_revenue: Number(r.today_revenue || 0)
  }));
};

exports.getGymLive = async (gymId) => {
  const occupancySql = `
    SELECT COUNT(*) AS count, (SELECT capacity FROM gyms WHERE id = $1) AS capacity, (SELECT name FROM gyms WHERE id = $1) AS gym_name
    FROM checkins WHERE gym_id = $1 AND checked_out IS NULL
  `;
  const occRes = await db.query(occupancySql, [gymId]);
  const count = Number(occRes.rows[0].count || 0);
  const capacity = Number(occRes.rows[0].capacity || 0);
  const gym_name = String(occRes.rows[0].gym_name || '');
  const pct = capacity ? Number(((count / capacity) * 100).toFixed(1)) : 0;

  const revenueSql = `SELECT COALESCE(SUM(amount),0) AS today_revenue FROM payments WHERE gym_id = $1 AND paid_at::date = CURRENT_DATE`;
  const revRes = await db.query(revenueSql, [gymId]);
  const today_revenue = Number(revRes.rows[0].today_revenue || 0);

  const [checkinsRes, checkoutsRes, paymentsRes] = await Promise.all([
    db.query(
      `SELECT 'CHECKIN_EVENT' AS type, m.name AS member_name, g.name AS gym, c.checked_in AS timestamp, NULL::numeric AS amount, NULL::text AS plan_type
       FROM checkins c
       JOIN members m ON m.id = c.member_id
       JOIN gyms g ON g.id = c.gym_id
       WHERE c.gym_id = $1
       ORDER BY c.checked_in DESC
       LIMIT 20`,
      [gymId]
    ),
    db.query(
      `SELECT 'CHECKOUT_EVENT' AS type, m.name AS member_name, g.name AS gym, c.checked_out AS timestamp, NULL::numeric AS amount, NULL::text AS plan_type
       FROM checkins c
       JOIN members m ON m.id = c.member_id
       JOIN gyms g ON g.id = c.gym_id
       WHERE c.gym_id = $1 AND c.checked_out IS NOT NULL
       ORDER BY c.checked_out DESC
       LIMIT 20`,
      [gymId]
    ),
    db.query(
      `SELECT 'PAYMENT_EVENT' AS type, m.name AS member_name, g.name AS gym, p.paid_at AS timestamp, p.amount, p.plan_type
       FROM payments p
       JOIN members m ON m.id = p.member_id
       JOIN gyms g ON g.id = p.gym_id
       WHERE p.gym_id = $1
       ORDER BY p.paid_at DESC
       LIMIT 20`,
      [gymId]
    )
  ]);

  const grouped = [checkinsRes.rows, checkoutsRes.rows, paymentsRes.rows];
  const recent_events = [];
  let index = 0;

  while (recent_events.length < 20) {
    let added = false;
    for (const rows of grouped) {
      const event = rows[index];
      if (event) {
        recent_events.push(event);
        added = true;
        if (recent_events.length === 20) break;
      }
    }
    if (!added) break;
    index += 1;
  }

  for (let i = 0; i < recent_events.length; i += 1) {
    recent_events[i] = {
      ...recent_events[i],
      gym_name: recent_events[i].gym,
      ts: recent_events[i].timestamp,
    };
  }

  const hardcodedAnomaly = getHardcodedAnomalyForGym({ id: gymId, name: gym_name });
  const active_anomalies = hardcodedAnomaly ? [hardcodedAnomaly] : [];

  return {
    occupancy: { count, capacity, percentage: pct },
    today_revenue,
    recent_events,
    active_anomalies
  };
};
