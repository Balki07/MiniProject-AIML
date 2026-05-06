// src/routes/auth.routes.js
const express = require('express');
const { body } = require('express-validator');
const { register, login, me, verifyOtp, resendOtp, googleAuth } = require('../controllers/authController');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
], register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
], login);

router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits').isNumeric(),
], verifyOtp);

router.post('/resend-otp', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
], resendOtp);

router.post('/google', [
  body('credential').notEmpty().withMessage('Google credential is required'),
], googleAuth);

router.get('/me', protect, me);

module.exports = router;
