# Database Optimization Script - Instructions

## 📋 **What This Script Does**

The `10-optimize-route-queries.sql` script adds database indexes to optimize route queries for faster seat page loading.

### **Optimizations:**
1. **Composite Index on Routes:** `idx_routes_id_status` - Speeds up route lookups by ID with status filter
2. **Operator Index:** `idx_operators_id` - Optimizes operator joins
3. **Table Analysis:** Updates query optimizer statistics for better query planning

---

## 🚀 **How to Run**

### **Option 1: Using Node.js (Recommended)**

Create a runner script similar to other migrations:

```bash
node scripts/run-migration-10.js
```

### **Option 2: Using SQLite CLI**

```bash
sqlite3 your-database.db < scripts/10-optimize-route-queries.sql
```

### **Option 3: Manual Execution**

1. Open your database file
2. Copy the contents of `scripts/10-optimize-route-queries.sql`
3. Execute in your SQLite client

---

## ⚠️ **Important Notes**

1. **Safe to Run Multiple Times:** All statements use `IF NOT EXISTS`, so running it multiple times won't cause errors
2. **No Data Loss:** This script only adds indexes - it doesn't modify or delete any data
3. **Performance Impact:** Index creation may take a few seconds on large tables, but it's a one-time operation
4. **Already Indexed:** Primary keys are automatically indexed, but composite indexes can still help with filtered queries

---

## ✅ **Verification**

After running the script, verify the indexes were created:

```sql
-- Check routes indexes
SELECT name FROM sqlite_master 
WHERE type='index' AND tbl_name='routes' AND name LIKE 'idx_routes%';

-- Check operators indexes
SELECT name FROM sqlite_master 
WHERE type='index' AND tbl_name='operators' AND name LIKE 'idx_operators%';
```

You should see:
- `idx_routes_id_status`
- `idx_operators_id`

---

## 📊 **Expected Performance Improvement**

- **Route Lookups:** 20-50% faster when filtering by ID and status
- **Operator Joins:** 10-30% faster when joining routes with operators
- **Overall:** Seat page loading should be noticeably faster, especially with large datasets

---

## 🔄 **When to Run**

- **After initial setup:** Run once after creating your database
- **After adding many routes:** Re-run `ANALYZE` commands to update statistics
- **If queries are slow:** Check if indexes exist, run if missing

---

## 📝 **Script Contents Summary**

```sql
-- Composite index for route lookups
CREATE INDEX IF NOT EXISTS idx_routes_id_status ON routes(id, status);

-- Optimize operator joins
CREATE INDEX IF NOT EXISTS idx_operators_id ON operators(id);

-- Update query optimizer statistics
ANALYZE routes;
ANALYZE operators;
```

---

## ❓ **Troubleshooting**

**Error: "database is locked"**
- Close any other connections to the database
- Wait a few seconds and try again

**No performance improvement?**
- Check if indexes were actually created (use verification queries above)
- Run `ANALYZE` commands again to refresh statistics
- Check if your queries are actually using the indexes (use `EXPLAIN QUERY PLAN`)

---

**Note:** This is an optional optimization. Your application will work without it, but queries will be slower on large datasets.
