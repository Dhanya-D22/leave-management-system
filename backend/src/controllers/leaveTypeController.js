const pool = require("../config/database");

function validateLeaveType(name, totalDays) {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
    return "Enter a leave type name with at most 80 characters.";
  }

  const parsedDays = Number(totalDays);
  if (!Number.isInteger(parsedDays) || parsedDays < 1 || parsedDays > 3650) {
    return "Allowed days must be a whole number between 1 and 3650.";
  }

  return null;
}

function validateResetPeriod(resetPeriod) {
  return resetPeriod === "YEARLY" || resetPeriod === "MONTHLY"
    ? null
    : "Choose a yearly or monthly reset period.";
}

async function getAdminLeaveTypes(req, res) {
  try {
    const result = await pool.query(`
      SELECT id, name, total_days, description, reset_period, is_active
      FROM leave_types
      ORDER BY id
    `);
    res.json({ leaveTypes: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load leave types" });
  }
}

async function createLeaveType(req, res) {
  const { name, total_days, description = "", reset_period = "YEARLY" } = req.body;
  const validationError = validateLeaveType(name, total_days) || validateResetPeriod(reset_period);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const created = await client.query(
      `
      INSERT INTO leave_types (name, total_days, description, reset_period)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, total_days, description, reset_period, is_active
      `,
      [name.trim(), Number(total_days), String(description).trim(), reset_period]
    );
    const leaveType = created.rows[0];

    await client.query(
      `
      INSERT INTO leave_balances
        (employee_id, leave_type_id, total_days, used_days, remaining_days, period_year, period_month)
      SELECT
        u.id,
        lt.id,
        lt.total_days,
        0,
        lt.total_days,
        EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
        CASE WHEN lt.reset_period = 'MONTHLY'
          THEN EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER ELSE NULL END
      FROM users u
      CROSS JOIN leave_types lt
      WHERE u.role = 'EMPLOYEE' AND lt.id = $1
      ON CONFLICT DO NOTHING
      `,
      [leaveType.id]
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Leave type created", leaveType });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      return res.status(409).json({ message: "A leave type with this name already exists" });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to create leave type" });
  } finally {
    client.release();
  }
}

async function updateLeaveType(req, res) {
  const { name, total_days, description = "", reset_period = "YEARLY" } = req.body;
  const validationError = validateLeaveType(name, total_days) || validateResetPeriod(reset_period);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updated = await client.query(
      `
      UPDATE leave_types
      SET name = $1, total_days = $2, description = $3, reset_period = $4
      WHERE id = $5
      RETURNING id, name, total_days, description, reset_period, is_active
      `,
      [name.trim(), Number(total_days), String(description).trim(), reset_period, req.params.id]
    );

    if (updated.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Leave type not found" });
    }

    const leaveType = updated.rows[0];
    await client.query(
      `
      INSERT INTO leave_balances
        (employee_id, leave_type_id, total_days, used_days, remaining_days, period_year, period_month)
      SELECT
        u.id,
        lt.id,
        lt.total_days,
        0,
        lt.total_days,
        EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
        CASE WHEN lt.reset_period = 'MONTHLY'
          THEN EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER ELSE NULL END
      FROM users u
      CROSS JOIN leave_types lt
      WHERE u.role = 'EMPLOYEE' AND lt.id = $1
      ON CONFLICT DO NOTHING
      `,
      [leaveType.id]
    );

    await client.query(
      `
      UPDATE leave_balances lb
      SET total_days = $2,
          remaining_days = GREATEST($2 - lb.used_days, 0)
      WHERE lb.leave_type_id = $1
        AND lb.period_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
        AND lb.period_month IS NOT DISTINCT FROM CASE
          WHEN $3 = 'MONTHLY' THEN EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
          ELSE NULL
        END
      `,
      [leaveType.id, leaveType.total_days, leaveType.reset_period]
    );

    await client.query("COMMIT");
    res.json({ message: "Leave type updated", leaveType });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      return res.status(409).json({ message: "A leave type with this name already exists" });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to update leave type" });
  } finally {
    client.release();
  }
}

async function setLeaveTypeActive(req, res) {
  const { is_active } = req.body;
  if (typeof is_active !== "boolean") {
    return res.status(400).json({ message: "is_active must be true or false" });
  }

  try {
    const result = await pool.query(
      `
      UPDATE leave_types
      SET is_active = $1
      WHERE id = $2
      RETURNING id, name, total_days, description, reset_period, is_active
      `,
      [is_active, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Leave type not found" });
    }

    res.json({ message: "Leave type status updated", leaveType: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update leave type status" });
  }
}

module.exports = {
  getAdminLeaveTypes,
  createLeaveType,
  updateLeaveType,
  setLeaveTypeActive,
};
