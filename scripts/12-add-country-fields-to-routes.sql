-- Migration 12: Add country fields to routes table
-- This migration adds from_country and to_country columns to support international routes
-- Date: 2026-01-27

-- Add country columns to routes table (SQLite)
ALTER TABLE routes ADD COLUMN from_country TEXT;
ALTER TABLE routes ADD COLUMN to_country TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_routes_from_country ON routes(from_country);
CREATE INDEX IF NOT EXISTS idx_routes_to_country ON routes(to_country);
CREATE INDEX IF NOT EXISTS idx_routes_from_city_country ON routes(from_city COLLATE NOCASE, from_country);
CREATE INDEX IF NOT EXISTS idx_routes_to_city_country ON routes(to_city COLLATE NOCASE, to_country);
