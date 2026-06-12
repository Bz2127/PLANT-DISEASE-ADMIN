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
    id: data.id,
    disease_name: data.disease_name,
    crop_id: data.crop_id,
    image_url: data.image_url,
    status: data.status,
    Crop: data.Crop,
    created_at: data.created_at,
    updated_at: data.updated_at,
    
    display_name: data[`display_name${suffix}`] ?? data.display_name_en ?? data.disease_name,
    description: data[`description${suffix}`] ?? data.description_en ?? '',
    symptoms: data[`symptoms${suffix}`] ?? data.symptoms_en ?? '',
    causes: data[`causes${suffix}`] ?? (lang === 'am' ? data.causes_am : data.causes_en) ?? '',
    treatment_organic: data[`treatment_organic${suffix}`] ?? data.treatment_organic_en ?? '',
    treatment_chemical: data[`treatment_chemical${suffix}`] ?? data.treatment_chemical_en ?? '',
    prevention_tips: data[`prevention_tips${suffix}`] ?? data.prevention_tips_en ?? ''
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