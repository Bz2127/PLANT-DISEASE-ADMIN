const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./config/config');

// Database Models
const User = require('./models/User');

// Route Subsystem Files
const diseaseRoutes = require('./routes/diseaseRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const userRoutes = require('./routes/userRoutes'); 

// Core Controllers
const userController = require('./controllers/userController');
const adminController = require('./controllers/adminController');
const scanController = require('./controllers/scanController');
const userAuthMiddleware = require('./middleware/userAuthMiddleware');

dotenv.config();
const app = express();

// Cross-Origin Settings for Web Panel access
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://plant-disease-webfront.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Image Upload Storage Systems
// 1. Storage for Profiles (Saves to Disk)
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const uploadProfile = multer({ storage: profileStorage });

// 2. Storage for Scans (Keeps in Memory for ML processing)
const uploadScan = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } 
});

// Serve static profile image assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. APPLY THEM INDIVIDUALLY TO ROUTES:
app.post('/api/users/profile-update', uploadProfile.single('image'), async (req, res) => {
    
});

// Use uploadScan for the scan route
app.post('/api/scans/predict-disease', uploadScan.single('image'), userAuthMiddleware, (req, res) => {
    // ... existing logic ...
});

// ----- MOUNT SYSTEM ROUTE HANDLERS -----

// Admin System Base Routers
app.use('/api/admin', adminAuthRoutes); 
app.use('/api/admin/diseases', diseaseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/diseases', diseaseRoutes);

// Scanning History Systems
app.get('/api/admin/scans', adminController.getScanLogs);

// Emergency Direct Fallback for Admin User Query Fetching
app.get('/api/admin/users', async (req, res) => {
  try {
    const usersList = await User.findAll();
    return res.status(200).json({ success: true, users: usersList });
  } catch (error) {
    console.error("Admin user list fetch error:", error);
    return res.status(500).json({ success: false, message: "Database query error" });
  }
});

app.put('/api/admin/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const targetedUser = await User.findByPk(req.params.id);
    if (!targetedUser) return res.status(404).json({ success: false, message: "User not found" });
    
    targetedUser.status = status;
    await targetedUser.save();
    return res.status(200).json({ success: true, user: targetedUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to switch user constraint status" });
  }
});

// Mobile Farmer Profile Sync Operations (Fixes 09 vs +251 mismatch)
app.post('/api/users/profile-update', upload.single('image'), async (req, res) => {
  console.log("--- MOBILE PROFILE UPDATE REQUEST ---", req.body);
  try {
    let { phone_number, full_name, location, language_pref } = req.body;
    if (!phone_number) {
      return res.status(400).json({ success: false, message: "Phone number required" });
    }

    let phoneNormalized = phone_number.trim();
    if (phoneNormalized.startsWith('0')) {
      phoneNormalized = '+251' + phoneNormalized.substring(1);
    }

    const user = await User.findOne({ where: { phone_number: phoneNormalized } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (full_name !== undefined) user.full_name = full_name;
if (location !== undefined) user.location = location;
if (language_pref !== undefined) user.language_pref = language_pref;
    if (req.file) {
      user.profile_image = `/uploads/${req.file.filename}`;
    }

    await user.save();
    console.log("✅ USER UPDATED SUCCESSFULLY IN MYSQL DATABASE!");
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Machine Learning Diagnostic Route Links
app.post('/api/scans/recommend-crop', (req, res) => {
  if (scanController && typeof scanController.getRecommendation === 'function') {
    return scanController.getRecommendation(req, res);
  }
  return res.json({ success: true });
});

app.post('/api/scans/predict-disease', upload.single('image'), userAuthMiddleware, (req, res) => {
  if (scanController && typeof scanController.processPlantScan === 'function') {
    return scanController.processPlantScan(req, res);
  }
  return res.json({ success: false });
});

// Redirect baseline request directly to the nested route configuration
app.get('/api/scans', userAuthMiddleware, (req, res) => {
  res.redirect(307, '/api/users/scans');
});

app.get('/', (req, res) => { res.send('API is running...'); });

// Boot Sequence
async function startServer() {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Initialization Failed:", error);
  }
}
startServer();