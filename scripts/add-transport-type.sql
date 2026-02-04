-- Add transport_type column to routes table
-- This migration adds support for distinguishing routes by transport type (bus/train/flight)

-- For SQLite
ALTER TABLE routes ADD COLUMN transport_type TEXT DEFAULT 'bus';

-- Update existing routes to have 'bus' as default transport type
UPDATE routes SET transport_type = 'bus' WHERE transport_type IS NULL;
