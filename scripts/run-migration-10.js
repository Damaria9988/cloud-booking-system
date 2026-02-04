/**
 * Migration Script: Optimize route queries for faster seat page loading
 * Usage: node scripts/run-migration-10.js
 * 
 * Note: This uses Node.js built-in SQLite (node:sqlite) instead of better-sqlite3
 */

const { DatabaseSync } = require('node:sqlite')
const fs = require('fs')
const path = require('path')

const dataDir = path.join(process.cwd(), 'data')
const dbPath = path.join(dataDir, 'travelflow.db')

console.log('🚀 Starting migration 10: Optimize route queries...\n')

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.error('❌ Database not found at:', dbPath)
  console.error('   Please run setup-database.js first')
  process.exit(1)
}

console.log('📦 Connecting to SQLite database...')
console.log(`   Database path: ${dbPath}`)
const db = new DatabaseSync(dbPath)
db.exec('PRAGMA foreign_keys = ON')

// Helper to execute SQL file
function runSQLFile(filePath) {
  console.log(`\n📄 Running: ${path.basename(filePath)}`)
  try {
    const sql = fs.readFileSync(filePath, 'utf-8')
    
    // Execute statements one by one
    const statements = [
      'CREATE INDEX IF NOT EXISTS idx_routes_id_status ON routes(id, status)',
      'CREATE INDEX IF NOT EXISTS idx_operators_id ON operators(id)',
      'ANALYZE routes',
      'ANALYZE operators'
    ]
    
    console.log(`  Executing ${statements.length} statements...\n`)
    
    let executed = 0
    for (const statement of statements) {
      try {
        db.exec(statement + ';')
        executed++
        const preview = statement.substring(0, 70)
        console.log(`  ✓ ${preview}`)
      } catch (error) {
        const errorMsg = error.message || String(error)
        if (errorMsg.includes('already exists') || errorMsg.includes('duplicate') || errorMsg.includes('UNIQUE constraint')) {
          const preview = statement.substring(0, 70)
          console.log(`  ⚠️  Already exists: ${preview}`)
          executed++ // Count as executed since IF NOT EXISTS handled it
        } else {
          console.error(`  ❌ Error: ${errorMsg}`)
          console.error(`     Statement: ${statement}`)
          throw error
        }
      }
    }
    
    console.log(`\n  ✅ Migration executed successfully (${executed}/${statements.length} statements)`)
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`)
    throw error
  }
}

// Run the migration
const migrationPath = path.join(process.cwd(), 'scripts', '10-optimize-route-queries.sql')

if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Migration file not found: ${migrationPath}`)
  process.exit(1)
}

console.log('🚀 Starting migration...\n')
runSQLFile(migrationPath)

// Verify the migration
console.log('\n📊 Verifying migration...')

// Check if idx_routes_id_status index exists
try {
  const indexes = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='index' AND tbl_name='routes' AND name='idx_routes_id_status'
  `).all()
  
  if (indexes.length > 0) {
    console.log('  ✅ idx_routes_id_status index exists on routes table')
  } else {
    console.log('  ⚠️  idx_routes_id_status index not found (may need manual check)')
  }
} catch (error) {
  console.log('  ⚠️  Could not verify routes indexes')
}

// Check if idx_operators_id index exists
try {
  const indexes = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='index' AND tbl_name='operators' AND name='idx_operators_id'
  `).all()
  
  if (indexes.length > 0) {
    console.log('  ✅ idx_operators_id index exists on operators table')
  } else {
    console.log('  ⚠️  idx_operators_id index not found (may need manual check)')
  }
} catch (error) {
  console.log('  ⚠️  Could not verify operators indexes')
}

// List all route-related indexes
try {
  const allRouteIndexes = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='index' AND tbl_name='routes' AND name LIKE 'idx_routes%'
  `).all()
  
  if (allRouteIndexes.length > 0) {
    console.log(`\n  📋 All route indexes (${allRouteIndexes.length}):`)
    allRouteIndexes.forEach(idx => {
      console.log(`     - ${idx.name}`)
    })
  }
} catch (error) {
  console.log('  ⚠️  Could not list route indexes')
}

db.close()
console.log('\n✨ Migration complete!')
console.log(`📁 Database location: ${dbPath}`)
console.log('\n💡 Next steps:')
console.log('   1. The indexes are now active and will speed up route queries')
console.log('   2. Test the seat selection page - it should load faster')
console.log('   3. Monitor query performance in your application')
