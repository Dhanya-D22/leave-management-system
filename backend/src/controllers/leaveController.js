const pool = require("../config/database");
const {
  ensureCurrentEmployeeBalances,
  ensureEmployeeBalanceForPeriod,
  allocateDaysByPeriod,
} = require("../services/leaveBalanceService");

function calculateDays(startDate, endDate) {
  if (
    typeof startDate !== "string" ||
    typeof endDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
  ) {
    return NaN;
  }

  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    new Date(start).toISOString().slice(0, 10) !== startDate ||
    new Date(end).toISOString().slice(0, 10) !== endDate
  ) {
    return NaN;
  }
  return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
}


// Get leave types
async function getLeaveTypes(req, res) {
  try {
    await ensureCurrentEmployeeBalances(pool, req.user.id);
    const result = await pool.query(`
      SELECT
        lt.id,
        lt.name,
        lt.total_days,
        lt.description,
        lt.reset_period
      FROM leave_types lt
      WHERE lt.is_active = TRUE
      ORDER BY lt.id
    `);

    const leaveTypes = [];
    for (const type of result.rows) {
      const periods = req.query.start_date && req.query.end_date
        ? allocateDaysByPeriod(req.query.start_date, req.query.end_date, type.reset_period)
        : null;

      if (periods) {
        let remainingDays = 0;
        for (const period of periods) {
          const balance = await ensureEmployeeBalanceForPeriod(pool, {
            employeeId: req.user.id,
            leaveTypeId: type.id,
            totalDays: type.total_days,
            year: period.year,
            month: period.month,
          });
          remainingDays += Number(balance?.remaining_days || 0);
        }
        leaveTypes.push({
          ...type,
          remaining_days: remainingDays,
          balance_period_label: "selected period(s)",
        });
      } else {
        const balance = await pool.query(
          `
          SELECT remaining_days,
                 CASE WHEN period_month IS NULL THEN period_year::TEXT
                   ELSE period_year::TEXT || '-' || LPAD(period_month::TEXT, 2, '0')
                 END AS balance_period_label
          FROM leave_balances
          WHERE employee_id = $1 AND leave_type_id = $2
            AND period_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
            AND period_month IS NOT DISTINCT FROM CASE
              WHEN $3 = 'MONTHLY' THEN EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
              ELSE NULL
            END
          `,
          [req.user.id, type.id, type.reset_period]
        );
        leaveTypes.push({
          ...type,
          remaining_days: Number(balance.rows[0]?.remaining_days || 0),
          balance_period_label: balance.rows[0]?.balance_period_label || "current period",
        });
      }
    }

    res.json({ leaveTypes });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch leave types",
    });
  }
}


