// src/routes/admin.routes.js
const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/rbac.middleware');
const {
  getAdsByStatus, moderateAd, verifyUser, getAnalytics, getReports, getUsers, getVerificationPreview,
  getLayoutDepartments, createLayoutDepartment, getLayoutDraft, saveLayoutDraft, publishLayout, getApprovalReport, getAdHistory,
  regenerateSingleReport, regenerateAllReports,
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require auth + admin role
router.use(protect, requireAdmin);

router.get('/analytics', getAnalytics);
router.get('/ads', getAdsByStatus);
router.get('/ads/:id/verification-preview', getVerificationPreview);
router.get('/ads/:id/report', getApprovalReport);
router.post('/ads/:id/regenerate-report', regenerateSingleReport);
router.get('/ads/history', getAdHistory);
router.post('/regenerate-all-reports', regenerateAllReports);
router.put('/ads/:id/status', moderateAd);
router.get('/reports', getReports);
router.get('/users', getUsers);
router.post('/users/:id/verify', verifyUser);

router.get('/layout/departments', getLayoutDepartments);
router.post('/layout/departments', createLayoutDepartment);
router.get('/layout/:departmentSlug/draft', getLayoutDraft);
router.put('/layout/:departmentSlug/draft', saveLayoutDraft);
router.post('/layout/:departmentSlug/publish', publishLayout);

module.exports = router;
