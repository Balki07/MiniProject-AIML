// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const userModel = require('../models/userModel');
const { signToken } = require('../config/jwt');
const { sendWelcomeEmail, sendOtpEmail } = require('../services/emailService');

// Google Auth — loaded lazily so the server still starts if google-auth-library is not installed
let OAuth2Client;
try {
  ({ OAuth2Client } = require('google-auth-library'));
} catch {
  // Package not installed — Google Sign-In will return an error gracefully
}
const getGoogleClient = () => (OAuth2Client ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null);

/** Generate a cryptographically random 6-digit OTP */
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// ─────────────────────────────────────────────────────────────────────────────
/** POST /api/auth/register */
// ─────────────────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phone, password } = req.body;

  try {
    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userModel.create({ name, email, phone, passwordHash });

    // Generate OTP and save to DB
    const otp = generateOtp();
    await userModel.setVerificationToken(user.id, otp);

    // Send OTP email (non-blocking on failure)
    sendOtpEmail({ to: user.email, userName: user.name, otp }).catch((err) => {
      console.error('[Email] OTP email failed:', err.message);
    });

    // Do NOT issue JWT yet — user must verify email first
    return res.status(201).json({
      requiresVerification: true,
      email: user.email,
      message: 'Account created. Please check your email for the 6-digit verification code.',
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
/** POST /api/auth/verify-otp */
// ─────────────────────────────────────────────────────────────────────────────
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required.' });
  }

  try {
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    if (user.email_verified) {
      // Already verified — just issue JWT
      const { password_hash, ...safeUser } = user;
      const token = signToken({ id: user.id, email: user.email, role: user.role });
      return res.json({ user: safeUser, token, alreadyVerified: true });
    }

    // Check OTP matches and is not expired
    if (
      !user.email_verification_token ||
      user.email_verification_token !== String(otp).trim() ||
      new Date(user.email_verification_expires) < new Date()
    ) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    // Mark email as verified
    await userModel.verifyEmail(user.id);

    // Send welcome email after successful verification
    sendWelcomeEmail({ to: user.email, userName: user.name }).catch((err) => {
      console.error('[Email] Welcome email failed:', err.message);
    });

    // Fetch fresh user record (has email_verified: true now)
    const freshUser = await userModel.findById(user.id);
    const { password_hash, ...safeUser } = { ...user, ...freshUser };
    const token = signToken({ id: user.id, email: user.email, role: user.role });

    return res.json({
      user: safeUser,
      token,
      message: 'Email verified successfully! Welcome to JBAdX.',
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
/** POST /api/auth/resend-otp */
// ─────────────────────────────────────────────────────────────────────────────
const resendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    if (user.email_verified) {
      return res.status(400).json({ error: 'This email is already verified.' });
    }

    const otp = generateOtp();
    await userModel.setVerificationToken(user.id, otp);

    sendOtpEmail({ to: user.email, userName: user.name, otp }).catch((err) => {
      console.error('[Email] Resend OTP failed:', err.message);
    });

    return res.json({ message: 'A new verification code has been sent to your email.' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({ error: 'Failed to resend code. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
/** POST /api/auth/login */
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // If email is not verified, block login and ask them to verify
    if (!user.email_verified) {
      // Re-send a fresh OTP to help them get in
      const otp = generateOtp();
      await userModel.setVerificationToken(user.id, otp);
      sendOtpEmail({ to: user.email, userName: user.name, otp }).catch(() => {});

      return res.status(403).json({
        error: 'Please verify your email before logging in.',
        requiresVerification: true,
        email: user.email,
      });
    }

    const { password_hash, ...safeUser } = user;
    const token = signToken({ id: safeUser.id, email: safeUser.email, role: safeUser.role });
    return res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
/** POST /api/auth/google */
// ─────────────────────────────────────────────────────────────────────────────
const googleAuth = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Google credential token is required.' });
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Google Sign-In is not configured on this server.' });
  }

  const googleClient = getGoogleClient();
  if (!googleClient) {
    return res.status(500).json({ error: 'Google Sign-In package not installed on server. Run: npm install google-auth-library' });
  }

  try {
    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({ error: 'Google account email is not verified.' });
    }

    // Check if user already exists by Google ID
    let user = await userModel.findByGoogleId(googleId);
    let isNewUser = false;

    if (!user) {
      // Check if an account with this email already exists (email/password user)
      const existingByEmail = await userModel.findByEmail(email);
      if (existingByEmail) {
        // Link Google ID to the existing account
        user = await userModel.createGoogleUser({ name: existingByEmail.name, email, googleId });
      } else {
        // Brand new user — create account
        user = await userModel.createGoogleUser({ name, email, googleId });
        isNewUser = true;

        // Send welcome email for new Google users
        sendWelcomeEmail({ to: email, userName: name }).catch((err) => {
          console.error('[Email] Google welcome email failed:', err.message);
        });
      }
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    return res.json({
      user,
      token,
      isNewUser,
      message: isNewUser ? 'Account created via Google!' : 'Signed in with Google.',
    });
  } catch (err) {
    console.error('[Google Auth] verifyIdToken failed:', err.message, err.stack);
    return res.status(401).json({
      error: 'Invalid Google credential. Please try again.',
      debug: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
/** GET /api/auth/me - returns current user from token */
// ─────────────────────────────────────────────────────────────────────────────
const me = async (req, res) => {
  return res.json({ user: req.user });
};

module.exports = { register, login, me, verifyOtp, resendOtp, googleAuth };
