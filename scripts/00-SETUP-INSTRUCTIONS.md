# Database Setup Instructions

## 🚀 Quick Setup Guide

Follow these steps to set up your database with all tables and the admin user.

---

## Step 1: Set Up Database

Choose one of these options:

### **Option A: Supabase (Recommended - Free)**
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Project Settings → Database**
4. Copy your connection string
5. Add to `.env.local`:
   ```
   DATABASE_URL=postgresql://postgres:yourpassword@db.xxxxx.supabase.co:5432/postgres
   ```

### **Option B: Local PostgreSQL**
1. Install PostgreSQL
2. Create database: `CREATE DATABASE travelflow;`
3. Add to `.env.local`:
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/travelflow
   ```

---

## Step 2: Run SQL Scripts

Run these scripts **in order** in your database:

### **1. Create Tables**
```sql
-- Run: scripts/01-create-tables.sql
```
This creates all the database tables (users, routes, bookings, etc.)

### **2. Create Recurring Schedules Table (Admin Feature)**
```sql
-- Run: scripts/03-create-recurring-schedules.sql
```
This creates the recurring_schedules table for admin features.

### **3. Insert Admin User**
```sql
-- Run: scripts/04-insert-admin-user.sql
```
This creates the default admin account.

### **4. (Optional) Seed Sample Data**
```sql
-- Run: scripts/02-seed-data.sql
```
This adds sample routes, operators, and test data.

---

## Step 3: Admin Login

After running the scripts, you can login to the admin panel:

**URL:** `http://localhost:3000/admin/login`

**Default Credentials:**
- **Email:** `admin@cloudticket.com`
- **Password:** `admin123`

⚠️ **IMPORTANT:** Change this password immediately after first login!

---

## 📝 Script Execution Order

```
1. scripts/01-create-tables.sql          (Required)
2. scripts/03-create-recurring-schedules.sql  (Required for admin)
3. scripts/04-insert-admin-user.sql      (Required for admin access)
4. scripts/02-seed-data.sql              (Optional - sample data)
```

---

## 🔧 How to Run Scripts

### **Supabase:**
1. Go to **SQL Editor** in Supabase dashboard
2. Copy and paste each script
3. Click **Run**

### **Local PostgreSQL (psql):**
```bash
psql -U postgres -d travelflow -f scripts/01-create-tables.sql
psql -U postgres -d travelflow -f scripts/03-create-recurring-schedules.sql
psql -U postgres -d travelflow -f scripts/04-insert-admin-user.sql
```

### **pgAdmin:**
1. Right-click on your database
2. Select **Query Tool**
3. Paste and run each script

---

## ✅ Verification

After setup, verify everything works:

1. **Check tables exist:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
   Should show: users, operators, routes, schedules, bookings, etc.

2. **Check admin user exists:**
   ```sql
   SELECT email, is_admin FROM users WHERE is_admin = true;
   ```
   Should show: `admin@cloudticket.com`

3. **Test admin login:**
   - Go to `/admin/login`
   - Login with default credentials
   - Should redirect to `/admin` dashboard

---

## 🔐 Security Notes

- The default admin password is **admin123** - change it immediately!
- Never commit `.env.local` to git
- Use strong passwords in production
- Consider using environment-specific admin accounts

---

## 🆘 Troubleshooting

**"Table already exists" error:**
- Tables might already be created
- You can skip that script or drop tables first

**"User already exists" error:**
- Admin user might already be created
- You can skip the admin script or delete the user first

**Can't connect to database:**
- Check your `DATABASE_URL` in `.env.local`
- Verify database is running
- Check firewall/network settings

---

**Ready to go!** 🎉

