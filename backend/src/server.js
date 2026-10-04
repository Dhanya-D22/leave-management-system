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

    await pool.query(`
      ALTER TABLE leave_types
      ADD COLUMN IF NOT EXISTS reset_period VARCHAR(10) NOT NULL DEFAULT 'YEARLY'
    `);
    await pool.query("ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS period_year INTEGER");
    await pool.query("ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS period_month INTEGER");
    await pool.query(`
      UPDATE leave_balances lb
      SET period_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
      WHERE period_year IS NULL
    `);
    await pool.query(`
      UPDATE leave_balances lb
      SET period_month = EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
      FROM leave_types lt
      WHERE lt.id = lb.leave_type_id
        AND lt.reset_period = 'MONTHLY'
        AND lb.period_month IS NULL
    `);
    await pool.query("ALTER TABLE leave_balances ALTER COLUMN period_year SET NOT NULL");
    await pool.query(`
      ALTER TABLE leave_balances
      DROP CONSTRAINT IF EXISTS leave_balances_employee_id_leave_type_id_key
    `);
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS leave_balances_period_unique_idx
      ON leave_balances
      (employee_id, leave_type_id, period_year, COALESCE(period_month, 0))
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leave_request_balance_allocations (
        id SERIAL PRIMARY KEY,
        leave_request_id INTEGER NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
        leave_balance_id INTEGER NOT NULL REFERENCES leave_balances(id) ON DELETE RESTRICT,
        number_of_days INTEGER NOT NULL CHECK (number_of_days > 0),
        UNIQUE (leave_request_id, leave_balance_id)
      )
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
