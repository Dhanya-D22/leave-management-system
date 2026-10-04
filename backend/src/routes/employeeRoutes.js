const router = require("express").Router();

const authMiddleware = require("../middleware/authMiddleware");

const roleMiddleware = require("../middleware/roleMiddleware");

const {
  createEmployee,
  deleteEmployee,
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

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  deleteEmployee
);

module.exports = router;