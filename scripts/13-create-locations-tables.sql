-- Create locations tables for worldwide city autocomplete
-- Migrated from locations.json (151K lines)

-- Countries table
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

-- States/Provinces table
CREATE TABLE IF NOT EXISTS states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  state_code TEXT NOT NULL,
  FOREIGN KEY (country_code) REFERENCES countries(iso2),
  UNIQUE(country_code, state_code)
);

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  state_code TEXT,
  country_code TEXT NOT NULL,
  latitude TEXT,
  longitude TEXT,
  FOREIGN KEY (country_code) REFERENCES countries(iso2)
);

-- Create indexes for fast autocomplete queries
CREATE INDEX IF NOT EXISTS idx_countries_name ON countries(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_countries_iso2 ON countries(iso2);

CREATE INDEX IF NOT EXISTS idx_states_name ON states(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_states_country ON states(country_code);
CREATE INDEX IF NOT EXISTS idx_states_code ON states(state_code);

CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_cities_country ON cities(country_code);
CREATE INDEX IF NOT EXISTS idx_cities_state ON cities(state_code);
CREATE INDEX IF NOT EXISTS idx_cities_name_prefix ON cities(name);

-- Full-text search index for better autocomplete (optional, for SQLite FTS5)
-- CREATE VIRTUAL TABLE IF NOT EXISTS cities_fts USING fts5(name, state_code, country_code, content=cities, content_rowid=id);
