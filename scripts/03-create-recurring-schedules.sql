-- Create Recurring Schedules table
CREATE TABLE IF NOT EXISTS recurring_schedules (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    recurrence_type VARCHAR(20) NOT NULL, -- 'daily' | 'weekly'
    recurrence_days TEXT[] NULL,          -- ['Monday', 'Wednesday'] for weekly
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    price_override NUMERIC(10,2) NULL,
    seat_capacity_override INTEGER NULL,
    status VARCHAR(20) DEFAULT 'active',  -- 'active' | 'disabled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_route_id ON recurring_schedules(route_id);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_status ON recurring_schedules(status);

