CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('ADMIN', 'EMPLOYEE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS leave_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) UNIQUE NOT NULL,
    total_days INTEGER NOT NULL,
    description TEXT
);


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

    UNIQUE(employee_id, leave_type_id)
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
