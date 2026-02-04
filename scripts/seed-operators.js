/**
 * Script to seed initial operators into SQLite database
 * Usage: node scripts/seed-operators.js
 */

const Database = require('better-sqlite3')
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
const db = new Database(dbPath)

// Sample operators to seed
const operators = [
  { name: 'RedBus Express', email: 'contact@redbus.com', phone: '+1-800-REDBUS' },
  { name: 'Greyhound Lines', email: 'info@greyhound.com', phone: '+1-800-GREYHOUND' },
  { name: 'Megabus', email: 'support@megabus.com', phone: '+1-877-MEGABUS' },
  { name: 'BoltBus', email: 'help@boltbus.com', phone: '+1-877-BOLTBUS' },
  { name: 'FlixBus', email: 'contact@flixbus.com', phone: '+1-855-FLIXBUS' },
  { name: 'Peter Pan Bus Lines', email: 'info@peterpanbus.com', phone: '+1-800-343-9999' },
  { name: 'Trailways', email: 'support@trailways.com', phone: '+1-800-776-0581' },
  { name: 'Amtrak', email: 'info@amtrak.com', phone: '+1-800-872-7245' },
  { name: 'JetBlue Airways', email: 'contact@jetblue.com', phone: '+1-800-538-2583' },
  { name: 'Southwest Airlines', email: 'support@southwest.com', phone: '+1-800-435-9792' },
]

console.log('🌱 Seeding operators...')

let created = 0
let skipped = 0

for (const operator of operators) {
  try {
    // Check if operator already exists
    const existing = db.prepare('SELECT id FROM operators WHERE name = ?').get(operator.name)
    
    if (existing) {
      console.log(`   ⏭️  Skipped: ${operator.name} (already exists)`)
      skipped++
      continue
    }

    // Insert operator
    const result = db.prepare(`
      INSERT INTO operators (name, email, phone, rating, total_reviews, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(operator.name, operator.email, operator.phone, 0.0, 0)

    console.log(`   ✅ Created: ${operator.name} (ID: ${result.lastInsertRowid})`)
    created++
  } catch (error) {
    console.error(`   ❌ Error creating ${operator.name}:`, error.message)
  }
}

console.log(`\n✨ Seeding complete!`)
console.log(`   ✅ Created: ${created} operators`)
console.log(`   ⏭️  Skipped: ${skipped} operators (already exist)`)

db.close()

