const { createHash, randomBytes } = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const pool = require("../config/database");

const RESET_TOKEN_TTL_MINUTES = 15;

function createMailer() {
  const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD, MAIL_FROM } =
    process.env;
  const port = Number(MAIL_PORT);

  if (
    !MAIL_HOST ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !MAIL_USER ||
    !MAIL_PASSWORD ||
    !MAIL_FROM
  ) {
    throw new Error("Password reset email settings are incomplete");
  }

  return nodemailer.createTransport({
    host: MAIL_HOST,
    port,
    secure: port === 465,
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASSWORD,
    },
  });
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

async function requestPasswordReset(req, res) {
  const { email } = req.body || {};

  if (typeof email !== "string" || !email.trim()) {
    return res.status(400).json({
      message: "Email is required",
    });
  }

  let transporter;
  try {
    transporter = createMailer();
  } catch (error) {
    console.error(error.message);
    return res.status(503).json({
      message: "Password reset email is not configured on the server",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  let user;

  try {
    const result = await pool.query(
      `
      SELECT id, name, email
      FROM users
      WHERE LOWER(email) = $1
      `,
      [normalizedEmail]
    );
    user = result.rows[0];
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Unable to process password reset request",
    });
  }

  if (!user) {
    return res.json({
      message:
        "If an account exists for that email, a password reset link will be sent.",
    });
  }

  let resetUrl;
  try {
    resetUrl = new URL(
      "/reset-password",
      process.env.FRONTEND_URL || "http://localhost:5173"
    );
  } catch (error) {
    console.error("Invalid frontend URL for password reset:", error);
    return res.status(503).json({
      message: "Password reset is not configured correctly on the server",
    });
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;
    await client.query(
      `
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE user_id = $1 AND used_at IS NULL
      `,
      [user.id]
    );
    await client.query(
      `
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 minute'))
      `,
      [user.id, tokenHash, RESET_TOKEN_TTL_MINUTES]
    );
    await client.query("COMMIT");
    transactionStarted = false;
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }
    console.error(error);
    return res.status(500).json({
      message: "Unable to process password reset request",
    });
  } finally {
    client.release();
  }

  resetUrl.searchParams.set("token", token);

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: user.email,
      subject: "Reset your LeaveTrack password",
      text: `Hello ${user.name},\n\nUse this link to reset your password within ${RESET_TOKEN_TTL_MINUTES} minutes:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      html: `
        <p>Hello ${escapeHtml(user.name)},</p>
        <p>Use the link below to reset your LeaveTrack password. It expires in ${RESET_TOKEN_TTL_MINUTES} minutes.</p>
        <p><a href="${escapeHtml(resetUrl.toString())}">Reset password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    });
  } catch (error) {
    await pool.query(
      `
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE token_hash = $1 AND used_at IS NULL
      `,
      [tokenHash]
    );
    console.error("Failed to send password reset email:", error);
    return res.status(503).json({
      message: "Unable to send the reset email. Please try again later.",
    });
  }

  return res.json({
    message:
      "If an account exists for that email, a password reset link will be sent.",
  });
}

async function resetPassword(req, res) {
  const { token, password } = req.body || {};

  if (
    typeof token !== "string" ||
    !/^[a-f0-9]{64}$/i.test(token) ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    return res.status(400).json({
      message:
        "A valid reset token and a password of at least 8 characters are required",
    });
  }

  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;

    const tokenResult = await client.query(
      `
      SELECT id, user_id
      FROM password_reset_tokens
      WHERE token_hash = $1
        AND used_at IS NULL
        AND expires_at > NOW()
      FOR UPDATE
      `,
      [hashToken(token)]
    );

    if (tokenResult.rowCount === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(400).json({
        message: "This password reset link is invalid or has expired",
      });
    }

    const resetToken = tokenResult.rows[0];
    const passwordHash = await bcrypt.hash(password, 10);
    await client.query(
      "UPDATE users SET password = $1 WHERE id = $2",
      [passwordHash, resetToken.user_id]
    );
    await client.query(
      `
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE user_id = $1 AND used_at IS NULL
      `,
      [resetToken.user_id]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return res.json({
      message: "Password reset successfully. You can now sign in.",
    });
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }
    console.error(error);
    return res.status(500).json({
      message: "Unable to reset password",
    });
  } finally {
    client.release();
  }
}

module.exports = {
  requestPasswordReset,
  resetPassword,
};
