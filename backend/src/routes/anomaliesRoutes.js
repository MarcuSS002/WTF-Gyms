const express = require('express');
const router = express.Router();
const anomalyService = require('../services/anomalyService');
const anomalyDetector = require('../jobs/anomalyDetector');

router.get('/', async (req, res) => {
  try {
    const { gym_id, severity, include_resolved } = req.query;
    const rows = await anomalyService.list({ gym_id, severity, include_resolved: include_resolved === 'true' });
    res.json(rows);
  } catch (err) {
    console.error('GET /api/anomalies', err);
    res.status(500).json({ error: 'internal' });
  }
});

router.patch('/:id/dismiss', async (req, res) => {
  try {
    const id = req.params.id;
    const out = await anomalyService.dismiss(id);
    res.json(out);
  } catch (err) {
    if (err && err.code === 'forbidden') return res.status(403).json({ error: 'Cannot dismiss critical anomaly' });
    console.error('PATCH /api/anomalies/:id/dismiss', err);
    res.status(500).json({ error: 'internal' });
  }
});

module.exports = router;

// Debug endpoint to trigger detector manually (not for production)
router.post('/debug/run-detector', async (req, res) => {
  try {
    await anomalyDetector.detectOnce();
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('POST /api/anomalies/debug/run-detector', err);
    res.status(500).json({ error: err.message || 'detector_error' });
  }
});
