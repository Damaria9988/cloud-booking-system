/**
 * Script to generate admin user with hashed password
 * 
 * Run this with Node.js to generate a proper password hash:
 * 
 * node scripts/04-insert-admin-user.js
 * 
 * Then copy the generated SQL and run it in your database.
 */

const bcrypt = require('bcryptjs');

async function generateAdminUser() {
  // Default admin credentials (CHANGE THESE!)
  const email = 'admin@cloudticket.com';
  const password = 'admin123'; // ⚠️ CHANGE THIS!
  const firstName = 'Admin';
  const lastName = 'User';

  // Generate password hash
  const passwordHash = await bcrypt.hash(password, 10);

  // Generate SQL
  const sql = `
-- Insert Default Admin User
-- Generated password hash for: ${password}
-- ⚠️ CHANGE THIS PASSWORD AFTER FIRST LOGIN!

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
    '${email}',
    '${passwordHash}',
    '${firstName}',
    '${lastName}',
    true,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Admin Login Credentials:
-- Email: ${email}
-- Password: ${password}
-- ⚠️ IMPORTANT: Change this password immediately after first login!
`;

  console.log('Generated SQL:');
  console.log(sql);
  console.log('\n⚠️  Copy the SQL above and run it in your database.');
  console.log('⚠️  Remember to change the password after first login!');
}

generateAdminUser().catch(console.error);

