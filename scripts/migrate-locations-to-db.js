/**
 * Migration script: Move locations.json data to SQLite database
 * Run with: node scripts/migrate-locations-to-db.js
 */

const { DatabaseSync } = require('node:sqlite')
const { readFileSync, existsSync } = require('fs')
const { join } = require('path')

const dbPath = join(process.cwd(), 'data', 'travelflow.db')
const jsonPath = join(process.cwd(), 'lib', 'data', 'locations.json')

if (!existsSync(jsonPath)) {
  console.error('❌ locations.json not found at:', jsonPath)
  process.exit(1)
}

console.log('📂 Loading locations.json...')
const data = JSON.parse(readFileSync(jsonPath, 'utf-8'))

console.log('🔗 Connecting to database...')
const db = new DatabaseSync(dbPath)

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON')

// Create tables
console.log('📦 Creating tables...')
db.exec(`
  CREATE TABLE IF NOT EXISTS countries (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    iso2 TEXT NOT NULL UNIQUE,
    iso3 TEXT,
    phonecode TEXT,
    capital TEXT,
    currency TEXT,
    native TEXT,
    emoji TEXT
  );

  CREATE TABLE IF NOT EXISTS states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country_code TEXT NOT NULL,
    state_code TEXT NOT NULL,
    UNIQUE(country_code, state_code)
  );

  CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    state_code TEXT,
    country_code TEXT NOT NULL,
    latitude TEXT,
    longitude TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_countries_name ON countries(name COLLATE NOCASE);
  CREATE INDEX IF NOT EXISTS idx_countries_iso2 ON countries(iso2);
  CREATE INDEX IF NOT EXISTS idx_states_name ON states(name COLLATE NOCASE);
  CREATE INDEX IF NOT EXISTS idx_states_country ON states(country_code);
  CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name COLLATE NOCASE);
  CREATE INDEX IF NOT EXISTS idx_cities_country ON cities(country_code);
  CREATE INDEX IF NOT EXISTS idx_cities_state ON cities(state_code);
`)

// Check if already migrated
const existingCountries = db.prepare('SELECT COUNT(*) as count FROM countries').get()
if (existingCountries.count > 0) {
  console.log(`⚠️  Tables already contain data (${existingCountries.count} countries). Skipping migration.`)
  console.log('   To re-migrate, first delete existing data:')
  console.log('   DELETE FROM cities; DELETE FROM states; DELETE FROM countries;')
  db.close()
  process.exit(0)
}

// Prepare statements
const insertCountry = db.prepare(`
  INSERT OR IGNORE INTO countries (id, name, iso2, iso3, phonecode, capital, currency, native, emoji)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertState = db.prepare(`
  INSERT OR IGNORE INTO states (name, country_code, state_code)
  VALUES (?, ?, ?)
`)

const insertCity = db.prepare(`
  INSERT INTO cities (name, state_code, country_code, latitude, longitude)
  VALUES (?, ?, ?, ?, ?)
`)

// Begin transaction for faster inserts
db.exec('BEGIN TRANSACTION')

try {
  // Insert countries
  console.log('🌍 Inserting countries...')
  let countryCount = 0
  for (const [iso2, country] of Object.entries(data.countries || {})) {
    insertCountry.run(
      parseInt(country.id) || countryCount + 1,
      country.name || '',
      iso2,
      country.iso3 || null,
      country.phonecode || null,
      country.capital || null,
      country.currency || null,
      country.native || null,
      country.emoji || null
    )
    countryCount++
  }
  console.log(`   ✅ Inserted ${countryCount} countries`)

  // Insert states
  console.log('🏛️  Inserting states...')
  let stateCount = 0
  for (const [countryCode, states] of Object.entries(data.states || {})) {
    for (const state of states) {
      if (state && state.name && state.state_code) {
        insertState.run(state.name, countryCode, state.state_code)
        stateCount++
      }
    }
  }
  console.log(`   ✅ Inserted ${stateCount} states`)

  // Insert cities (from citiesByState first, then fallback to cities)
  console.log('🏙️  Inserting cities...')
  let cityCount = 0
  const seenCities = new Set()

  // First, insert from citiesByState (has state_code)
  for (const [key, cities] of Object.entries(data.citiesByState || {})) {
    const [countryCode, stateCode] = key.split('-')
    for (const city of cities) {
      if (city && city.name) {
        const cityKey = `${city.name.toLowerCase()}-${stateCode || ''}-${countryCode}`
        if (!seenCities.has(cityKey)) {
          seenCities.add(cityKey)
          insertCity.run(
            city.name,
            stateCode || city.state_code || null,
            countryCode,
            city.latitude || null,
            city.longitude || null
          )
          cityCount++
        }
      }
    }
  }

  // Then insert from cities (country-level, no state_code)
  for (const [countryCode, cities] of Object.entries(data.cities || {})) {
    for (const city of cities) {
      if (city && city.name) {
        const cityKey = `${city.name.toLowerCase()}-${city.state_code || ''}-${countryCode}`
        if (!seenCities.has(cityKey)) {
          seenCities.add(cityKey)
          insertCity.run(
            city.name,
            city.state_code || null,
            countryCode,
            city.latitude || null,
            city.longitude || null
          )
          cityCount++
        }
      }
    }
  }
  console.log(`   ✅ Inserted ${cityCount} cities`)

  // Commit transaction
  db.exec('COMMIT')
  
  console.log('')
  console.log('✨ Migration complete!')
  console.log(`   📊 Total: ${countryCount} countries, ${stateCount} states, ${cityCount} cities`)
  console.log('')
  console.log('🗑️  You can now safely delete lib/data/locations.json')
  console.log('   The data is now stored in data/travelflow.db')

} catch (error) {
  db.exec('ROLLBACK')
  console.error('❌ Migration failed:', error)
  process.exit(1)
} finally {
  db.close()
}
