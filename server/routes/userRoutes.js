const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // Imported for real token generation
const User = require('../models/User');
const Scan = require('../models/Scan'); 
const authMiddleware = require('../middleware/authMiddleware'); 
const userAuthMiddleware = require('../middleware/userAuthMiddleware'); 

// --- MOBILE AUTHENTICATION ENDPOINTS ---

router.post('/register', async (req, res) => {
  try {
    console.log("--- MOBILE REGISTER REQUEST ---", req.body);
    const { full_name, full_name_am, phone_number, location } = req.body;

    if (!phone_number) {
      return res.status(400).json({ msg: 'Phone number is required' });
    }

    let user = await User.findOne({ where: { phone_number } });
    if (user) {
      return res.status(400).json({ msg: 'User already exists with this phone number' });
    }

    user = await User.create({
      full_name: full_name || 'Farmer',
      full_name_am: full_name_am || 'አራሽ',
      phone_number: phone_number,
      location: location,
      app_localization: full_name_am ? 'Amharic' : 'English',
      status: 'active'
    });

    // Real signed JSON Web Token creation
    const realToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'fallback_secret_123',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token: realToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        phone_number: user.phone_number,
        location: user.location,
        language_pref: user.app_localization
      }
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ msg: 'Server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  try {
    console.log("--- MOBILE LOGIN REQUEST ---", req.body);
    const { phone_number } = req.body;

    if (!phone_number) {
      return res.status(400).json({ msg: 'Phone number is required' });
    }

    const user = await User.findOne({ where: { phone_number } });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Real signed JSON Web Token creation
    const realToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'fallback_secret_123',
      { expiresIn: '30d' }
    );

    res.json({
      token: realToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        phone_number: user.phone_number,
        location: user.location,
        language_pref: user.app_localization
      }
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ msg: 'Server error during login' });
  }
});

// --- MOBILE PROFILE UPDATE ENDPOINT ---

router.put('/profile', userAuthMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.full_name = req.body.full_name || user.full_name;
    user.phone_number = req.body.phone_number || user.phone_number;
    
    user.location = req.body.location || user.location;
    user.app_localization = req.body.app_localization || req.body.language_pref || user.app_localization;

    await user.save();

    res.json({
      msg: 'Profile updated successfully',
      user: {
        id: user.id,
        full_name: user.full_name,
        phone_number: user.phone_number,
        location: user.location,
        language_pref: user.app_localization
      }
    });
  } catch (err) {
    console.error("Profile Update Error:", err);
    res.status(500).json({ msg: 'Server error updating profile' });
  }
});

// --- MOBILE SCAN HISTORY ROUTE ---

router.get('/scans', userAuthMiddleware, async (req, res) => {
  try {
    const scans = await Scan.findAll({
      where: { user_id: req.user.id }, 
      attributes: [
        'id', 'user_id', 'crop_id', 'image_url', 'ai_predicted_disease_id', 
        'confidence_level', 'raw_ai_result', 'scan_date', 
        ['created_at', 'createdAt'], 
        ['updated_at', 'updatedAt'], 
        'latitude', 'longitude'
      ],
      order: [['created_at', 'DESC']] 
    });
    res.json(scans);
  } catch (err) {
    console.error("Error fetching scan history:", err);
    res.status(500).json({ msg: 'Server error fetching scan history' });
  }
});

// --- ADMIN ROUTES ---

router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Server error fetching users' });
  }
});

router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    user.status = req.body.status;
    await user.save();
    res.json({ msg: `User status updated to ${user.status}` });
  } catch (err) {
    res.status(500).json({ msg: 'Update failed' });
  }
});

module.exports = router;