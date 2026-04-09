

# ✅ 3. SEEDING_STRATEGY.md

## 📌 Purpose

This document defines how realistic data is generated for the system.

👉 Goal: simulate real-world gym behavior (data simulation = generating fake but realistic data patterns)

---

# 1. 🧑‍🤝‍🧑 Member Distribution

### Total Members: **5,000 across 10 gyms**

### Key Logic

* Distribution is **NOT equal**
* Based on **gym size (capacity)**

### Example Pattern

| Gym Type                   | % Members | Logic                        |
| -------------------------- | --------- | ---------------------------- |
| Large gyms (Bandra, Powai) | 12–15%    | More capacity → more members |
| Medium gyms                | 9–13%     | Balanced                     |
| Small gyms                 | 5–8%      | Fewer members                |

### Plan Distribution (per gym)

* Monthly → 40–60%
* Quarterly → 25–40%
* Annual → 10–20%

### Member Status

* Active → ~82–90%
* Inactive → ~8%
* Frozen → ~4%

### Member Type

* New → 80%
* Renewal → 20%

👉 Why important:

* Helps analytics like revenue, churn, occupancy look realistic

---

# 2. 🏃 Check-in Logic (Hour + Day Pattern)

## 📊 Daily Behavior (Hour-wise)

| Time        | Multiplier | Meaning      |
| ----------- | ---------- | ------------ |
| 00:00–05:30 | 0x         | Closed       |
| 06:00–09:00 | 1.0x 🔥    | Morning peak |
| 10:00–13:00 | 0.3–0.4x   | Low traffic  |
| 14:00–16:00 | 0.2x       | Very low     |
| 17:00–21:00 | 0.9x 🔥    | Evening peak |
| 21:00+      | 0.3x       | Drop         |

👉 Multiplier (weight applied to generate data)

---

## 📅 Weekly Behavior

| Day | Multiplier |
| --- | ---------- |
| Mon | 1.0        |
| Tue | 0.95       |
| Wed | 0.90       |
| Thu | 0.95       |
| Fri | 0.85       |
| Sat | 0.70       |
| Sun | 0.45       |

👉 Meaning:

* Weekdays = busy
* Sunday = least traffic

---

## 🔁 Check-in Rules

* Total: ~270,000 check-ins (90 days) 
* Each session:

  * Duration → 45–90 mins
* Historical data:

  * `checked_out` is NOT NULL
* Current day:

  * Some `checked_out = NULL` (live users)

---

## 🟢 Live Occupancy Setup

* Seed open check-ins:

  * Large gyms → 25–35
  * Medium → 15–25
  * Small → 8–15

👉 Used for:

* Live dashboard occupancy

---

# 3. 💰 Payment Logic

## Plan Pricing

| Plan      | Price   |
| --------- | ------- |
| Monthly   | ₹1,499  |
| Quarterly | ₹3,999  |
| Annual    | ₹11,999 |

## Rules

* Every member → ≥ 1 payment
* Renewal members → 2 payments

### Payment Timing

* `paid_at ≈ joined_at`
* Renewal:

  * next payment = +30 / +90 / +365 days

👉 Important:

* No future payments

---

## 💡 Revenue Behavior

* Large gyms → high revenue
* Small gyms → low revenue

👉 Used for:

* Revenue charts
* Revenue anomaly detection

---

# 4. ⚠️ Churn Logic (Very Important)

Churn = members who stop visiting (user drop-off behavior)

## Segments

| Type      | Last Check-in | Count    |
| --------- | ------------- | -------- |
| Healthy   | < 44 days     | majority |
| High Risk | 45–60 days    | ≥150     |
| Critical  | >60 days      | ≥80      |

👉 Must match:

* `last_checkin_at` = latest check-in record

---

## Why Needed

* Drives:

  * Churn panel
  * Retention analytics

---

# 5. 🚨 Anomaly Setup (Critical for evaluation)

System must detect issues automatically.

---

## 🟥 Scenario A — Zero Check-ins

* Gym: Velachery
* Condition:

  * No open check-ins
  * Last check-in > 2 hours

👉 Output:

* `zero_checkins` anomaly

---

## 🟥 Scenario B — Capacity Breach

* Gym: Bandra (capacity = 300)
* Seed:

  * 275+ active check-ins

👉 Output:

* `capacity_breach` anomaly

---

## 🟥 Scenario C — Revenue Drop

* Gym: Salt Lake

### Setup

* Last week → high revenue (₹15k+)
* Today → very low (≤ ₹3k)

👉 Output:

* `revenue_drop` anomaly

---

## 🎯 Why Anomalies Matter

* Tests real-time engine
* Reviewer verifies within 30 seconds 

---

# ⚡ Final Summary

This seeding strategy ensures:

* Realistic user behavior
* Meaningful analytics
* Working anomaly detection
* Live dashboard data from start


