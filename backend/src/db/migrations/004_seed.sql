-- ==============================
-- 1. GYMS (EXACT 10)
-- ==============================
INSERT INTO gyms (name, city, capacity, opens_at, closes_at, status)
VALUES
('WTF Gyms — Lajpat Nagar','New Delhi',220,'05:30','22:30','active'),
('WTF Gyms — Connaught Place','New Delhi',180,'06:00','22:00','active'),
('WTF Gyms — Bandra West','Mumbai',300,'05:00','23:00','active'),
('WTF Gyms — Powai','Mumbai',250,'05:30','22:30','active'),
('WTF Gyms — Indiranagar','Bengaluru',200,'05:30','22:00','active'),
('WTF Gyms — Koramangala','Bengaluru',180,'06:00','22:00','active'),
('WTF Gyms — Banjara Hills','Hyderabad',160,'06:00','22:00','active'),
('WTF Gyms — Sector 18 Noida','Noida',140,'06:00','21:30','active'),
('WTF Gyms — Salt Lake','Kolkata',120,'06:00','21:00','active'),
('WTF Gyms — Velachery','Chennai',110,'06:00','21:00','active')
ON CONFLICT DO NOTHING;

-- ==============================
-- 2. MEMBERS (5000 UNIQUE)
-- ==============================

WITH gym_dist AS (
  SELECT id, name,
    CASE name
      WHEN 'WTF Gyms — Lajpat Nagar' THEN 650
      WHEN 'WTF Gyms — Connaught Place' THEN 550
      WHEN 'WTF Gyms — Bandra West' THEN 750
      WHEN 'WTF Gyms — Powai' THEN 600
      WHEN 'WTF Gyms — Indiranagar' THEN 550
      WHEN 'WTF Gyms — Koramangala' THEN 500
      WHEN 'WTF Gyms — Banjara Hills' THEN 450
      WHEN 'WTF Gyms — Sector 18 Noida' THEN 400
      WHEN 'WTF Gyms — Salt Lake' THEN 300
      WHEN 'WTF Gyms — Velachery' THEN 250
    END AS member_count
  FROM gyms
),

numbered AS (
  SELECT g.id, generate_series(1, g.member_count) AS gs
  FROM gym_dist g
),

global_ids AS (
  SELECT id, ROW_NUMBER() OVER () AS uid
  FROM numbered
),

name_bank AS (
  SELECT
    ARRAY[
      'Rahul','Aarav','Vivaan','Aditya','Arjun','Rohan','Kunal','Siddharth','Ishaan','Aman',
      'Priya','Ananya','Diya','Kavya','Riya','Aisha','Sneha','Pooja','Meera','Ira'
    ]::text[] AS first_names,
    ARRAY[
      'Sharma','Verma','Gupta','Patel','Singh','Khan','Iyer','Nair','Reddy','Rao',
      'Chopra','Mehta','Joshi','Kapoor','Mishra','Das','Ghosh','Yadav','Jain','Bose'
    ]::text[] AS last_names
)

INSERT INTO members (
  gym_id, name, email, phone,
  plan_type, member_type, status,
  joined_at, plan_expires_at
)
SELECT
  g.id,
  (
    (nb.first_names[((g.uid - 1) % array_length(nb.first_names, 1)) + 1]) || ' ' ||
    (nb.last_names[(((g.uid - 1) / array_length(nb.first_names, 1)) % array_length(nb.last_names, 1)) + 1])
  ) AS name,
  'user' || uid || '@gmail.com',   -- ✅ UNIQUE EMAIL
  '9' || (100000000 + uid)::text,

  CASE 
    WHEN random() < 0.5 THEN 'monthly'
    WHEN random() < 0.8 THEN 'quarterly'
    ELSE 'annual'
  END,

  CASE WHEN random() < 0.8 THEN 'new' ELSE 'renewal' END,

  CASE 
    WHEN random() < 0.86 THEN 'active'
    WHEN random() < 0.94 THEN 'inactive'
    ELSE 'frozen'
  END,

  NOW() - (random() * INTERVAL '90 days'),

  NOW() + INTERVAL '30 days'

FROM global_ids g
CROSS JOIN name_bank nb;

-- ==============================
-- 3. CHECKINS (~270k)
-- ==============================

