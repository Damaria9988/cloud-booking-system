/**
 * Script to seed international routes into SQLite database
 * Usage: node scripts/seed-international-routes.js
 * 
 * This will insert routes for:
 * - USA (bus routes between major cities)
 * - Europe (train and bus routes)
 * - Asia (various transport types)
 * - And more...
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

// Get existing operators - do NOT auto-create to avoid confusion
const operators = db.prepare('SELECT id, name FROM operators').all()

if (operators.length === 0) {
  console.error('❌ No operators found!')
  console.error('   Please add operators via the Admin Panel first:')
  console.error('   → Go to /admin/operators')
  console.error('   → Add operators like: Greyhound, FlixBus, EuroLines, etc.')
  db.close()
  process.exit(1)
}

console.log(`✅ Found ${operators.length} operators:`)
operators.forEach((op, i) => {
  console.log(`   ${i + 1}. ${op.name} (ID: ${op.id})`)
})
console.log('\n📌 Routes will be randomly assigned to these existing operators.')

// Get random operator ID
function getRandomOperatorId() {
  return operators[Math.floor(Math.random() * operators.length)].id
}

// International routes to insert
const internationalRoutes = [
  // === USA BUS ROUTES ===
  { fromCity: 'New York City', fromState: 'New York', fromCountry: 'USA', toCity: 'Boston', toState: 'Massachusetts', toCountry: 'USA', departureTime: '07:00', arrivalTime: '11:30', durationMinutes: 270, vehicleType: 'AC Express', totalSeats: 52, basePrice: 49.00, transportType: 'bus' },
  { fromCity: 'New York City', fromState: 'New York', fromCountry: 'USA', toCity: 'Philadelphia', toState: 'Pennsylvania', toCountry: 'USA', departureTime: '08:00', arrivalTime: '10:00', durationMinutes: 120, vehicleType: 'AC Express', totalSeats: 52, basePrice: 35.00, transportType: 'bus' },
  { fromCity: 'New York City', fromState: 'New York', fromCountry: 'USA', toCity: 'Washington DC', toState: 'District of Columbia', toCountry: 'USA', departureTime: '06:00', arrivalTime: '10:30', durationMinutes: 270, vehicleType: 'AC Sleeper', totalSeats: 48, basePrice: 65.00, transportType: 'bus' },
  { fromCity: 'Los Angeles', fromState: 'California', fromCountry: 'USA', toCity: 'San Francisco', toState: 'California', toCountry: 'USA', departureTime: '09:00', arrivalTime: '15:00', durationMinutes: 360, vehicleType: 'AC Express', totalSeats: 52, basePrice: 55.00, transportType: 'bus' },
  { fromCity: 'Los Angeles', fromState: 'California', fromCountry: 'USA', toCity: 'Las Vegas', toState: 'Nevada', toCountry: 'USA', departureTime: '10:00', arrivalTime: '14:00', durationMinutes: 240, vehicleType: 'AC Seater', totalSeats: 45, basePrice: 45.00, transportType: 'bus' },
  { fromCity: 'Los Angeles', fromState: 'California', fromCountry: 'USA', toCity: 'San Diego', toState: 'California', toCountry: 'USA', departureTime: '11:00', arrivalTime: '13:30', durationMinutes: 150, vehicleType: 'AC Express', totalSeats: 52, basePrice: 25.00, transportType: 'bus' },
  { fromCity: 'Chicago', fromState: 'Illinois', fromCountry: 'USA', toCity: 'Detroit', toState: 'Michigan', toCountry: 'USA', departureTime: '08:00', arrivalTime: '12:30', durationMinutes: 270, vehicleType: 'AC Semi-Sleeper', totalSeats: 44, basePrice: 42.00, transportType: 'bus' },
  { fromCity: 'Chicago', fromState: 'Illinois', fromCountry: 'USA', toCity: 'Minneapolis', toState: 'Minnesota', toCountry: 'USA', departureTime: '07:00', arrivalTime: '14:00', durationMinutes: 420, vehicleType: 'AC Sleeper', totalSeats: 48, basePrice: 75.00, transportType: 'bus' },
  { fromCity: 'Miami', fromState: 'Florida', fromCountry: 'USA', toCity: 'Orlando', toState: 'Florida', toCountry: 'USA', departureTime: '09:00', arrivalTime: '12:30', durationMinutes: 210, vehicleType: 'AC Express', totalSeats: 52, basePrice: 38.00, transportType: 'bus' },
  { fromCity: 'Seattle', fromState: 'Washington', fromCountry: 'USA', toCity: 'Portland', toState: 'Oregon', toCountry: 'USA', departureTime: '10:00', arrivalTime: '13:30', durationMinutes: 210, vehicleType: 'AC Express', totalSeats: 50, basePrice: 35.00, transportType: 'bus' },
  { fromCity: 'Dallas', fromState: 'Texas', fromCountry: 'USA', toCity: 'Houston', toState: 'Texas', toCountry: 'USA', departureTime: '08:00', arrivalTime: '12:00', durationMinutes: 240, vehicleType: 'AC Seater', totalSeats: 45, basePrice: 32.00, transportType: 'bus' },
  { fromCity: 'Boston', fromState: 'Massachusetts', fromCountry: 'USA', toCity: 'New York City', toState: 'New York', toCountry: 'USA', departureTime: '14:00', arrivalTime: '18:30', durationMinutes: 270, vehicleType: 'AC Express', totalSeats: 52, basePrice: 49.00, transportType: 'bus' },
  
  // === EUROPE BUS/TRAIN ROUTES ===
  { fromCity: 'London', fromState: 'England', fromCountry: 'UK', toCity: 'Manchester', toState: 'England', toCountry: 'UK', departureTime: '09:00', arrivalTime: '12:30', durationMinutes: 210, vehicleType: 'Express Coach', totalSeats: 50, basePrice: 35.00, transportType: 'bus' },
  { fromCity: 'London', fromState: 'England', fromCountry: 'UK', toCity: 'Edinburgh', toState: 'Scotland', toCountry: 'UK', departureTime: '08:00', arrivalTime: '16:30', durationMinutes: 510, vehicleType: 'Sleeper Coach', totalSeats: 44, basePrice: 85.00, transportType: 'bus' },
  { fromCity: 'Paris', fromState: 'Île-de-France', fromCountry: 'France', toCity: 'Lyon', toState: 'Auvergne-Rhône-Alpes', toCountry: 'France', departureTime: '10:00', arrivalTime: '12:00', durationMinutes: 120, vehicleType: 'TGV High-Speed', totalSeats: 350, basePrice: 75.00, transportType: 'train' },
  { fromCity: 'Paris', fromState: 'Île-de-France', fromCountry: 'France', toCity: 'Amsterdam', toState: 'North Holland', toCountry: 'Netherlands', departureTime: '07:00', arrivalTime: '10:20', durationMinutes: 200, vehicleType: 'Thalys High-Speed', totalSeats: 300, basePrice: 95.00, transportType: 'train' },
  { fromCity: 'Berlin', fromState: 'Berlin', fromCountry: 'Germany', toCity: 'Munich', toState: 'Bavaria', toCountry: 'Germany', departureTime: '08:00', arrivalTime: '12:00', durationMinutes: 240, vehicleType: 'ICE High-Speed', totalSeats: 400, basePrice: 89.00, transportType: 'train' },
  { fromCity: 'Berlin', fromState: 'Berlin', fromCountry: 'Germany', toCity: 'Frankfurt', toState: 'Hesse', toCountry: 'Germany', departureTime: '09:00', arrivalTime: '13:00', durationMinutes: 240, vehicleType: 'ICE High-Speed', totalSeats: 400, basePrice: 79.00, transportType: 'train' },
  { fromCity: 'Madrid', fromState: 'Community of Madrid', fromCountry: 'Spain', toCity: 'Barcelona', toState: 'Catalonia', toCountry: 'Spain', departureTime: '10:00', arrivalTime: '12:30', durationMinutes: 150, vehicleType: 'AVE High-Speed', totalSeats: 350, basePrice: 85.00, transportType: 'train' },
  { fromCity: 'Rome', fromState: 'Lazio', fromCountry: 'Italy', toCity: 'Milan', toState: 'Lombardy', toCountry: 'Italy', departureTime: '09:00', arrivalTime: '12:00', durationMinutes: 180, vehicleType: 'Frecciarossa', totalSeats: 450, basePrice: 69.00, transportType: 'train' },
  { fromCity: 'Amsterdam', fromState: 'North Holland', fromCountry: 'Netherlands', toCity: 'Brussels', toState: 'Brussels', toCountry: 'Belgium', departureTime: '11:00', arrivalTime: '13:00', durationMinutes: 120, vehicleType: 'Thalys High-Speed', totalSeats: 300, basePrice: 55.00, transportType: 'train' },
  
  // === ASIA ROUTES ===
  { fromCity: 'Tokyo', fromState: 'Tokyo', fromCountry: 'Japan', toCity: 'Osaka', toState: 'Osaka', toCountry: 'Japan', departureTime: '08:00', arrivalTime: '10:30', durationMinutes: 150, vehicleType: 'Shinkansen', totalSeats: 1300, basePrice: 130.00, transportType: 'train' },
  { fromCity: 'Tokyo', fromState: 'Tokyo', fromCountry: 'Japan', toCity: 'Kyoto', toState: 'Kyoto', toCountry: 'Japan', departureTime: '09:00', arrivalTime: '11:15', durationMinutes: 135, vehicleType: 'Shinkansen', totalSeats: 1300, basePrice: 125.00, transportType: 'train' },
  { fromCity: 'Singapore', fromState: 'Singapore', fromCountry: 'Singapore', toCity: 'Kuala Lumpur', toState: 'Federal Territory', toCountry: 'Malaysia', departureTime: '07:00', arrivalTime: '12:00', durationMinutes: 300, vehicleType: 'Luxury Coach', totalSeats: 40, basePrice: 35.00, transportType: 'bus' },
  { fromCity: 'Bangkok', fromState: 'Bangkok', fromCountry: 'Thailand', toCity: 'Pattaya', toState: 'Chonburi', toCountry: 'Thailand', departureTime: '10:00', arrivalTime: '12:30', durationMinutes: 150, vehicleType: 'VIP Bus', totalSeats: 32, basePrice: 15.00, transportType: 'bus' },
  { fromCity: 'Hong Kong', fromState: 'Hong Kong', fromCountry: 'Hong Kong', toCity: 'Shenzhen', toState: 'Guangdong', toCountry: 'China', departureTime: '09:00', arrivalTime: '09:45', durationMinutes: 45, vehicleType: 'High-Speed Rail', totalSeats: 500, basePrice: 25.00, transportType: 'train' },
  { fromCity: 'Seoul', fromState: 'Seoul', fromCountry: 'South Korea', toCity: 'Busan', toState: 'Busan', toCountry: 'South Korea', departureTime: '08:00', arrivalTime: '10:30', durationMinutes: 150, vehicleType: 'KTX High-Speed', totalSeats: 400, basePrice: 55.00, transportType: 'train' },
  
  // === AUSTRALIA ROUTES ===
  { fromCity: 'Sydney', fromState: 'New South Wales', fromCountry: 'Australia', toCity: 'Melbourne', toState: 'Victoria', toCountry: 'Australia', departureTime: '07:00', arrivalTime: '18:00', durationMinutes: 660, vehicleType: 'Luxury Coach', totalSeats: 48, basePrice: 85.00, transportType: 'bus' },
  { fromCity: 'Sydney', fromState: 'New South Wales', fromCountry: 'Australia', toCity: 'Brisbane', toState: 'Queensland', toCountry: 'Australia', departureTime: '08:00', arrivalTime: '22:00', durationMinutes: 840, vehicleType: 'Sleeper Coach', totalSeats: 40, basePrice: 120.00, transportType: 'bus' },
  { fromCity: 'Melbourne', fromState: 'Victoria', fromCountry: 'Australia', toCity: 'Adelaide', toState: 'South Australia', toCountry: 'Australia', departureTime: '09:00', arrivalTime: '19:00', durationMinutes: 600, vehicleType: 'Express Coach', totalSeats: 48, basePrice: 95.00, transportType: 'bus' },
  
  // === CANADA ROUTES ===
  { fromCity: 'Toronto', fromState: 'Ontario', fromCountry: 'Canada', toCity: 'Montreal', toState: 'Quebec', toCountry: 'Canada', departureTime: '08:00', arrivalTime: '14:00', durationMinutes: 360, vehicleType: 'VIA Rail Express', totalSeats: 200, basePrice: 85.00, transportType: 'train' },
  { fromCity: 'Toronto', fromState: 'Ontario', fromCountry: 'Canada', toCity: 'Ottawa', toState: 'Ontario', toCountry: 'Canada', departureTime: '09:00', arrivalTime: '13:30', durationMinutes: 270, vehicleType: 'VIA Rail', totalSeats: 200, basePrice: 65.00, transportType: 'train' },
  { fromCity: 'Vancouver', fromState: 'British Columbia', fromCountry: 'Canada', toCity: 'Calgary', toState: 'Alberta', toCountry: 'Canada', departureTime: '07:00', arrivalTime: '19:00', durationMinutes: 720, vehicleType: 'Rocky Mountaineer', totalSeats: 80, basePrice: 250.00, transportType: 'train' },
  
  // === MIDDLE EAST ROUTES ===
  { fromCity: 'Dubai', fromState: 'Dubai', fromCountry: 'UAE', toCity: 'Abu Dhabi', toState: 'Abu Dhabi', toCountry: 'UAE', departureTime: '10:00', arrivalTime: '11:30', durationMinutes: 90, vehicleType: 'Luxury Coach', totalSeats: 40, basePrice: 25.00, transportType: 'bus' },
  { fromCity: 'Dubai', fromState: 'Dubai', fromCountry: 'UAE', toCity: 'Sharjah', toState: 'Sharjah', toCountry: 'UAE', departureTime: '08:00', arrivalTime: '08:45', durationMinutes: 45, vehicleType: 'City Bus', totalSeats: 50, basePrice: 8.00, transportType: 'bus' },
  
  // === SOUTH AMERICA ROUTES ===
  { fromCity: 'São Paulo', fromState: 'São Paulo', fromCountry: 'Brazil', toCity: 'Rio de Janeiro', toState: 'Rio de Janeiro', toCountry: 'Brazil', departureTime: '08:00', arrivalTime: '14:00', durationMinutes: 360, vehicleType: 'Leito (Sleeper)', totalSeats: 28, basePrice: 65.00, transportType: 'bus' },
  { fromCity: 'Buenos Aires', fromState: 'Buenos Aires', fromCountry: 'Argentina', toCity: 'Montevideo', toState: 'Montevideo', toCountry: 'Uruguay', departureTime: '09:00', arrivalTime: '18:00', durationMinutes: 540, vehicleType: 'International Coach', totalSeats: 44, basePrice: 55.00, transportType: 'bus' },
  { fromCity: 'Santiago', fromState: 'Santiago Metropolitan', fromCountry: 'Chile', toCity: 'Valparaiso', toState: 'Valparaiso', toCountry: 'Chile', departureTime: '10:00', arrivalTime: '11:30', durationMinutes: 90, vehicleType: 'Express Bus', totalSeats: 45, basePrice: 12.00, transportType: 'bus' },
  
  // === FLIGHT ROUTES ===
  { fromCity: 'New York City', fromState: 'New York', fromCountry: 'USA', toCity: 'London', toState: 'England', toCountry: 'UK', departureTime: '19:00', arrivalTime: '07:00', durationMinutes: 420, vehicleType: 'Boeing 777', totalSeats: 300, basePrice: 450.00, transportType: 'flight' },
  { fromCity: 'Los Angeles', fromState: 'California', fromCountry: 'USA', toCity: 'Tokyo', toState: 'Tokyo', toCountry: 'Japan', departureTime: '11:00', arrivalTime: '15:00', durationMinutes: 720, vehicleType: 'Boeing 787', totalSeats: 280, basePrice: 650.00, transportType: 'flight' },
  { fromCity: 'London', fromState: 'England', fromCountry: 'UK', toCity: 'Paris', toState: 'Île-de-France', toCountry: 'France', departureTime: '08:00', arrivalTime: '10:15', durationMinutes: 75, vehicleType: 'Airbus A320', totalSeats: 180, basePrice: 120.00, transportType: 'flight' },
  { fromCity: 'Dubai', fromState: 'Dubai', fromCountry: 'UAE', toCity: 'Singapore', toState: 'Singapore', toCountry: 'Singapore', departureTime: '02:00', arrivalTime: '13:30', durationMinutes: 450, vehicleType: 'Airbus A380', totalSeats: 500, basePrice: 380.00, transportType: 'flight' },
  { fromCity: 'Sydney', fromState: 'New South Wales', fromCountry: 'Australia', toCity: 'Singapore', toState: 'Singapore', toCountry: 'Singapore', departureTime: '10:00', arrivalTime: '16:00', durationMinutes: 480, vehicleType: 'Boeing 787', totalSeats: 280, basePrice: 350.00, transportType: 'flight' },
]

console.log('\n🌍 Seeding international routes...\n')

let routesCreated = 0
let routesSkipped = 0
const routeIds = []

for (const route of internationalRoutes) {
  try {
    // Check if similar route already exists (same cities and transport type)
    const existing = db.prepare(`
      SELECT id FROM routes 
      WHERE LOWER(TRIM(from_city)) = LOWER(TRIM(?)) 
      AND LOWER(TRIM(to_city)) = LOWER(TRIM(?))
      AND transport_type = ?
    `).get(route.fromCity, route.toCity, route.transportType)
    
    if (existing) {
      console.log(`   ⏭️  Skipped: ${route.fromCity} → ${route.toCity} (${route.transportType}) - already exists`)
      routesSkipped++
      routeIds.push(existing.id)
      continue
    }

    const operatorId = getRandomOperatorId()
    const amenities = JSON.stringify(['WiFi', 'USB Charging', 'Air Conditioning', 'Restroom'])
    
    const result = db.prepare(`
      INSERT INTO routes (
        operator_id, from_city, from_state, from_country, to_city, to_state, to_country,
        departure_time, arrival_time, duration_minutes, vehicle_type, total_seats, 
        base_price, amenities, transport_type, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))
    `).run(
      operatorId,
      route.fromCity,
      route.fromState,
      route.fromCountry,
      route.toCity,
      route.toState,
      route.toCountry,
      route.departureTime,
      route.arrivalTime,
      route.durationMinutes,
      route.vehicleType,
      route.totalSeats,
      route.basePrice,
      amenities,
      route.transportType
    )

    console.log(`   ✅ Created: ${route.fromCity} → ${route.toCity} (${route.transportType}) - $${route.basePrice}`)
    routeIds.push(result.lastInsertRowid)
    routesCreated++
  } catch (error) {
    console.error(`   ❌ Error creating ${route.fromCity} → ${route.toCity}:`, error.message)
  }
}

// Create sample schedules for new routes
console.log('\n📅 Creating schedules for new routes...\n')

let schedulesCreated = 0

// Get today and next 7 days
const dates = []
for (let i = 0; i < 7; i++) {
  const date = new Date()
  date.setDate(date.getDate() + i)
  dates.push(date.toISOString().split('T')[0])
}

// Create schedules only for newly created routes
const newRouteIds = routeIds.slice(routeIds.length - routesCreated)

for (const routeId of newRouteIds) {
  const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(routeId)
  if (!route) continue
  
  for (const travelDate of dates) {
    try {
      // Check if schedule already exists
      const existing = db.prepare(`
        SELECT id FROM schedules WHERE route_id = ? AND travel_date = ?
      `).get(routeId, travelDate)
      
      if (existing) continue
      
      // Create schedule
      db.prepare(`
        INSERT INTO schedules (route_id, travel_date, available_seats, is_cancelled, created_at)
        VALUES (?, ?, ?, 0, datetime('now'))
      `).run(routeId, travelDate, route.total_seats)
      
      schedulesCreated++
    } catch (error) {
      // Ignore duplicate schedule errors
      if (!error.message.includes('UNIQUE')) {
        console.error(`   ⚠️ Schedule error: ${error.message}`)
      }
    }
  }
}

console.log(`   ✅ Created ${schedulesCreated} schedules for new routes`)

// Summary
console.log('\n' + '='.repeat(50))
console.log('📊 SUMMARY')
console.log('='.repeat(50))
console.log(`   Routes created:  ${routesCreated}`)
console.log(`   Routes skipped:  ${routesSkipped}`)
console.log(`   Schedules added: ${schedulesCreated}`)
console.log('='.repeat(50))

db.close()
console.log('\n✨ International routes seeding complete!')
