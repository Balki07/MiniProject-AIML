// src/models/userModel.js
const { query } = require('../config/db');

const userModel = {
  /** Find user by email */
  async findByEmail(email) {
    const res = await query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0] || null;
  },

  /** Find user by ID (safe — no password) */
  async findById(id) {
    const res = await query(
      'SELECT id, name, email, phone, role, is_verified, trust_level, ad_count, approved_count, created_at FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  },

  /** Create a new user */
  async create({ name, email, phone, passwordHash }) {
    const res = await query(
      `INSERT INTO users (name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone, role, is_verified, trust_level, created_at`,
      [name, email, phone || null, passwordHash]
    );
    return res.rows[0];
  },

  /** Update profile fields */
  async updateProfile(id, { name, phone }) {
    const res = await query(
      `UPDATE users SET name=$1, phone=$2, updated_at=NOW() WHERE id=$3
       RETURNING id, name, email, phone, role, is_verified, trust_level`,
      [name, phone, id]
    );
    return res.rows[0];
  },

  /** Update trust level */
  async updateTrustLevel(id, trustLevel) {
    await query(
      'UPDATE users SET trust_level=$1, updated_at=NOW() WHERE id=$2',
      [Math.max(0, Math.min(100, trustLevel)), id]
    );
  },

  /** Mark user as verified */
  async verify(id) {
    await query('UPDATE users SET is_verified=TRUE, updated_at=NOW() WHERE id=$1', [id]);
  },

  /** Increment ad_count and optionally approved_count */
  async incrementAdStats(id, { incrementApproved = false }) {
    await query(
      `UPDATE users SET
         ad_count = ad_count + 1,
         approved_count = approved_count + $1,
         updated_at = NOW()
       WHERE id = $2`,
      [incrementApproved ? 1 : 0, id]
    );
  },

  /** Admin: get all users with pagination */
  async getAll({ limit = 20, offset = 0 }) {
    const res = await query(
      `SELECT id, name, email, phone, role, is_verified, trust_level, ad_count, approved_count, created_at
       FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return res.rows;
  },

  /** Admin: total user count */
  async count() {
    const res = await query('SELECT COUNT(*) FROM users');
    return parseInt(res.rows[0].count, 10);
  },
};

module.exports = userModel;
