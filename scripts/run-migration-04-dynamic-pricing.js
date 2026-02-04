/**
 * Migration script to create dynamic pricing tables
 * Run this after creating the tables SQL file
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

console.log('🚀 Running migration: Dynamic Pricing Tables\n');

try {
  // Create tables directly (more reliable than parsing SQL file)
  console.log('Creating tables and indexes...\n');
    
  const createTableStatements = [
      `CREATE TABLE IF NOT EXISTS date_price_overrides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
        travel_date DATE NOT NULL,
        price_override REAL NOT NULL,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(route_id, travel_date)
      )`,
      `CREATE TABLE IF NOT EXISTS holidays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        date DATE NOT NULL,
        type TEXT DEFAULT 'national',
        is_recurring BOOLEAN DEFAULT 0,
        price_multiplier REAL DEFAULT 1.5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, name)
      )`,
      `CREATE TABLE IF NOT EXISTS recurring_schedule_price_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recurring_schedule_id INTEGER REFERENCES recurring_schedules(id) ON DELETE CASCADE,
        day_of_week TEXT,
        price_multiplier REAL DEFAULT 1.0,
        fixed_price REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
  ];
  
  let tablesCreated = 0;
  let indexesCreated = 0;
  let errors = 0;
  
  for (const sql of createTableStatements) {
    try {
      db.exec(sql);
      tablesCreated++;
      const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/i)?.[1];
      console.log(`✅ Created table: ${tableName}`);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error(`❌ Failed to create table: ${error.message}`);
        errors++;
      } else {
        const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/i)?.[1];
        console.log(`ℹ️  Table '${tableName}' already exists`);
        tablesCreated++;
      }
    }
  }
  
  // Now create indexes
  const createIndexStatements = [
      `CREATE INDEX IF NOT EXISTS idx_date_price_overrides_route_date ON date_price_overrides(route_id, travel_date)`,
      `CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date)`,
      `CREATE INDEX IF NOT EXISTS idx_holidays_recurring ON holidays(is_recurring)`,
      `CREATE INDEX IF NOT EXISTS idx_recurring_schedule_price_rules_recurring_id ON recurring_schedule_price_rules(recurring_schedule_id)`
  ];
  
  for (const sql of createIndexStatements) {
    try {
      db.exec(sql);
      indexesCreated++;
      const indexName = sql.match(/CREATE INDEX IF NOT EXISTS (\w+)/i)?.[1];
      console.log(`✅ Created index: ${indexName}`);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error(`❌ Failed to create index: ${error.message}`);
        errors++;
      } else {
        const indexName = sql.match(/CREATE INDEX IF NOT EXISTS (\w+)/i)?.[1];
        console.log(`ℹ️  Index '${indexName}' already exists`);
        indexesCreated++;
      }
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`  ✅ Tables created/verified: ${tablesCreated}`);
  console.log(`  ✅ Indexes created/verified: ${indexesCreated}`);
  if (errors > 0) {
    console.log(`  ⚠️  Errors encountered: ${errors}`);
  }
  
  // Verify tables exist
  console.log('\n🔍 Verifying tables...');
  const tableNames = ['date_price_overrides', 'holidays', 'recurring_schedule_price_rules'];
  for (const tableName of tableNames) {
    try {
      const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(tableName);
      if (result) {
        console.log(`  ✅ Table '${tableName}' exists`);
      } else {
        console.log(`  ❌ Table '${tableName}' NOT found`);
      }
    } catch (error) {
      console.log(`  ❌ Error checking table '${tableName}': ${error.message}`);
    }
  }
  
  if (errors === 0 && tablesCreated >= 3) {
    console.log('\n✅ Migration completed successfully!');
  } else {
    console.log('\n⚠️  Migration completed with warnings. Please review the output above.');
  }
  
} catch (error) {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
