const request = require('supertest');
const db = require('../../src/db/pool');

jest.mock('../../src/db/pool');

const appModule = require('../../src/app');
const app = appModule.app || appModule;

describe('GET /api/gyms and /api/anomalies', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  test('GET /api/gyms returns gyms with expected fields', async () => {
    // Mock getGyms SQL
    db.query.mockImplementation((sql, params) => {
      if (sql.includes('SELECT g.id')) {
        return Promise.resolve({ rows: [{ id: 'g1', name: 'Gym One', city: 'City', capacity: 200, status: 'active', current_occupancy: 50, today_revenue: 1200 }] });
      }
      return Promise.resolve({ rows: [] });
    });

    const res = await request(app).get('/api/gyms');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ id: 'g1', name: 'Gym One', city: 'City', capacity: 200, status: 'active' });
    expect(res.body[0]).toHaveProperty('current_occupancy');
    expect(res.body[0]).toHaveProperty('capacity_pct');
  });

  test('GET /api/anomalies returns anomalies with gym_name', async () => {
    db.query.mockImplementation((sql, params) => {
      if (sql.startsWith('SELECT a.id')) {
        return Promise.resolve({ rows: [{ id: 'a1', gym_id: 'g1', gym_name: 'Gym One', type: 'capacity_breach', severity: 'critical', message: 'Capacity exceeded', resolved: false, detected_at: new Date().toISOString() }] });
      }
      return Promise.resolve({ rows: [] });
    });

    const res = await request(app).get('/api/anomalies');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ id: 'a1', gym_name: 'Gym One', type: 'capacity_breach', severity: 'critical' });
  });
});
