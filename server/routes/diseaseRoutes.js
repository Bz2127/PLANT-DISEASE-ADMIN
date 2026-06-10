// server/routes/diseaseRoutes.js
const express = require('express');
const router = express.Router();
const { addDisease, getDiseases, getAdvisoryByScanId } = require('../controllers/diseaseController');
const authMiddleware = require('../middleware/authMiddleware');
const Crop = require('../models/Crop');
const Disease = require('../models/Disease'); // Import Disease model directly for quick operations

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
  return getAdvisoryByScanId(req, res, next);
});

// 2. SECURITY LAYER: Protects admin operations listed below this line
router.use(authMiddleware);

// 3. PROTECTED ROUTES: Handles adding and getting diseases safely
router.route('/')
  .post(addDisease)
  .get(getDiseases);

// =========================================================================
// 4. NEW ADMINISTRATIVE VERIFICATION & REPAIR LAYER
// These stop your unique constraint database crashes!
// =========================================================================

// Verification path to see if the ML placeholder already exists in MySQL
router.get('/verify', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Missing target verification name parameter.' });
    }
    
    const disease = await Disease.findOne({ where: { disease_name: name.trim() } });
    if (disease) {
      // It exists! Send back its ID so the React form knows to switch from POST to PUT
      return res.status(200).json({ exists: true, id: disease.id });
    }
    
    // It doesn't exist yet, safe to do a regular POST creation
    return res.status(200).json({ exists: false });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT path to update/overwrite the placeholder rows directly via their numeric ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [updatedRowsCount] = await Disease.update(req.body, { 
      where: { id: id } 
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({ success: false, message: 'No placeholder record found matching that ID.' });
    }

    res.status(200).json({ success: true, message: 'Data matrix record patched successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;