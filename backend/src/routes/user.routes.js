// src/routes/user.routes.js
const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { getProfile, updateProfile } = require('../controllers/userController');

const router = express.Router();
router.use(protect);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
module.exports = router;
