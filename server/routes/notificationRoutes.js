const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

router.post('/notifications', authMiddleware, notificationController.sendNotification);
router.get('/notifications', authMiddleware, notificationController.getNotificationHistory);

module.exports = router;