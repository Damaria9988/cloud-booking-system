-- Migration 12: Add country fields to routes table (PostgreSQL)
-- This migration adds from_country and to_country columns to support international routes
-- Date: 2026-01-27

-- Add country columns to routes table
ALTER TABLE routes ADD COLUMN IF NOT EXISTS from_country VARCHAR(100);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS to_country VARCHAR(100);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_routes_from_country ON routes(from_country);
CREATE INDEX IF NOT EXISTS idx_routes_to_country ON routes(to_country);
CREATE INDEX IF NOT EXISTS idx_routes_from_city_country ON routes(from_city, from_country);
CREATE INDEX IF NOT EXISTS idx_routes_to_city_country ON routes(to_city, to_country);
