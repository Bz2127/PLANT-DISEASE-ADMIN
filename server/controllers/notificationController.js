// server/controllers/notificationController.js
const Notification = require('../models/Notification');

// @desc    Send a new advisory/alert
// @route   POST /api/admin/notifications
exports.sendNotification = async (req, res) => {
  try {
    const { type, title_en, title_am, message_en, message_am } = req.body;

    // Validate that we have at least one language version
    if (!title_en || !title_am) {
      return res.status(400).json({ success: false, message: 'Titles in both languages are required.' });
    }

    const notification = await Notification.create({
      type,
      title_en,
      title_am,
      message_en,
      message_am,
      sent_by: req.admin.id // Track which admin sent the alert
    });

    res.status(201).json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to broadcast alert.' });
  }
};

// @desc    Get notification history
// @route   GET /api/admin/notifications
exports.getNotificationHistory = async (req, res) => {
  try {
    const history = await Notification.findAll({ order: [['createdAt', 'DESC']] });
    res.status(200).json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching history.' });
  }
};