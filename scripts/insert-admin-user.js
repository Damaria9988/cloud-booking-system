/**
 * Script to insert default admin user into SQLite database
 * Usage: node scripts/insert-admin-user.js or npm run create-admin
 */

const { DatabaseSync } = require('node:sqlite')
const bcrypt = require('bcryptjs')
const path = require('path')
const fs = require('fs')

const dataDir = path.join(process.cwd(), 'data')
const dbPath = path.join(dataDir, 'travelflow.db')

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.error('❌ Database not found! Please run "npm run init-db" first.')
  process.exit(1)
}

console.log('📦 Connecting to SQLite database...')
const db = new DatabaseSync(dbPath)

// Default admin credentials
const email = 'admin@cloudticket.com'
const password = 'admin123' // ⚠️ CHANGE THIS!
const firstName = 'Admin'
const lastName = 'User'

// Check if admin already exists
const existingStmt = db.prepare('SELECT id, email FROM users WHERE email = ?')
const existing = existingStmt.get(email)

if (existing) {
  console.log(`⚠️  Admin user already exists with email: ${email}`)
  console.log(`   User ID: ${existing.id}`)
  console.log('   Skipping insertion.')
  process.exit(0)
}

// Generate password hash
console.log('🔐 Generating password hash...')
const passwordHash = bcrypt.hashSync(password, 10)

// Insert admin user
console.log('👤 Inserting admin user...')
try {
  const insertStmt = db.prepare(`
    INSERT INTO users (
      email,
      password_hash,
      first_name,
      last_name,
      is_admin,
      is_student,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `)
  
  const result = insertStmt.run(email, passwordHash, firstName, lastName, 1, 0)

  console.log('✅ Admin user created successfully!')
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 Admin Login Credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`   Email:    ${email}`)
  console.log(`   Password: ${password}`)
  console.log(`   User ID:  ${result.lastInsertRowid}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n⚠️  IMPORTANT: Change this password immediately after first login!')
  console.log('\n🔐 To change password:')
  console.log('   1. Login to http://localhost:3000/admin')
  console.log('   2. Go to Profile Settings')
  console.log('   3. Update your password')
} catch (error) {
  console.error('❌ Error creating admin user:', error.message)
  console.error('Full error:', error)
  process.exit(1)
}

console.log('\n✨ Done!')

