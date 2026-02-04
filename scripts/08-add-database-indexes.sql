-- Add Database Indexes for Performance Optimization
-- Run this script to add indexes to frequently queried columns

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Bookings table indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_schedule_id ON bookings(schedule_id);
CREATE INDEX IF NOT EXISTS idx_bookings_route_id ON bookings(route_id);
CREATE INDEX IF NOT EXISTS idx_bookings_pnr ON bookings(pnr);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_travel_date ON bookings(travel_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- Composite index for common booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON bookings(user_id, booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_schedule_status ON bookings(schedule_id, booking_status);

-- Routes table indexes
CREATE INDEX IF NOT EXISTS idx_routes_operator_id ON routes(operator_id);
CREATE INDEX IF NOT EXISTS idx_routes_from_city ON routes(from_city COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_routes_to_city ON routes(to_city COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_routes_vehicle_type ON routes(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);
CREATE INDEX IF NOT EXISTS idx_routes_transport_type ON routes(transport_type);

-- Composite index for route searches
CREATE INDEX IF NOT EXISTS idx_routes_from_to ON routes(from_city COLLATE NOCASE, to_city COLLATE NOCASE, status);
CREATE INDEX IF NOT EXISTS idx_routes_status_transport ON routes(status, transport_type);

-- Schedules table indexes
CREATE INDEX IF NOT EXISTS idx_schedules_route_id ON schedules(route_id);
CREATE INDEX IF NOT EXISTS idx_schedules_travel_date ON schedules(travel_date);
CREATE INDEX IF NOT EXISTS idx_schedules_is_cancelled ON schedules(is_cancelled);
CREATE INDEX IF NOT EXISTS idx_schedules_available_seats ON schedules(available_seats);

-- Composite index for schedule searches
CREATE INDEX IF NOT EXISTS idx_schedules_route_date ON schedules(route_id, travel_date, is_cancelled);

-- Seat bookings table indexes
CREATE INDEX IF NOT EXISTS idx_seat_bookings_booking_id ON seat_bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_seat_bookings_schedule_id ON seat_bookings(schedule_id);
CREATE INDEX IF NOT EXISTS idx_seat_bookings_seat_number ON seat_bookings(seat_number);
CREATE INDEX IF NOT EXISTS idx_seat_bookings_status ON seat_bookings(status);

-- Composite index for seat availability queries
CREATE INDEX IF NOT EXISTS idx_seat_bookings_schedule_status ON seat_bookings(schedule_id, status);

-- Passengers table indexes
CREATE INDEX IF NOT EXISTS idx_passengers_booking_id ON passengers(booking_id);

-- Promo codes table indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid_from ON promo_codes(valid_from);
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid_until ON promo_codes(valid_until);

-- Composite index for promo code validation
CREATE INDEX IF NOT EXISTS idx_promo_codes_active_dates ON promo_codes(code, is_active, valid_from, valid_until);

-- OTP codes table indexes
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_otp ON otp_codes(otp);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

-- Composite index for OTP validation
CREATE INDEX IF NOT EXISTS idx_otp_codes_email_otp ON otp_codes(email, otp, expires_at);

-- Reviews table indexes (if not already created)
CREATE INDEX IF NOT EXISTS idx_reviews_route_id ON reviews(route_id);
CREATE INDEX IF NOT EXISTS idx_reviews_operator_id ON reviews(operator_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Review helpful table indexes
CREATE INDEX IF NOT EXISTS idx_review_helpful_review_id ON review_helpful(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_user_id ON review_helpful(user_id);

-- Operators table indexes
CREATE INDEX IF NOT EXISTS idx_operators_rating ON operators(rating DESC);
CREATE INDEX IF NOT EXISTS idx_operators_name ON operators(name);

ANALYZE;
