/**
 * Script to add recurring schedules for international routes
 * Usage: node scripts/seed-international-recurring-schedules.js
 * 
 * This will create recurring schedules for all international routes
 * so they automatically generate schedules for future dates.
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

// Get all international routes (those with from_country set)
const internationalRoutes = db.prepare(`
  SELECT id, from_city, to_city, from_country, transport_type, base_price, 
         departure_time, arrival_time, total_seats
  FROM routes 
  WHERE from_country IS NOT NULL
`).all()

console.log(`✅ Found ${internationalRoutes.length} international routes\n`)

if (internationalRoutes.length === 0) {
  console.log('⚠️ No international routes found. Run seed-international-routes.js first.')
  db.close()
  process.exit(0)
}

// Check existing recurring schedules
const existingRecurring = db.prepare(`
  SELECT route_id FROM recurring_schedules WHERE route_id IN (
    SELECT id FROM routes WHERE from_country IS NOT NULL
  )
`).all()

const existingRouteIds = new Set(existingRecurring.map(r => r.route_id))
console.log(`📋 ${existingRouteIds.size} international routes already have recurring schedules\n`)

console.log('🔄 Creating recurring schedules for international routes...\n')

let created = 0
let skipped = 0

for (const route of internationalRoutes) {
  try {
    // Skip if already has recurring schedule
    if (existingRouteIds.has(route.id)) {
      console.log(`   ⏭️  Skipped: ${route.from_city} → ${route.to_city} (already exists)`)
      skipped++
      continue
    }

    // All days of the week (0=Sunday, 1=Monday, ..., 6=Saturday)
    const recurrenceDays = JSON.stringify([0, 1, 2, 3, 4, 5, 6])
    
    // Set validity period: today to 1 year from now
    const startDate = new Date().toISOString().split('T')[0]
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Insert recurring schedule with correct schema
    db.prepare(`
      INSERT INTO recurring_schedules (
        route_id, recurrence_type, recurrence_days, start_date, end_date,
        departure_time, arrival_time, status, created_at
      )
      VALUES (?, 'daily', ?, ?, ?, ?, ?, 'active', datetime('now'))
    `).run(
      route.id, 
      recurrenceDays, 
      startDate, 
      endDate,
      route.departure_time || '08:00',
      route.arrival_time || '12:00'
    )

    console.log(`   ✅ Created: ${route.from_city} → ${route.to_city} (${route.transport_type})`)
    created++
  } catch (error) {
    console.error(`   ❌ Error for ${route.from_city} → ${route.to_city}:`, error.message)
  }
}

// Now generate schedules for the next 30 days for ALL international routes
console.log('\n📅 Generating schedules for the next 30 days...\n')

let schedulesGenerated = 0

for (const route of internationalRoutes) {
  // Generate schedules for next 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]

    try {
      // Check if schedule already exists
      const existing = db.prepare(`
        SELECT id FROM schedules WHERE route_id = ? AND travel_date = ?
      `).get(route.id, dateStr)

      if (existing) continue

      // Create schedule
      db.prepare(`
        INSERT INTO schedules (route_id, travel_date, available_seats, is_cancelled, created_at)
        VALUES (?, ?, ?, 0, datetime('now'))
      `).run(route.id, dateStr, route.total_seats)

      schedulesGenerated++
    } catch (error) {
      // Ignore duplicates
    }
  }
}

console.log(`   ✅ Generated ${schedulesGenerated} new schedules`)

// Summary
console.log('\n' + '='.repeat(50))
console.log('📊 SUMMARY')
console.log('='.repeat(50))
console.log(`   Recurring schedules created: ${created}`)
console.log(`   Recurring schedules skipped: ${skipped}`)
console.log(`   New schedules generated:     ${schedulesGenerated}`)
console.log('='.repeat(50))

// Show total recurring schedules now
const totalRecurring = db.prepare('SELECT COUNT(*) as count FROM recurring_schedules').get().count
const totalIntlRecurring = db.prepare(`
  SELECT COUNT(*) as count FROM recurring_schedules rs
  JOIN routes r ON rs.route_id = r.id
  WHERE r.from_country IS NOT NULL
`).get().count

console.log(`\n📈 Total recurring schedules: ${totalRecurring}`)
console.log(`   - Indian routes:        ${totalRecurring - totalIntlRecurring}`)
console.log(`   - International routes: ${totalIntlRecurring}`)

db.close()
console.log('\n✨ International recurring schedules setup complete!')
