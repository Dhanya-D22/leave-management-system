const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  getAdminLeaveTypes,
  createLeaveType,
  updateLeaveType,
  setLeaveTypeActive,
} = require("../controllers/leaveTypeController");

router.use(authMiddleware, roleMiddleware("ADMIN"));
router.get("/", getAdminLeaveTypes);
router.post("/", createLeaveType);
router.put("/:id", updateLeaveType);
router.patch("/:id/active", setLeaveTypeActive);

module.exports = router;
