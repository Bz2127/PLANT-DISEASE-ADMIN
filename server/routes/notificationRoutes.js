const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.post('/notifications', protectAdmin, notificationController.sendNotification);
router.get('/notifications', protectAdmin, notificationController.getNotificationHistory);

module.exports = router;