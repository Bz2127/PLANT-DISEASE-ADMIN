// server/controllers/diseaseController.js
const Disease = require('../models/Disease');
const Crop = require('../models/Crop');
const Scan = require('../models/Scan');

// Helper function to dynamically map object fields based on chosen language
const formatLocalizedData = (diseaseInstance, lang = 'en') => {
  if (!diseaseInstance) return null;
  
  // Safeguard: fallback to English if an invalid language string is passed
  const suffix = lang === 'am' ? '_am' : '_en';
  
  // Convert Sequelize instance to a clean JSON object
  const cleanData = diseaseInstance.toJSON ? diseaseInstance.toJSON() : { ...diseaseInstance };

return {
    id: cleanData.id,
    disease_name: cleanData.disease_name,
    crop_id: cleanData.crop_id,
    image_url: cleanData.image_url,
    status: cleanData.status,
    Crop: cleanData.Crop,
    created_at: cleanData.created_at,
    updated_at: cleanData.updated_at,
    
    // Replace all instances of 'data' with 'cleanData'
    display_name: cleanData[`display_name${suffix}`] ?? cleanData.display_name_en ?? cleanData.disease_name,
    description: cleanData[`description${suffix}`] ?? cleanData.description_en ?? '',
    symptoms: cleanData[`symptoms${suffix}`] ?? cleanData.symptoms_en ?? '',
    causes: cleanData[`causes${suffix}`] ?? (lang === 'am' ? cleanData.causes_am : cleanData.causes_en) ?? '',
    treatment_organic: cleanData[`treatment_organic${suffix}`] ?? cleanData.treatment_organic_en ?? '',
    treatment_chemical: cleanData[`treatment_chemical${suffix}`] ?? cleanData.treatment_chemical_en ?? '',
    prevention_tips: cleanData[`prevention_tips${suffix}`] ?? cleanData.prevention_tips_en ?? ''
  };
};

exports.addDisease = async (req, res) => {
  try {
    const { 
      disease_name, crop_id, status, 
      display_name_en, display_name_am,
      description_en, description_am, 
      symptoms_en, symptoms_am, 
      causes_en, causes_am, 
      treatment_organic_en, treatment_organic_am, 
      treatment_chemical_en, treatment_chemical_am, 
      prevention_tips_en, prevention_tips_am, 
      image_url 
    } = req.body;

    if (!disease_name || !crop_id) {
        return res.status(400).json({ success: false, message: 'Please provide disease name and target crop ID' });
    }

    const disease = await Disease.create({
      disease_name, crop_id, status: status || 'Active', 
      display_name_en, display_name_am,
      description_en, description_am, 
      symptoms_en, symptoms_am, 
      causes_en, causes_am, 
      treatment_organic_en, treatment_organic_am, 
      treatment_chemical_en, treatment_chemical_am, 
      prevention_tips_en, prevention_tips_am, 
      image_url
    });

    const completedRecord = await Disease.findByPk(disease.id, {
      include: [{ model: Crop, attributes: ['crop_name'] }]
    });

    res.status(201).json({ success: true, data: completedRecord });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
};

exports.getDiseases = async (req, res) => {
  try {
    // Read optional language preference from query parameters string (?lang=am)
    const { lang } = req.query;

    const diseases = await Disease.findAll({
      order: [['id', 'DESC']],
      include: [{ model: Crop, attributes: ['crop_name'] }]
    }); 

    // Dynamically map list values before sending them to the client
    const localizedDiseases = diseases.map(item => formatLocalizedData(item, lang));

    res.status(200).json({ success: true, data: localizedDiseases });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
};

exports.getAdvisoryByScanId = async (req, res) => {
  try {
    const { scanId } = req.params;
    const { lang } = req.query; // Capture app language context (?lang=am or ?lang=en)
    let scan;

    if (scanId === '0' || scanId === 'latest_id') {
      scan = await Scan.findOne({
        order: [['id', 'DESC']],
        include: [{ 
          model: Disease,
          required: true 
        }]
      });
    } else {
      scan = await Scan.findByPk(scanId, {
        include: [{ model: Disease }]
      });
    }

    if (!scan) {
      return res.status(404).json({ 
        success: false, 
        message: "No scan records found in the database." 
      });
    }

    if (!scan.Disease) {
      return res.status(404).json({ 
        success: false, 
        message: `Scan found, but no matching advisory treatments matching disease ID inside your Diseases table.` 
      });
    }

    // Process output variables on the fly based on the user's selected language context
    const localizedAdvisory = formatLocalizedData(scan.Disease, lang);

    return res.status(200).json({ 
      success: true, 
      data: localizedAdvisory 
    });

  } catch (err) {
    console.error("Advisory Engine Error:", err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server Error processing advisory layout', 
      error: err.message 
    });
  }
};