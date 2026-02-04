-- Migration: Add passenger_type column and ensure payment_method is properly used
-- Run this script to update the database schema

-- Add passenger_type column to passengers table
ALTER TABLE passengers ADD COLUMN passenger_type TEXT DEFAULT 'adult';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_passengers_type ON passengers(passenger_type);

-- Verify payment_method column exists in bookings table (should already exist)
-- If it doesn't exist, uncomment the line below:
-- ALTER TABLE bookings ADD COLUMN payment_method TEXT;

-- Update any existing passengers to have 'adult' as default type
UPDATE passengers SET passenger_type = 'adult' WHERE passenger_type IS NULL;
