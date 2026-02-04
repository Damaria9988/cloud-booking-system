-- Insert Default Admin User for SQLite
-- IMPORTANT: Change the password after first login!
--
-- Default Admin Credentials:
-- Email: admin@cloudticket.com
-- Password: admin123
-- ⚠️ CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!
--
-- To generate a bcrypt hash, use:
-- node scripts/04-insert-admin-user.js
-- (This will generate the hash for you)

-- Note: Replace the password_hash below with a generated hash
-- The hash below is for "admin123" (generated with bcrypt rounds=10)

INSERT OR IGNORE INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    is_admin,
    is_student,
    created_at,
    updated_at
) VALUES (
    'admin@cloudticket.com',
    '$2a$10$X9DG2v1ucJ2jbf0z6Hddoej7xeCzr8.5aav7VkMv/8oVWivKBpAqe', -- bcrypt hash for "admin123"
    'Admin',
    'User',
    1,  -- is_admin = true (SQLite uses 1 for true)
    0,  -- is_student = false (SQLite uses 0 for false)
    datetime('now'),
    datetime('now')
);

-- Admin Login Credentials:
-- Email: admin@cloudticket.com
-- Password: admin123
-- ⚠️ IMPORTANT: Change this password immediately after first login!

