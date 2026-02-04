-- Create Date Price Overrides table for dynamic pricing
CREATE TABLE IF NOT EXISTS date_price_overrides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    travel_date DATE NOT NULL,
    price_override REAL NOT NULL,
    reason TEXT, -- 'holiday', 'festival', 'weekend', 'special_event', 'manual'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(route_id, travel_date)
);

-- Create Holidays table for holiday management
CREATE TABLE IF NOT EXISTS holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    type TEXT DEFAULT 'national', -- 'national', 'regional', 'festival'
    is_recurring BOOLEAN DEFAULT 0, -- If true, applies every year
    price_multiplier REAL DEFAULT 1.5, -- Default 1.5x for holidays (50% increase)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, name)
);

-- Create Recurring Schedule Price Rules table for pattern-based pricing
CREATE TABLE IF NOT EXISTS recurring_schedule_price_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recurring_schedule_id INTEGER REFERENCES recurring_schedules(id) ON DELETE CASCADE,
    day_of_week TEXT, -- 'Monday', 'Tuesday', etc. (NULL for all days)
    price_multiplier REAL DEFAULT 1.0, -- Multiplier for base price (1.0 = same, 1.2 = 20% increase)
    fixed_price REAL, -- Fixed price override (NULL to use multiplier)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_date_price_overrides_route_date ON date_price_overrides(route_id, travel_date);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_recurring ON holidays(is_recurring);
CREATE INDEX IF NOT EXISTS idx_recurring_schedule_price_rules_recurring_id ON recurring_schedule_price_rules(recurring_schedule_id);
