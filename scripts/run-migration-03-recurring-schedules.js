// Run migration to create recurring_schedules table
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('path');

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

console.log('🚀 Running migration: Recurring Schedules Table\n');

try {
  // Create table directly (more reliable than parsing SQL file)
  console.log('Creating recurring_schedules table...');
  
  const createTableSQL = `CREATE TABLE IF NOT EXISTS recurring_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    recurrence_type TEXT NOT NULL,
    recurrence_days TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    price_override REAL,
    seat_capacity_override INTEGER,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`;
  
  try {
    db.exec(createTableSQL);
    console.log('✅ Created table: recurring_schedules');
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error(`❌ Failed to create table: ${error.message}`);
      throw error;
    } else {
      console.log('ℹ️  Table \'recurring_schedules\' already exists');
    }
  }
  
  // Create indexes
  const createIndexStatements = [
    `CREATE INDEX IF NOT EXISTS idx_recurring_schedules_route_id ON recurring_schedules(route_id)`,
    `CREATE INDEX IF NOT EXISTS idx_recurring_schedules_status ON recurring_schedules(status)`
  ];
  
  for (const sql of createIndexStatements) {
    try {
      db.exec(sql);
      const indexName = sql.match(/CREATE INDEX IF NOT EXISTS (\w+)/i)?.[1];
      console.log(`✅ Created index: ${indexName}`);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error(`❌ Failed to create index: ${error.message}`);
      } else {
        const indexName = sql.match(/CREATE INDEX IF NOT EXISTS (\w+)/i)?.[1];
        console.log(`ℹ️  Index '${indexName}' already exists`);
      }
    }
  }
  
  // Verify table was created
  console.log('\n🔍 Verifying table...');
  const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get('recurring_schedules');
  
  if (result) {
    console.log('✅ Verified: recurring_schedules table exists');
    
    // Check columns
    const columns = db.prepare(`PRAGMA table_info(recurring_schedules)`).all();
    console.log(`   Columns: ${columns.length}`);
    columns.forEach(col => {
      console.log(`   - ${col.name} (${col.type})`);
    });
  } else {
    console.error('❌ Warning: Table verification failed');
  }
  
  console.log('\n✅ Migration completed successfully!');
  
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
