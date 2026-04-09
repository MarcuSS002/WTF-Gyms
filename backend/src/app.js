const express = require('express');
const cors = require('cors');
const http = require('http');
const app = express();
app.use(express.json());
// allow cross-origin requests from the frontend dev server
app.use(cors());

const gymRoutes = require('./routes/gymRoutes');
const anomaliesRoutes = require('./routes/anomaliesRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const simulatorRoutes = require('./routes/simulatorRoutes');
const setupSocket = require('./websocket/socket');
const simulator = require('./jobs/simulator');
const anomalyDetector = require('./jobs/anomalyDetector');
const db = require('./db/pool');
const dbConfig = require('./config/db');

async function waitForDb({ retries = 60, delay = 3000 } = {}) {
  let lastErr = null;
  for (let i = 0; i < retries; i++) {
    try {
      await db.query('SELECT 1');
      return true;
    } catch (err) {
      lastErr = err;
      // show minimal connection info for debugging (mask password)
      const conn = dbConfig.buildConnectionString();
      const masked = conn.replace(/:(.*?)@/, ':***@');
      console.log(`DB ping failed (${i + 1}/${retries}) to ${masked}, retrying in ${delay}ms - ${err && err.message ? err.message : ''}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  const msg = lastErr && lastErr.message ? `${lastErr.message}` : 'Database not reachable after retries';
  throw new Error(msg);
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/gyms', gymRoutes);
app.use('/api/anomalies', anomaliesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/simulator', simulatorRoutes);

const port = process.env.PORT || 3001;
const server = http.createServer(app);

// attach websocket
const io = setupSocket(server);

// Only start the server and background jobs when run directly (not when required by tests)
if (require.main === module) {
  (async () => {
    try {
      await waitForDb();
      server.listen(port, () => console.log(`Backend listening on ${port}`));

      if (process.env.SIMULATOR !== 'off') {
        simulator.start(io).catch(err => console.error('Simulator failed', err));
      }
      if (process.env.ANOMALY_DETECTOR !== 'off') {
        anomalyDetector.start().catch(err => console.error('Anomaly detector failed', err));
      }
    } catch (err) {
      console.error('Server startup failed:', err.message || err);
      process.exit(1);
    }
  })();
}

module.exports = { app, server, io };
