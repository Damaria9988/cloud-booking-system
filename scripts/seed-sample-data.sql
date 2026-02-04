-- Seed Sample Data: Operators and Routes
-- Run this after resetting the database

-- =============================================
-- OPERATORS
-- =============================================

INSERT INTO operators (name, email, phone, rating, total_reviews, status) VALUES
('Emirates', 'bookings@emirates.com', '+971-4-214-4444', 4.8, 15420, 'active'),
('Eurostar', 'support@eurostar.com', '+44-3432-186-186', 4.5, 8932, 'active'),
('FlixBus', 'service@flixbus.com', '+49-30-300-137-300', 4.2, 12540, 'active'),
('Delta Airlines', 'reservations@delta.com', '+1-800-221-1212', 4.4, 21350, 'active'),
('Amtrak', 'customerservice@amtrak.com', '+1-800-872-7245', 4.1, 9870, 'active');

-- =============================================
-- ROUTES
-- =============================================

-- Emirates: Dubai → London (Flight)
INSERT INTO routes (
  operator_id, from_city, from_state, from_country, to_city, to_state, to_country,
  departure_time, arrival_time, duration_minutes, transport_type, vehicle_type,
  total_seats, base_price, amenities, status
) VALUES (
  1, 'Dubai', 'Dubai', 'United Arab Emirates', 'London', 'England', 'United Kingdom',
  '08:00', '14:30', 390, 'flight', 'Boeing 777',
  300, 850.00, '["WiFi", "Meals", "Entertainment", "Charging"]', 'active'
);

-- Emirates: London → Dubai (Flight - Return)
INSERT INTO routes (
  operator_id, from_city, from_state, from_country, to_city, to_state, to_country,
  departure_time, arrival_time, duration_minutes, transport_type, vehicle_type,
  total_seats, base_price, amenities, status
) VALUES (
  1, 'London', 'England', 'United Kingdom', 'Dubai', 'Dubai', 'United Arab Emirates',
  '21:00', '07:30', 390, 'flight', 'Boeing 777',
  300, 850.00, '["WiFi", "Meals", "Entertainment", "Charging"]', 'active'
);

-- Eurostar: London → Paris (Train)
INSERT INTO routes (
  operator_id, from_city, from_state, from_country, to_city, to_state, to_country,
  departure_time, arrival_time, duration_minutes, transport_type, vehicle_type,
  total_seats, base_price, amenities, status
) VALUES (
  2, 'London', 'England', 'United Kingdom', 'Paris', 'Île-de-France', 'France',
  '07:00', '10:20', 200, 'train', 'High-Speed Rail',
  750, 180.00, '["WiFi", "Café Bar", "Charging"]', 'active'
);

-- Eurostar: Paris → London (Train - Return)
INSERT INTO routes (
  operator_id, from_city, from_state, from_country, to_city, to_state, to_country,
  departure_time, arrival_time, duration_minutes, transport_type, vehicle_type,
  total_seats, base_price, amenities, status
) VALUES (
  2, 'Paris', 'Île-de-France', 'France', 'London', 'England', 'United Kingdom',
  '18:00', '19:20', 200, 'train', 'High-Speed Rail',
  750, 180.00, '["WiFi", "Café Bar", "Charging"]', 'active'
);

-- Eurostar: London → Brussels (Train)
INSERT INTO routes (
  operator_id, from_city, from_state, from_country, to_city, to_state, to_country,
  departure_time, arrival_time, duration_minutes, transport_type, vehicle_type,
  total_seats, base_price, amenities, status
) VALUES (
  2, 'London', 'England', 'United Kingdom', 'Brussels', 'Brussels', 'Belgium',
  '09:00', '12:00', 180, 'train', 'High-Speed Rail',
  750, 150.00, '["WiFi", "Café Bar", "Charging"]', 'active'
);

-- FlixBus: Berlin → Amsterdam (Bus)
INSERT INTO routes (
  operator_id, from_city, from_state, from_country, to_city, to_state, to_country,
  departure_time, arrival_time, duration_minutes, transport_type, vehicle_type,
  total_seats, base_price, amenities, status
) VALUES (
  3, 'Berlin', 'Berlin', 'Germany', 'Amsterdam', 'North Holland', 'Netherlands',
  '06:00', '12:30', 390, 'bus', 'AC Sleeper',
  45, 35.00, '["WiFi", "Charging", "Restroom"]', 'active'
);

