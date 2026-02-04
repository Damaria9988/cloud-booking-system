-- Reset Users Table Sequence Only
-- This resets the users table ID sequence to start from 1
-- Safe to run - it will use the highest existing ID + 1 if there are existing records

-- Option 1: Reset to start from 1 (even if records exist)
-- WARNING: This can cause issues if you have foreign key references
-- Only use if you've deleted ALL users and want to start fresh
-- SELECT setval('users_id_seq', 1, false);

-- Option 2: Reset to next available ID (SAFER - Recommended)
-- This sets the sequence to the highest existing ID + 1
-- If no records exist, it starts at 1
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 0) + 1, false);

-- Verify the sequence was reset
SELECT currval('users_id_seq') as current_value, 
       nextval('users_id_seq') as next_value;

-- Note: The nextval() above will increment the sequence, so the next insert will use that value
-- If you want to keep it at the current max, you can reset it again:
-- SELECT setval('users_id_seq', (SELECT MAX(id) FROM users), true);

