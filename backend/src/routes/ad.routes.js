// src/routes/ad.routes.js
const express = require('express');
const { body } = require('express-validator');
const { createAd, getFeed, getMyAds, getAdById, trackClick } = require('../controllers/adController');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');

const router = express.Router();

// Public
router.get('/', getFeed);
router.get('/:id', getAdById);
router.post('/:id/click', trackClick);

// Protected
router.post('/', protect, upload.single('image'), [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isIn(['Jobs','Services','Business','Events','Real Estate','Other'])
    .withMessage('Invalid category'),
  body('location').optional().trim(),
], createAd);

router.get('/user/my', protect, getMyAds);

module.exports = router;
