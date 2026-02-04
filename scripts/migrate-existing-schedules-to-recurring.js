/**
 * Migration script to convert existing schedules to recurring schedule rules
 * This analyzes existing schedules and creates recurring schedule rules that match them
 * 
 * Run with: node scripts/migrate-existing-schedules-to-recurring.js
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'travelflow.db');

// Open database
let db;
try {
  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON');
} catch (error) {
  console.error('❌ Failed to open database:', error.message);
  process.exit(1);
}

console.log('🔄 Migrating Existing Schedules to Recurring Schedule Rules\n');

try {
  // Step 1: Get all routes with their schedules
  console.log('📋 Step 1: Analyzing existing schedules...\n');
  
  const routesWithSchedules = db.prepare(`
    SELECT 
      r.id as route_id,
      r.from_city,
      r.from_state,
      r.to_city,
      r.to_state,
      r.departure_time,
      r.arrival_time,
      r.base_price,
      COUNT(s.id) as schedule_count,
      MIN(s.travel_date) as earliest_date,
      MAX(s.travel_date) as latest_date
    FROM routes r
    LEFT JOIN schedules s ON r.id = s.route_id AND s.is_cancelled = 0
    WHERE r.status = 'active'
    GROUP BY r.id
    HAVING schedule_count > 0
    ORDER BY schedule_count DESC
  `).all();
  
  console.log(`Found ${routesWithSchedules.length} routes with existing schedules\n`);
  
  if (routesWithSchedules.length === 0) {
    console.log('ℹ️  No routes with schedules found. Nothing to migrate.');
    db.close();
    process.exit(0);
  }
  
  // Step 2: For each route, analyze schedule patterns
  let recurringRulesCreated = 0;
  let routesProcessed = 0;
  
  for (const route of routesWithSchedules) {
    routesProcessed++;
    console.log(`\n${routesProcessed}. Processing Route: ${route.from_city} → ${route.to_city} (${route.schedule_count} schedules)`);
    
    // Get all schedules for this route
    const schedules = db.prepare(`
      SELECT travel_date, available_seats
      FROM schedules
      WHERE route_id = ? AND is_cancelled = 0
      ORDER BY travel_date ASC
    `).all(route.route_id);
    
    if (schedules.length === 0) continue;
    
    // Analyze pattern
    const dates = schedules.map(s => new Date(s.travel_date));
    const dateStrings = schedules.map(s => s.travel_date);
    
    // Check if schedules are daily (consecutive dates)
    let isDaily = true;
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      prevDate.setDate(prevDate.getDate() + 1);
      
      if (prevDate.toISOString().split('T')[0] !== currDate.toISOString().split('T')[0]) {
        isDaily = false;
        break;
      }
    }
    
    // Check if schedules are weekly (same day of week)
    const dayOfWeek = dates[0].getDay();
    let isWeekly = true;
    const weekDays = new Set();
    dates.forEach(d => weekDays.add(d.getDay()));
    
    if (weekDays.size > 1) {
      isWeekly = false;
    }
    
    // Determine recurrence type
    let recurrenceType = 'daily';
    let recurrenceDays = null;
    
    if (isWeekly && weekDays.size === 1) {
      recurrenceType = 'weekly';
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      recurrenceDays = [dayNames[dayOfWeek]];
    }
    
    // Calculate date range
    const startDate = dateStrings[0];
    const endDate = dateStrings[dateStrings.length - 1];
    
    // Check if recurring schedule already exists for this route
    const existingRecurring = db.prepare(`
      SELECT id FROM recurring_schedules
      WHERE route_id = ? AND start_date = ? AND end_date = ?
    `).get(route.route_id, startDate, endDate);
    
    if (existingRecurring) {
      console.log(`   ⏭️  Recurring schedule already exists (ID: ${existingRecurring.id}). Skipping.`);
      continue;
    }
    
    // Create recurring schedule rule
    try {
      const result = db.prepare(`
        INSERT INTO recurring_schedules (
          route_id, recurrence_type, recurrence_days, start_date, end_date,
          departure_time, arrival_time, price_override, seat_capacity_override, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        route.route_id,
        recurrenceType,
        recurrenceDays ? JSON.stringify(recurrenceDays) : null,
        startDate,
        endDate,
        route.departure_time,
        route.arrival_time,
        null, // price_override
        null, // seat_capacity_override
        'active'
      );
      
      console.log(`   ✅ Created recurring schedule rule (ID: ${result.lastInsertRowid})`);
      console.log(`      Type: ${recurrenceType}${recurrenceDays ? ` (${recurrenceDays.join(', ')})` : ''}`);
      console.log(`      Date range: ${startDate} to ${endDate}`);
      console.log(`      Matches ${schedules.length} existing schedules`);
      
      recurringRulesCreated++;
      
    } catch (error) {
      console.error(`   ❌ Failed to create recurring schedule: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log(`   Routes analyzed: ${routesProcessed}`);
  console.log(`   Recurring rules created: ${recurringRulesCreated}`);
  console.log('='.repeat(60));
  
  if (recurringRulesCreated > 0) {
    console.log('\n✅ Migration completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Review the created recurring schedule rules in the admin panel');
    console.log('   2. You can now manage these schedules through the recurring schedule system');
    console.log('   3. Future schedules will be generated automatically based on these rules');
    console.log('   4. Existing schedules remain unchanged and continue to work normally');
  } else {
    console.log('\nℹ️  No new recurring rules were created (they may already exist).');
  }
  
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  if (error.stack) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }
  process.exit(1);
} finally {
  db.close();
}
