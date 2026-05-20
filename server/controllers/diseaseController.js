// server/controllers/diseaseController.js
const Disease = require('../models/Disease');
const Crop = require('../models/Crop'); 

// @desc    Add new plant disease pathology entry
// @route   POST /api/admin/diseases
exports.addDisease = async (req, res) => {
  try {
    const { 
      disease_name, 
      crop_id, 
      status,
      description, 
      symptoms, 
      causes, 
      treatment_organic, 
      treatment_chemical, 
      prevention_tips,
      image_url 
    } = req.body;

    // Strict validation for the Admin Intake Portal
    if (!disease_name || !crop_id) {
        return res.status(400).json({ success: false, message: 'Please provide disease name and target crop ID' });
    }

    const disease = await Disease.create({
      disease_name,
      crop_id,
      status: status || 'Active',
      description,
      symptoms,
      causes,
      treatment_organic,
      treatment_chemical,
      prevention_tips,
      image_url
    });

    // Re-fetch the newly created row with Crop data immediately so the frontend 
    // can append it to the active state list without needing a hard page reload
    const completedRecord = await Disease.findByPk(disease.id, {
      include: [{ model: Crop, attributes: ['crop_name'] }]
    });

    res.status(201).json({ success: true, data: completedRecord });
  } catch (err) {
    console.error("Data Ingestion Error:", err);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
};

// @desc    Get all diseases with structural Crop table relations hydrated
// @route   GET /api/admin/diseases
exports.getDiseases = async (req, res) => {
  try {
    // Fetches all records, sorted with the newest entries first to match the UI spec
    const diseases = await Disease.findAll({
      order: [['id', 'DESC']],
      include: [{ model: Crop, attributes: ['crop_name'] }]
    }); 
    
    res.status(200).json({ success: true, data: diseases });
  } catch (err) {
    console.error("Fetch Disease Catalog Error:", err);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
};