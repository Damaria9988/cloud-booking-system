-- Insert sample operators
INSERT INTO operators (name, email, phone, rating, total_reviews) VALUES
('QuickTravel Express', 'contact@quicktravel.com', '+1-555-0101', 4.8, 234),
('SafeRide Comfort', 'info@saferide.com', '+1-555-0102', 4.6, 189),
('SpeedyBus Premium', 'support@speedybus.com', '+1-555-0103', 4.9, 412),
('ComfortLine Travel', 'hello@comfortline.com', '+1-555-0104', 4.7, 156),
('ExpressWay Transport', 'service@expressway.com', '+1-555-0105', 4.5, 98);

-- Insert sample routes
INSERT INTO routes (operator_id, from_city, from_state, to_city, to_state, departure_time, arrival_time, duration_minutes, vehicle_type, total_seats, base_price, amenities, status) VALUES
(1, 'New York', 'NY', 'Boston', 'MA', '06:30:00', '11:45:00', 315, 'AC Sleeper', 48, 45.00, ARRAY['WiFi', 'Coffee', 'Charging'], 'active'),
(1, 'New York', 'NY', 'Boston', 'MA', '14:00:00', '19:15:00', 315, 'AC Sleeper', 48, 48.00, ARRAY['WiFi', 'Coffee', 'Charging'], 'active'),
(2, 'Los Angeles', 'CA', 'San Francisco', 'CA', '08:00:00', '14:30:00', 390, 'AC Semi-Sleeper', 42, 52.00, ARRAY['WiFi', 'Charging'], 'active'),
(3, 'Chicago', 'IL', 'Detroit', 'MI', '09:15:00', '14:00:00', 285, 'AC Express', 40, 38.00, ARRAY['WiFi', 'Coffee', 'Charging'], 'active'),
(4, 'Miami', 'FL', 'Orlando', 'FL', '10:30:00', '14:15:00', 225, 'AC Sleeper', 44, 42.00, ARRAY['WiFi', 'Charging'], 'active'),
(5, 'Seattle', 'WA', 'Portland', 'OR', '07:00:00', '10:30:00', 210, 'AC Semi-Sleeper', 38, 35.00, ARRAY['WiFi'], 'active'),
(2, 'Boston', 'MA', 'New York', 'NY', '08:00:00', '13:30:00', 330, 'AC Semi-Sleeper', 42, 52.00, ARRAY['WiFi', 'Charging'], 'active'),
(3, 'San Francisco', 'CA', 'Los Angeles', 'CA', '09:00:00', '15:30:00', 390, 'AC Express', 40, 50.00, ARRAY['WiFi', 'Coffee', 'Charging'], 'active');

-- Insert schedules for next 30 days
INSERT INTO schedules (route_id, travel_date, available_seats)
SELECT 
    r.id,
    CURRENT_DATE + (n || ' days')::INTERVAL,
    r.total_seats
FROM routes r
CROSS JOIN generate_series(0, 29) as n
WHERE r.status = 'active';

-- Insert sample promo codes
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_discount, min_booking_amount, usage_limit, user_type, valid_from, valid_until, is_active) VALUES
('WELCOME40', 'First-time user discount - 40% off', 'percentage', 40.00, 50.00, 30.00, 1000, 'first_time', CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', true),
('STUDENT30', 'Student discount - 30% off all bookings', 'percentage', 30.00, 40.00, 0.00, NULL, 'student', CURRENT_DATE, CURRENT_DATE + INTERVAL '365 days', true),
('NEWYEAR25', 'New Year special - 25% off', 'percentage', 25.00, 30.00, 40.00, 500, 'all', CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', true),
('SAVE10', 'Save $10 on your booking', 'fixed', 10.00, NULL, 50.00, NULL, 'all', CURRENT_DATE, CURRENT_DATE + INTERVAL '180 days', true),
('WEEKEND20', 'Weekend special - 20% off', 'percentage', 20.00, 25.00, 35.00, 300, 'all', CURRENT_DATE, CURRENT_DATE + INTERVAL '120 days', true);

-- Insert sample admin user (password: admin123 - hashed with bcrypt)
INSERT INTO users (email, password_hash, first_name, last_name, phone, is_student, is_admin) VALUES
('admin@travelflow.com', '$2a$10$rGfE8sxvhVb5LhWxPvXnH.Rv0PQhL3mK9VQXHvV1zN8cM9KYvJZYe', 'Admin', 'User', '+1-555-0001', false, true);

-- Insert sample regular users
INSERT INTO users (email, password_hash, first_name, last_name, phone, is_student, student_id) VALUES
('john@example.com', '$2a$10$rGfE8sxvhVb5LhWxPvXnH.Rv0PQhL3mK9VQXHvV1zN8cM9KYvJZYe', 'John', 'Doe', '+1-555-1001', false, NULL),
('jane@example.com', '$2a$10$rGfE8sxvhVb5LhWxPvXnH.Rv0PQhL3mK9VQXHvV1zN8cM9KYvJZYe', 'Jane', 'Smith', '+1-555-1002', true, 'STU2024001'),
('mike@example.com', '$2a$10$rGfE8sxvhVb5LhWxPvXnH.Rv0PQhL3mK9VQXHvV1zN8cM9KYvJZYe', 'Mike', 'Johnson', '+1-555-1003', false, NULL);

-- Insert sample bookings
INSERT INTO bookings (booking_id, pnr, user_id, route_id, schedule_id, travel_date, total_amount, discount_amount, tax_amount, final_amount, promo_code, payment_status, payment_method, booking_status, contact_email, contact_phone, qr_code_data) VALUES
('BK' || LPAD(nextval('bookings_id_seq')::TEXT, 8, '0'), 'TF' || UPPER(substr(md5(random()::text), 1, 9)), 2, 1, 1, CURRENT_DATE + INTERVAL '5 days', 90.00, 36.00, 7.20, 61.20, 'WELCOME40', 'completed', 'card', 'confirmed', 'john@example.com', '+1-555-1001', 'QR_' || UPPER(substr(md5(random()::text), 1, 16)));

-- Insert passengers for the booking
INSERT INTO passengers (booking_id, seat_number, first_name, last_name, age, gender) VALUES
(1, 'A3', 'John', 'Doe', 28, 'Male'),
(1, 'A4', 'Jane', 'Doe', 26, 'Female');

-- Insert seat bookings
INSERT INTO seat_bookings (schedule_id, seat_number, booking_id, status) VALUES
(1, 'A3', 1, 'booked'),
(1, 'A4', 1, 'booked');

-- Update available seats
UPDATE schedules SET available_seats = available_seats - 2 WHERE id = 1;

-- Insert sample reviews
INSERT INTO reviews (booking_id, user_id, operator_id, rating, comment) VALUES
(1, 2, 1, 5, 'Excellent service! Clean bus, comfortable seats, and arrived on time. Highly recommend QuickTravel Express.');
