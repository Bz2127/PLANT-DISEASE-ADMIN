// server/routes/adminAuthRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin'); 
const authMiddleware = require('../middleware/authMiddleware'); 
const adminController = require('../controllers/adminController'); 

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// @route   POST /api/admin/register
// @desc    Register a new admin account
// @access  Public (for development setup)
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    let admin = await Admin.findOne({ where: { email } });

    if (admin) {
      return res.status(400).json({ success: false, message: 'Admin already exists' });
    }

    admin = await Admin.create({ email, password }); // beforeCreate hook handles automatic hashing

    const payload = {
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role || 'Admin'
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        // Standardized response envelope matching your React catch logic
        res.status(201).json({ 
          success: true, 
          token, 
          admin: payload.admin 
        });
      }
    );
  } catch (err) {
    console.error("Admin Registration Error:", err.message);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// @route   POST /api/admin/login
// @desc    Authenticate admin credentials & issue session token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please fill out all credential fields' });
    }

    let admin = await Admin.findOne({ where: { email } });

    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid Credentials' });
    }

    const isMatch = await admin.comparePassword(password); 

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid Credentials' });
    }

    const payload = {
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        // Unifies object payloads for local storage mapping routines
        res.status(200).json({ 
          success: true, 
          token, 
          admin: payload.admin 
        });
      }
    );
  } catch (err) {
    console.error("Admin Login Error:", err.message);
    res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
});

// @route   GET /api/admin/auth-test
// @desc    Verify active protected routing tokens
// @access  Private
router.get('/auth-test', authMiddleware, (req, res) => {
  res.json({ success: true, message: `Welcome, ${req.admin.email}! Authorized channel open.`, admin: req.admin });
});


// ==========================================
// 2. PROFILE & CREDENTIAL SETTINGS ENDPOINTS
// ==========================================

// @route   GET /api/admin/profile
// @desc    Get current logged-in admin details for Settings context
// @access  Private
router.get('/profile', authMiddleware, adminController.getAdminProfile);

// @route   PUT /api/admin/profile/update
// @desc    Update admin account profile parameters
// @access  Private
router.put('/profile/update', authMiddleware, adminController.updateAdminProfile);

// @route   PUT /api/admin/profile/password
// @desc    Rotate admin password matrix keys cleanly
// @access  Private
router.put('/profile/password', authMiddleware, adminController.updateAdminPassword);


// ==========================================
// 3. FIELD TRANS-LOG MONITORING ENDPOINTS
// ==========================================

// @route   GET /api/admin/dashboard-stats
// @desc    Fetch counted summary metrics from MySQL database structures
// @access  Private
router.get('/dashboard-stats', authMiddleware, adminController.getDashboardStats);

// @route   GET /api/admin/scans
// @desc    Retrieve all relational scan logs recorded inside field instances
// @access  Private
router.get('/scans', authMiddleware, adminController.getScanLogs);

// @route   GET /api/admin/users
// @desc    Fetch live registered farmer profiles for index sorting maps
// @access  Private
router.get('/users', authMiddleware, adminController.getUsersList);

// @route   PUT /api/admin/users/:id/status
// @desc    Alter field access rights (Block / Unblock registration accounts)
// @access  Private
router.put('/users/:id/status', authMiddleware, adminController.toggleUserStatus);

// @route   GET /api/admin/analytics
// @desc    Compile timeframe metrics payloads directly for charts
// @access  Private
router.get('/analytics', authMiddleware, adminController.getAnalyticsData);


module.exports = router;