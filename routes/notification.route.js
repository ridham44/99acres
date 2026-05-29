const express = require('express');
const controller = require('../controllers/notification.controller');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

// All notification endpoints require valid JWT authentication
router.use(auth);

router.get('/', controller.getNotifications);
router.put('/mark-all-read', controller.markAllAsRead);
router.put('/:id/read', controller.markAsRead);
router.delete('/:id', controller.deleteNotification);

module.exports = router;
