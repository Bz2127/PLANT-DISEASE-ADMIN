// server/controllers/adminController.js 
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Mobile Farmer Registration via Phone Number
// @route   POST /api/users/register
exports.registerMobileUser = async (req, res) => {
  try {
    const { full_name, phone_number, location } = req.body;

    if (!full_name || !phone_number) {
      return res.status(400).json({ success: false, message: 'Missing full name or phone number' });
    }

    // Check if user already exists
    let user = await User.findOne({ where: { phone_number } });
    if (user) {
      return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }

    // Create new farmer entry
    user = await User.create({
      full_name,
      phone_number,
      location,
      language_pref: 'English',
      status: 'Active'
    });

    // Generate real JWT token for the mobile session lifecycle
    const token = jwt.sign({ id: user.id, role: 'farmer' }, process.env.JWT_SECRET || 'fallback_secret_123', {
      expiresIn: '30d'
    });

    res.status(201).json({ success: true, token, user });
  } catch (err) {
    console.error('Mobile Register Error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Mobile Farmer Login/Verification
// @route   POST /api/users/login
exports.loginMobileUser = async (req, res) => {
  try {
    const { phone_number } = req.body;

    if (!phone_number) {
      return res.status(400).json({ success: false, message: 'Please provide phone number' });
    }

    const user = await User.findOne({ where: { phone_number } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found with this phone number' });
    }

    if (user.status === 'Blocked') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended by an administrator' });
    }

    const token = jwt.sign({ id: user.id, role: 'farmer' }, process.env.JWT_SECRET || 'fallback_secret_123', {
      expiresIn: '30d'
    });

    res.status(200).json({ success: true, token, user });
  } catch (err) {
    console.error('Mobile Login Error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};