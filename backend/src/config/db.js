// Database configuration derived from project docs and environment
const DEFAULTS = {
  user: 'wtf',
  password: 'wtf_secret',
  host: 'db',
  port: 5432,
  database: 'wtf_livepulse',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
};

function buildConnectionString(env = process.env) {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  const user = env.PGUSER || env.POSTGRES_USER || DEFAULTS.user;
  const password = env.PGPASSWORD || env.POSTGRES_PASSWORD || DEFAULTS.password;
  const host = env.PGHOST || env.POSTGRES_HOST || DEFAULTS.host;
  const port = env.PGPORT || env.POSTGRES_PORT || DEFAULTS.port;
  const database = env.PGDATABASE || env.POSTGRES_DB || DEFAULTS.database;
  return `postgres://${user}:${password}@${host}:${port}/${database}`;
}

module.exports = {
  DEFAULTS,
  buildConnectionString,
  poolConfig: {
    max: Number(process.env.PG_MAX_CLIENTS) || DEFAULTS.max,
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS) || DEFAULTS.idleTimeoutMillis,
    // allow longer for initial container setups
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS) || 20000,
    connectionString: buildConnectionString(),
  },
};
