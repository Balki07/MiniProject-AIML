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
      'SELECT id, name, email, phone, company, address, bio, role, is_verified, trust_level, ad_count, approved_count, created_at FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  },

  /** Create a new user */
  async create({ name, email, phone, passwordHash }) {
    const res = await query(
      `INSERT INTO users (name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone, company, address, bio, role, is_verified, trust_level, created_at`,
      [name, email, phone || null, passwordHash]
    );
    return res.rows[0];
  },

  /** Update profile fields */
  async updateProfile(id, { name, phone, company, address, bio }) {
    const res = await query(
      `UPDATE users SET name=$1, phone=$2, company=$3, address=$4, bio=$5, updated_at=NOW() WHERE id=$6
       RETURNING id, name, email, phone, company, address, bio, role, is_verified, trust_level, email_verified`,
      [name, phone, company, address, bio, id]
    );
    return res.rows[0];
  },

  /** Save a 6-digit OTP token against a user */
  async setVerificationToken(id, token) {
    // Token expires in 15 minutes
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await query(
      `UPDATE users SET email_verification_token=$1, email_verification_expires=$2 WHERE id=$3`,
      [token, expires, id]
    );
  },

  /** Find user by the OTP token (only if not expired) */
  async findByVerificationToken(token) {
    const res = await query(
      `SELECT * FROM users WHERE email_verification_token=$1 AND email_verification_expires > NOW()`,
      [token]
    );
    return res.rows[0] || null;
  },

  /** Mark email as verified and clear OTP fields */
  async verifyEmail(id) {
    await query(
      `UPDATE users SET email_verified=TRUE, email_verification_token=NULL, email_verification_expires=NULL, updated_at=NOW() WHERE id=$1`,
      [id]
    );
  },

  /** Find user by Google ID */
  async findByGoogleId(googleId) {
    const res = await query(
      `SELECT id, name, email, phone, company, address, bio, role, is_verified, trust_level, email_verified, google_id FROM users WHERE google_id = $1`,
      [googleId]
    );
    return res.rows[0] || null;
  },

  /** Create user via Google OAuth (no password, pre-verified) */
  async createGoogleUser({ name, email, googleId }) {
    const res = await query(
      `INSERT INTO users (name, email, google_id, email_verified, role)
       VALUES ($1, $2, $3, TRUE, 'user')
       ON CONFLICT (email) DO UPDATE
         SET google_id = EXCLUDED.google_id,
             email_verified = TRUE,
             updated_at = NOW()
       RETURNING id, name, email, phone, company, address, bio, role, is_verified, trust_level, email_verified, google_id`,
      [name, email, googleId]
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
