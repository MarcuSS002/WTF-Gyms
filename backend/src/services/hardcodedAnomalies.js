const HARD_CODED_ANOMALY_DEFS = [
  {
    match: 'bandra',
    id: 'hardcoded-bandra-capacity-breach',
    type: 'capacity_breach',
    severity: 'critical',
    message: 'Occupancy crossed safe limit',
  },
  {
    match: 'velachery',
    id: 'hardcoded-velachery-zero-checkins',
    type: 'zero_checkins',
    severity: 'warning',
    message: 'No check-ins in the last 2 hours',
  },
  {
    match: 'salt lake',
    id: 'hardcoded-saltlake-revenue-drop',
    type: 'revenue_drop',
    severity: 'warning',
    message: 'Today revenue is lower than expected',
  },
];

function getHardcodedAnomalyForGym(gym) {
  const gymName = String(gym?.gym_name || gym?.name || '').toLowerCase();
  const match = HARD_CODED_ANOMALY_DEFS.find((item) => gymName.includes(item.match));
  if (!match) return null;

  return {
    id: match.id,
    gym_id: gym?.gym_id || gym?.id || null,
    gym_name: gym?.gym_name || gym?.name || '',
    type: match.type,
    severity: match.severity,
    message: match.message,
    resolved: false,
    dismissed: false,
    detected_at: new Date().toISOString(),
    resolved_at: null,
  };
}

function isHardcodedAnomalyId(id) {
  return HARD_CODED_ANOMALY_DEFS.some((item) => item.id === id);
}

function getHardcodedAnomalyById(id) {
  const match = HARD_CODED_ANOMALY_DEFS.find((item) => item.id === id);
  if (!match) return null;
  return {
    id: match.id,
    type: match.type,
    severity: match.severity,
    message: match.message,
  };
}

module.exports = {
  getHardcodedAnomalyForGym,
  getHardcodedAnomalyById,
  isHardcodedAnomalyId,
};
