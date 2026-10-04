const router = require("express").Router();

const authMiddleware = require("../middleware/authMiddleware");

const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getLeaveTypes,
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  getMyBalance,
} = require("../controllers/leaveController");


// Leave types
router.get(
  "/types",
  authMiddleware,
  getLeaveTypes
);


// Employee
router.post(
  "/",
  authMiddleware,
  roleMiddleware("EMPLOYEE"),
  applyLeave
);

router.get(
  "/my",
  authMiddleware,
  roleMiddleware("EMPLOYEE"),
  getMyLeaves
);

router.get(
  "/balance",
  authMiddleware,
  roleMiddleware("EMPLOYEE"),
  getMyBalance
);


// Admin
router.get(
  "/all",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getAllLeaves
);

router.put(
  "/:id/status",
  authMiddleware,
  roleMiddleware("ADMIN"),
  updateLeaveStatus
);

module.exports = router;