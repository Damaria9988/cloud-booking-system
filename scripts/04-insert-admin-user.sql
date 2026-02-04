-- Insert Default Admin User
-- IMPORTANT: Change the password after first login!

-- Default Admin Credentials:
-- Email: admin@cloudticket.com
-- Password: admin123
-- ⚠️ CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!

INSERT INTO users (
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
    '$2b$10$X9DG2v1ucJ2jbf0z6Hddoej7xeCzr8.5aav7VkMv/8oVWivKBpAqe', -- bcrypt hash for "admin123"
    'Admin',
    'User',
    true,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Note: The password hash above is a placeholder.
-- You need to generate a real bcrypt hash for your desired password.
-- 
-- To generate a bcrypt hash:
-- 1. Go to https://bcrypt-generator.com/
-- 2. Enter your desired password
-- 3. Set rounds to 10
-- 4. Copy the generated hash
-- 5. Replace the password_hash value above
--
-- OR use Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('yourpassword', 10);
-- console.log(hash);

