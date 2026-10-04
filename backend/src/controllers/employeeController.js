const pool = require("../config/database");
const bcrypt = require("bcryptjs");

async function createEmployee(req, res) {
  const { name, email, password } = req.body;

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !name.trim() ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({
      message: "Name, email, and password are required",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({
      message: "Enter a valid email address",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters",
    });
  }

  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;

    const leaveTypes = await client.query(
      "SELECT id, total_days FROM leave_types WHERE is_active = TRUE"
    );

    if (leaveTypes.rowCount === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(500).json({
        message: "No leave types are configured",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const employeeResult = await client.query(
      `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, 'EMPLOYEE')
      RETURNING id, name, email, role, created_at
      `,
      [name.trim(), normalizedEmail, passwordHash]
    );
    const employee = employeeResult.rows[0];

    await client.query(
      `
      INSERT INTO leave_balances
        (employee_id, leave_type_id, total_days, used_days, remaining_days, period_year, period_month)
      SELECT $1, id, total_days, 0, total_days
        , EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
        CASE WHEN reset_period = 'MONTHLY'
          THEN EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER ELSE NULL END
      FROM leave_types
      WHERE is_active = TRUE
      `,
      [employee.id]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(201).json({
      message: "Employee created successfully",
      employee,
    });
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }

    if (error.code === "23505") {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Failed to create employee",
    });
  } finally {
    client.release();
  }
}

async function getEmployees(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        email,
        role,
        created_at
      FROM users
      WHERE role = 'EMPLOYEE'
      ORDER BY name
    `);

    res.json({ employees: result.rows });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch employees",
    });
  }
}

module.exports = {
  createEmployee,
  getEmployees,
};
