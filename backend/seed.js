require("dotenv").config();

const bcrypt = require("bcryptjs");

const pool = require("./src/config/database");

async function seed() {
  try {
    const password =
      await bcrypt.hash(
        "Password@123",
        10
      );

    // Admin
    await pool.query(
      `
      INSERT INTO users
      (name, email, password, role)

      VALUES
      ($1, $2, $3, $4)

      ON CONFLICT (email)
      DO UPDATE SET
        password = EXCLUDED.password,
        role = EXCLUDED.role
      `,
      [
        "System Admin",
        "admin@example.com",
        password,
        "ADMIN",
      ]
    );


    // Employee
    await pool.query(
      `
      INSERT INTO users
      (name, email, password, role)

      VALUES
      ($1, $2, $3, $4)

      ON CONFLICT (email)
      DO UPDATE SET
        password = EXCLUDED.password,
        role = EXCLUDED.role
      `,
      [
        "Dhanya Poojary",
        "employee@example.com",
        password,
        "EMPLOYEE",
      ]
    );


    // Employee balance
    await pool.query(
      `
      INSERT INTO leave_balances
      (
        employee_id,
        leave_type_id,
        total_days,
        used_days,
        remaining_days,
        period_year,
        period_month
      )

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

      WHERE u.email = 'employee@example.com'
      AND lt.is_active = TRUE

      ON CONFLICT DO NOTHING
      `
    );


    console.log("Database seed completed.");
    console.log("");
    console.log("Admin:");
    console.log("Email: admin@example.com");
    console.log("Password: Password@123");
    console.log("");
    console.log("Employee:");
    console.log("Email: employee@example.com");
    console.log("Password: Password@123");

  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}

seed();
