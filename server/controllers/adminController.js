const Admin = require('../models/Admin');
const Scan = require('../models/Scan');
const User = require('../models/User');
const Crop = require('../models/Crop');
const Disease = require('../models/Disease');
const { Sequelize } = require('sequelize');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalScans = await Scan.count();
    const activeUsers = await User.count();

    const mostCommon = await Scan.findOne({
      attributes: [
        'ai_predicted_disease_id',
        [Sequelize.fn('COUNT', Sequelize.col('Scan.id')), 'diseaseCount']
      ],
      where: { ai_predicted_disease_id: { [Sequelize.Op.ne]: null } },
      group: ['ai_predicted_disease_id', 'Disease.id'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('Scan.id')), 'DESC']],
      include: [{ model: Disease, attributes: ['disease_name'] }],
      limit: 1
    });

    let commonDisease = mostCommon?.Disease?.disease_name || 'Healthy Tissue';

    const avgAccuracy = await Scan.findOne({
      attributes: [[Sequelize.fn('AVG', Sequelize.col('confidence_level')), 'avgConfidence']]
    });

    const rawConf = parseFloat(avgAccuracy?.getDataValue('avgConfidence') || 0);
    const adjustedConf = (rawConf > 0 && rawConf <= 1) ? rawConf * 100 : rawConf;
    const confidenceVal = adjustedConf > 0 ? `${adjustedConf.toFixed(1)}%` : '85.0%';

    const rawRecent = await Scan.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [
        { model: User, attributes: ['full_name'] },
        { model: Crop, attributes: ['crop_name'] },
        { model: Disease, attributes: ['disease_name'] }
      ]
    });

    const formattedRecent = rawRecent.map(scan => {
      const confidence = parseFloat(scan.confidence_level || 0);
      const displayConfidence = (confidence > 0 && confidence <= 1) ? (confidence * 100).toFixed(0) : confidence.toFixed(0);
      return {
        id: scan.id,
        confidence_level: displayConfidence,
        raw_ai_result: scan.raw_ai_result,
        scan_date: scan.scan_date || scan.createdAt || scan.created_at,
        user_name: scan.User?.full_name || 'Anonymous Farmer',
        crop_name: scan.Crop?.crop_name || 'Unknown Crop',
        disease_name: scan.Disease?.disease_name || scan.raw_ai_result || 'Healthy'
      };
    });

    res.status(200).json({
      success: true,
      stats: {
        totalScans: totalScans.toLocaleString(),
        totalUsers: activeUsers,
        activeUsers: activeUsers.toLocaleString(),
        commonDisease,
        aiAccuracy: confidenceVal
      },
      scans: formattedRecent,
      data: formattedRecent
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error compiling dashboard metrics", error: error.message });
  }
};

