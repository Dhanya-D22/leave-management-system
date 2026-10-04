const router = require("express").Router();

const authMiddleware = require("../middleware/authMiddleware");

const roleMiddleware = require("../middleware/roleMiddleware");

const {
  createEmployee,
  getEmployees,
} = require("../controllers/employeeController");

router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  createEmployee
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getEmployees
);

module.exports = router;