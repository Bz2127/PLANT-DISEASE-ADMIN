const express = require('express');
const router = express.Router();

const {
  createNotification,
  getNotifications
} = require('../controllers/notificationController');

router.post('/notifications', createNotification);
router.get('/notifications', getNotifications);

module.exports = router;