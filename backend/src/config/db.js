const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const databaseUrl = process.env.DATABASE_URL || '';
const isSupabaseHost = /supabase\.co/i.test(databaseUrl);

if (isSupabaseHost && !/\b(db\.|pooler\.)/i.test(databaseUrl)) {
  console.warn(
    'DATABASE_URL looks like a Supabase connection string, but the host does not look like a Supabase database host. Use the exact URI from Supabase Settings → Database → Connection string.'
  );
}

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Connected to PostgreSQL database');
  }
});

pool.on('error', (err) => {
  if (err && err.message && /getaddrinfo ENOTFOUND/i.test(err.message)) {
    console.error(
      'Database host could not be resolved. Check your DATABASE_URL in backend/.env and copy the exact Supabase connection string from the dashboard.'
    );
    return;
  }

  console.error('Unexpected DB error:', err.message);
});

/**
 * Execute a parameterized SQL query
 * @param {string} text   - SQL with $1, $2 placeholders
 * @param {Array}  params - Values array
 */
const query = (text, params) => pool.query(text, params);

module.exports = { query, pool };
