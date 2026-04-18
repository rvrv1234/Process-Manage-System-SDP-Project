const express = require('express');
const router = express.Router();
const { getNotifications, markAllAsRead } = require('../controllers/notificationController');

// GET /api/notifications/:userId  — fetch user's notifications
router.get('/:userId', getNotifications);

// PUT /api/notifications/:userId/read — mark all as read
router.put('/:userId/read', markAllAsRead);

module.exports = router;
