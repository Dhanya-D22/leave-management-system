const pool = require("../config/database");
const { ensureCurrentEmployeeBalances } = require("../services/leaveBalanceService");


// Employee dashboard
async function employeeDashboard(req, res) {
  try {
    await ensureCurrentEmployeeBalances(pool, req.user.id);
    const balances = await pool.query(
      `
      SELECT
        lb.id,
        lb.leave_type_id,
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

    const recent = await pool.query(
      `
      SELECT
        lr.id,
        lt.name AS leave_type,
        lr.start_date,
        lr.end_date,
        lr.number_of_days,
        lr.status
      FROM leave_requests lr

      JOIN leave_types lt
        ON lt.id = lr.leave_type_id

      WHERE lr.employee_id = $1

      ORDER BY lr.created_at DESC

      LIMIT 5
      `,
      [req.user.id]
    );

    const requestStats = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE status = 'PENDING') AS pending,
        COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved
      FROM leave_requests
      WHERE employee_id = $1
      `,
      [req.user.id]
    );

    res.json({
      balances: balances.rows,
      recentRequests: recent.rows,
      stats: requestStats.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to load dashboard",
    });
  }
}


// Admin dashboard
async function adminDashboard(req, res) {
  try {
    const stats = await pool.query(`
      SELECT

        (
          SELECT COUNT(*)
          FROM users
          WHERE role = 'EMPLOYEE'
        ) AS employees,

        (
          SELECT COUNT(*)
          FROM leave_requests
          WHERE status = 'PENDING'
        ) AS pending,

        (
          SELECT COUNT(*)
          FROM leave_requests
          WHERE status = 'APPROVED'
        ) AS approved,

        (
          SELECT COUNT(*)
          FROM leave_requests
          WHERE status = 'REJECTED'
        ) AS rejected
    `);

    const recent = await pool.query(`
      SELECT
        lr.id,
        u.name AS employee_name,
        u.email AS employee_email,
        lt.name AS leave_type,
        lr.start_date,
        lr.end_date,
        lr.number_of_days,
        lr.status
      FROM leave_requests lr

      JOIN users u
        ON u.id = lr.employee_id

      JOIN leave_types lt
        ON lt.id = lr.leave_type_id

      ORDER BY lr.created_at DESC

      LIMIT 8
    `);

    res.json({
      stats: stats.rows[0],
      recentRequests: recent.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to load admin dashboard",
    });
  }
}

module.exports = {
  employeeDashboard,
  adminDashboard,
};
