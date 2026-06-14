const axios = require('axios');
const FormData = require('form-data');
const { createClient } = require('@supabase/supabase-js');
const Scan = require('../models/Scan');
const Disease = require('../models/Disease');
const Crop = require('../models/Crop');
const { Op } = require('sequelize');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'https://plant-disease-model-8k82.onrender.com';

Scan.belongsTo(Disease, { foreignKey: 'ai_predicted_disease_id' });
Scan.belongsTo(Crop, { foreignKey: 'crop_id' });

async function getDynamicCropId(aiResult) {
  const crops = await Crop.findAll();
  const match = crops.find(crop => 
    aiResult.toLowerCase().includes(crop.crop_name.toLowerCase())
  );
  return match ? match.id : null;
}

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
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, payload);
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

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('scan-images')
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('scan-images')
      .getPublicUrl(fileName);

    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

   try {
  const mlResponse = await axios.post(
    `${ML_SERVICE_URL}/predict`,
    formData,
    {
      headers: { ...formData.getHeaders() },
      timeout: 120000
    }
  );

  console.log("ML SUCCESS:", mlResponse.data);

} catch (err) {

  console.log("========== ML ERROR ==========");

  console.log("STATUS:", err.response?.status);

  console.log("HEADERS:", err.response?.headers);

  console.log("DATA:", err.response?.data);

  console.log("MESSAGE:", err.message);

  throw err;
}
    
    const mlOutput = mlResponse.data;
    if (mlOutput.error) {
      return res.status(500).json({ success: false, message: mlOutput.error });
    }

    const rawResult = mlOutput.result ? mlOutput.result.trim() : '';
    
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

    const diseaseMapping = { 'Teff Rust': 'Teff-Rust' };
    const targetName = diseaseMapping[rawResult] || rawResult;
    const determinedCropId = await getDynamicCropId(targetName);

    const [diseaseData] = await Disease.findOrCreate({
      where: { disease_name: targetName },
      defaults: {
        crop_id: determinedCropId,
        status: 'Inactive',
        display_name_en: `${targetName.replace(/-/g, ' ')} (Pending Review)`,
        display_name_am: `${targetName} (ያልተመረመረ በሽታ)`,
        description_en: 'Automated telemetry profile created.',
        description_am: 'በስርዓቱ በራስ-ሰር የተመዘገበ ጊዜያዊ መገለጫ።',
        symptoms_en: '', symptoms_am: '',
        causes_en: '', causes_am: '',
        treatment_organic_en: 'Keep leaves dry, isolate the plant.',
        treatment_organic_am: 'እባክዎን ቅጠሎችን ያድርቁ፣ ተክሉን ይለዩ።',
        treatment_chemical_en: 'Consult local extension staff.',
        treatment_chemical_am: 'የግብርና ባለሙያ ያማክሩ።',
        prevention_tips_en: 'Maintain proper spacing.',
        prevention_tips_am: 'ለአየር ዝውውር በቂ የተክሎች ርቀት ይጠብቁ።'
      }
    });

    const userId = req.user ? req.user.id : null;

    await Scan.create({
      user_id: userId,
      crop_id: diseaseData.crop_id,
      image_url: publicUrl,
      ai_predicted_disease_id: diseaseData.id,
      confidence_level: mlOutput.confidence || 1.0,
      raw_ai_result: targetName,
      latitude: latitude || null,
      longitude: longitude || null
    });

    let cleanNameEn = (diseaseData.display_name_en || diseaseData.disease_name).replace(' (Pending Review)', '').replace(/-/g, ' ').trim();
    let cleanNameAm = (diseaseData.display_name_am || diseaseData.disease_name).replace(' (ያልተመረመረ በሽታ)', '').trim();

    if (cleanNameAm === diseaseData.disease_name) {
      cleanNameAm = `ያልተመረመረ በሽታ (${cleanNameEn})`;
    }

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

  console.error({
    message: err.message,
    status: err.response?.status,
    data: err.response?.data
  });

  return res.status(err.response?.status || 500).json({
    success: false,
    status: err.response?.status,
    message: err.message,
    details: err.response?.data
  });
}
};

exports.getUserHistory = async (req, res) => {
  try {
    const history = await Scan.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'image_url', 'raw_ai_result', 'confidence_level', 'createdAt', 'latitude', 'longitude'],
      include: [
        { model: Disease, attributes: ['disease_name', 'display_name_en', 'display_name_am', 'treatment_organic_en', 'treatment_organic_am', 'treatment_chemical_en', 'treatment_chemical_am', 'prevention_tips_en', 'prevention_tips_am'] },
        { model: Crop, attributes: ['crop_name'] }
      ]
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching history" });
  }
};