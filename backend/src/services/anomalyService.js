const db = require('../db/pool');
const {
  getHardcodedAnomalyForGym,
  getHardcodedAnomalyById,
  isHardcodedAnomalyId,
} = require('./hardcodedAnomalies');

async function getHardcodedAnomalies() {
  const gymsRes = await db.query(
    `SELECT id, name
     FROM gyms
     WHERE name ILIKE '%Bandra%' OR name ILIKE '%Velachery%' OR name ILIKE '%Salt Lake%'`
  );
  return gymsRes.rows
    .map((gym) => getHardcodedAnomalyForGym(gym))
    .filter(Boolean);
}

exports.list = async ({ gym_id, severity, include_resolved = false } = {}) => {
  const parts = ['SELECT a.id, a.gym_id, g.name AS gym_name, a.type, a.severity, a.message, a.resolved, a.dismissed, a.detected_at, a.resolved_at FROM anomalies a LEFT JOIN gyms g ON g.id = a.gym_id'];
  const conditions = [];
  const params = [];
  if (!include_resolved) {
    conditions.push('a.resolved = false');
  }
  if (gym_id) { params.push(gym_id); conditions.push(`a.gym_id = $${params.length}`); }
  if (severity) { params.push(severity); conditions.push(`a.severity = $${params.length}`); }
  if (conditions.length) parts.push('WHERE ' + conditions.join(' AND '));
  parts.push('ORDER BY a.detected_at DESC');
  const sql = parts.join(' ');
  const res = await db.query(sql, params);

  const hardcoded = await getHardcodedAnomalies();

  const filteredHardcoded = hardcoded.filter((a) => {
    if (!include_resolved && a.resolved) return false;
    if (gym_id && String(a.gym_id) !== String(gym_id)) return false;
    if (severity && String(a.severity) !== String(severity)) return false;
    return true;
  });

  const seen = new Set();
  const merged = [];
  for (const row of [...filteredHardcoded, ...res.rows]) {
    const key = String(row.id);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
  }

  merged.sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at));
  return merged;
};

exports.dismiss = async (id) => {
  if (isHardcodedAnomalyId(id)) {
    const anomaly = getHardcodedAnomalyById(id);
    if (!anomaly) throw new Error('not_found');
    if (anomaly.severity === 'critical') {
      const err = new Error('forbidden'); err.code = 'forbidden'; throw err;
    }
    return { id, dismissed: true, hardcoded: true };
  }

  // check severity
  const cur = await db.query('SELECT severity, resolved FROM anomalies WHERE id = $1', [id]);
  if (!cur.rows[0]) throw new Error('not_found');
  const { severity, resolved } = cur.rows[0];
  if (severity === 'critical') {
    const err = new Error('forbidden'); err.code = 'forbidden'; throw err;
  }
  if (resolved) return { id, dismissed: false, already_resolved: true };
  await db.query('UPDATE anomalies SET dismissed = true WHERE id = $1', [id]);
  return { id, dismissed: true };
};
