// src/routes/admin.routes.js
const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/rbac.middleware');
const {
  getAdsByStatus, moderateAd, verifyUser, getAnalytics, getReports, getUsers,
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require auth + admin role
router.use(protect, requireAdmin);

router.get('/analytics', getAnalytics);
router.get('/ads', getAdsByStatus);
router.put('/ads/:id/status', moderateAd);
router.get('/reports', getReports);
router.get('/users', getUsers);
router.post('/users/:id/verify', verifyUser);

module.exports = router;
