// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // We need to define this next
const authMiddleware = require('../middleware/authMiddleware');

// Get all farmers for monitoring
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] } // Security: never send passwords to frontend
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Server error fetching users' });
  }
});

// Update user status (Block/Activate)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    user.status = req.body.status; // 'Active' or 'Blocked'
    await user.save();
    res.json({ msg: `User status updated to ${user.status}` });
  } catch (err) {
    res.status(500).json({ msg: 'Update failed' });
  }
});

module.exports = router;