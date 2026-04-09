-- ========================
-- MEMBERS INDEXES
-- ========================

-- For gym-wise queries
CREATE INDEX IF NOT EXISTS idx_members_gym_id
ON members (gym_id);

-- REQUIRED: Partial index for churn detection (very important)
CREATE INDEX IF NOT EXISTS idx_members_churn_risk
ON members (last_checkin_at)
WHERE status = 'active';

-- ========================
-- CHECKINS INDEXES
-- ========================

-- REQUIRED: BRIN (Block Range Index = fast for large time-series tables)
CREATE INDEX IF NOT EXISTS idx_checkins_time_brin
ON checkins USING BRIN (checked_in);

-- REQUIRED: Live occupancy query (most frequent query)
CREATE INDEX IF NOT EXISTS idx_checkins_live_occupancy
ON checkins (gym_id, checked_out)
WHERE checked_out IS NULL;

-- Member history lookup (latest checkins)
CREATE INDEX IF NOT EXISTS idx_checkins_member
ON checkins (member_id, checked_in DESC);

-- 🔥 EXTRA (important for heatmap fallback queries)
CREATE INDEX IF NOT EXISTS idx_checkins_gym_time
ON checkins (gym_id, checked_in);

-- ========================
-- PAYMENTS INDEXES
-- ========================

-- REQUIRED: today's revenue query
CREATE INDEX IF NOT EXISTS idx_payments_gym_date
ON payments (gym_id, paid_at DESC);

-- Cross-gym revenue comparison
CREATE INDEX IF NOT EXISTS idx_payments_date
ON payments (paid_at DESC);

-- 🔥 EXTRA (aggregation optimization)
CREATE INDEX IF NOT EXISTS idx_payments_gym
ON payments (gym_id);

-- ========================
-- ANOMALIES INDEXES
-- ========================

-- REQUIRED: active anomalies (very fast lookup)
CREATE INDEX IF NOT EXISTS idx_anomalies_active
ON anomalies (gym_id, detected_at DESC)
WHERE resolved = FALSE;

-- 🔥 EXTRA (global anomaly list)
CREATE INDEX IF NOT EXISTS idx_anomalies_detected
ON anomalies (detected_at DESC);