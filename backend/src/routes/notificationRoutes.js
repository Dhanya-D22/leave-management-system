const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getNotifications,
  markNotificationRead,
} = require("../controllers/notificationController");

router.get("/", authMiddleware, getNotifications);
router.put("/:id/read", authMiddleware, markNotificationRead);

module.exports = router;
