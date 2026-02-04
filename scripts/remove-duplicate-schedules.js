/**
 * Script to identify and remove duplicate schedules
 * Duplicates are defined as schedules with the same route_id and travel_date
 * This script keeps the schedule with the lowest ID (oldest) and removes others
 */

const { DatabaseSync } = require('node:sqlite')
const path = require('path')
const { existsSync, mkdirSync } = require('fs')

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data')
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'travelflow.db')
const db = new DatabaseSync(dbPath)

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON')

console.log('🔍 Finding duplicate schedules...\n')

// Find all duplicate schedules
const duplicates = db.prepare(`
  SELECT 
    route_id,
    travel_date,
    COUNT(*) as count,
    GROUP_CONCAT(id) as ids
  FROM schedules
  GROUP BY route_id, travel_date
  HAVING COUNT(*) > 1
`).all().map(row => ({
  route_id: row.route_id,
  travel_date: row.travel_date,
  count: row.count,
  ids: row.ids
}))

if (duplicates.length === 0) {
  console.log('✅ No duplicate schedules found!')
  db.close()
  process.exit(0)
}

console.log(`⚠️  Found ${duplicates.length} duplicate schedule groups:\n`)

let totalToDelete = 0
const schedulesToDelete = []

duplicates.forEach((dup, index) => {
  const ids = dup.ids.split(',').map(Number).sort((a, b) => a - b)
  const keepId = ids[0] // Keep the oldest (lowest ID)
  const deleteIds = ids.slice(1) // Delete the rest
  
  console.log(`Group ${index + 1}:`)
  console.log(`  Route ID: ${dup.route_id}, Travel Date: ${dup.travel_date}`)
  console.log(`  Total duplicates: ${dup.count}`)
  console.log(`  Keeping schedule ID: ${keepId}`)
  console.log(`  Deleting schedule IDs: ${deleteIds.join(', ')}`)
  console.log('')
  
  totalToDelete += deleteIds.length
  schedulesToDelete.push(...deleteIds)
})

console.log(`\n📊 Summary:`)
console.log(`  Duplicate groups: ${duplicates.length}`)
console.log(`  Total schedules to delete: ${totalToDelete}`)
console.log(`\n⚠️  WARNING: This will permanently delete ${totalToDelete} duplicate schedule(s)!`)
console.log(`\nTo proceed, run: node scripts/remove-duplicate-schedules.js --confirm`)

// If --confirm flag is provided, proceed with deletion
if (process.argv.includes('--confirm')) {
  console.log('\n🗑️  Deleting duplicate schedules...\n')
  
  const deleteSchedule = db.prepare(`
    DELETE FROM schedules WHERE id = ?
  `)
  
  const deleteSeatBookings = db.prepare(`
    DELETE FROM seat_bookings WHERE schedule_id = ?
  `)
  
  const transaction = db.transaction((ids) => {
    for (const id of ids) {
      // First, check if schedule has bookings
      const bookings = db.prepare(`
        SELECT COUNT(*) as count FROM bookings WHERE schedule_id = ?
      `).get(id)
      
      if (bookings && bookings.count > 0) {
        console.log(`⚠️  Skipping schedule ID ${id} - has ${bookings.count} booking(s)`)
        continue
      }
      
      // Delete seat bookings first (if any)
      deleteSeatBookings.run(id)
      
      // Then delete the schedule
      deleteSchedule.run(id)
      console.log(`✅ Deleted duplicate schedule ID: ${id}`)
    }
  })
  
  transaction(schedulesToDelete)
  
  console.log(`\n✅ Successfully removed duplicate schedules!`)
} else {
  console.log(`\n💡 To see what would be deleted without actually deleting, run this script without --confirm`)
}

db.close()
