Folder structure : 
📦 Root Structure
wtf-livepulse/
│
├── docker-compose.yml
├── .env.example
├── README.md
│
├── backend/
├── frontend/
├── benchmarks/
└── .gitignore
⚙️ Backend Structure
backend/
│
├── Dockerfile
├── package.json
├── package-lock.json
├── .env
│
├── src/
│   ├── app.js
│
│   ├── config/
│   │   ├── db.js
│   │   └── constants.js
│
│   ├── routes/
│   │   ├── gymRoutes.js
│   │   ├── analyticsRoutes.js
│   │   ├── anomalyRoutes.js
│   │   └── simulatorRoutes.js
│
│   ├── controllers/
│   │   ├── gymController.js
│   │   ├── analyticsController.js
│   │   ├── anomalyController.js
│   │   └── simulatorController.js
│
│   ├── services/
│   │   ├── gymService.js
│   │   ├── analyticsService.js
│   │   ├── anomalyService.js
│   │   └── simulatorService.js
│
│   ├── db/
│   │   ├── pool.js
│   │   │
│   │   ├── migrations/
│   │   │   ├── 001_init.sql
│   │   │   ├── 002_indexes.sql
│   │   │   └── 003_views.sql
│   │   │
│   │   └── seeds/
│   │       ├── seed.sql
│   │       └── seed.js
│
│   ├── jobs/
│   │   ├── anomalyDetector.js
│   │   └── simulator.js
│
│   ├── websocket/
│   │   ├── socket.js
│   │   └── events.js
│
│   ├── utils/
│   │   ├── timeUtils.js
│   │   ├── queryUtils.js
│   │   └── logger.js
│
│   └── middleware/
│       ├── errorHandler.js
│       └── validate.js
│
├── tests/
│   ├── unit/
│   │   ├── anomaly.test.js
│   │   └── simulator.test.js
│   │
│   └── integration/
│       ├── gym.test.js
│       ├── analytics.test.js
│       └── anomaly.test.js
🎨 Frontend Structure
frontend/
│
├── Dockerfile
├── package.json
│
├── src/
│   ├── main.jsx
│
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── OccupancyCard.jsx
│   │   ├── RevenueCard.jsx
│   │   ├── ActivityFeed.jsx
│   │   ├── Heatmap.jsx
│   │   ├── Charts.jsx
│   │   ├── AnomalyTable.jsx
│   │   └── SimulatorControls.jsx
│
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Analytics.jsx
│   │   └── Anomalies.jsx
│
│   ├── hooks/
│   │   ├── useWebSocket.js
│   │   ├── useGymData.js
│   │   └── useAnomalies.js
│
│   ├── store/
│   │   └── store.js
│
│   ├── services/
│   │   └── api.js
│
│   ├── styles/
│   │   └── global.css
│
│   └── utils/
│       └── format.js
│
├── tests/
│   └── e2e.spec.js
|--benchmarks/ 
    └── screenshots/