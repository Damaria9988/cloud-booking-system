/**
 * Simple JavaScript version to run SQLite setup scripts
 * Usage: node scripts/setup-database.js
 */

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const dataDir = path.join(process.cwd(), 'data')
const dbPath = path.join(dataDir, 'travelflow.db')

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Check if database exists and ask to reset (optional)
if (fs.existsSync(dbPath)) {
  console.log('⚠️  Database already exists. Starting fresh...')
  // Close and delete existing database
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath)
  }
}

console.log('📦 Connecting to SQLite database...')
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

// Helper to execute SQL file
function runSQLFile(filePath) {
  console.log(`\n📄 Running: ${path.basename(filePath)}`)
  try {
    const sql = fs.readFileSync(filePath, 'utf-8')
    
    // Remove comments (lines starting with --)
    const cleanedSQL = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
    
    // Execute the entire SQL file at once
    // SQLite's exec() handles multiple statements separated by semicolons
    try {
      db.exec(cleanedSQL)
      console.log(`  ✅ SQL file executed successfully`)
    } catch (error) {
      // Check if it's just a "table already exists" error (which is OK)
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log(`  ⚠️  Some objects already exist (this is OK)`)
      } else {
        console.error(`  ❌ Error executing SQL: ${error.message}`)
        throw error
      }
    }
  } catch (error) {
    console.error(`  ❌ Error reading file: ${error.message}`)
  }
}

// Scripts to run in order
const scripts = [
  '01-create-tables-sqlite.sql',
  '03-create-recurring-schedules-sqlite.sql',
]

console.log('🚀 Starting database setup...\n')

for (const script of scripts) {
  const scriptPath = path.join(process.cwd(), 'scripts', script)
  if (fs.existsSync(scriptPath)) {
    runSQLFile(scriptPath)
  } else {
    console.log(`⚠️  Script not found: ${script}`)
  }
}

// Verify tables were created
console.log('\n📊 Verifying tables...')
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' 
  ORDER BY name
`).all()

console.log(`✅ Found ${tables.length} tables:`)
tables.forEach(table => {
  console.log(`   - ${table.name}`)
})

db.close()
console.log('\n✨ Database setup complete!')
console.log(`📁 Database location: ${dbPath}`)

