# ⚙️ WTF LivePulse — Backend MCP (Master Control Prompt)

---

# 🎯 Goal

Build a **production-grade backend system** for a real-time multi-gym analytics platform.

Tech stack:

* Node.js (runtime - runs JS outside browser)
* Express (framework - handles APIs)
* PostgreSQL (database - stores structured data)
* WebSocket (real-time protocol - instant updates)
* Docker Compose (container orchestration - runs services together)

---

# 🧠 Core System Responsibilities

The backend must:

* Serve REST APIs
* Handle WebSocket real-time updates
* Run anomaly detection (background job)
* Run simulator (generates live events)
* Query optimized PostgreSQL database

---

# 🏗️ Architecture

3-layer system:

1. Database → PostgreSQL (single source of truth)
2. Backend → Node.js + Express
3. Frontend → React (consumes APIs + WebSocket)

Background jobs run inside backend.

---

# 🌐 REST API Endpoints

## 1. Get all gyms

GET /api/gyms

Returns:

* id, name, city, capacity
* current_occupancy
* today_revenue
* status

---

## 2. Live gym data

GET /api/gyms/:id/live

Returns:

* occupancy
* today revenue
* recent events
* active anomalies

---

## 3. Analytics

GET /api/gyms/:id/analytics?dateRange=7d|30d|90d

Returns:

* heatmap
* revenue breakdown
* churn risk members
* new vs renewal ratio

---

## 4. Anomalies list

GET /api/anomalies

Filters:

* gym_id
* severity

---

## 5. Dismiss anomaly

PATCH /api/anomalies/:id/dismiss

Rules:

* Only warning allowed
* Critical → return 403

---

## 6. Cross-gym revenue

GET /api/analytics/cross-gym

Returns:

* gym_id
* total_revenue
* rank

---

## 7. Simulator controls

POST /api/simulator/start
POST /api/simulator/stop
POST /api/simulator/reset

---

# 🔌 WebSocket Events

Backend must broadcast:

## CHECKIN_EVENT

* Update occupancy
* Add to activity feed

## CHECKOUT_EVENT

* Decrease occupancy

## PAYMENT_EVENT

* Update revenue

## ANOMALY_DETECTED

* Add anomaly

## ANOMALY_RESOLVED

* Mark resolved

---

# 🚨 Anomaly Detection Engine

Runs every **30 seconds**

## 1. Zero Check-ins

Condition:

* No check-in in last 2 hours
* Gym is active

---

## 2. Capacity Breach

Condition:

* occupancy > 90%

Resolve:

* < 85%

---

## 3. Revenue Drop

Condition:

* Today revenue < 70% of same day last week

---

# 🔄 Simulation Engine

* Runs every **2 seconds**
* Generates:

  * check-ins
  * check-outs

Pattern:

* Peak: 6–9 AM, 5–8 PM
* Low: afternoon
* Zero: night

---

# 🧪 Testing Requirements

## Unit Tests

* anomaly logic
* simulator logic

## Integration Tests

* APIs working
* status codes correct

## E2E Tests

* UI updates from backend events

---

# ⚡ Performance Requirements

All queries must be fast:

* occupancy query < 0.5ms
* revenue query < 0.8ms
* churn query < 1ms
* heatmap < 0.3ms

NO sequential scan allowed

---

# 🐳 Docker Requirements

Command:
docker compose up

Must:

* start DB
* run seed
* start backend
* start frontend

NO manual steps

---

# 🔥 Critical Rules

* No polling → only WebSocket
* Seed data must exist
* Queries must use indexes
* Must handle real-time updates
* Must auto-detect anomalies

---

# 🧠 Final Summary

Backend is responsible for:

* Data storage (PostgreSQL)
* Fast queries (indexed)
* Real-time updates (WebSocket)
* Business logic (anomalies + analytics)
* Event simulation

System must behave like:
👉 real-time production system, not demo

---
