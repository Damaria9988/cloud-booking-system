-- Create Recurring Schedules table for SQLite
CREATE TABLE IF NOT EXISTS recurring_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    recurrence_type TEXT NOT NULL, -- 'daily' | 'weekly'
    recurrence_days TEXT,          -- JSON array string for weekly: '["Monday","Wednesday"]'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    price_override REAL,
    seat_capacity_override INTEGER,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_route_id ON recurring_schedules(route_id);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_status ON recurring_schedules(status);

