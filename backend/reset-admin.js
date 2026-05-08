// Script to reset admin account with correct password hash
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function resetAdmin() {
  try {
    const hash = await bcrypt.hash('Admin@123456', 10);
    console.log('Generated hash for Admin@123456:', hash);

    // Remove old broken admin
    await pool.query('DELETE FROM users WHERE email = $1', ['admin@adexpress.com']);

    // Insert fresh admin with correct hash
    const res = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, is_verified, trust_level)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, role, is_verified`,
      ['Platform Admin', 'admin@adexpress.com', hash, 'admin', true, 100]
    );

    console.log('✅ Admin account created successfully!');
    console.log('   Email:', res.rows[0].email);
    console.log('   Role:', res.rows[0].role);
    console.log('   Verified:', res.rows[0].is_verified);
    console.log('\n   Login with:');
    console.log('   Email:    admin@adexpress.com');
    console.log('   Password: Admin@123456');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

resetAdmin();
