#!/usr/bin/env node
/**
 * Script to run SQLite database setup scripts
 * Usage: npx tsx scripts/run-sqlite-scripts.ts
 */

import Database from 'better-sqlite3'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const dataDir = join(process.cwd(), 'data')
const dbPath = join(dataDir, 'travelflow.db')

// Ensure data directory exists
if (!existsSync(dataDir)) {
  const { mkdirSync } = require('fs')
  mkdirSync(dataDir, { recursive: true })
}

console.log('📦 Connecting to SQLite database...')
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

// Helper to execute SQL file
function runSQLFile(filePath: string) {
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
    } catch (error: any) {
      // Check if it's just a "table already exists" error (which is OK)
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log(`  ⚠️  Some objects already exist (this is OK)`)
      } else {
        console.error(`  ❌ Error executing SQL: ${error.message}`)
        throw error
      }
    }
  } catch (error: any) {
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
  const scriptPath = join(process.cwd(), 'scripts', script)
  if (existsSync(scriptPath)) {
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
`).all() as Array<{ name: string }>

console.log(`✅ Found ${tables.length} tables:`)
tables.forEach(table => {
  console.log(`   - ${table.name}`)
})

db.close()
console.log('\n✨ Database setup complete!')
console.log(`📁 Database location: ${dbPath}`)