-- FlixBus: Munich → Vienna (Bus)
INSERT INTO routes (
  operator_id, from_city, from_state, from_country, to_city, to_state, to_country,
  departure_time, arrival_time, duration_minutes, transport_type, vehicle_type,
  total_seats, base_price, amenities, status
) VALUES (
  3, 'Munich', 'Bavaria', 'Germany', 'Vienna', 'Vienna', 'Austria',
  '08:00', '12:30', 270, 'bus', 'AC Seater',
  50, 29.00, '["WiFi", "Charging", "Restroom"]', 'active'
);

-- FlixBus: Paris → Barcelona (Bus)
INSERT INTO routes (
  operator_id, from_city, from_state, from_country, to_city, to_state, to_country,
  departure_time, arrival_time, duration_minutes, transport_type, vehicle_type,
  total_seats, base_price, amenities, status
) VALUES (
  3, 'Paris', 'Île-de-France', 'France', 'Barcelona', 'Catalonia', 'Spain',
  '22:00', '08:30', 630, 'bus', 'AC Sleeper',
  40, 55.00, '["WiFi", "Charging", "Restroom", "Coffee"]', 'active'
);

-- Delta Airlines: New York → Los Angeles (Flight)
INSERT INTO routes (
  operator_id, from_city, from_state, from_country, to_city, to_state, to_country,
  departure_time, arrival_time, duration_minutes, transport_type, vehicle_type,
  total_seats, base_price, amenities, status
) VALUES (
  4, 'New York', 'New York', 'United States', 'Los Angeles', 'California', 'United States',
  '09:00', '12:30', 330, 'flight', 'Airbus A320',
  180, 350.00, '["WiFi", "Snacks", "Entertainment", "Charging"]', 'active'
);

-- Delta Airlines: Los Angeles → New York (Flight - Return)
INSERT INTO routes (
  operator_id, from_city, from_state, from_country, to_city, to_state, to_country,
  departure_time, arrival_time, duration_minutes, transport_type, vehicle_type,
  total_seats, base_price, amenities, status
) VALUES (
  4, 'Los Angeles', 'California', 'United States', 'New York', 'New York', 'United States',
  '14:00', '22:30', 330, 'flight', 'Airbus A320',
  180, 350.00, '["WiFi", "Snacks", "Entertainment", "Charging"]', 'active'
);

-- Delta Airlines: New York → Miami (Flight)
INSERT INTO routes (
  operator_id, from_city, from_state, from_country, to_city, to_state, to_country,
  departure_time, arrival_time, duration_minutes, transport_type, vehicle_type,
  total_seats, base_price, amenities, status
) VALUES (
  4, 'New York', 'New York', 'United States', 'Miami', 'Florida', 'United States',
  '07:00', '10:15', 195, 'flight', 'Boeing 737',
  160, 220.00, '["WiFi", "Snacks", "Charging"]', 'active'
);

-- Amtrak: Washington → Boston (Train)
INSERT INTO routes (
  operator_id, from_city, from_state, from_country, to_city, to_state, to_country,
  departure_time, arrival_time, duration_minutes, transport_type, vehicle_type,
  total_seats, base_price, amenities, status
) VALUES (
  5, 'Washington', 'District of Columbia', 'United States', 'Boston', 'Massachusetts', 'United States',
  '06:30', '13:00', 390, 'train', 'Acela Express',
  300, 120.00, '["WiFi", "Café Car", "Charging"]', 'active'
);

-- Amtrak: Boston → Washington (Train - Return)
INSERT INTO routes (
  operator_id, from_city, from_state, from_country, to_city, to_state, to_country,
  departure_time, arrival_time, duration_minutes, transport_type, vehicle_type,
  total_seats, base_price, amenities, status
) VALUES (
  5, 'Boston', 'Massachusetts', 'United States', 'Washington', 'District of Columbia', 'United States',
  '15:00', '21:30', 390, 'train', 'Acela Express',
  300, 120.00, '["WiFi", "Café Car", "Charging"]', 'active'
);

-- Amtrak: New York → Chicago (Train)
INSERT INTO routes (
  operator_id, from_city, from_state, from_country, to_city, to_state, to_country,
  departure_time, arrival_time, duration_minutes, transport_type, vehicle_type,
  total_seats, base_price, amenities, status
) VALUES (
  5, 'New York', 'New York', 'United States', 'Chicago', 'Illinois', 'United States',
  '15:45', '09:45', 1080, 'train', 'Lake Shore Limited',
  250, 150.00, '["WiFi", "Dining Car", "Sleeper Cabin", "Charging"]', 'active'
);

-- =============================================
-- VERIFY DATA
-- =============================================
SELECT 'Operators created: ' || COUNT(*) FROM operators;
SELECT 'Routes created: ' || COUNT(*) FROM routes;