WITH day_series AS (
  SELECT generate_series(
    NOW() - INTERVAL '90 days',
    NOW(),
    INTERVAL '1 day'
  ) AS day_ts
), historical_checkins AS (
  SELECT
    m.id AS member_id,
    m.gym_id,
    date_trunc('day', d.day_ts)
      + CASE
          WHEN EXTRACT(HOUR FROM d.day_ts) < 6 THEN INTERVAL '6 hours'
          WHEN EXTRACT(HOUR FROM d.day_ts) < 10 THEN INTERVAL '7 hours' + random() * INTERVAL '3 hours'
          WHEN EXTRACT(HOUR FROM d.day_ts) < 14 THEN INTERVAL '10 hours' + random() * INTERVAL '3 hours'
          WHEN EXTRACT(HOUR FROM d.day_ts) < 17 THEN INTERVAL '14 hours' + random() * INTERVAL '2 hours'
          WHEN EXTRACT(HOUR FROM d.day_ts) < 21 THEN INTERVAL '17 hours' + random() * INTERVAL '4 hours'
          ELSE INTERVAL '21 hours' + random() * INTERVAL '2 hours'
        END AS checked_in
  FROM members m
  JOIN day_series d ON random() < 0.6
)
INSERT INTO checkins (member_id, gym_id, checked_in, checked_out)
SELECT
  member_id,
  gym_id,
  checked_in,
  checked_in + (INTERVAL '45 min' + random() * INTERVAL '45 min')
FROM historical_checkins;

-- ==============================
-- 4. OPEN CHECKINS
-- ==============================

WITH live_open_counts AS (
  SELECT g.id AS gym_id, g.name, g.capacity,
    CASE
      WHEN g.name = 'WTF Gyms — Bandra West' THEN 276
      WHEN g.name = 'WTF Gyms — Velachery' THEN 0
      WHEN g.capacity >= 240 THEN 30
      WHEN g.capacity BETWEEN 160 AND 239 THEN 20
      ELSE 10
    END AS open_count,
    CASE
      WHEN g.name = 'WTF Gyms — Bandra West' THEN INTERVAL '15 min'
      WHEN g.name = 'WTF Gyms — Velachery' THEN INTERVAL '0 min'
      WHEN g.capacity >= 240 THEN INTERVAL '30 min'
      WHEN g.capacity BETWEEN 160 AND 239 THEN INTERVAL '20 min'
      ELSE INTERVAL '15 min'
    END AS age_offset
  FROM gyms g
)
INSERT INTO checkins (member_id, gym_id, checked_in, checked_out)
SELECT m.id, l.gym_id, NOW() - l.age_offset, NULL
FROM live_open_counts l
JOIN LATERAL (
  SELECT id
  FROM members
  WHERE gym_id = l.gym_id
  ORDER BY random()
  LIMIT GREATEST(l.open_count, 0)
) m ON true;

-- Velachery = ZERO
DELETE FROM checkins
WHERE gym_id = (SELECT id FROM gyms WHERE name='WTF Gyms — Velachery')
AND checked_out IS NULL;
DELETE FROM checkins
WHERE gym_id = (SELECT id FROM gyms WHERE name='WTF Gyms — Velachery');

-- ==============================
-- 5. LAST CHECKIN SYNC
-- ==============================

UPDATE members m
SET last_checkin_at = sub.max_time
FROM (
  SELECT member_id, MAX(checked_in) AS max_time
  FROM checkins
  GROUP BY member_id
) sub
WHERE m.id = sub.member_id;

-- churn
UPDATE members
SET last_checkin_at = NOW() - INTERVAL '50 days'
WHERE id IN (
  SELECT id FROM members WHERE status='active' LIMIT 230
);

-- ==============================
-- 6. PAYMENTS
-- ==============================

INSERT INTO payments (member_id, gym_id, amount, plan_type, payment_type, paid_at)
SELECT
  m.id,
  m.gym_id,
  CASE 
    WHEN m.plan_type='monthly' THEN 1499
    WHEN m.plan_type='quarterly' THEN 3999
    ELSE 11999
  END,
  m.plan_type,
  'new',
  m.joined_at
FROM members m;

INSERT INTO payments (member_id, gym_id, amount, plan_type, payment_type, paid_at)
SELECT
  m.id,
  m.gym_id,
  CASE 
    WHEN m.plan_type='monthly' THEN 1499
    WHEN m.plan_type='quarterly' THEN 3999
    ELSE 11999
  END,
  m.plan_type,
  'renewal',
  m.joined_at +
    CASE 
      WHEN m.plan_type='monthly' THEN INTERVAL '30 days'
      WHEN m.plan_type='quarterly' THEN INTERVAL '90 days'
      ELSE INTERVAL '365 days'
    END
FROM members m
WHERE m.member_type='renewal';

-- ==============================
-- 7. REVENUE DROP
-- ==============================

INSERT INTO payments (member_id, gym_id, amount, plan_type, payment_type, paid_at)
SELECT id,
(SELECT id FROM gyms WHERE name='WTF Gyms — Salt Lake'),
1499,'monthly','new',
NOW() - INTERVAL '7 days'
FROM members LIMIT 8;

INSERT INTO payments (member_id, gym_id, amount, plan_type, payment_type, paid_at)
SELECT id,
(SELECT id FROM gyms WHERE name='WTF Gyms — Salt Lake'),
1499,'monthly','new',
NOW()
FROM members LIMIT 1;

DO $$ BEGIN
  RAISE NOTICE 'SEED COMPLETE ✅';
END $$;