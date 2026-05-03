// src/controllers/userController.js
const userModel = require('../models/userModel');

/** GET /api/users/profile */
const getProfile = async (req, res) => res.json({ user: req.user });

/** PUT /api/users/profile */
const updateProfile = async (req, res) => {
  const { name, phone, company, address, bio } = req.body;
  try {
    const user = await userModel.updateProfile(req.user.id, { name, phone, company, address, bio });
    return res.json({ user });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
};

module.exports = { getProfile, updateProfile };
