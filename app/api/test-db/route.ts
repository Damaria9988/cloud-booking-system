import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// Test database connection
export async function GET() {
  try {
    // Test simple query (SQLite compatible)
    const result = await query("SELECT datetime('now') as current_time, sqlite_version() as db_version")
    
    // Test users table exists
    const users = await query("SELECT COUNT(*) as count FROM users")
    
    return NextResponse.json({
      success: true,
      database: "Connected (SQLite)",
      currentTime: result[0]?.current_time,
      dbVersion: result[0]?.db_version,
      usersCount: users[0]?.count,
      message: "Database connection is working!"
    })
  } catch (error: any) {
    console.error("Database test error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    }, { status: 500 })
  }
}