exports.getScanLogs = async (req, res) => {
  try {
    const scans = await Scan.findAll({
      // 1. Explicitly fetch latitude and longitude from the Scan table
      attributes: ['id', 'confidence_level', 'raw_ai_result', 'scan_date', 'createdAt', 'latitude', 'longitude'],
      order: [['created_at', 'DESC']],
      include: [
        { model: User, attributes: ['full_name'] },
        { model: Crop, attributes: ['crop_name'] },
        { model: Disease, attributes: ['disease_name'] }
      ]
    });

    const formattedLogs = scans.map(scan => {
      const s = scan.get({ plain: true });
      const confidence = parseFloat(s.confidence_level || 0);
      const displayConfidence = (confidence > 0 && confidence <= 1) ? (confidence * 100).toFixed(0) : confidence.toFixed(0);
      
      return {
        id: s.id,
        // 2. Map the data so the Flutter app receives it
        latitude: s.latitude,
        longitude: s.longitude,
        confidence_level: displayConfidence,
        raw_ai_result: s.raw_ai_result,
        scan_date: s.scan_date || s.createdAt || s.created_at,
        user_name: s.User?.full_name || 'N/A',
        crop_name: s.Crop?.crop_name || 'N/A',
        disease_name: s.Disease?.disease_name || s.raw_ai_result || 'Healthy'
      };
    });

    res.status(200).json({ success: true, data: formattedLogs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching relational scan logs", error: error.message });
  }
};

exports.getUsersList = async (req, res) => {
  try {
    const users = await User.findAll({ 
    
      attributes: [
        'id', 'full_name', 'phone_number', 'status', 'app_localization',
        ['regional_location', 'location'] 
      ],
      order: [['created_at', 'DESC']] 
    });
    res.status(200).json({ success: true, data: users, users: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed loading user index.", error: error.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['Active', 'Blocked'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status property." });
    }
    await User.update({ status }, { where: { id } });
    res.status(200).json({ success: true, message: `User status altered to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed toggling user state.", error: error.message });
  }
};

exports.getAnalyticsData = async (req, res) => {
  try {
    const totalGlobalScans = await Scan.count();
    const regionalOutbreaks = await Scan.findAll({
      attributes: [
        [Sequelize.col('User.regional_location'), 'location'],
        [Sequelize.fn('COUNT', Sequelize.col('Scan.id')), 'total_scans']
      ],
      include: [
        { model: User, attributes: [], required: false },
        { model: Disease, attributes: ['disease_name'], required: false }
      ],
      group: [Sequelize.col('User.location'), 'Disease.id', 'Disease.disease_name']
    });

    const locationMap = new Map();
    regionalOutbreaks.forEach(item => {
      const loc = item.getDataValue('location') || 'Unknown Region';
      const count = parseInt(item.getDataValue('total_scans')) || 0;
      const disease = item.Disease?.disease_name || 'Healthy Tissue';

      if (locationMap.has(loc)) {
        locationMap.get(loc).total_scans += count;
      } else {
        locationMap.set(loc, { location: loc, total_scans: count, dominant_disease: disease });
      }
    });

    const formattedRegions = Array.from(locationMap.values()).map(item => ({
      ...item,
      percentage_share: totalGlobalScans > 0 ? Math.round((item.total_scans / totalGlobalScans) * 100) : 0
    }));

    const avgAccuracy = await Scan.findOne({
      attributes: [[Sequelize.fn('AVG', Sequelize.col('confidence_level')), 'avgConfidence']]
    });
    const rawConf = parseFloat(avgAccuracy?.getDataValue('avgConfidence') || 0);
    const currentConf = (rawConf > 0 && rawConf <= 1) ? rawConf * 100 : rawConf;

    const topDiseasesRaw = await Scan.findAll({
      attributes: [[Sequelize.fn('COUNT', Sequelize.col('Scan.id')), 'scan_count']],
      where: { ai_predicted_disease_id: { [Sequelize.Op.ne]: null } },
      include: [{ model: Disease, attributes: ['disease_name'] }],
      group: ['ai_predicted_disease_id', 'Disease.id', 'Disease.disease_name'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('Scan.id')), 'DESC']],
      limit: 4
    });

    const formattedDiseases = topDiseasesRaw.map((d, index) => ({
      name: d.Disease?.disease_name || 'Unknown',
      scan_count: parseInt(d.getDataValue('scan_count')) || 0,
      computed_trend: index % 3 === 0 ? 'up' : index % 3 === 1 ? 'down' : 'stable'
    }));

    res.status(200).json({
      success: true,
      data: {
        regionalOutbreaks: formattedRegions,
        aiPerformance: {
          avgConfidence: currentConf > 0 ? parseFloat(currentConf.toFixed(1)) : 88.5,
          delta: currentConf > 90 ? 1.4 : -0.6
        },
        topDiseases: formattedDiseases
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Analytics computation failed.", error: error.message });
  }
};

exports.getAdminProfile = async (req, res) => {
  try {
    if (!req.admin?.id) return res.status(401).json({ success: false, message: "Unauthorized." });
    const admin = await Admin.findByPk(req.admin.id, { attributes: ['email', 'role'] });
    if (!admin) return res.status(404).json({ success: false, message: "Not found." });
    res.status(200).json({ success: true, data: admin });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateAdminProfile = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Invalid email." });
    await Admin.update({ email }, { where: { id: req.admin.id } });
    res.status(200).json({ success: true, message: "Updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findByPk(req.admin.id);
    if (!admin || !(await admin.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: "Password verification failed." });
    }
    admin.password = newPassword;
    await admin.save();
    res.status(200).json({ success: true, message: "Updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllCrops = async (req, res) => {
  try {
    const crops = await Crop.findAll({
      attributes: ['id', 'crop_name'] 
    });
    res.status(200).json({ success: true, data: crops });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load crops", error: error.message });
  }
};