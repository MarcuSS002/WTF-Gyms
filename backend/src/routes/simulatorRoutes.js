const express = require('express');
const router = express.Router();
const simulator = require('../jobs/simulator');

router.post('/start', async (req, res) => {
  try {
    const rawSpeed = req.body && req.body.speed != null ? req.body.speed : req.query.speed;
    const speed = Number(rawSpeed);
    const out = await simulator.start(null, speed);
    res.json(out);
  } catch (err) {
    console.error('POST /api/simulator/start', err);
    res.status(500).json({ error: 'internal' });
  }
});

router.post('/stop', (req, res) => {
  try {
    const out = simulator.stop();
    res.json(out);
  } catch (err) {
    console.error('POST /api/simulator/stop', err);
    res.status(500).json({ error: 'internal' });
  }
});

router.post('/reset', async (req, res) => {
  try {
    const out = await simulator.reset();
    res.json(out);
  } catch (err) {
    console.error('POST /api/simulator/reset', err);
    res.status(500).json({ error: 'internal' });
  }
});

router.get('/status', (req, res) => {
  try {
    const out = simulator.status();
    res.json(out);
  } catch (err) {
    console.error('GET /api/simulator/status', err);
    res.status(500).json({ error: 'internal' });
  }
});

module.exports = router;
