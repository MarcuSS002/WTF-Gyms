const express = require('express');
const router = express.Router();
const gymService = require('../services/gymService');
const analyticsService = require('../services/analyticsService');
const socketModule = require('../websocket/socket');

router.get('/', async (req, res) => {
	try {
		const gyms = await gymService.getGyms();
		res.json(gyms);
	} catch (err) {
		console.error('GET /api/gyms error', err);
		res.status(500).json({ error: 'internal' });
	}
});

router.get('/:id/live', async (req, res) => {
	try {
		const data = await gymService.getGymLive(req.params.id);
		res.json(data);
	} catch (err) {
		console.error('GET /api/gyms/:id/live error', err);
		res.status(500).json({ error: 'internal' });
	}
});

router.get('/:id/analytics', async (req, res) => {
	try {
		const data = await analyticsService.getGymAnalytics(req.params.id, req.query.dateRange || '30d');
		res.json(data);
	} catch (err) {
		console.error('GET /api/gyms/:id/analytics error', err);
		res.status(500).json({ error: 'Failed to load analytics' });
	}
});

router.get('/:id/occupancy', async (req, res) => {
	try {
		const data = await gymService.getLiveOccupancy(req.params.id);
		res.json(data);
	} catch (err) {
		console.error('GET /api/gyms/:id/occupancy error', err);
		res.status(500).json({ error: 'internal' });
	}
});

module.exports = router;
