/**
 * Script to clear all data from database tables (except admin user)
 * Usage: node scripts/clear-database.js
 */

const { DatabaseSync } = require('node:sqlite')
const path = require('path')
const fs = require('fs')

const dataDir = path.join(process.cwd(), 'data')
const dbPath = path.join(dataDir, 'travelflow.db')

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.error('❌ Database not found! Please run "npm run setup-db" first.')
  process.exit(1)
}

console.log('📦 Connecting to SQLite database...')
const db = new DatabaseSync(dbPath)

console.log('🗑️  Clearing database tables...\n')

try {
  // Get admin user ID to preserve it
  const adminUser = db.prepare('SELECT id FROM users WHERE is_admin = 1').get()
  const adminId = adminUser?.id

  // Clear bookings first (foreign key dependencies)
  const bookingsDeleted = db.prepare('DELETE FROM bookings').run()
  console.log(`✅ Cleared bookings table: ${bookingsDeleted.changes} rows deleted`)

  // Clear schedules
  const schedulesDeleted = db.prepare('DELETE FROM schedules').run()
  console.log(`✅ Cleared schedules table: ${schedulesDeleted.changes} rows deleted`)

  // Clear routes
  const routesDeleted = db.prepare('DELETE FROM routes').run()
  console.log(`✅ Cleared routes table: ${routesDeleted.changes} rows deleted`)

  // Clear promo codes
  const promosDeleted = db.prepare('DELETE FROM promo_codes').run()
  console.log(`✅ Cleared promo_codes table: ${promosDeleted.changes} rows deleted`)

  // Clear reviews
  const reviewsDeleted = db.prepare('DELETE FROM reviews').run()
  console.log(`✅ Cleared reviews table: ${reviewsDeleted.changes} rows deleted`)

  // Clear users except admin
  let usersDeleted
  if (adminId) {
    usersDeleted = db.prepare('DELETE FROM users WHERE id != ?').run(adminId)
    console.log(`✅ Cleared users table (kept admin): ${usersDeleted.changes} rows deleted`)
  } else {
    usersDeleted = db.prepare('DELETE FROM users').run()
    console.log(`⚠️  Cleared all users (no admin found): ${usersDeleted.changes} rows deleted`)
  }

  console.log('\n✨ Database cleared successfully!')
  
  if (adminId) {
    console.log(`\n📋 Admin account preserved:`)
    const admin = db.prepare('SELECT email FROM users WHERE id = ?').get(adminId)
    console.log(`   Email: ${admin.email}`)
    console.log(`   Password: admin123 (default)`)
  } else {
    console.log('\n⚠️  No admin account found. Run "npm run create-admin" to create one.')
  }

} catch (error) {
  console.error('❌ Error clearing database:', error.message)
  process.exit(1)
} finally {
  db.close()
}

console.log('\n🎯 Ready for testing! Check TESTING_GUIDE.md for next steps.')
