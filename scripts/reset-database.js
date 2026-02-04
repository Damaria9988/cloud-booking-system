/**
 * Reset Database Script
 * Deletes all data except admin users
 * 
 * Usage: node scripts/reset-database.js
 */

const { DatabaseSync } = require('node:sqlite')
const path = require('path')
const readline = require('readline')

const DB_PATH = path.join(__dirname, '..', 'data', 'travelflow.db')

async function confirm(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y')
    })
  })
}

async function resetDatabase() {
  console.log('\n🗑️  DATABASE RESET SCRIPT')
  console.log('========================')
  console.log(`Database: ${DB_PATH}`)
  console.log('')
  console.log('This will DELETE:')
  console.log('  - All bookings and seat bookings')
  console.log('  - All schedules and recurring schedules')
  console.log('  - All routes and operators')
  console.log('  - All promo codes and holidays')
  console.log('  - All non-admin users')
  console.log('')
  console.log('This will KEEP:')
  console.log('  - Admin user accounts')
  console.log('')

  const confirmed = await confirm('Are you sure you want to proceed? (yes/no): ')
  
  if (!confirmed) {
    console.log('\n❌ Reset cancelled.')
    process.exit(0)
  }

  console.log('\n🔄 Starting database reset...\n')

  try {
    const db = new DatabaseSync(DB_PATH)

    // Get admin users before reset (is_admin = 1 means admin)
    const adminsBefore = db.prepare('SELECT id, email, first_name, last_name FROM users WHERE is_admin = 1').all()
    console.log(`📋 Found ${adminsBefore.length} admin user(s) to preserve`)

    // Disable foreign keys
    db.exec('PRAGMA foreign_keys = OFF')

    // Delete in order (respecting dependencies)
    const tables = [
      { name: 'seat_bookings', label: 'Seat Bookings' },
      { name: 'passengers', label: 'Passengers' },
      { name: 'bookings', label: 'Bookings' },
      { name: 'schedules', label: 'Schedules' },
      { name: 'recurring_schedule_price_rules', label: 'Recurring Schedule Price Rules' },
      { name: 'recurring_schedules', label: 'Recurring Schedules' },
      { name: 'date_price_overrides', label: 'Date Price Overrides' },
      { name: 'routes', label: 'Routes' },
      { name: 'operators', label: 'Operators' },
      { name: 'promo_codes', label: 'Promo Codes' },
      { name: 'holidays', label: 'Holidays' },
      { name: 'email_verification_tokens', label: 'Email Verification Tokens' },
      { name: 'password_reset_tokens', label: 'Password Reset Tokens' },
    ]

    for (const table of tables) {
      try {
        const countBefore = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get()
        db.exec(`DELETE FROM ${table.name}`)
        console.log(`  ✅ Deleted ${countBefore.count} rows from ${table.label}`)
      } catch (err) {
        console.log(`  ⚠️  Could not delete from ${table.label}: ${err.message}`)
      }
    }

    // Delete non-admin users (is_admin = 0 or NULL means non-admin)
    const nonAdminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 0 OR is_admin IS NULL').get()
    db.exec("DELETE FROM users WHERE is_admin = 0 OR is_admin IS NULL")
    console.log(`  ✅ Deleted ${nonAdminCount.count} non-admin user(s)`)

    // Reset auto-increment counters
    try {
      for (const table of tables) {
        db.exec(`DELETE FROM sqlite_sequence WHERE name = '${table.name}'`)
      }
      console.log(`  ✅ Reset auto-increment counters`)
    } catch (err) {
      console.log(`  ⚠️  Could not reset counters: ${err.message}`)
    }

    // Re-enable foreign keys
    db.exec('PRAGMA foreign_keys = ON')

    // Verify admin users
    const adminsAfter = db.prepare('SELECT id, email, first_name, last_name FROM users WHERE is_admin = 1').all()
    
    console.log('\n✅ DATABASE RESET COMPLETE!\n')
    console.log('Admin users preserved:')
    adminsAfter.forEach(admin => {
      console.log(`  - ${admin.email} (${admin.first_name} ${admin.last_name})`)
    })

    db.close()
    console.log('\n🎉 Ready for testing!\n')

  } catch (error) {
    console.error('\n❌ Error during reset:', error.message)
    process.exit(1)
  }
}

resetDatabase()
