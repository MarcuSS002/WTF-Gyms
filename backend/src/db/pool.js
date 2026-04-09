const { Pool } = require('pg');
const { poolConfig } = require('../config/db');

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  // Let the process crash so orchestrator can restart it
  process.exit(1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
