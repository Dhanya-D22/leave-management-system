const pool = require("../config/database");

function calculateDays(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  const difference = end - start;

  return Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;
}


// Get leave types
async function getLeaveTypes(req, res) {
  try {
    const result = await pool.query(`
      SELECT *
      FROM leave_types
      ORDER BY id
    `);

    res.json({ leaveTypes: result.rows });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch leave types",
    });
  }
}


// Apply leave
async function applyLeave(req, res) {
  try {
    const {
      leave_type_id,
      start_date,
      end_date,
      reason,
    } = req.body;

    if (
      !leave_type_id ||
      !start_date ||
      !end_date ||
      !reason
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const numberOfDays = calculateDays(
      start_date,
      end_date
    );

    if (numberOfDays <= 0) {
      return res.status(400).json({
        message: "Invalid dates",
      });
    }

    // Check balance
    const balance = await pool.query(
      `
      SELECT remaining_days
      FROM leave_balances
      WHERE employee_id = $1
      AND leave_type_id = $2
      `,
      [req.user.id, leave_type_id]
    );

    if (!balance.rows[0]) {
      return res.status(400).json({
        message: "Leave balance not found",
      });
    }

    if (
      balance.rows[0].remaining_days <
      numberOfDays
    ) {
      return res.status(400).json({
        message: "Insufficient leave balance",
      });
    }

    const result = await pool.query(
      `
      WITH new_leave AS (
      INSERT INTO leave_requests
      (
        employee_id,
        leave_type_id,
        start_date,
        end_date,
        number_of_days,
        reason,
        status
      )
      VALUES
      ($1, $2, $3, $4, $5, $6, 'PENDING')
      RETURNING *
      ), notification_rows AS (
        INSERT INTO notifications
        (recipient_id, leave_request_id, type, title, message, link)
        SELECT
          users.id,
          new_leave.id,
          'LEAVE_SUBMITTED',
          'New leave request',
          'A new leave request is waiting for your review.',
          '/admin/requests'
        FROM users
        CROSS JOIN new_leave
        WHERE users.role = 'ADMIN'
        RETURNING id
      )
      SELECT * FROM new_leave
      `,
      [
        req.user.id,
        leave_type_id,
        start_date,
        end_date,
        numberOfDays,
        reason,
      ]
    );

    res.status(201).json({
      message: "Leave request submitted",
      leave: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to apply leave",
    });
  }
}


// Employee leave history
async function getMyLeaves(req, res) {
  try {
    const result = await pool.query(
      `
      SELECT
        lr.id,
        lt.name AS leave_type,
        lr.start_date,
        lr.end_date,
        lr.number_of_days,
        lr.reason,
        lr.status,
        lr.created_at
      FROM leave_requests lr
      JOIN leave_types lt
        ON lt.id = lr.leave_type_id
      WHERE lr.employee_id = $1
      ORDER BY lr.created_at DESC
      `,
      [req.user.id]
    );

    res.json({ requests: result.rows });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch leave history",
    });
  }
}


// Admin: all leave requests
async function getAllLeaves(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        lr.id,
        u.name AS employee_name,
        u.email AS employee_email,
        lt.name AS leave_type,
        lr.start_date,
        lr.end_date,
        lr.number_of_days,
        lr.reason,
        lr.status,
        lr.created_at
      FROM leave_requests lr

      JOIN users u
        ON u.id = lr.employee_id

      JOIN leave_types lt
        ON lt.id = lr.leave_type_id

      ORDER BY lr.created_at DESC
    `);

    res.json({ requests: result.rows });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch leave requests",
    });
  }
}


// Admin: approve / reject
async function updateLeaveStatus(req, res) {
  const client = await pool.connect();

  try {
    const { status } = req.body;
    const leaveId = req.params.id;

    if (
      status !== "APPROVED" &&
      status !== "REJECTED"
    ) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    await client.query("BEGIN");

    const leaveResult = await client.query(
      `
      SELECT *
      FROM leave_requests
      WHERE id = $1
      FOR UPDATE
      `,
      [leaveId]
    );

    const leave = leaveResult.rows[0];

    if (!leave) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Leave request not found",
      });
    }

    if (leave.status !== "PENDING") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Leave request already processed",
      });
    }

    await client.query(
      `
      UPDATE leave_requests
      SET
        status = $1,
        approved_by = $2,
        updated_at = NOW()
      WHERE id = $3
      `,
      [status, req.user.id, leaveId]
    );

    // Reduce balance only when approved
    if (status === "APPROVED") {
      await client.query(
        `
        UPDATE leave_balances
        SET
          used_days = used_days + $1,
          remaining_days = remaining_days - $1
        WHERE employee_id = $2
        AND leave_type_id = $3
        `,
        [
          leave.number_of_days,
          leave.employee_id,
          leave.leave_type_id,
        ]
      );
    }

    await client.query(
      `
      INSERT INTO notifications
      (recipient_id, leave_request_id, type, title, message, link)
      VALUES ($1, $2, 'LEAVE_STATUS', $3, $4, '/leave-history')
      `,
      [
        leave.employee_id,
        leave.id,
        status === "APPROVED" ? "Leave approved" : "Leave rejected",
        `Your ${leave.number_of_days}-day leave request was ${status.toLowerCase()}.`,
      ]
    );

    await client.query("COMMIT");

    res.json({
      message:
        status === "APPROVED"
          ? "Leave approved"
          : "Leave rejected",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    res.status(500).json({
      message: "Failed to update leave status",
    });
  } finally {
    client.release();
  }
}


// Employee balance
async function getMyBalance(req, res) {
  try {
    const result = await pool.query(
      `
      SELECT
        lb.id,
        lt.name,
        lb.total_days,
        lb.used_days,
        lb.remaining_days
      FROM leave_balances lb

      JOIN leave_types lt
        ON lt.id = lb.leave_type_id

      WHERE lb.employee_id = $1

      ORDER BY lt.id
      `,
      [req.user.id]
    );

    res.json({ balances: result.rows });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch leave balance",
    });
  }
}

module.exports = {
  getLeaveTypes,
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  getMyBalance,
};
