// server/routes/diseaseRoutes.js
const express = require('express');
const router = express.Router();
const { addDisease, getDiseases } = require('../controllers/diseaseController');
const authMiddleware = require('../middleware/authMiddleware'); //
const Crop = require('../models/Crop'); //

// 1. PUBLIC ROUTE: Frontend needs this to populate the dropdown selection input
router.get('/crops-list', async (req, res) => {
  try {
    const crops = await Crop.findAll({ attributes: ['id', 'crop_name'] });
    res.status(200).json({ success: true, data: crops });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error loading crops list' });
  }
});

// 2. SECURITY LAYER: Protects all routes listed below this line
router.use(authMiddleware);

// 3. PROTECTED ROUTES: Handles adding and getting diseases safely
router.route('/')
  .post(addDisease)
  .get(getDiseases);

module.exports = router;