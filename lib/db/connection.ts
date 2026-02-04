/**
 * Database connection and SQL utilities
 * Handles SQLite connection setup and SQL conversion from PostgreSQL
 */

import { DatabaseSync } from 'node:sqlite'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// Ensure data directory exists
const dataDir = join(process.cwd(), 'data')
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

// Create SQLite database connection using Node.js built-in
const dbPath = join(dataDir, 'travelflow.db')
export const database = new DatabaseSync(dbPath)

// Enable foreign keys
database.exec('PRAGMA foreign_keys = ON')

// Performance optimizations for SQLite
database.exec('PRAGMA journal_mode = WAL') // Write-Ahead Logging for better concurrency
database.exec('PRAGMA synchronous = NORMAL') // Balance between safety and speed
database.exec('PRAGMA cache_size = -64000') // 64MB cache (negative = KB)
database.exec('PRAGMA temp_store = MEMORY') // Store temp tables in memory
database.exec('PRAGMA mmap_size = 268435456') // 256MB memory-mapped I/O

/**
 * Convert PostgreSQL placeholders ($1, $2) to SQLite (?)
 */
export function convertPlaceholders(sql: string): string {
  return sql.replace(/\$(\d+)/g, '?')
}

/**
 * Convert PostgreSQL-specific SQL to SQLite
 */
export function convertSQL(sql: string): string {
  // Remove ::date casts
  sql = sql.replace(/::date/g, '')
  // Remove ::timestamp casts
  sql = sql.replace(/::timestamp/g, '')
  // Convert INTERVAL to date arithmetic
  sql = sql.replace(/CURRENT_DATE - INTERVAL '(\d+) days'/g, "date('now', '-$1 days')")
  sql = sql.replace(/CURRENT_DATE - INTERVAL '30 days'/g, "date('now', '-30 days')")
  // Convert PostgreSQL NOW() to SQLite datetime('now')
  sql = sql.replace(/NOW\(\)/gi, "datetime('now')")
  // Convert PostgreSQL version() to SQLite sqlite_version()
  sql = sql.replace(/\bversion\(\)/gi, "sqlite_version()")
  // Convert DISTINCT ON to subquery (simplified)
  sql = sql.replace(/DISTINCT ON \(([^)]+)\)/g, 'DISTINCT')
  // Convert FILTER (WHERE ...) to CASE WHEN
  sql = sql.replace(/COUNT\(([^)]+)\) FILTER \(WHERE ([^)]+)\)/g, "SUM(CASE WHEN $2 THEN 1 ELSE 0 END)")
  // Convert array_agg to GROUP_CONCAT (for simple cases)
  sql = sql.replace(/array_agg\(([^)]+)\)/g, "GROUP_CONCAT($1)")
  // Convert json_build_object to json_object (SQLite 3.38+)
  // For older versions, we'll handle this in post-processing
  return sql
}

/**
 * Execute SQL queries with parameterized statements
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  try {
    let sqliteSql = convertSQL(convertPlaceholders(sql))
    const stmt = database.prepare(sqliteSql)
    
    if (params && params.length > 0) {
      // Convert boolean to integer for SQLite
      const convertedParams = params.map(p => {
        if (typeof p === 'boolean') return p ? 1 : 0
        if (Array.isArray(p)) return JSON.stringify(p)
        return p
      })
      const result = stmt.all(...convertedParams) as T[]
      return result
    } else {
      const result = stmt.all() as T[]
      return result
    }
  } catch (error) {
    console.error('Database query error:', error)
    console.error('SQL:', sql)
    console.error('Params:', params)
    throw error
  }
}

/**
 * Execute a query that returns a single row
 */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  try {
    let sqliteSql = convertSQL(convertPlaceholders(sql))
    const stmt = database.prepare(sqliteSql)
    
    if (params && params.length > 0) {
      const convertedParams = params.map(p => {
        if (typeof p === 'boolean') return p ? 1 : 0
        if (Array.isArray(p)) return JSON.stringify(p)
        return p
      })
      const result = stmt.get(...convertedParams) as T | undefined
      return result || null
    } else {
      const result = stmt.get() as T | undefined
      return result || null
    }
  } catch (error) {
    console.error('Database queryOne error:', error)
    console.error('SQL:', sql)
    console.error('Params:', params)
    throw error
  }
}

/**
 * Execute a query that modifies data (INSERT, UPDATE, DELETE)
 */
export async function execute(sql: string, params?: any[]): Promise<{ lastInsertRowid: number; changes: number }> {
  try {
    let sqliteSql = convertSQL(convertPlaceholders(sql))
    const stmt = database.prepare(sqliteSql)
    
    if (params && params.length > 0) {
      const convertedParams = params.map(p => {
        if (typeof p === 'boolean') return p ? 1 : 0
        if (Array.isArray(p)) return JSON.stringify(p)
        return p
      })
      stmt.run(...convertedParams)
    } else {
      stmt.run()
    }
    
    return {
      lastInsertRowid: Number(database.lastInsertRowId),
      changes: stmt.changes || 0
    }
  } catch (error) {
    console.error('Database execute error:', error)
    console.error('SQL:', sql)
    console.error('Params:', params)
    throw error
  }
}

/**
 * Close the database connection (useful for cleanup)
 */
export async function closePool() {
  database.close()
}
