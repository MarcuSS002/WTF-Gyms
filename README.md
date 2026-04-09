"# 🏋️ WTF Gyms - Real-Time Gym Analytics Platform

<div align="center">

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg)
![React](https://img.shields.io/badge/React-18+-61DAFB.svg)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)

**Advanced real-time gym analytics, occupancy tracking, and anomaly detection platform**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Documentation](#-documentation)

</div>

---

## 💡 Overview

WTF Gyms is a **production-grade gym management analytics platform** that leverages real-time data streaming, machine learning anomaly detection, and predictive churn analytics. Built with modern web technologies, it provides gym operators with actionable insights into member behavior, peak hours, revenue trends, and operational anomalies.

**Live Dashboard** → Real-time occupancy, revenue, and event monitoring  
**Smart Analytics** → Heatmaps, churn prediction, revenue breakdown  
**Anomaly Detection** → Automatic detection of unusual activity patterns  
**Simulator** → Test and demo platform with realistic data generation

---

## ✨ Features

### 📊 Real-Time Dashboarding
- **Live Occupancy Tracking** - Current occupancy metrics with percentage utilization
- **Revenue Dashboard** - Today's revenue at a glance with formatted currency
- **Socket Status Indicator** - Connection status with pulsing visual feedback
- **Recent Events Feed** - Auto-scrolling activity stream with 20 latest events

### 📈 Advanced Analytics  
- **Peak Hours Heatmap** - Aggregated check-ins by day of week and hour
- **Revenue Breakdown** - Subscription plan analysis (Annual, Monthly, Quarterly)
- **Churn Prediction** - Risk-scored members (45+ days inactive) with severity levels
- **30-Day Trends** - Historical analytics across all metrics

### 🚨 Anomaly Detection
- **Real-Time Detection** - Automatic anomaly identification and logging
- **Severity Levels** - Critical and warning severity classification
- **Status Tracking** - Active/Resolved states with timestamps
- **Active Alerts Table** - Clean, sortable anomaly dashboard

### 🎮 Simulator Controls
- **Data Generation** - Create realistic test scenarios
- **Speed Control** - 1x, 5x, 10x simulation speeds
- **Reset Capability** - Reset simulator state anytime
- **Status Monitoring** - Live simulator status updates

### 🔌 Real-Time Communication
- **WebSocket Events** - Instant check-in/check-out notifications
- **Payment Events** - Revenue updates as they happen
- **Anomaly Alerts** - Immediate notification of detected anomalies
- **Simulator Reset** - Live feed updates on simulator resets

---

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** - For containerized deployment
- **Node.js 18+** - For local development
- **PostgreSQL 15+** - For local database setup

### Installation & Running

#### Using Docker (Recommended)
```bash
# Clone the repository
git clone https://github.com/MarcuSS002/WTF-Gyms.git
cd "WTF Gyms 2"

# Start all services
docker compose up -d

# Access the platforms
frontend:  http://localhost:3000
backend:   http://localhost:3001
database:  localhost:5433
```

#### Local Development
```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Configure environment
cp backend/.env.example backend/.env

# Start services
npm run dev          # Frontend (Vite)
npm run start        # Backend (Express)
npm run migrations   # Run database migrations
```

---

## 🏗️ Architecture

### System Design
```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│  ┌─────────────────────────────────────────────────────┐ │
│  │            React 18 + Vite App                       │ │
│  │  Dashboard │ Analytics │ Anomalies │ Simulator       │ │
│  └──────────────────┬────────────────────────────────┘ │
└─────────────────────┼─────────────────────────────────┘
                      │ HTTP + WebSocket
          ┌───────────┴─────────────┐
          │                         │
    ┌─────▼──────────────┐   ┌──────▼────────────┐
    │  Backend (Node.js)  │   │  WebSocket Server  │
    │  ├─ Gym Routes      │   │  ├─ Events         │
    │  ├─ Analytics       │   │  ├─ Anomalies      │
    │  ├─ Anomalies       │   │  └─ Updates        │
    │  └─ Simulator       │   └───────────────────┘
    └─────┬──────────────┘
          │
    ┌─────▼────────────────────┐
    │   PostgreSQL Database    │
    │  ├─ Members              │
    │  ├─ Gym Data             │
    │  ├─ Check-ins/Outs       │
    │  ├─ Payments             │
    │  ├─ Anomalies            │
    │  └─ Materialized Views    │
    └──────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, Vite, Socket.io | UI, bundling, real-time events |
| **Styling** | CSS Grid/Flexbox | Dark theme, responsive design |
| **Backend** | Node.js, Express.js | API, business logic |
| **Database** | PostgreSQL 15 | Data persistence, analytics |
| **Real-Time** | Socket.io | WebSocket for live updates |
| **Deployment** | Docker Compose | Containerization, orchestration |

---

## 📁 Project Structure

```
WTF Gyms 2/
├── frontend/                      # React application
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── Dashboard.jsx     # Main dashboard page
│   │   │   ├── AnomalyTable.jsx  # Anomaly tracking table
│   │   │   ├── Heatmap.jsx       # Peak hours visualization
│   │   │   ├── Revenue.jsx       # Revenue breakdown
│   │   │   ├── Churn.jsx         # Churn prediction display
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── useAnalytics.js  # Analytics data fetching
│   │   │   ├── useGymData.js    # Gym data management
│   │   │   └── useWebSocket.js  # WebSocket integration
│   │   ├── services/
│   │   │   └── api.js            # API client
│   │   └── styles/
│   │       └── global.css         # Design system
│   └── Dockerfile
│
├── backend/                       # Express.js API
│   ├── src/
│   │   ├── routes/               # API endpoints
│   │   ├── services/             # Business logic
│   │   │   ├── analyticsService.js
│   │   │   ├── anomalyService.js
│   │   │   └── gymService.js
│   │   ├── jobs/                 # Background tasks
│   │   │   ├── anomalyDetector.js
│   │   │   └── simulator.js
│   │   ├── config/               # Configuration
│   │   └── middleware/           # Express middleware
│   ├── db/
│   │   ├── migrations/           # Database schema
│   │   ├── seeds/                # Sample data
│   │   └── pool.js              # Connection pooling
│   ├── tests/                    # Test suites
│   └── Dockerfile
│
├── docs/                         # Documentation
│   ├── API_DOCS.md
│   ├── DATABASE_SCHEMA.md
│   ├── DOCKER_SETUP.md
│   └── ...
│
├── docker-compose.yml            # Multi-container setup
└── README.md                      # This file
```

---

## 🔗 API Endpoints

### Gym Management
```
GET    /api/gyms              # List all gyms
GET    /api/gyms/:id         # Get gym details
GET    /api/gyms/:id/analytics?dateRange=30d  # Analytics data
```

### Anomalies
```
GET    /api/anomalies        # List all anomalies
GET    /api/anomalies/active # Active anomalies only
POST   /api/anomalies        # Report anomaly
```

### Simulator
```
POST   /api/simulator/start   # Start simulator
POST   /api/simulator/stop    # Stop simulator
POST   /api/simulator/reset   # Reset simulator
GET    /api/simulator/status  # Simulator status
```

### Data Models

**Gym**
```json
{
  "id": "uuid",
  "name": "string",
  "occupancy": "number",
  "today_revenue": "number",
  "total_members": "number",
  "recent_events": []
}
```

**Anomaly**
```json
{
  "id": "uuid",
  "gym_id": "uuid",
  "type": "string",
  "severity": "critical|warning",
  "detected_at": "timestamp",
  "resolved": "boolean"
}
```

---

## 🎨 Design System

### Color Palette
- **Primary Background**: `#0D0D1A` - Deep navy
- **Card Background**: `#1A1A2E` - Dark purple-gray
- **Accent (Teal)**: `#14B8A6` - Primary interactive color
- **Success (Green)**: `#22C55E` - Positive indicators
- **Warning (Yellow)**: `#F59E0B` - Alerts
- **Critical (Red)**: `#EF4444` - Errors/Critical alerts

### Typography
- **Headings**: Sora (Bold, 16px)
- **Body**: Inter (Regular, 13px)
- **Data/Code**: JetBrains Mono (12px)

### Components
- **Cards**: Gradient background, hover effects, subtle shadows
- **Buttons**: Teal accent, uppercase labels, smooth transitions
- **Tables**: Clean borders, row hover states, color-coded badges
- **Badges**: Status indicators with borders and background opacity

---

## 🧪 Testing

### Frontend
```bash
cd frontend
npm run test              # Run unit tests
npm run test:e2e          # Run E2E tests (Playwright)
npm run test:coverage     # Coverage report
```

### Backend
```bash
cd backend
npm run test              # Run tests
npm run test:integration  # Integration tests
```

---

## 📊 Database Schema Highlights

### Key Tables
- **members** - Gym member profiles
- **gyms** - Gym locations and metadata
- **checkins** - Entry/exit records with timestamps
- **payments** - Revenue transactions
- **anomalies** - Detected anomalies with severity
- **simulator_events** - Test data generation logs

### Materialized Views
- **gym_hourly_stats** - Aggregated check-ins by hour/day for heatmap
- **member_churn_risk** - Churn scoring (inactive 45+ days)

---

## 🚀 Deployment

### Docker Compose
```bash
# Build all services
docker compose build

# Start services
docker compose up -d

# View logs
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f db

# Stop services
docker compose down
```

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Seeds loaded
- [ ] WebSocket connections verified
- [ ] SSL/TLS configured
- [ ] Rate limiting enabled

---

## 📝 Documentation

- **[API Docs](./docs/API_DOCS.md)** - Complete API reference
- **[Database Schema](./docs/DATABASE_SCHEMA.md)** - ER diagrams and schema details
- **[Docker Setup](./docs/DOCKER_SETUP.md)** - Container configuration
- **[Frontend Guide](./docs/FRONTEND.md)** - UI components and design
- **[Backend Overview](./docs/BACKEND_OVERVIEW.md)** - Architecture and services

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Standards
- Use semantic commits (feat:, fix:, docs:, etc.)
- Add tests for new features
- Follow existing code style
- Update documentation as needed

---

## 📦 Dependencies

### Frontend
- React 18.2+
- Vite 5.4+
- Socket.io Client
- CSS (Grid, Flexbox)

### Backend
- Express.js 4.18+
- PostgreSQL Client (pg)
- Socket.io
- Node.js 18+

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Author

**Marcus S** - [@MarcuSS002](https://github.com/MarcuSS002)

---

## 📞 Support

For issues and questions:
1. Check [existing issues](https://github.com/MarcuSS002/WTF-Gyms/issues)
2. Review [documentation](./docs/)
3. Create a new issue with detailed information

---

<div align="center">

**[⬆ Back to Top](#-wtf-gyms---real-time-gym-analytics-platform)**

Made with ❤️ for gym operators and data enthusiasts

</div>" 
