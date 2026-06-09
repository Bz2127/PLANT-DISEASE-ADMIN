const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const Scan = require('../models/Scan');
const Disease = require('../models/Disease');
const Crop = require('../models/Crop');

const ML_SERVICE_URL = 'http://localhost:5001/predict';

Scan.belongsTo(Disease, { foreignKey: 'ai_predicted_disease_id' });
Scan.belongsTo(Crop, { foreignKey: 'crop_id' });

exports.getRecommendation = async (req, res) => {
  try {
    const { nitrogen, phosphorus, potassium, ph, rainfall, temperature } = req.body;
    if (!nitrogen || !phosphorus || !potassium || !ph || !rainfall || !temperature) {
      return res.status(400).json({ success: false, message: 'Missing soil parameters' });
    }

    const payload = {
      type: 'crop',
      data: [Number(nitrogen), Number(phosphorus), Number(potassium), Number(ph), Number(rainfall), Number(temperature)]
    };

    const response = await axios.post(ML_SERVICE_URL, payload);
    res.status(200).json({ success: true, recommended_crop: response.data.result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Crop Model Service Unavailable' });
  }
};

exports.processPlantScan = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file required' });
    }

    const { latitude, longitude } = req.body;

    const fileBuffer = fs.readFileSync(req.file.path);
    const formData = new FormData();
    formData.append('image', fileBuffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const mlResponse = await axios.post(ML_SERVICE_URL, formData, {
      headers: { ...formData.getHeaders() },
      timeout: 15000
    });
    
    const mlOutput = mlResponse.data;
    if (mlOutput.error) {
      return res.status(500).json({ success: false, message: mlOutput.error });
    }

    const diseaseMapping = { 'Teff Rust': 'Teff Rust (Uromyces eragrostidis)' };
    const targetName = diseaseMapping[mlOutput.result] || mlOutput.result;

    const diseaseData = await Disease.findOne({ 
      where: { disease_name: targetName },
      include: [{ model: Crop, attributes: ['id', 'crop_name'] }]
    });

    const userId = req.user ? req.user.id : null;
    const resolvedCropId = diseaseData ? diseaseData.crop_id : null;

    // Save scan data to the logs database regardless of whether details exist yet
    await Scan.create({
      user_id: userId,
      crop_id: resolvedCropId,
      image_url: req.file.path,
      ai_predicted_disease_id: diseaseData ? diseaseData.id : null,
      confidence_level: mlOutput.confidence,
      raw_ai_result: mlOutput.result,
      latitude: latitude || null,
      longitude: longitude || null
    });

    // Case 1: Disease exists in the database
    if (diseaseData) {
      return res.status(200).json({
        id: diseaseData.id,
        nameEn: diseaseData.disease_name,
        nameAm: diseaseData.disease_name_am || diseaseData.disease_name,
        confidence: mlOutput.confidence,
        treatmentOrganic: diseaseData.treatment_organic || 'No specific organic treatment registered.',
        treatmentChemical: diseaseData.treatment_chemical || 'No specific chemical treatment registered.',
        prevention: diseaseData.prevention_steps || 'No custom prevention steps found.'
      });
    }

    // Case 2: GLOBAL FALLBACK - Matches any disease missing from your database rows
    console.log(`⚠️ Database row missing for "${targetName}". Triggering safe network response.`);
    
    return res.status(200).json({
      id: 0,
      nameEn: targetName,
      nameAm: `${targetName} (ያልተመዘገበ)`, 
      confidence: mlOutput.confidence,
      treatmentOrganic: 'Keep leaves dry, separate the infected plant from others, and ensure clean cultivation tools.',
      treatmentChemical: 'No chemical treatment profile exists in system records. Consult local extension staff.',
      prevention: 'Maintain proper plant spacing for healthy ventilation, and clear weed hosts around production plots.'
    });

  } catch (err) {
    console.error("Scan Error Details:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Server Data Processing Error' });
  }
};

exports.getUserHistory = async (req, res) => {
  try {
    const history = await Scan.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
      attributes: [
        'id', 'image_url', 'raw_ai_result', 'confidence_level', 
        'scan_date', 'createdAt', 'latitude', 'longitude' 
      ],
      include: [
        { 
          model: Disease, 
          attributes: ['disease_name', 'disease_name_am', 'treatment_organic', 'treatment_chemical', 'prevention_steps'] 
        },
        { 
          model: Crop, 
          attributes: ['crop_name'] 
        }
      ]
    });
    res.json(history);
  } catch (error) {
    console.error("History Fetch Error:", error);
    res.status(500).json({ success: false, message: "Error fetching history" });
  }
};