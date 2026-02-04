-- Migration: Add round trip support to bookings table
-- Run this script to add round trip functionality

-- Add trip_type column to distinguish one-way and round-trip bookings
ALTER TABLE bookings ADD COLUMN trip_type TEXT DEFAULT 'one-way';

-- Add round_trip_id to link outbound and return bookings together
-- This will be a shared identifier (e.g., UUID) for both bookings in a round trip
ALTER TABLE bookings ADD COLUMN round_trip_id TEXT;

-- Add is_return flag to identify if this booking is the return leg (1) or outbound leg (0)
ALTER TABLE bookings ADD COLUMN is_return INTEGER DEFAULT 0;

-- Create index for better query performance when searching round trips
CREATE INDEX IF NOT EXISTS idx_bookings_round_trip_id ON bookings(round_trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_type ON bookings(trip_type);

-- Update existing bookings to have 'one-way' as default trip_type
UPDATE bookings SET trip_type = 'one-way' WHERE trip_type IS NULL;
