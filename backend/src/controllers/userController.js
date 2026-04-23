// src/controllers/userController.js
const userModel = require('../models/userModel');

/** GET /api/users/profile */
const getProfile = async (req, res) => res.json({ user: req.user });

/** PUT /api/users/profile */
const updateProfile = async (req, res) => {
  const { name, phone } = req.body;
  try {
    const user = await userModel.updateProfile(req.user.id, { name, phone });
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
};

module.exports = { getProfile, updateProfile };
