const router = require("express").Router();

const authMiddleware = require("../middleware/authMiddleware");

const roleMiddleware = require("../middleware/roleMiddleware");

const {
  employeeDashboard,
  adminDashboard,
} = require("../controllers/dashboardController");


router.get(
  "/employee",
  authMiddleware,
  roleMiddleware("EMPLOYEE"),
  employeeDashboard
);


router.get(
  "/admin",
  authMiddleware,
  roleMiddleware("ADMIN"),
  adminDashboard
);


module.exports = router;