Here is your **⭐ 5. API_DOCS.md** — clean, short, and reviewer-ready 👇

---

# ⭐ 5. API_DOCS.md

## 📌 Purpose

Defines all backend APIs (Application Programming Interface = way frontend talks to backend)

---

# 🌐 Base URL

```
http://localhost:3001/api
```

---

# 1. 🏢 Get All Gyms

### Endpoint

```
GET /gyms
```

### Description

Fetch all gyms with live data

### Response

```json
[
  {
    "id": "uuid",
    "name": "WTF Gyms — Bandra West",
    "city": "Mumbai",
    "capacity": 300,
    "current_occupancy": 120,
    "capacity_pct": 40,
    "today_revenue": 250000,
    "status": "active"
  }
]
```

---

# 2. 📊 Get Single Gym Live Data

### Endpoint

```
GET /gyms/:id/live
```

### Description

Live snapshot of a gym

### Response

```json
{
  "gym": {
    "id": "uuid",
    "name": "Bandra West"
  },
  "occupancy": {
    "count": 120,
    "capacity": 300,
    "percentage": 40
  },
  "today_revenue": 250000,
  "recent_events": [],
  "active_anomalies": []
}
```

---

# 3. 📈 Gym Analytics

### Endpoint

```
GET /gyms/:id/analytics?dateRange=7d
```

### Query Params

* `dateRange` → 7d | 30d | 90d

### Response

```json
{
  "heatmap": [],
  "revenue_by_plan": {
    "monthly": 120000,
    "quarterly": 90000,
    "annual": 300000
  },
  "churn_members": [
    {
      "name": "Rahul Sharma",
      "last_checkin_at": "2025-02-01",
      "risk": "HIGH"
    }
  ],
  "new_vs_renewal": {
    "new": 80,
    "renewal": 20
  }
}
```

---

# 4. 🚨 Get Anomalies

### Endpoint

```
GET /anomalies
```

### Query Params (optional)

* `gym_id`
* `severity` → warning | critical

### Response

```json
[
  {
    "id": "uuid",
    "gym_name": "Bandra West",
    "type": "capacity_breach",
    "severity": "critical",
    "message": "Capacity exceeded 90%",
    "resolved": false,
    "detected_at": "timestamp"
  }
]
```

---

# 5. ⚠️ Dismiss Anomaly

### Endpoint

```
PATCH /anomalies/:id/dismiss
```

### Description

Dismiss warning-level anomaly

### Response

```json
{
  "id": "uuid",
  "dismissed": true
}
```

### Error

```json
{
  "error": "Cannot dismiss critical anomaly"
}
```

---

# 6. 📊 Cross-Gym Revenue

### Endpoint

```
GET /analytics/cross-gym
```

### Response

```json
[
  {
    "gym_id": "uuid",
    "gym_name": "Bandra West",
    "total_revenue": 500000,
    "rank": 1
  }
]
```

---

# 7. ▶️ Start Simulator

### Endpoint

```
POST /simulator/start
```

### Body

```json
{
  "speed": 1
}
```

### Response

```json
{
  "status": "running",
  "speed": 1
}
```

---

# 8. ⏸ Stop Simulator

### Endpoint

```
POST /simulator/stop
```

### Response

```json
{
  "status": "paused"
}
```

---

# 9. 🔄 Reset Simulator

### Endpoint

```
POST /simulator/reset
```

### Description

Reset live data to seed state

### Response

```json
{
  "status": "reset"
}
```

---

# 🔌 WebSocket Events

## Connection

```
ws://localhost:3001
```

---

## Event Types

### 1. CHECKIN_EVENT

```json
{
  "type": "CHECKIN_EVENT",
  "gym_id": "uuid",
  "member_name": "Rahul",
  "timestamp": "time",
  "current_occupancy": 120,
  "capacity_pct": 40
}
```

---

### 2. CHECKOUT_EVENT

```json
{
  "type": "CHECKOUT_EVENT",
  "gym_id": "uuid",
  "member_name": "Rahul",
  "timestamp": "time"
}
```

---

### 3. PAYMENT_EVENT

```json
{
  "type": "PAYMENT_EVENT",
  "gym_id": "uuid",
  "amount": 1499,
  "plan_type": "monthly",
  "member_name": "Rahul",
  "today_total": 250000
}
```

---

### 4. ANOMALY_DETECTED

```json
{
  "type": "ANOMALY_DETECTED",
  "anomaly_id": "uuid",
  "gym_id": "uuid",
  "gym_name": "Bandra",
  "anomaly_type": "capacity_breach",
  "severity": "critical",
  "message": "Capacity exceeded"
}
```

---

### 5. ANOMALY_RESOLVED

```json
{
  "type": "ANOMALY_RESOLVED",
  "anomaly_id": "uuid",
  "gym_id": "uuid",
  "resolved_at": "time"
}
```

---

# ⚡ Final Summary

This API layer enables:

* Real-time updates (WebSocket)
* Fast analytics queries
* Full system control (simulator + anomalies)

👉 Covers all 4 modules:

* Dashboard
* Analytics
* Anomalies
* Simulator

---

If you want next 🔥
I can give you:

* Postman collection
* or backend route code (Node.js Express ready)
