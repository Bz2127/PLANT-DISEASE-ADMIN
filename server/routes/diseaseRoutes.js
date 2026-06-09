const express = require('express');
const router = express.Router();
const { addDisease, getDiseases, getAdvisoryByScanId } = require('../controllers/diseaseController');
const authMiddleware = require('../middleware/authMiddleware');
const Crop = require('../models/Crop');
// If you have a DiseaseAdvisory model, import it here to serve fallback data directly
// const DiseaseAdvisory = require('../models/DiseaseAdvisory'); 

// 1. PUBLIC ROUTES: Accessible by the Farmer Mobile App

// Fetch list of available crops
router.get('/crops-list', async (req, res) => {
  try {
    const crops = await Crop.findAll({ attributes: ['id', 'crop_name'] });
    res.status(200).json({ success: true, data: crops });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error loading crops list' });
  }
});

// New endpoint for Smart Advisory - Public access for farmers
// ✅ Intercepts ID '0' right here so it doesn't break the mobile screen or crash the controller query
router.get('/advisory/:scanId', (req, res, next) => {
  if (req.params.scanId === '0') {
    return res.status(200).json({
      success: true,
      message: "Placeholder advisory loaded.",
      data: {
        disease_name: "No Scan Selected",
        treatment_steps: "Please select a previous scan from your history layout or perform a new leaf scan to see tailored treatments here.",
        chemical_control: "None",
        organic_control: "Keep fields watered normally."
      }
    });
  }
  // If it's a valid ID, pass control right along to your existing controller logic
  return getAdvisoryByScanId(req, res, next);
});

// 2. SECURITY LAYER: Protects admin operations listed below this line
router.use(authMiddleware);

// 3. PROTECTED ROUTES: Handles adding and getting diseases safely
router.route('/')
  .post(addDisease)
  .get(getDiseases);

module.exports = router;