/**
 * Migration Script: Add passenger_type and ensure payment_method is saved
 * Usage: node scripts/run-migration-09.js
 * 
 * Note: This uses Node.js built-in SQLite (node:sqlite) instead of better-sqlite3
 */

const { DatabaseSync } = require('node:sqlite')
const fs = require('fs')
const path = require('path')

const dataDir = path.join(process.cwd(), 'data')
const dbPath = path.join(dataDir, 'travelflow.db')

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.error('❌ Database not found at:', dbPath)
  console.error('   Please run setup-database.js first')
  process.exit(1)
}

console.log('📦 Connecting to SQLite database...')
const db = new DatabaseSync(dbPath)
db.exec('PRAGMA foreign_keys = ON')

// Helper to execute SQL file
function runSQLFile(filePath) {
  console.log(`\n📄 Running: ${path.basename(filePath)}`)
  try {
    const sql = fs.readFileSync(filePath, 'utf-8')
    
    // Remove comments (lines starting with --)
    const cleanedSQL = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
    
    // Execute the entire SQL file at once
    try {
      db.exec(cleanedSQL)
      console.log(`  ✅ Migration executed successfully`)
    } catch (error) {
      // Check if it's just a "column already exists" error (which is OK)
      const errorMsg = error.message || String(error)
      if (errorMsg.includes('duplicate column') || errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
        console.log(`  ⚠️  Column already exists (migration may have been run before)`)
      } else {
        console.error(`  ❌ Error executing migration: ${errorMsg}`)
        throw error
      }
    }
  } catch (error) {
    console.error(`  ❌ Error reading file: ${error.message}`)
    throw error
  }
}

// Run the migration
const migrationPath = path.join(process.cwd(), 'scripts', '09-add-passenger-type-and-payment-method.sql')

if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Migration file not found: ${migrationPath}`)
  process.exit(1)
}

console.log('🚀 Starting migration...\n')
runSQLFile(migrationPath)

// Verify the migration
console.log('\n📊 Verifying migration...')

// Check if passenger_type column exists
try {
  const passengerColumns = db.prepare("PRAGMA table_info(passengers)").all()
  const hasPassengerType = passengerColumns.some((col) => col.name === 'passenger_type')
  
  if (hasPassengerType) {
    console.log('  ✅ passenger_type column exists in passengers table')
  } else {
    console.log('  ⚠️  passenger_type column not found (may need manual check)')
  }
} catch (error) {
  console.log('  ⚠️  Could not verify passengers table')
}

// Check if payment_method column exists in bookings
try {
  const bookingColumns = db.prepare("PRAGMA table_info(bookings)").all()
  const hasPaymentMethod = bookingColumns.some((col) => col.name === 'payment_method')
  
  if (hasPaymentMethod) {
    console.log('  ✅ payment_method column exists in bookings table')
  } else {
    console.log('  ⚠️  payment_method column not found (should already exist)')
  }
} catch (error) {
  console.log('  ⚠️  Could not verify bookings table')
}

db.close()
console.log('\n✨ Migration complete!')
console.log(`📁 Database location: ${dbPath}`)
console.log('\n💡 Next steps:')
console.log('   1. Restart your development server')
console.log('   2. Test creating a booking with passenger type and payment method')
console.log('   3. Verify data is saved correctly in the database')
