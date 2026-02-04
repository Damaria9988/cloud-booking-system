#!/usr/bin/env node
/**
 * Migration 12: Add country fields to routes table
 * Adds from_country and to_country columns to support international routes
 * 
 * Usage: node scripts/run-migration-12-country-fields.js
 */

const { DatabaseSync } = require('node:sqlite')
const { readFileSync, existsSync } = require('fs')
const { join } = require('path')

const dataDir = join(process.cwd(), 'data')
const dbPath = join(dataDir, 'travelflow.db')

// Ensure data directory exists
if (!existsSync(dataDir)) {
  const { mkdirSync } = require('fs')
  mkdirSync(dataDir, { recursive: true })
}

console.log('📦 Connecting to SQLite database...')
const db = new DatabaseSync(dbPath)
db.exec('PRAGMA foreign_keys = ON')

// Helper to execute SQL file
function runSQLFile(filePath) {
  console.log(`\n📄 Running: ${filePath}`)
  try {
    const sql = readFileSync(filePath, 'utf-8')
    
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
      // Check if it's just a "column already exists" error (which is OK)
      if (error.message.includes('duplicate column') || 
          error.message.includes('already exists') || 
          error.message.includes('duplicate')) {
        console.log(`  ⚠️  Columns already exist (this is OK)`)
      } else {
        console.error(`  ❌ Error executing SQL: ${error.message}`)
        throw error
      }
    }
  } catch (error) {
    console.error(`  ❌ Error reading file: ${error.message}`)
    throw error
  }
}

// Run the migration
console.log('🚀 Running migration: Add Country Fields to Routes Table\n')

const migrationPath = join(process.cwd(), 'scripts', '12-add-country-fields-to-routes.sql')

if (!existsSync(migrationPath)) {
  console.error(`❌ Migration file not found: ${migrationPath}`)
  process.exit(1)
}

runSQLFile(migrationPath)

// Verify columns were added
console.log('\n📊 Verifying columns...')
try {
  const columns = db.prepare(`PRAGMA table_info(routes)`).all()
  const columnNames = columns.map(col => col.name)
  
  if (columnNames.includes('from_country') && columnNames.includes('to_country')) {
    console.log('✅ Migration successful! Columns added:')
    console.log('   - from_country')
    console.log('   - to_country')
  } else {
    console.log('⚠️  Warning: Columns may not have been added correctly')
    console.log('   Current columns:', columnNames.join(', '))
  }
} catch (error) {
  console.error('❌ Error verifying columns:', error.message)
}

// Verify indexes were created
console.log('\n📊 Verifying indexes...')
try {
  const indexes = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='index' 
    AND name LIKE 'idx_routes_%country%'
    ORDER BY name
  `).all()
  
  if (indexes.length > 0) {
    console.log(`✅ Found ${indexes.length} country-related indexes:`)
    indexes.forEach(idx => console.log(`   - ${idx.name}`))
  } else {
    console.log('⚠️  Warning: No country-related indexes found')
  }
} catch (error) {
  console.error('❌ Error verifying indexes:', error.message)
}

console.log('\n✨ Migration complete!')
console.log(`📁 Database location: ${dbPath}`)
