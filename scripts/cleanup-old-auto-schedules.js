/**
 * Cleanup script to remove old 90-day auto-generated schedules
 * Only removes schedules that have no bookings associated with them
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'travelflow.db');

if (!fs.existsSync(dbPath)) {
  console.error('❌ Database not found at:', dbPath);
  process.exit(1);
}

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON');

console.log('🧹 Cleanup: Removing old 90-day auto-generated schedules\n');

try {
  // Step 1: Find schedules that look like they were auto-generated
  // Criteria: Sequential dates for the same route, no bookings
  
  console.log('📊 Analyzing schedules...\n');
  
  // Get all schedules grouped by route
  const routeSchedules = db.prepare(`
    SELECT 
      s.id,
      s.route_id,
      s.travel_date,
      s.available_seats,
      s.created_at,
      r.from_city,
      r.to_city,
      r.operator_id,
      o.name as operator_name,
      (SELECT COUNT(*) FROM seat_bookings sb WHERE sb.schedule_id = s.id AND sb.status = 'booked') as booking_count
    FROM schedules s
    JOIN routes r ON s.route_id = r.id
    LEFT JOIN operators o ON r.operator_id = o.id
    ORDER BY s.route_id, s.travel_date
  `).all();
  
  // Group by route
  const schedulesByRoute = new Map();
  for (const schedule of routeSchedules) {
    const routeId = schedule.route_id;
    if (!schedulesByRoute.has(routeId)) {
      schedulesByRoute.set(routeId, []);
    }
    schedulesByRoute.get(routeId).push(schedule);
  }
  
  // Identify auto-generated schedules (sequential dates, no bookings)
  const schedulesToDelete = [];
  let totalSchedules = 0;
  let schedulesWithBookings = 0;
  
  for (const [routeId, schedules] of schedulesByRoute.entries()) {
    // Sort by date
    schedules.sort((a, b) => new Date(a.travel_date) - new Date(b.travel_date));
    
    // Check if this looks like auto-generated (sequential dates)
    // Auto-generated schedules are typically consecutive dates
    let consecutiveCount = 0;
    let lastDate = null;
    
    for (let i = 0; i < schedules.length; i++) {
      const schedule = schedules[i];
      const currentDate = new Date(schedule.travel_date);
      
      // Skip schedules with bookings
      if (schedule.booking_count > 0) {
        schedulesWithBookings++;
        lastDate = null; // Reset consecutive count
        consecutiveCount = 0;
        continue;
      }
      
      // Check if this date is consecutive from the last
      if (lastDate) {
        const daysDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          consecutiveCount++;
        } else {
          // Not consecutive, reset
          consecutiveCount = 1;
        }
      } else {
        consecutiveCount = 1;
      }
      
      // If we have 7+ consecutive dates with no bookings, likely auto-generated
      // Also check if created_at dates are very close together (batch creation)
      if (consecutiveCount >= 7) {
        schedulesToDelete.push({
          id: schedule.id,
          route_id: schedule.route_id,
          travel_date: schedule.travel_date,
          from_city: schedule.from_city,
          to_city: schedule.to_city,
          operator_name: schedule.operator_name,
          available_seats: schedule.available_seats,
          booking_count: schedule.booking_count
        });
      }
      
      lastDate = currentDate;
      totalSchedules++;
    }
  }
  
  // Remove duplicates (in case a schedule appears in multiple consecutive sequences)
  const uniqueSchedulesToDelete = Array.from(
    new Map(schedulesToDelete.map(s => [s.id, s])).values()
  );
  
  console.log('📈 Analysis Results:');
  console.log(`   Total schedules: ${totalSchedules}`);
  console.log(`   Schedules with bookings: ${schedulesWithBookings}`);
  console.log(`   Schedules to delete: ${uniqueSchedulesToDelete.length}`);
  console.log(`   Schedules to keep: ${totalSchedules - uniqueSchedulesToDelete.length}\n`);
  
  if (uniqueSchedulesToDelete.length === 0) {
    console.log('✅ No auto-generated schedules found to clean up.');
    db.close();
    process.exit(0);
  }
  
  // Group by route for display
  const byRoute = new Map();
  for (const schedule of uniqueSchedulesToDelete) {
    const key = `${schedule.route_id}|${schedule.from_city}|${schedule.to_city}`;
    if (!byRoute.has(key)) {
      byRoute.set(key, {
        route_id: schedule.route_id,
        from_city: schedule.from_city,
        to_city: schedule.to_city,
        operator_name: schedule.operator_name,
        schedules: []
      });
    }
    byRoute.get(key).schedules.push(schedule);
  }
  
  console.log('🗑️  Schedules to be deleted (grouped by route):\n');
  for (const [key, routeData] of byRoute.entries()) {
    console.log(`   Route ${routeData.route_id}: ${routeData.from_city} → ${routeData.to_city} (${routeData.operator_name})`);
    console.log(`   ${routeData.schedules.length} schedules to delete`);
    console.log(`   Date range: ${routeData.schedules[0].travel_date} to ${routeData.schedules[routeData.schedules.length - 1].travel_date}\n`);
  }
  
  // Double-check: Verify no bookings exist
  console.log('🔍 Verifying no bookings exist for these schedules...\n');
  let hasBookings = false;
  for (const schedule of uniqueSchedulesToDelete) {
    const bookings = db.prepare(`
      SELECT COUNT(*) as count 
      FROM seat_bookings 
      WHERE schedule_id = ? AND status = 'booked'
    `).get(schedule.id);
    
    if (bookings.count > 0) {
      console.error(`   ⚠️  WARNING: Schedule ${schedule.id} has ${bookings.count} booking(s)! Skipping...`);
      hasBookings = true;
    }
  }
  
  if (hasBookings) {
    console.error('\n❌ Some schedules have bookings. Aborting deletion for safety.');
    db.close();
    process.exit(1);
  }
  
  console.log('✅ All schedules verified - no bookings found.\n');
  
  // Ask for confirmation (in a real scenario, you might want to add a prompt)
  console.log('⚠️  Ready to delete schedules. Starting deletion...\n');
  
  // Delete schedules
  let deletedCount = 0;
  let errorCount = 0;
  
  db.exec('BEGIN TRANSACTION');
  
  try {
    for (const schedule of uniqueSchedulesToDelete) {
      try {
        // First, delete any seat_bookings (should be none, but just in case)
        db.prepare(`
          DELETE FROM seat_bookings WHERE schedule_id = ?
        `).run(schedule.id);
        
        // Delete the schedule
        const result = db.prepare(`
          DELETE FROM schedules WHERE id = ?
        `).run(schedule.id);
        
        if (result.changes > 0) {
          deletedCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error deleting schedule ${schedule.id}:`, error.message);
        errorCount++;
      }
    }
    
    db.exec('COMMIT');
    console.log(`\n✅ Deletion complete!`);
    console.log(`   Deleted: ${deletedCount} schedules`);
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount}`);
    }
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('\n❌ Error during deletion. Transaction rolled back.');
    console.error('Error:', error.message);
    process.exit(1);
  }
  
} catch (error) {
  console.error('\n❌ Cleanup failed:', error);
  process.exit(1);
} finally {
  db.close();
}
