const app = require("./app");
const pool = require("./config/database");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Keep existing installations in sync with the current leave type model.
    await pool.query(`
      ALTER TABLE leave_types
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE
    `);

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to apply database migrations:", error);
    process.exit(1);
  }
}

startServer();
