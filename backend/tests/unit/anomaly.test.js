const db = require('../../src/db/pool');
const socket = require('../../src/websocket/socket');

jest.mock('../../src/db/pool');
jest.mock('../../src/websocket/socket');

const detector = require('../../src/jobs/anomalyDetector');

describe('anomalyDetector.detectOnce', () => {
  beforeEach(() => {
    db.query.mockReset();
    socket.emitEvent = jest.fn();
  });

  test('inserts capacity_breach anomaly when occupancy > 90%', async () => {
    // Mock sequence of queries made by detectOnce for one gym
    db.query.mockImplementation((sql, params) => {
      if (sql.includes("FROM gyms WHERE status = 'active'")) {
        return Promise.resolve({ rows: [{ id: 'gym1', name: 'G1', capacity: 100, status: 'active' }] });
      }
      if (sql.includes('COUNT(*) AS count') && sql.includes('checked_out IS NULL')) {
        // occupancy query -> 95
        return Promise.resolve({ rows: [{ count: 95 }] });
      }
      if (sql.includes("checked_in >= NOW() - INTERVAL '2 hours'")) {
        return Promise.resolve({ rows: [{ cnt: 1 }] });
      }
      if (sql.includes('FROM payments') && sql.includes('CURRENT_DATE')) {
        return Promise.resolve({ rows: [{ total: 0 }] });
      }
      if (sql.startsWith('SELECT id FROM anomalies')) {
        return Promise.resolve({ rows: [] });
      }
      if (sql.startsWith('INSERT INTO anomalies')) {
        return Promise.resolve({ rows: [{ id: 'a1', detected_at: new Date().toISOString() }] });
      }
      return Promise.resolve({ rows: [] });
    });

    await detector.detectOnce();

    // Expect an INSERT into anomalies occurred
    const insertCall = db.query.mock.calls.find(c => c[0].startsWith('INSERT INTO anomalies'));
    expect(insertCall).toBeTruthy();

    // Expect a websocket ANOMALY_DETECTED emitted
    expect(socket.emitEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'ANOMALY_DETECTED' }));
  });
});
