import { NextResponse } from "next/server"
import { dbInstance } from "@/lib/db"

export async function POST() {
  try {
    // Create OTP codes table
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        otp_code TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        is_used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        used_at DATETIME
      );
    `)

    // Create indexes
    dbInstance.exec(`
      CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);
      CREATE INDEX IF NOT EXISTS idx_otp_code ON otp_codes(otp_code);
      CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at);
    `)

    return NextResponse.json({
      message: "OTP table created successfully",
      success: true,
    })
  } catch (error: any) {
    console.error("Error creating OTP table:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create OTP table" },
      { status: 500 }
    )
  }
}
