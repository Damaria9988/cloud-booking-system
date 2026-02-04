# SQLite Database Setup Guide

This guide will help you set up the SQLite database for the cloud booking system.

## Prerequisites

Make sure you have `better-sqlite3` installed:
```bash
npm install better-sqlite3 @types/better-sqlite3
```

## Quick Setup

Run the setup script:
```bash
npm run setup-db
```

Or directly:
```bash
node scripts/setup-database.js
```

## What the Script Does

1. Creates the `data` directory if it doesn't exist
2. Creates/connects to `data/travelflow.db`
3. Runs the following SQL scripts in order:
   - `01-create-tables-sqlite.sql` - Creates all main tables
   - `03-create-recurring-schedules-sqlite.sql` - Creates recurring schedules table
4. Verifies that all tables were created successfully

## Manual Setup (Alternative)

If you prefer to run the scripts manually, you can use any SQLite client:

### Using SQLite CLI (if installed)
```bash
sqlite3 data/travelflow.db < scripts/01-create-tables-sqlite.sql
sqlite3 data/travelflow.db < scripts/03-create-recurring-schedules-sqlite.sql
```

### Using a SQLite GUI Tool
- **DB Browser for SQLite** (free): https://sqlitebrowser.org/
- **SQLiteStudio** (free): https://sqlitestudio.pl/
- **VS Code Extension**: SQLite Viewer

1. Open `data/travelflow.db` (will be created automatically)
2. Run the SQL scripts from the `scripts/` folder

## Database Location

The database file will be created at:
```
data/travelflow.db
```

## Creating an Admin User

After setting up the database, you can create an admin user using the existing script:

```bash
# Using Node.js
node scripts/04-insert-admin-user.js

# Or using TypeScript (if tsx is installed)
npx tsx scripts/04-insert-admin-user.ts
```

Or manually insert using SQL:
```sql
INSERT INTO users (email, password_hash, first_name, last_name, is_admin)
VALUES ('admin@example.com', '$2a$10$...', 'Admin', 'User', 1);
```

## Verifying Setup

After running the setup, you should see output like:
```
✅ Found 11 tables:
   - bookings
   - operators
   - passengers
   - promo_codes
   - recurring_schedules
   - reviews
   - routes
   - schedules
   - seat_bookings
   - users
```

## Troubleshooting

### Error: "Cannot find module 'better-sqlite3'"
```bash
npm install better-sqlite3
```

### Error: "Database is locked"
- Make sure no other process is using the database
- Close any SQLite GUI tools
- Restart your development server

### Tables not created
- Check that the SQL scripts exist in the `scripts/` folder
- Verify file permissions
- Check the console output for specific error messages

## Next Steps

1. ✅ Run `npm run setup-db` to create tables
2. ✅ Create an admin user
3. ✅ Start your development server: `npm run dev`
4. ✅ Test the database connection at `/api/test-db`

