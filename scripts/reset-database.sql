-- Reset Database Script
-- Keeps admin users, deletes everything else

-- Disable foreign key checks temporarily
PRAGMA foreign_keys = OFF;

-- Delete seat bookings
DELETE FROM seat_bookings;

-- Delete passengers
DELETE FROM passengers;

-- Delete bookings
DELETE FROM bookings;

-- Delete schedules
DELETE FROM schedules;

-- Delete recurring schedule price rules
DELETE FROM recurring_schedule_price_rules;

-- Delete recurring schedules
DELETE FROM recurring_schedules;

-- Delete date price overrides
DELETE FROM date_price_overrides;

-- Delete routes
DELETE FROM routes;

-- Delete operators
DELETE FROM operators;

-- Delete promo codes
DELETE FROM promo_codes;

-- Delete holidays
DELETE FROM holidays;

-- Delete email verification tokens
DELETE FROM email_verification_tokens;

-- Delete password reset tokens
DELETE FROM password_reset_tokens;

-- Delete non-admin users (keep is_admin = 1)
DELETE FROM users WHERE is_admin = 0 OR is_admin IS NULL;

-- Reset auto-increment counters (SQLite specific)
DELETE FROM sqlite_sequence WHERE name IN (
  'seat_bookings', 
  'passengers', 
  'bookings', 
  'schedules', 
  'recurring_schedules',
  'recurring_schedule_price_rules',
  'date_price_overrides',
  'routes', 
  'operators',
  'promo_codes',
  'holidays',
  'email_verification_tokens',
  'password_reset_tokens'
);

-- Re-enable foreign key checks
PRAGMA foreign_keys = ON;

-- Verify admin users are kept
SELECT id, email, first_name, last_name, is_admin FROM users WHERE is_admin = 1;