// Apply leave
async function applyLeave(req, res) {
  const client = await pool.connect();
  let transactionStarted = false;

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

    if (!Number.isInteger(numberOfDays) || numberOfDays <= 0) {
      return res.status(400).json({
        message: "Invalid dates",
      });
    }

    await client.query("BEGIN");
    transactionStarted = true;

    const typeResult = await client.query(
      `
      SELECT id, name, total_days, reset_period
      FROM leave_types
      WHERE id = $1 AND is_active = TRUE
      FOR SHARE
      `,
      [leave_type_id]
    );

    if (!typeResult.rows[0]) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(400).json({
        message: "This leave type is unavailable.",
      });
    }

    const leaveType = typeResult.rows[0];
    const allocations = allocateDaysByPeriod(start_date, end_date, leaveType.reset_period);
    if (!allocations || allocations.reduce((sum, row) => sum + row.numberOfDays, 0) !== numberOfDays) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(400).json({ message: "Invalid dates" });
    }

    const balances = [];
    for (const allocation of allocations) {
      const balance = await ensureEmployeeBalanceForPeriod(client, {
        employeeId: req.user.id,
        leaveTypeId: leaveType.id,
        totalDays: leaveType.total_days,
        year: allocation.year,
        month: allocation.month,
      });

      if (!balance) {
        await client.query("ROLLBACK");
        transactionStarted = false;
        return res.status(400).json({ message: "Leave balance could not be created." });
      }

      if (Number(balance.remaining_days) < allocation.numberOfDays) {
        await client.query("ROLLBACK");
        transactionStarted = false;
        return res.status(400).json({
          message: `Insufficient leave balance for ${allocation.month ? `month ${allocation.month}` : allocation.year}. ${balance.remaining_days} day(s) remain.`,
        });
      }

      balances.push({ balanceId: balance.id, numberOfDays: allocation.numberOfDays });
    }

    const result = await client.query(
      `
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

    for (const allocation of balances) {
      await client.query(
        `
        INSERT INTO leave_request_balance_allocations
          (leave_request_id, leave_balance_id, number_of_days)
        VALUES ($1, $2, $3)
        `,
        [result.rows[0].id, allocation.balanceId, allocation.numberOfDays]
      );
    }

    await client.query(
      `
      INSERT INTO notifications
        (recipient_id, leave_request_id, type, title, message, link)
      SELECT
        id, $1, 'LEAVE_SUBMITTED', 'New leave request',
        'A new leave request is waiting for your review.', '/admin/requests'
      FROM users
      WHERE role = 'ADMIN'
      `,
      [result.rows[0].id]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    res.status(201).json({
      message: "Leave request submitted",
      leave: result.rows[0],
    });
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }
    console.error(error);

    res.status(500).json({
      message: "Failed to apply leave",
    });
  } finally {
    client.release();
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
  let transactionStarted = false;

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
    transactionStarted = true;

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
      transactionStarted = false;

      return res.status(404).json({
        message: "Leave request not found",
      });
    }

    if (leave.status !== "PENDING") {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(400).json({
        message: "Leave request already processed",
      });
    }

    let periodBalances = [];
    if (status === "APPROVED") {
      let allocationResult = await client.query(
        `
        SELECT
          lb.id,
          lb.remaining_days,
          allocation.number_of_days,
          lb.period_year,
          lb.period_month
        FROM leave_request_balance_allocations allocation
        JOIN leave_balances lb ON lb.id = allocation.leave_balance_id
        WHERE allocation.leave_request_id = $1
        ORDER BY lb.period_year, COALESCE(lb.period_month, 0)
        FOR UPDATE OF lb
        `,
        [leave.id]
      );

      // Backfill allocations for pending requests created before period tracking.
      if (allocationResult.rowCount === 0) {
        const typeResult = await client.query(
          "SELECT total_days, reset_period FROM leave_types WHERE id = $1",
          [leave.leave_type_id]
        );
        const leaveType = typeResult.rows[0];
        const startDate = leave.start_date.toISOString
          ? leave.start_date.toISOString().slice(0, 10)
          : String(leave.start_date).slice(0, 10);
        const endDate = leave.end_date.toISOString
          ? leave.end_date.toISOString().slice(0, 10)
          : String(leave.end_date).slice(0, 10);
        const periods = leaveType
          ? allocateDaysByPeriod(startDate, endDate, leaveType.reset_period)
          : null;

        if (!periods) {
          await client.query("ROLLBACK");
          transactionStarted = false;
          return res.status(400).json({ message: "Unable to calculate this request's leave period." });
        }

        for (const period of periods) {
          const balance = await ensureEmployeeBalanceForPeriod(client, {
            employeeId: leave.employee_id,
            leaveTypeId: leave.leave_type_id,
            totalDays: leaveType.total_days,
            year: period.year,
            month: period.month,
          });
          if (!balance) {
            await client.query("ROLLBACK");
            transactionStarted = false;
            return res.status(400).json({ message: "Leave balance could not be created." });
          }

          await client.query(
            `
            INSERT INTO leave_request_balance_allocations
              (leave_request_id, leave_balance_id, number_of_days)
            VALUES ($1, $2, $3)
            `,
            [leave.id, balance.id, period.numberOfDays]
          );
        }

        allocationResult = await client.query(
          `
          SELECT lb.id, lb.remaining_days, allocation.number_of_days,
                 lb.period_year, lb.period_month
          FROM leave_request_balance_allocations allocation
          JOIN leave_balances lb ON lb.id = allocation.leave_balance_id
          WHERE allocation.leave_request_id = $1
          ORDER BY lb.period_year, COALESCE(lb.period_month, 0)
          FOR UPDATE OF lb
          `,
          [leave.id]
        );
      }

      periodBalances = allocationResult.rows;
      const allocatedDays = periodBalances.reduce(
        (sum, row) => sum + Number(row.number_of_days),
        0
      );
      if (
        allocatedDays !== Number(leave.number_of_days) ||
        periodBalances.some((row) => Number(row.remaining_days) < Number(row.number_of_days))
      ) {
        await client.query("ROLLBACK");
        transactionStarted = false;
        return res.status(400).json({
          message: "This request exceeds the employee's remaining leave balance for one or more periods.",
        });
      }
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

    if (status === "APPROVED") {
      for (const allocation of periodBalances) {
        await client.query(
          `
          UPDATE leave_balances
          SET used_days = used_days + $1,
              remaining_days = remaining_days - $1
          WHERE id = $2
          `,
          [allocation.number_of_days, allocation.id]
        );
      }
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
    transactionStarted = false;

    res.json({
      message:
        status === "APPROVED"
          ? "Leave approved"
          : "Leave rejected",
    });
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }

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
    await ensureCurrentEmployeeBalances(pool, req.user.id);
    const result = await pool.query(
      `
      SELECT
        lb.id,
        lt.name,
        lb.total_days,
        lb.used_days,
        lb.remaining_days,
        lb.period_year,
        lb.period_month,
        lt.reset_period
      FROM leave_balances lb

      JOIN leave_types lt
        ON lt.id = lb.leave_type_id

      WHERE lb.employee_id = $1
      AND lt.is_active = TRUE
      AND lb.period_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
      AND lb.period_month IS NOT DISTINCT FROM CASE
        WHEN lt.reset_period = 'MONTHLY' THEN EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
        ELSE NULL
      END

      ORDER BY lt.id
      `,
      [req.user.id]
    );

    const history = await pool.query(
      `
      SELECT
        lb.id,
        lt.name,
        lb.total_days,
        lb.used_days,
        lb.remaining_days,
        lb.period_year,
        lb.period_month,
        lt.reset_period
      FROM leave_balances lb
      JOIN leave_types lt ON lt.id = lb.leave_type_id
      WHERE lb.employee_id = $1
        AND NOT (
          lb.period_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
          AND lb.period_month IS NOT DISTINCT FROM CASE
            WHEN lt.reset_period = 'MONTHLY' THEN EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
            ELSE NULL
          END
        )
      ORDER BY lb.period_year DESC, lb.period_month DESC NULLS LAST, lt.id
      `,
      [req.user.id]
    );

    res.json({ balances: result.rows, history: history.rows });
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
