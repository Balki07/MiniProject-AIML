// src/middleware/rbac.middleware.js

/**
 * RBAC guard — only allow admins
 * Must be used AFTER the protect middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  next();
};

module.exports = { requireAdmin };
