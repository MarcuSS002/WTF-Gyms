const BASE = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:3001/api';

export const fetchGyms = async () => {
	const res = await fetch(`${BASE}/gyms`);
	if (!res.ok) throw new Error('failed');
	return res.json();
};

export const fetchGymLive = async (id) => {
	const res = await fetch(`${BASE}/gyms/${id}/live`);
	if (!res.ok) throw new Error('failed');
	return res.json();
};

export const fetchGymAnalytics = async (id, dateRange = '30d') => {
	const res = await fetch(`${BASE}/gyms/${id}/analytics?dateRange=${encodeURIComponent(dateRange)}`);
	if (!res.ok) throw new Error('failed');
	return res.json();
};

export const fetchAnomalies = async () => {
	const res = await fetch(`${BASE}/anomalies`);
	if (!res.ok) throw new Error('failed');
	return res.json();
};

export const startSimulator = async (speed = 1) => {
	const res = await fetch(`${BASE}/simulator/start`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ speed }),
	});
	if (!res.ok) throw new Error('failed');
	return res.json();
};

export const stopSimulator = async () => {
	const res = await fetch(`${BASE}/simulator/stop`, { method: 'POST' });
	if (!res.ok) throw new Error('failed');
	return res.json();
};

export const resetSimulator = async () => {
	const res = await fetch(`${BASE}/simulator/reset`, { method: 'POST' });
	if (!res.ok) throw new Error('failed');
	return res.json();
};

export const getSimulatorStatus = async () => {
	const res = await fetch(`${BASE}/simulator/status`);
	if (!res.ok) throw new Error('failed');
	return res.json();
};
