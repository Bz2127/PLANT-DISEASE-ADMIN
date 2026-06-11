const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const Scan = require('../models/Scan');
const Disease = require('../models/Disease');
const Crop = require('../models/Crop');

// Use the actual public URL of your deployed ML model
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'https://plant-disease-model-8k82.onrender.com/predict';

// Maintain table relationships cleanly
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
    const lang = req.query.lang === 'am' ? 'am' : 'en'; 

   const formData = new FormData();
formData.append('image', req.file.buffer, {
  filename: req.file.originalname,
  contentType: req.file.mimetype
});

    const mlResponse = await axios.post(ML_SERVICE_URL, formData, {
      headers: { ...formData.getHeaders() },
      timeout: 60000
    });
    
    const mlOutput = mlResponse.data;
    if (mlOutput.error) {
      return res.status(500).json({ success: false, message: mlOutput.error });
    }

    // 1. NON-PLANT IMAGE OR INVALID MODEL OUTPUT PROTECTION
    const rawResult = mlOutput.result ? mlOutput.result.trim() : '';
    
    // If Python specifically says it's not a leaf/plant, or if the output is completely empty
    if (rawResult === 'Non-Plant' || rawResult === 'Unknown' || !rawResult) {
      return res.status(200).json({
        id: 0,
        nameEn: "Invalid Image Detected",
        nameAm: "ያልታወቀ ምስል ተገኝቷል",
        raw_ml_key: "Non-Plant",
        confidence: 0.0,
        treatmentOrganic: lang === 'am' ? "እባክዎን ግልጽ የሆነ የሰብል ወይም የተክል ቅጠል ምስል ያንሱ።" : "Please take a clear picture of a valid crop leaf.",
        treatmentChemical: lang === 'am' ? "ምንም ዓይነት የኬሚካል ሕክምና አያስፈልግም።" : "No chemical treatment applicable.",
        prevention: lang === 'am' ? "ምስሉን በተሻለ ብርሃን በድጋሚ ይሞክሩ።" : "Try capturing the image again with better lighting and focus."
      });
    }

    // Direct mapping configuration for strict model evaluation matches
    const diseaseMapping = { 'Teff Rust': 'Teff-Rust' };
    const targetName = diseaseMapping[rawResult] || rawResult;

    // 2. Dynamic "Find or Create" Mechanism
    const [diseaseData, created] = await Disease.findOrCreate({
      where: { disease_name: targetName },
      defaults: {
        crop_id: 1, 
        status: 'Inactive', 
        display_name_en: `${targetName.replace(/-/g, ' ')} (Pending Review)`,
        display_name_am: `${targetName} (ያልተመረመረ በሽታ)`,
        description_en: 'Automated telemetry profile created. Structural parameters pending web update.',
        description_am: 'በስርዓቱ በራስ-ሰር የተመዘገበ ጊዜያዊ መገለጫ። በአስተዳዳሪው መረጋገጥ አለበት።',
        symptoms_en: '', symptoms_am: '',
        causes_en: '', causes_am: '',
        treatment_organic_en: 'Keep leaves dry, isolate the plant, and maintain clean cultivation tools.',
        treatment_organic_am: 'እባክዎን ቅጠሎችን ያድርቁ፣ ተክሉን ይለዩ እና ንጹህ የግብርና መሳሪያዎችን ይጠቀሙ።',
        treatment_chemical_en: 'No chemical treatment profile verified yet. Consult local extension staff.',
        treatment_chemical_am: 'ምንም የኬሚካል ሕክምና መገለጫ አልተረጋገጠም። የግብርና ባለሙያ ያማክሩ።',
        prevention_tips_en: 'Maintain proper spacing for air ventilation.',
        prevention_tips_am: 'ለአየር ዝውውር በቂ የተክሎች ርቀት ይጠብቁ።'
      }
    });

    if (created) {
      console.log(`✨ Ingestion Engine: Created new placeholder entry for raw ML label: "${targetName}"`);
    }

    const userId = req.user ? req.user.id : null;

    // 3. Commit log metrics directly into database
    await Scan.create({
      user_id: userId,
      crop_id: diseaseData.crop_id,
      image_url: 'in-memory-process',
      ai_predicted_disease_id: diseaseData.id,
      confidence_level: mlOutput.confidence || 1.0,
      raw_ai_result: targetName,
      latitude: latitude || null,
      longitude: longitude || null
    });

    // 4. Clean up display names dynamically by stripping out placeholder phrases
    let cleanNameEn = (diseaseData.display_name_en || diseaseData.disease_name)
      .replace(' (Pending Review)', '')
      .replace(/-/g, ' ')
      .trim();

    let cleanNameAm = (diseaseData.display_name_am || diseaseData.disease_name)
      .replace(' (ያልተመረመረ በሽታ)', '')
      .trim();

    // Fallback localization phrase if Amharic entry isn't customized by an admin yet
    if (cleanNameAm === diseaseData.disease_name) {
      cleanNameAm = `ያልተመረመረ በሽታ (${cleanNameEn})`;
    }

    // 5. Return formatted data structural mapping built to match Flutter model properties 
    return res.status(200).json({
      id: diseaseData.id,
      nameEn: cleanNameEn,
      nameAm: cleanNameAm,
      raw_ml_key: diseaseData.disease_name,
      confidence: mlOutput.confidence || 1.0, 
      treatmentOrganic: lang === 'am' ? diseaseData.treatment_organic_am : diseaseData.treatment_organic_en,
      treatmentChemical: lang === 'am' ? diseaseData.treatment_chemical_am : diseaseData.treatment_chemical_en,
      prevention: lang === 'am' ? diseaseData.prevention_tips_am : diseaseData.prevention_tips_en
    });

  } catch (err) {
  console.error("========== SCAN ERROR ==========");
  console.error("MESSAGE:", err.message);
  console.error("STATUS:", err.response?.status);
  console.error("DATA:", err.response?.data);
  console.error("STACK:", err.stack);

  return res.status(500).json({
    success: false,
    message: err.message,
    details: err.response?.data || null
  });
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
          attributes: [
            'disease_name', 
            'display_name_en', 'display_name_am',
            'treatment_organic_en', 'treatment_organic_am', 
            'treatment_chemical_en', 'treatment_chemical_am', 
            'prevention_tips_en', 'prevention_tips_am'
          ] 
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