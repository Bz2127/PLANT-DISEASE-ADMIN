// server/routes/adminAuthRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin'); 
const authMiddleware = require('../middleware/authMiddleware'); 
const adminController = require('../controllers/adminController'); 

// Production Admin Login Handler
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // 1. Basic validation check
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please fill out all credential fields' });
    }

    // 2. Clean inputs to prevent email validator mismatch issues
    const cleanEmail = email.trim().toLowerCase();

    // 3. Query record using clean Sequelize methods
    const adminInstance = await Admin.findOne({ where: { email: cleanEmail } });

    if (!adminInstance) {
      return res.status(400).json({ success: false, message: 'Invalid Credentials' });
    }

    // 4. Call your model prototype method to verify the password securely
    const isMatch = await adminInstance.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid Credentials' });
    }

    // 5. Build token payload cleanly matching model values
    const payload = { 
      admin: { 
        id: adminInstance.id, 
        email: adminInstance.email, 
        role: adminInstance.role 
      } 
    };

    // 6. Sign cryptographic session token
    jwt.sign(
      payload, 
      process.env.JWT_SECRET || 'fallback_secret_123', 
      { expiresIn: '24h' }, 
      (err, token) => {
        if (err) throw err;
        return res.status(200).json({ success: true, token, admin: payload.admin });
      }
    );

  } catch (err) {
    console.error("Admin Login Error:", err.message);
    // Prevents breaking with a raw 400 bad request error stream response
    return res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
});

// Production Admin Registration Handler
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingAdmin = await Admin.findOne({ where: { email: cleanEmail } });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Admin already exists' });
    }

    const newAdmin = await Admin.create({ 
      email: cleanEmail, 
      password, 
      role: 'admin' 
    });
    
    const payload = { admin: { id: newAdmin.id, email: newAdmin.email, role: newAdmin.role } };

    jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret_123', { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      return res.status(201).json({ success: true, token, admin: payload.admin });
    });
  } catch (err) {
    console.error("Admin Registration Error:", err.message);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// Protected UI Module Pipelines
router.get('/auth-test', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Authorized channel open.', admin: req.admin });
});

router.get('/profile', authMiddleware, adminController.getAdminProfile);
router.put('/profile/update', authMiddleware, adminController.updateAdminProfile);
router.put('/profile/password', authMiddleware, adminController.updateAdminPassword);
router.get('/dashboard-stats', authMiddleware, adminController.getDashboardStats);
router.get('/scans', authMiddleware, adminController.getScanLogs);
router.get('/users', authMiddleware, adminController.getUsersList);
router.put('/users/:id/status', authMiddleware, adminController.toggleUserStatus);
router.get('/analytics', authMiddleware, adminController.getAnalyticsData);

module.exports = router;