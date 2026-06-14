const Disease = require('../models/Disease');
const Crop = require('../models/Crop');
const Scan = require('../models/Scan');
const supabase = require('../config/supabase');

const uploadImageToSupabase = async (file) => {
  const fileName = `${Date.now()}-${file.originalname}`;

  const { error } = await supabase.storage
    .from('scan-images')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from('scan-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
};

const formatLocalizedData = (diseaseInstance) => {
  if (!diseaseInstance) return null;

  const cleanData = diseaseInstance.toJSON ? diseaseInstance.toJSON() : { ...diseaseInstance };

  return {
    id: cleanData.id,
    nameEn: cleanData.display_name_en ?? cleanData.disease_name,
    nameAm: cleanData.display_name_am ?? cleanData.disease_name,

    descriptionEn: cleanData.description_en ?? '',
    descriptionAm: cleanData.description_am ?? '',

    treatmentOrganic: cleanData.treatment_organic_en ?? '',
    treatmentChemical: cleanData.treatment_chemical_en ?? '',
    prevention: cleanData.prevention_tips_en ?? '',

    image_url: cleanData.image_url ?? '',

    confidence: cleanData.confidence ?? 0.0,
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
      prevention_tips_en, prevention_tips_am
    } = req.body;

    if (!disease_name || !crop_id) {
      return res.status(400).json({ success: false, message: 'Please provide disease name and target crop ID' });
    }

    let image_url = null;

    if (req.file) {
      image_url = await uploadImageToSupabase(req.file);
    }

    const disease = await Disease.create({
      disease_name,
      crop_id,
      status: status || 'Active',
      display_name_en,
      display_name_am,
      description_en,
      description_am,
      symptoms_en,
      symptoms_am,
      causes_en,
      causes_am,
      treatment_organic_en,
      treatment_organic_am,
      treatment_chemical_en,
      treatment_chemical_am,
      prevention_tips_en,
      prevention_tips_am,
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
    const { lang } = req.query;

    const diseases = await Disease.findAll({
      order: [['id', 'DESC']],
      include: [{ model: Crop, attributes: ['crop_name'] }]
    });

    const localizedDiseases = diseases.map(item => formatLocalizedData(item, lang));

    res.status(200).json({ success: true, data: localizedDiseases });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
};

exports.getAdvisoryByScanId = async (req, res) => {
  try {
    const { scanId } = req.params;
    const { lang } = req.query;

    let scan;

    if (scanId === '0' || scanId === 'latest_id') {
      scan = await Scan.findOne({
        order: [['id', 'DESC']],
        include: [{ model: Disease, required: true }]
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