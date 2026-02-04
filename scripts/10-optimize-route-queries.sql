-- Optimize route queries for faster seat page loading
-- Run this script to add indexes for route lookups

-- Primary key is already indexed, but add composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_routes_id_status ON routes(id, status);

-- Optimize operator join
CREATE INDEX IF NOT EXISTS idx_operators_id ON operators(id);

-- Analyze tables for query optimizer
ANALYZE routes;
ANALYZE operators;
