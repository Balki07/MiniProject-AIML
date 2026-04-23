// src/routes/report.routes.js
const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth.middleware');
const { submitReport } = require('../controllers/reportController');

const router = express.Router();

router.post('/', protect, [
  body('ad_id').notEmpty().withMessage('Ad ID required'),
  body('reason').notEmpty().withMessage('Reason required')
    .isIn(['Scam', 'Spam', 'Inappropriate', 'Misleading', 'Duplicate', 'Other'])
    .withMessage('Invalid reason'),
  body('details').optional().trim().isLength({ max: 500 }),
], submitReport);

module.exports = router;
