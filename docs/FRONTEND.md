# 🎨 WTF LivePulse — UI Design Requirements

---

## 🎯 Design Philosophy

- Must feel like a **real-time command centre**
- Inspired by:
  - Bloomberg terminal
  - Operations dashboards
- Focus:
  - Dark theme
  - High contrast
  - Live updating data

---

## 🎨 Color Palette

| Element | Color |
|--------|------|
| Background | #0D0D1A |
| Cards | #1A1A2E |
| Accent | One color (red / teal / orange) |
| Primary Text | #E2E8F0 |
| Secondary Text | #64748B |

---

## 🔤 Typography

- Fonts:
  - Inter
  - Sora
  - JetBrains Mono (for data)

- Sizes:
  - Minimum: 13px
  - KPI numbers: 32–48px

---

## 🟢 Live Indicators

- Show pulsing dot near occupancy

| State | Color |
|------|------|
| Connected | Green |
| Disconnected | Red |

---

## 🔢 Number Animations

- Smooth animation for KPI updates
- Duration: 300–500ms

---

## 📱 Responsiveness

- Must work at minimum width: **1280px**
- Mobile not required

---

## ⏳ Loading States

- Use skeleton loaders
- No empty UI or "undefined"

---

## ❌ Error States

- Show proper error messages in UI
- No console-only errors

---

# 📊 Dashboard UI

## 🧭 Navigation

- Top bar with all gyms
- Tabs or dropdown
- Switching updates UI without reload

---

## 🏋️ Occupancy

- Show:
  - Member count
  - Percentage

| Range | Color |
|------|------|
| < 60% | Green |
| 60–85% | Yellow |
| > 85% | Red |

---

## 💰 Revenue Ticker

- Show today’s revenue
- Update in real-time

---

## 📜 Activity Feed

- Show last 20 events:
  - Check-in
  - Check-out
  - Payment

Each item:
- Event type
- Member name
- Gym
- Timestamp

- Auto-scroll enabled

---

## 📊 Summary Bar

- Total occupancy (all gyms)
- Total revenue
- Active anomalies

---

# 📈 Analytics UI

## 🔥 Heatmap

- 7-day peak hours heatmap

---

## 📊 Revenue Chart

- Monthly / Quarterly / Annual
- Filter by date

---

## ⚠️ Churn Risk Panel

- Members inactive 45+ days
- Show:
  - Name
  - Last check-in
  - Risk level

---

## 🍩 New vs Renewal

- Donut chart
- Shows percentage split

---

## 🏆 Cross-Gym Comparison

- Revenue ranking of gyms

---

# 🚨 Anomaly UI

## 📋 Anomaly Table

Columns:
- Gym Name
- Type
- Severity
- Time
- Status

---

## 🔔 Notification Badge

- Shows unread anomalies count

---

## ✋ Dismiss Action

- Only for warning anomalies
- Requires confirmation

---

## 🕒 Resolved State

- Visible for 24 hours
- Then auto-removed

---

# ⚙️ Simulator UI

## 🎮 Controls

- Start
- Pause
- Speed (1x / 5x / 10x)
- Reset

---

# ⚡ Real-Time Behavior

- UI updates instantly via WebSocket:
  - Check-in
  - Check-out
  - Payment
  - Anomalies

- No polling allowed

---

# 🧠 Final Summary

This UI is a **dark-themed real-time dashboard** that shows:

- Live occupancy
- Revenue
- Analytics
- Anomalies

It updates instantly, uses color coding, smooth animations, and looks like a professional operations system.
