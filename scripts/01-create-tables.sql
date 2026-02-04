-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_student BOOLEAN DEFAULT FALSE,
    student_id VARCHAR(100),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Operators table
CREATE TABLE IF NOT EXISTS operators (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Routes table
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    operator_id INT REFERENCES operators(id) ON DELETE CASCADE,
    from_city VARCHAR(100) NOT NULL,
    from_state VARCHAR(50) NOT NULL,
    from_country VARCHAR(100),
    to_city VARCHAR(100) NOT NULL,
    to_state VARCHAR(50) NOT NULL,
    to_country VARCHAR(100),
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL, -- 'AC Sleeper', 'AC Semi-Sleeper', 'AC Express', 'Non-AC'
    total_seats INT NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    amenities TEXT[], -- array of amenities like 'WiFi', 'Coffee', 'Charging'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Schedules table (daily schedules for routes)
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    route_id INT REFERENCES routes(id) ON DELETE CASCADE,
    travel_date DATE NOT NULL,
    available_seats INT NOT NULL,
    is_cancelled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(route_id, travel_date)
);

-- Create Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    booking_id VARCHAR(20) UNIQUE NOT NULL,
    pnr VARCHAR(20) UNIQUE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    route_id INT REFERENCES routes(id) ON DELETE RESTRICT,
    schedule_id INT REFERENCES schedules(id) ON DELETE RESTRICT,
    travel_date DATE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) NOT NULL,
    final_amount DECIMAL(10, 2) NOT NULL,
    promo_code VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    payment_method VARCHAR(50), -- 'card', 'upi', 'netbanking'
    booking_status VARCHAR(20) DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'completed'
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    qr_code_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Passengers table
CREATE TABLE IF NOT EXISTS passengers (
    id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Seats table (to track individual seat bookings)
CREATE TABLE IF NOT EXISTS seat_bookings (
    id SERIAL PRIMARY KEY,
    schedule_id INT REFERENCES schedules(id) ON DELETE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'booked', -- 'booked', 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(schedule_id, seat_number)
);

-- Create Discounts/Promo Codes table
CREATE TABLE IF NOT EXISTS promo_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
    discount_value DECIMAL(10, 2) NOT NULL,
    max_discount DECIMAL(10, 2),
    min_booking_amount DECIMAL(10, 2),
    usage_limit INT,
    used_count INT DEFAULT 0,
    user_type VARCHAR(20), -- 'all', 'student', 'first_time'
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    operator_id INT REFERENCES operators(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_routes_from_to ON routes(from_city, to_city);
CREATE INDEX IF NOT EXISTS idx_routes_operator ON routes(operator_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(travel_date);
CREATE INDEX IF NOT EXISTS idx_schedules_route ON schedules(route_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_pnr ON bookings(pnr);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(travel_date);
CREATE INDEX IF NOT EXISTS idx_seat_bookings_schedule ON seat_bookings(schedule_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);

-- Add comments to tables
COMMENT ON TABLE users IS 'Stores user account information including students and admins';
COMMENT ON TABLE operators IS 'Stores bus/train/flight operator information';
COMMENT ON TABLE routes IS 'Stores route information with pricing and schedules';
COMMENT ON TABLE schedules IS 'Stores daily schedules for each route';
COMMENT ON TABLE bookings IS 'Stores booking transactions';
COMMENT ON TABLE passengers IS 'Stores passenger details for each booking';
COMMENT ON TABLE seat_bookings IS 'Tracks individual seat bookings';
COMMENT ON TABLE promo_codes IS 'Stores promotional discount codes';
COMMENT ON TABLE reviews IS 'Stores customer reviews and ratings';
