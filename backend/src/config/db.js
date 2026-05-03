const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: '34.206.177.121',       
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_P1oDcGqx6BOk',
  ssl: { rejectUnauthorized: false },
  options: 'endpoint=ep-sweet-firefly-am61rekg', 
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Connected to Neon PostgreSQL');
  }
});

pool.on('error', (err) => {
  console.error('Unexpected DB error:', err.message);
});

/**
 * Execute a parameterized SQL query
 * @param {string} text   - SQL with $1, $2 placeholders
 * @param {Array}  params - Values array
 */
const query = (text, params) => pool.query(text, params);

module.exports = { query, pool };
