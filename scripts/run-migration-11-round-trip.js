/**
 * Migration script to add round trip support to bookings table
 * Run this to add trip_type, round_trip_id, and is_return columns
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'travelflow.db');

// Open database with better error handling
let db;
try {
  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON');
} catch (error) {
  console.error('❌ Failed to open database:', error.message);
  process.exit(1);
}

console.log('🚀 Running migration: Round Trip Support\n');

try {
  // Check if columns already exist
  const tableInfo = db.prepare(`PRAGMA table_info(bookings)`).all();
  const columnNames = tableInfo.map(col => col.name);
  
  console.log('Checking existing columns...');
  const hasTripType = columnNames.includes('trip_type');
  const hasRoundTripId = columnNames.includes('round_trip_id');
  const hasIsReturn = columnNames.includes('is_return');
  
  if (hasTripType && hasRoundTripId && hasIsReturn) {
    console.log('✅ All columns already exist. Migration not needed.');
    db.close();
    process.exit(0);
  }
  
  // Add columns that don't exist
  let columnsAdded = 0;
  let indexesCreated = 0;
  
  if (!hasTripType) {
    try {
      db.exec(`ALTER TABLE bookings ADD COLUMN trip_type TEXT DEFAULT 'one-way'`);
      console.log('✅ Added column: trip_type');
      columnsAdded++;
    } catch (error) {
      if (!error.message.includes('duplicate column')) {
        console.error(`❌ Failed to add trip_type column: ${error.message}`);
        throw error;
      }
    }
  } else {
    console.log('ℹ️  Column trip_type already exists');
  }
  
  if (!hasRoundTripId) {
    try {
      db.exec(`ALTER TABLE bookings ADD COLUMN round_trip_id TEXT`);
      console.log('✅ Added column: round_trip_id');
      columnsAdded++;
    } catch (error) {
      if (!error.message.includes('duplicate column')) {
        console.error(`❌ Failed to add round_trip_id column: ${error.message}`);
        throw error;
      }
    }
  } else {
    console.log('ℹ️  Column round_trip_id already exists');
  }
  
  if (!hasIsReturn) {
    try {
      db.exec(`ALTER TABLE bookings ADD COLUMN is_return INTEGER DEFAULT 0`);
      console.log('✅ Added column: is_return');
      columnsAdded++;
    } catch (error) {
      if (!error.message.includes('duplicate column')) {
        console.error(`❌ Failed to add is_return column: ${error.message}`);
        throw error;
      }
    }
  } else {
    console.log('ℹ️  Column is_return already exists');
  }
  
  // Create indexes
  console.log('\nCreating indexes...');
  
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_bookings_round_trip_id ON bookings(round_trip_id)`);
    console.log('✅ Created index: idx_bookings_round_trip_id');
    indexesCreated++;
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error(`❌ Failed to create index: ${error.message}`);
    } else {
      console.log('ℹ️  Index idx_bookings_round_trip_id already exists');
      indexesCreated++;
    }
  }
  
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_bookings_trip_type ON bookings(trip_type)`);
    console.log('✅ Created index: idx_bookings_trip_type');
    indexesCreated++;
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error(`❌ Failed to create index: ${error.message}`);
    } else {
      console.log('ℹ️  Index idx_bookings_trip_type already exists');
      indexesCreated++;
    }
  }
  
  // Update existing bookings to have 'one-way' as default trip_type
  if (!hasTripType) {
    try {
      const result = db.prepare(`UPDATE bookings SET trip_type = 'one-way' WHERE trip_type IS NULL`).run();
      console.log(`✅ Updated ${result.changes} existing bookings with default trip_type`);
    } catch (error) {
      console.error(`⚠️  Warning: Failed to update existing bookings: ${error.message}`);
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`  ✅ Columns added: ${columnsAdded}`);
  console.log(`  ✅ Indexes created: ${indexesCreated}`);
  
  // Verify columns exist
  console.log('\n🔍 Verifying columns...');
  const finalTableInfo = db.prepare(`PRAGMA table_info(bookings)`).all();
  const finalColumnNames = finalTableInfo.map(col => col.name);
  
  const requiredColumns = ['trip_type', 'round_trip_id', 'is_return'];
  for (const colName of requiredColumns) {
    if (finalColumnNames.includes(colName)) {
      console.log(`  ✅ Column '${colName}' exists`);
    } else {
      console.log(`  ❌ Column '${colName}' NOT found`);
    }
  }
  
  console.log('\n✅ Migration completed successfully!');
  
} catch (error) {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
