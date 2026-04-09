const db = require('../db/pool');

exports.crossGymRevenue = async () => {
  const sql = `
    SELECT g.id AS gym_id, g.name AS gym_name, COALESCE(SUM(p.amount),0) AS total_revenue
    FROM gyms g
    LEFT JOIN payments p ON p.gym_id = g.id
      AND p.paid_at::date = CURRENT_DATE
    GROUP BY g.id, g.name
    ORDER BY total_revenue DESC
  `;
  const res = await db.query(sql);
  // attach rank
  return res.rows.map((r, i) => ({ gym_id: r.gym_id, gym_name: r.gym_name, total_revenue: Number(r.total_revenue), rank: i + 1 }));
};

exports.getGymAnalytics = async (gymId, dateRange = '30d') => {
  const days = String(dateRange) === '7d' ? 7 : String(dateRange) === '90d' ? 90 : 30;

  const heatmapQuery = `
    SELECT day_of_week AS day, hour_of_day AS hour, checkin_count AS count
    FROM gym_hourly_stats
    WHERE gym_id = $1
    ORDER BY day_of_week, hour_of_day
  `;

  const revenueQuery = `
    SELECT plan_type AS plan, COALESCE(SUM(amount),0) AS total
    FROM payments
    WHERE gym_id = $1
      AND paid_at >= NOW() - ($2::text || ' days')::interval
    GROUP BY plan_type
    ORDER BY plan_type
  `;

  const churnQuery = `
    SELECT name, last_checkin_at,
      CASE
        WHEN last_checkin_at < NOW() - INTERVAL '60 days' THEN 'CRITICAL'
        WHEN last_checkin_at < NOW() - INTERVAL '45 days' THEN 'HIGH'
      END AS risk
    FROM members
    WHERE gym_id = $1
      AND status = 'active'
      AND last_checkin_at < NOW() - INTERVAL '45 days'
    ORDER BY last_checkin_at ASC
    LIMIT 20
  `;

  const [heatmap, revenue, churn] = await Promise.all([
    db.query(heatmapQuery, [gymId]),
    db.query(revenueQuery, [gymId, days]),
    db.query(churnQuery, [gymId]),
  ]);

  return {
    heatmap: heatmap.rows.map((r) => ({ day: Number(r.day), hour: Number(r.hour), count: Number(r.count) })),
    revenue: revenue.rows.map((r) => ({ plan: r.plan, total: Number(r.total) })),
    churn: churn.rows,
  };
};
