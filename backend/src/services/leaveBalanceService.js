async function ensureCurrentEmployeeBalances(db, employeeId) {
  await db.query(
    `
    INSERT INTO leave_balances
      (employee_id, leave_type_id, total_days, used_days, remaining_days, period_year, period_month)
    SELECT
      $1,
      lt.id,
      lt.total_days,
      0,
      lt.total_days,
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
      CASE
        WHEN lt.reset_period = 'MONTHLY' THEN EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
        ELSE NULL
      END
    FROM leave_types lt
    WHERE lt.is_active = TRUE
    ON CONFLICT DO NOTHING
    `,
    [employeeId]
  );
}

async function ensureEmployeeBalanceForPeriod(
  db,
  { employeeId, leaveTypeId, totalDays, year, month }
) {
  await db.query(
    `
    INSERT INTO leave_balances
      (employee_id, leave_type_id, total_days, used_days, remaining_days, period_year, period_month)
    VALUES ($1, $2, $3, 0, $3, $4, $5)
    ON CONFLICT DO NOTHING
    `,
    [employeeId, leaveTypeId, totalDays, year, month]
  );

  const result = await db.query(
    `
    SELECT id, total_days, used_days, remaining_days
    FROM leave_balances
    WHERE employee_id = $1
      AND leave_type_id = $2
      AND period_year = $3
      AND period_month IS NOT DISTINCT FROM $4
    FOR UPDATE
    `,
    [employeeId, leaveTypeId, year, month]
  );

  return result.rows[0] || null;
}

function allocateDaysByPeriod(startDate, endDate, resetPeriod) {
  if (
    typeof startDate !== "string" ||
    typeof endDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
  ) {
    return null;
  }

  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    new Date(start).toISOString().slice(0, 10) !== startDate ||
    new Date(end).toISOString().slice(0, 10) !== endDate ||
    end < start
  ) {
    return null;
  }

  const allocations = new Map();
  for (let day = start; day <= end; day += 24 * 60 * 60 * 1000) {
    const date = new Date(day);
    const year = date.getUTCFullYear();
    const month = resetPeriod === "MONTHLY" ? date.getUTCMonth() + 1 : null;
    const key = `${year}-${month || 0}`;
    const allocation = allocations.get(key) || { year, month, numberOfDays: 0 };
    allocation.numberOfDays += 1;
    allocations.set(key, allocation);
  }

  return [...allocations.values()].sort(
    (first, second) => first.year - second.year || (first.month || 0) - (second.month || 0)
  );
}

module.exports = {
  ensureCurrentEmployeeBalances,
  ensureEmployeeBalanceForPeriod,
  allocateDaysByPeriod,
};
