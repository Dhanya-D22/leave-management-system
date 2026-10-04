CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('ADMIN', 'EMPLOYEE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx
    ON password_reset_tokens (user_id);


CREATE TABLE IF NOT EXISTS leave_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) UNIQUE NOT NULL,
    total_days INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    reset_period VARCHAR(10) NOT NULL DEFAULT 'YEARLY'
        CHECK (reset_period IN ('YEARLY', 'MONTHLY'))
);

ALTER TABLE leave_types
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE leave_types
    ADD COLUMN IF NOT EXISTS reset_period VARCHAR(10) NOT NULL DEFAULT 'YEARLY';


CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,

    employee_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    leave_type_id INTEGER NOT NULL
        REFERENCES leave_types(id),

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    number_of_days INTEGER NOT NULL,

    reason TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (
            status IN (
                'PENDING',
                'APPROVED',
                'REJECTED'
            )
        ),

    approved_by INTEGER
        REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,
    leave_request_id INTEGER NOT NULL
        REFERENCES leave_requests(id)
        ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    title VARCHAR(160) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx
    ON notifications (recipient_id, created_at DESC);


CREATE TABLE IF NOT EXISTS leave_balances (
    id SERIAL PRIMARY KEY,

    employee_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    leave_type_id INTEGER NOT NULL
        REFERENCES leave_types(id)
        ON DELETE CASCADE,

    total_days INTEGER NOT NULL DEFAULT 0,

    used_days INTEGER NOT NULL DEFAULT 0,

    remaining_days INTEGER NOT NULL DEFAULT 0,
    period_year INTEGER,
    period_month INTEGER
);

ALTER TABLE leave_balances
    ADD COLUMN IF NOT EXISTS period_year INTEGER;

ALTER TABLE leave_balances
    ADD COLUMN IF NOT EXISTS period_month INTEGER;

UPDATE leave_balances lb
SET period_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
WHERE period_year IS NULL;

UPDATE leave_balances lb
SET period_month = EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
FROM leave_types lt
WHERE lt.id = lb.leave_type_id
  AND lt.reset_period = 'MONTHLY'
  AND lb.period_month IS NULL;

ALTER TABLE leave_balances
    ALTER COLUMN period_year SET NOT NULL;

ALTER TABLE leave_balances
    DROP CONSTRAINT IF EXISTS leave_balances_employee_id_leave_type_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS leave_balances_period_unique_idx
    ON leave_balances
    (employee_id, leave_type_id, period_year, COALESCE(period_month, 0));

CREATE TABLE IF NOT EXISTS leave_request_balance_allocations (
    id SERIAL PRIMARY KEY,
    leave_request_id INTEGER NOT NULL
        REFERENCES leave_requests(id)
        ON DELETE CASCADE,
    leave_balance_id INTEGER NOT NULL
        REFERENCES leave_balances(id)
        ON DELETE RESTRICT,
    number_of_days INTEGER NOT NULL CHECK (number_of_days > 0),
    UNIQUE (leave_request_id, leave_balance_id)
);


INSERT INTO leave_types
(name, total_days, description)

VALUES
(
    'Casual Leave',
    12,
    'Leave for personal requirements'
),
(
    'Sick Leave',
    10,
    'Leave due to illness'
),
(
    'Earned Leave',
    15,
    'Planned annual leave'
)

ON CONFLICT (name) DO NOTHING;
