const express = require("express");

const router = express.Router();

const NotificationController = require("../controllers/notification.controller");

const authMiddleware = require("../middleware/auth.middleware");

// ==========================================
// GET MY NOTIFICATIONS
// ==========================================

router.get(
  "/",
  authMiddleware,
  NotificationController.getMyNotifications
);

// ==========================================
// MARK ONE AS READ
// ==========================================

router.put(
  "/:id/read",
  authMiddleware,
  NotificationController.markAsRead
);

// ==========================================
// MARK ALL AS READ
// ==========================================

router.put(
  "/read-all",
  authMiddleware,
  NotificationController.markAllAsRead
);

module.exports = router;