/**
 * Seed Sample Data Script
 * Creates operators, routes, recurring schedules, and schedules
 * 
 * Usage: node scripts/seed-sample-data.js
 */

const { DatabaseSync } = require('node:sqlite')
const path = require('path')
const fs = require('fs')

const DB_PATH = path.join(__dirname, '..', 'data', 'travelflow.db')

function generateSchedules(db, routeId, totalSeats, daysAhead = 30) {
  const today = new Date()
  let count = 0
  
  for (let i = 0; i < daysAhead; i++) {
    const scheduleDate = new Date(today)
    scheduleDate.setDate(today.getDate() + i)
    const dateStr = scheduleDate.toISOString().split('T')[0]
    
    try {
      // Check if schedule exists
      const existing = db.prepare('SELECT id FROM schedules WHERE route_id = ? AND travel_date = date(?)').get(routeId, dateStr)
      
      if (!existing) {
        db.prepare(`
          INSERT INTO schedules (route_id, travel_date, available_seats, is_cancelled)
          VALUES (?, date(?), ?, 0)
        `).run(routeId, dateStr, totalSeats)
        count++
      }
    } catch (err) {
      // Skip if exists
    }
  }
  
  return count
}

function createRecurringSchedule(db, route) {
  const today = new Date()
  const startDate = today.toISOString().split('T')[0]
  
  const endDate = new Date(today)
  endDate.setFullYear(endDate.getFullYear() + 1)
  const endDateStr = endDate.toISOString().split('T')[0]
  
  try {
    // Check if recurring schedule exists
    const existing = db.prepare('SELECT id FROM recurring_schedules WHERE route_id = ?').get(route.id)
    
    if (!existing) {
      db.prepare(`
        INSERT INTO recurring_schedules (
          route_id, recurrence_type, recurrence_days, start_date, end_date,
          departure_time, arrival_time, price_override, seat_capacity_override, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        route.id,
        'daily',
        null,
        startDate,
        endDateStr,
        route.departure_time,
        route.arrival_time,
        route.base_price,
        route.total_seats,
        'active'
      )
      return true
    }
  } catch (err) {
    console.error(`  ⚠️  Error creating recurring schedule for route ${route.id}:`, err.message)
  }
  return false
}

async function seedData() {
  console.log('\n🌱 SEED SAMPLE DATA SCRIPT')
  console.log('==========================')
  console.log(`Database: ${DB_PATH}\n`)

  try {
    const db = new DatabaseSync(DB_PATH)

    // =============================================
    // OPERATORS
    // =============================================
    console.log('📋 Creating Operators...')
    
    const operators = [
      { name: 'Emirates', email: 'bookings@emirates.com', phone: '+971-4-214-4444', rating: 4.8, reviews: 15420 },
      { name: 'Eurostar', email: 'support@eurostar.com', phone: '+44-3432-186-186', rating: 4.5, reviews: 8932 },
      { name: 'FlixBus', email: 'service@flixbus.com', phone: '+49-30-300-137-300', rating: 4.2, reviews: 12540 },
      { name: 'Delta Airlines', email: 'reservations@delta.com', phone: '+1-800-221-1212', rating: 4.4, reviews: 21350 },
      { name: 'Amtrak', email: 'customerservice@amtrak.com', phone: '+1-800-872-7245', rating: 4.1, reviews: 9870 },
    ]

    for (const op of operators) {
      try {
        const existing = db.prepare('SELECT id FROM operators WHERE email = ?').get(op.email)
        if (!existing) {
          db.prepare(`
            INSERT INTO operators (name, email, phone, rating, total_reviews, status)
            VALUES (?, ?, ?, ?, ?, 'active')
          `).run(op.name, op.email, op.phone, op.rating, op.reviews)
          console.log(`  ✅ Created: ${op.name}`)
        } else {
          console.log(`  ⏭️  Exists: ${op.name}`)
        }
      } catch (err) {
        console.log(`  ⚠️  Error: ${op.name} - ${err.message}`)
      }
    }

    // Get operator IDs
    const operatorIds = {}
    for (const op of operators) {
      const row = db.prepare('SELECT id FROM operators WHERE email = ?').get(op.email)
      if (row) operatorIds[op.name] = row.id
    }

    // =============================================
    // ROUTES
    // =============================================
    console.log('\n🛤️  Creating Routes...')
    
    const routes = [
      // Emirates
      { operator: 'Emirates', from: ['Dubai', 'Dubai', 'United Arab Emirates'], to: ['London', 'England', 'United Kingdom'], dep: '08:00', arr: '14:30', dur: 390, type: 'flight', vehicle: 'Boeing 777', seats: 300, price: 850 },
      { operator: 'Emirates', from: ['London', 'England', 'United Kingdom'], to: ['Dubai', 'Dubai', 'United Arab Emirates'], dep: '21:00', arr: '07:30', dur: 390, type: 'flight', vehicle: 'Boeing 777', seats: 300, price: 850 },
      
      // Eurostar
      { operator: 'Eurostar', from: ['London', 'England', 'United Kingdom'], to: ['Paris', 'Île-de-France', 'France'], dep: '07:00', arr: '10:20', dur: 200, type: 'train', vehicle: 'High-Speed Rail', seats: 750, price: 180 },
      { operator: 'Eurostar', from: ['Paris', 'Île-de-France', 'France'], to: ['London', 'England', 'United Kingdom'], dep: '18:00', arr: '19:20', dur: 200, type: 'train', vehicle: 'High-Speed Rail', seats: 750, price: 180 },
      { operator: 'Eurostar', from: ['London', 'England', 'United Kingdom'], to: ['Brussels', 'Brussels', 'Belgium'], dep: '09:00', arr: '12:00', dur: 180, type: 'train', vehicle: 'High-Speed Rail', seats: 750, price: 150 },
      
      // FlixBus
      { operator: 'FlixBus', from: ['Berlin', 'Berlin', 'Germany'], to: ['Amsterdam', 'North Holland', 'Netherlands'], dep: '06:00', arr: '12:30', dur: 390, type: 'bus', vehicle: 'AC Sleeper', seats: 45, price: 35 },
      { operator: 'FlixBus', from: ['Munich', 'Bavaria', 'Germany'], to: ['Vienna', 'Vienna', 'Austria'], dep: '08:00', arr: '12:30', dur: 270, type: 'bus', vehicle: 'AC Seater', seats: 50, price: 29 },
      { operator: 'FlixBus', from: ['Paris', 'Île-de-France', 'France'], to: ['Barcelona', 'Catalonia', 'Spain'], dep: '22:00', arr: '08:30', dur: 630, type: 'bus', vehicle: 'AC Sleeper', seats: 40, price: 55 },
      
      // Delta Airlines
      { operator: 'Delta Airlines', from: ['New York', 'New York', 'United States'], to: ['Los Angeles', 'California', 'United States'], dep: '09:00', arr: '12:30', dur: 330, type: 'flight', vehicle: 'Airbus A320', seats: 180, price: 350 },
      { operator: 'Delta Airlines', from: ['Los Angeles', 'California', 'United States'], to: ['New York', 'New York', 'United States'], dep: '14:00', arr: '22:30', dur: 330, type: 'flight', vehicle: 'Airbus A320', seats: 180, price: 350 },
      { operator: 'Delta Airlines', from: ['New York', 'New York', 'United States'], to: ['Miami', 'Florida', 'United States'], dep: '07:00', arr: '10:15', dur: 195, type: 'flight', vehicle: 'Boeing 737', seats: 160, price: 220 },
      
      // Amtrak
      { operator: 'Amtrak', from: ['Washington', 'District of Columbia', 'United States'], to: ['Boston', 'Massachusetts', 'United States'], dep: '06:30', arr: '13:00', dur: 390, type: 'train', vehicle: 'Acela Express', seats: 300, price: 120 },
      { operator: 'Amtrak', from: ['Boston', 'Massachusetts', 'United States'], to: ['Washington', 'District of Columbia', 'United States'], dep: '15:00', arr: '21:30', dur: 390, type: 'train', vehicle: 'Acela Express', seats: 300, price: 120 },
      { operator: 'Amtrak', from: ['New York', 'New York', 'United States'], to: ['Chicago', 'Illinois', 'United States'], dep: '15:45', arr: '09:45', dur: 1080, type: 'train', vehicle: 'Lake Shore Limited', seats: 250, price: 150 },
    ]

    const amenitiesByType = {
      flight: '["WiFi", "Meals", "Entertainment", "Charging"]',
      train: '["WiFi", "Café Car", "Charging"]',
      bus: '["WiFi", "Charging", "Restroom"]',
    }

    let routesCreated = 0
    for (const r of routes) {
      const opId = operatorIds[r.operator]
      if (!opId) {
        console.log(`  ⚠️  Operator not found: ${r.operator}`)
        continue
      }

      try {
        // Check if route exists
        const existing = db.prepare(`
          SELECT id FROM routes 
          WHERE operator_id = ? AND from_city = ? AND to_city = ? AND departure_time = ?
        `).get(opId, r.from[0], r.to[0], r.dep)

        if (!existing) {
          db.prepare(`
            INSERT INTO routes (
              operator_id, from_city, from_state, from_country, to_city, to_state, to_country,
              departure_time, arrival_time, duration_minutes, transport_type, vehicle_type,
              total_seats, base_price, amenities, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
          `).run(
            opId, r.from[0], r.from[1], r.from[2], r.to[0], r.to[1], r.to[2],
            r.dep, r.arr, r.dur, r.type, r.vehicle, r.seats, r.price, amenitiesByType[r.type]
          )
          console.log(`  ✅ Created: ${r.from[0]} → ${r.to[0]} (${r.operator})`)
          routesCreated++
        } else {
          console.log(`  ⏭️  Exists: ${r.from[0]} → ${r.to[0]} (${r.operator})`)
        }
      } catch (err) {
        console.log(`  ⚠️  Error: ${r.from[0]} → ${r.to[0]} - ${err.message}`)
      }
    }

    // =============================================
    // RECURRING SCHEDULES & SCHEDULES
    // =============================================
    console.log('\n📅 Creating Recurring Schedules & Schedules...')
    
    const allRoutes = db.prepare('SELECT * FROM routes WHERE status = ?').all('active')
    let totalSchedules = 0
    let recurringCount = 0

    for (const route of allRoutes) {
      // Create recurring schedule
      if (createRecurringSchedule(db, route)) {
        recurringCount++
      }
      
      // Generate 30 days of schedules
      const schedulesCreated = generateSchedules(db, route.id, route.total_seats, 30)
      totalSchedules += schedulesCreated
      
      if (schedulesCreated > 0) {
        console.log(`  ✅ Route ${route.id}: Created ${schedulesCreated} schedules`)
      }
    }

    // =============================================
    // SUMMARY
    // =============================================
    const operatorCount = db.prepare('SELECT COUNT(*) as count FROM operators').get().count
    const routeCount = db.prepare('SELECT COUNT(*) as count FROM routes').get().count
    const scheduleCount = db.prepare('SELECT COUNT(*) as count FROM schedules').get().count
    const recurringScheduleCount = db.prepare('SELECT COUNT(*) as count FROM recurring_schedules').get().count

    console.log('\n✅ SEED COMPLETE!')
    console.log('==================')
    console.log(`  📋 Operators: ${operatorCount}`)
    console.log(`  🛤️  Routes: ${routeCount}`)
    console.log(`  🔄 Recurring Schedules: ${recurringScheduleCount}`)
    console.log(`  📅 Schedules: ${scheduleCount}`)
    console.log('\n🎉 Ready for testing!\n')

    db.close()

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

seedData()
