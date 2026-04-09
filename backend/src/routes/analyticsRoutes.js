const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');

router.get('/cross-gym', async (req, res) => {
  try {
    const rows = await analyticsService.crossGymRevenue();
    res.json(rows);
  } catch (err) {
    console.error('GET /api/analytics/cross-gym', err);
    res.status(500).json({ error: 'internal' });
  }
});

module.exports = router;
