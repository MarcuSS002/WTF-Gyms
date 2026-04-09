Here’s your **clean, ready-to-paste `.md` file** 👇 (optimized for VS Code)

---

````md
# WTF LivePulse — Database Schema & Seeding Guide

---

# 🧠 1. DATABASE SCHEMA

## 🏋️ gyms
```sql
CREATE TABLE gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  capacity INT NOT NULL CHECK (capacity > 0),
  status TEXT NOT NULL CHECK (status IN ('active','inactive','maintenance')),
  opens_at TIME NOT NULL,
  closes_at TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
````

---

## 👤 members

```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  plan_type TEXT CHECK (plan_type IN ('monthly','quarterly','annual')),
  member_type TEXT CHECK (member_type IN ('new','renewal')),
  status TEXT CHECK (status IN ('active','inactive','frozen')),
  joined_at TIMESTAMPTZ,
  plan_expires_at TIMESTAMPTZ,
  last_checkin_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_members_gym_id ON members(gym_id);
CREATE INDEX idx_members_churn_risk 
ON members(last_checkin_at) WHERE status='active';
```

---

## 🏃 checkins

```sql
CREATE TABLE checkins (
  id BIGSERIAL PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  gym_id UUID REFERENCES gyms(id),
  checked_in TIMESTAMPTZ NOT NULL,
  checked_out TIMESTAMPTZ,
  duration_min INT GENERATED ALWAYS AS (
    CASE 
      WHEN checked_out IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (checked_out - checked_in))/60
    END
  ) STORED
);

CREATE INDEX idx_checkins_time_brin ON checkins USING BRIN(checked_in);
CREATE INDEX idx_checkins_live_occupancy 
ON checkins(gym_id, checked_out) WHERE checked_out IS NULL;
CREATE INDEX idx_checkins_member ON checkins(member_id, checked_in DESC);
```

---

## 💰 payments

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id),
  gym_id UUID REFERENCES gyms(id),
  amount NUMERIC(10,2),
  plan_type TEXT,
  payment_type TEXT CHECK (payment_type IN ('new','renewal')),
  paid_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX idx_payments_gym_date ON payments(gym_id, paid_at DESC);
CREATE INDEX idx_payments_date ON payments(paid_at DESC);
```

---

## 🚨 anomalies

```sql
CREATE TABLE anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id),
  type TEXT CHECK (type IN ('zero_checkins','capacity_breach','revenue_drop')),
  severity TEXT CHECK (severity IN ('warning','critical')),
  message TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_anomalies_active 
ON anomalies(gym_id, detected_at DESC) WHERE resolved = FALSE;
```

---

## 📊 Materialized View

```sql
CREATE MATERIALIZED VIEW gym_hourly_stats AS
SELECT
  gym_id,
  EXTRACT(DOW FROM checked_in) AS day_of_week,
  EXTRACT(HOUR FROM checked_in) AS hour_of_day,
  COUNT(*) AS checkin_count
FROM checkins
WHERE checked_in >= NOW() - INTERVAL '7 days'
GROUP BY gym_id, day_of_week, hour_of_day;
```

---

# 🌱 2. SEEDING GUIDE

---

## 🏢 Step 1: Gyms

* Exactly **10 gyms**
* Status = `active`
* Use given names, cities, capacity

---

## 👥 Step 2: Members (5000)

### Distribution (example)

* Lajpat: 650
* Bandra: 750
* Velachery: 250

---

### Member Fields

```json
{
  "name": "Rahul Sharma",
  "email": "rahul.sharma42@gmail.com",
  "phone": "9876543210",
  "plan_type": "monthly",
  "member_type": "new",
  "status": "active",
  "joined_at": "random",
  "plan_expires_at": "joined + duration",
  "last_checkin_at": "from checkins"
}
```

---

### Rules

* Active: ~85%
* Inactive: ~8%
* Frozen: ~4%

---

### ⚠️ Churn Risk (MANDATORY)

| Type     | Condition    |
| -------- | ------------ |
| High     | 45–60 days   |
| Critical | >60 days     |
| Total    | ≥230 members |

---

### ⚠️ Important

```
last_checkin_at MUST match latest checkin
```

---

## 🏃 Step 3: Checkins (~270k)

### Rules

* 90 days history
* ~300/day/gym

---

### Hourly Distribution

| Time      | Multiplier |
| --------- | ---------- |
| 7–10 AM   | 1.0        |
| 5–9 PM    | 0.9        |
| Afternoon | 0.2        |
| Night     | 0          |

---

### Weekly Pattern

| Day | Multiplier |
| --- | ---------- |
| Mon | 1.0        |
| Sun | 0.45       |

---

### Checkout Rule

```
checked_out = checked_in + random(45–90 mins)
```

---

### Live Data

* 100–350 open checkins
* used for dashboard

---

## 💰 Step 4: Payments

| Plan      | Amount |
| --------- | ------ |
| monthly   | 1499   |
| quarterly | 3999   |
| annual    | 11999  |

---

### Rules

* New → 1 payment
* Renewal → 2 payments

```
paid_at ≈ joined_at (±5 min)
```

---

## 🚨 Step 5: Anomaly Setup

---

### Zero Checkins (Velachery)

* open = 0
* last checkin > 2 hrs

---

### Capacity Breach (Bandra)

* capacity = 300
* open checkins = 275+

---

### Revenue Drop (Salt Lake)

* last week ≥ ₹15000
* today ≤ ₹3000

---

## ⚙️ Step 6: Final Sync

```sql
UPDATE members m
SET last_checkin_at = sub.max_time
FROM (
  SELECT member_id, MAX(checked_in) as max_time
  FROM checkins
  GROUP BY member_id
) sub
WHERE m.id = sub.member_id;
```

---

# ✅ VALIDATION

| Check         | Expected  |
| ------------- | --------- |
| gyms          | 10        |
| members       | 5000      |
| checkins      | 250k–300k |
| payments      | 5k–6k     |
| churn         | ≥230      |
| open checkins | 100–350   |

---

# 🚀 BEST PRACTICE

Use:

```
generate_series() (PostgreSQL)
```

Example:

```sql
SELECT generate_series(
  NOW() - INTERVAL '90 days',
  NOW(),
  INTERVAL '1 hour'
);
```

---

# 💡 FINAL NOTE

This seed is:

* Real-world simulation
* Analytics-ready dataset
* Core of your system

---

```

---

If you want next level 🚀  
I can give you:
- ✅ full **ready SQL seed file**
- ✅ OR **Node.js seed script (recommended)**

Just tell 👍
```
