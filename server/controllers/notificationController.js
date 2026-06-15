const Notification = require('../models/Notification');

exports.sendNotification = async (req, res) => {
  try {
    const { type, title_en, title_am, message_en, message_am } = req.body;

    if (!type || !title_en || !title_am || !message_en || !message_am) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const notification = await Notification.create({
      type,
      title_en,
      title_am,
      message_en,
      message_am,
      sent_by: req.admin ? req.admin.id : null
    });

    res.status(201).json({
      success: true,
      data: notification
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to broadcast alert.',
      error: err.message
    });
  }
};

exports.getNotificationHistory = async (req, res) => {
  try {
    const history = await Notification.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: history
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching history.',
      error: err.message
    });
  }
};