-- Reset Auto-Increment Sequences
-- This resets the ID sequences to start from 1 (or next available number)
-- Useful after deleting test data and wanting to start fresh

-- Reset users table sequence
-- This will set the next ID to be 1 (or the highest existing ID + 1, whichever is higher)
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 0) + 1, false);

-- Reset operators table sequence
SELECT setval('operators_id_seq', COALESCE((SELECT MAX(id) FROM operators), 0) + 1, false);

-- Reset routes table sequence
SELECT setval('routes_id_seq', COALESCE((SELECT MAX(id) FROM routes), 0) + 1, false);

-- Reset schedules table sequence
SELECT setval('schedules_id_seq', COALESCE((SELECT MAX(id) FROM schedules), 0) + 1, false);

-- Reset bookings table sequence
SELECT setval('bookings_id_seq', COALESCE((SELECT MAX(id) FROM bookings), 0) + 1, false);

-- Reset passengers table sequence
SELECT setval('passengers_id_seq', COALESCE((SELECT MAX(id) FROM passengers), 0) + 1, false);

-- Reset seat_bookings table sequence
SELECT setval('seat_bookings_id_seq', COALESCE((SELECT MAX(id) FROM seat_bookings), 0) + 1, false);

-- Reset promo_codes table sequence
SELECT setval('promo_codes_id_seq', COALESCE((SELECT MAX(id) FROM promo_codes), 0) + 1, false);

-- Reset reviews table sequence (if exists)
SELECT setval('reviews_id_seq', COALESCE((SELECT MAX(id) FROM reviews), 0) + 1, false);

-- Reset recurring_schedules table sequence (if exists)
SELECT setval('recurring_schedules_id_seq', COALESCE((SELECT MAX(id) FROM recurring_schedules), 0) + 1, false);

-- Verify the sequences (optional - run this to check)
-- SELECT * FROM pg_sequences WHERE schemaname = 'public';

