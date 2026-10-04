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

async function getAdminLeaveTypes(req, res) {
  try {
    const result = await pool.query(`
      SELECT id, name, total_days, description, is_active
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
  const { name, total_days, description = "" } = req.body;
  const validationError = validateLeaveType(name, total_days);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const created = await client.query(
      `
      INSERT INTO leave_types (name, total_days, description)
      VALUES ($1, $2, $3)
      RETURNING id, name, total_days, description, is_active
      `,
      [name.trim(), Number(total_days), String(description).trim()]
    );
    const leaveType = created.rows[0];

    await client.query(
      `
      INSERT INTO leave_balances
        (employee_id, leave_type_id, total_days, used_days, remaining_days)
      SELECT id, $1, $2, 0, $2
      FROM users
      WHERE role = 'EMPLOYEE'
      ON CONFLICT (employee_id, leave_type_id) DO NOTHING
      `,
      [leaveType.id, leaveType.total_days]
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
  const { name, total_days, description = "" } = req.body;
  const validationError = validateLeaveType(name, total_days);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updated = await client.query(
      `
      UPDATE leave_types
      SET name = $1, total_days = $2, description = $3
      WHERE id = $4
      RETURNING id, name, total_days, description, is_active
      `,
      [name.trim(), Number(total_days), String(description).trim(), req.params.id]
    );

    if (updated.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Leave type not found" });
    }

    const leaveType = updated.rows[0];
    await client.query(
      `
      INSERT INTO leave_balances
        (employee_id, leave_type_id, total_days, used_days, remaining_days)
      SELECT id, $1, $2, 0, $2
      FROM users
      WHERE role = 'EMPLOYEE'
      ON CONFLICT (employee_id, leave_type_id) DO UPDATE
      SET total_days = EXCLUDED.total_days,
          remaining_days = GREATEST(EXCLUDED.total_days - leave_balances.used_days, 0)
      `,
      [leaveType.id, leaveType.total_days]
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
      RETURNING id, name, total_days, description, is_active
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
