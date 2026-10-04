const router = require("express").Router();

const {
  login,
} = require("../controllers/authController");
const {
  requestPasswordReset,
  resetPassword,
} = require("../controllers/passwordResetController");
const { rateLimit } = require("express-rate-limit");

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many password reset attempts. Please try again later.",
  },
});

router.post("/login", login);
router.post("/forgot-password", passwordResetLimiter, requestPasswordReset);
router.post("/reset-password", passwordResetLimiter, resetPassword);

module.exports = router;