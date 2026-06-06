# Vercel Postgres Setup Guide

## Overview

Your DoubleJoy wedding website now supports **automatic database switching**:
- **Local Development**: Uses SQLite (`data/wedding.db`)
- **Production (Vercel)**: Uses Postgres (Neon serverless database)

The database adapter automatically detects which environment you're in and uses the appropriate database.

## ✅ What's Already Done

1. **Database Adapter Created** (`lib/db/adapter.ts`)
   - Automatically switches between SQLite and Postgres
   - Detects environment based on `POSTGRES_URL` or `DATABASE_URL` starting with "postgres"

2. **Postgres Connection Module** (`lib/db/connection-postgres.ts`)
   - Uses `@neondatabase/serverless` driver (optimized for Vercel Edge)
   - Compatible with Vercel Postgres (Neon)
   - Includes schema initialization function

3. **SQLite Compatibility Layer** (`lib/db/connection.ts`)
   - Automatically converts Postgres syntax (`$1, $2, $3`) to SQLite syntax (`?`)
   - Converts `CURRENT_TIMESTAMP` to `datetime('now')`
   - Converts boolean values to integers (0/1)

4. **All API Routes Updated**
   - `app/api/messages/route.ts` - Message submission and retrieval
   - `app/api/upload/route.ts` - File upload metadata storage
   - `app/api/messages/[id]/route.ts` - Message moderation
   - All routes now use Postgres-compatible SQL syntax

## 🚀 Setup Instructions

### Step 1: Create Vercel Postgres Database

1. **Log in to Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Select your project: `doublejoy26`

2. **Navigate to Storage**
   - Click on the "Storage" tab
   - Click "Create Database"

3. **Select Postgres**
   - Choose "Postgres" (powered by Neon)
   - Select your preferred region (choose closest to your users)
   - Click "Create"

4. **Copy Connection String**
   - After creation, you'll see environment variables
   - Copy the `POSTGRES_URL` value (it looks like: `postgres://username:password@host/database`)

### Step 2: Add Environment Variables

#### For Vercel (Production)

1. **In Vercel Dashboard**
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add the following variable:
     - **Name**: `POSTGRES_URL`
     - **Value**: `postgres://username:password@host/database` (from Step 1)
     - **Environments**: Select "Production", "Preview", and "Development"

2. **Redeploy**
   - Trigger a new deployment for the variables to take effect

#### For Local Development (Optional)

If you want to test Postgres locally instead of SQLite:

1. **Add to `.env.local`**:
   ```
   POSTGRES_URL=postgres://username:password@host/database
   ```

2. **Remove or comment out to use SQLite**:
   ```
   # POSTGRES_URL=postgres://username:password@host/database
   ```

### Step 3: Initialize Database Schema

The database schema will be automatically created on first connection. However, you can manually initialize it:

#### Option A: Via API Call (Recommended)

Create a one-time setup endpoint (for admin use only):

1. Create `app/api/setup-db/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/adapter';

export async function GET() {
  try {
    await initializeDatabase();
    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

2. Visit: `https://doublejoy26.vercel.app/api/setup-db`

3. **Delete the endpoint after use** for security

#### Option B: Via Vercel Postgres Dashboard

1. Go to your database in Vercel Dashboard
2. Click "Query" tab
3. Run the following SQL:

```sql
-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email_encrypted TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE NOT NULL,
  ip_address_hash VARCHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_hidden ON messages(is_hidden);

-- Uploads table
CREATE TABLE IF NOT EXISTS uploads (
  id VARCHAR(36) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  drive_file_id VARCHAR(255) NOT NULL,
  file_type VARCHAR(10) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  ip_address_hash VARCHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_uploads_uploaded_at ON uploads(uploaded_at DESC);

-- Moderation log table
CREATE TABLE IF NOT EXISTS moderation_log (
  id VARCHAR(36) PRIMARY KEY,
  message_id VARCHAR(36) NOT NULL,
  action_type VARCHAR(20) NOT NULL,
  admin_id VARCHAR(100),
  action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_moderation_log_message_id ON moderation_log(message_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_action_timestamp ON moderation_log(action_timestamp DESC);
```

## 🧪 Testing

### Test Local SQLite (Current Setup)

```bash
node test-database-adapter.js
```

Expected output:
```
Using SQLite database
✓ Database is healthy
✓ Found X messages
✓ Test message inserted successfully
✓ All tests passed!
```

### Test Postgres Connection

1. Add `POSTGRES_URL` to `.env.local`
2. Run the test again:
```bash
node test-database-adapter.js
```

Expected output:
```
Using Postgres/Neon database
✓ Database is healthy
✓ Found X messages
✓ Test message inserted successfully
✓ All tests passed!
```

## 📊 Database Schema

### Messages Table
- `id` - UUID (primary key)
- `name` - Guest name (2-100 characters)
- `email_encrypted` - Encrypted email (optional)
- `message` - Guest message (10-1000 characters)
- `created_at` - Timestamp
- `is_hidden` - Boolean (for moderation)
- `ip_address_hash` - Hashed IP address (for rate limiting)

### Uploads Table
- `id` - UUID (primary key)
- `filename` - Original filename
- `drive_file_id` - Google Drive file ID
- `file_type` - File type (image/video)
- `file_size` - Size in bytes
- `mime_type` - MIME type
- `uploaded_at` - Timestamp
- `ip_address_hash` - Hashed IP address

### Moderation Log Table
- `id` - UUID (primary key)
- `message_id` - Reference to message
- `action_type` - delete/hide
- `admin_id` - Admin identifier
- `action_timestamp` - Timestamp
- `reason` - Optional reason for moderation

## 🔍 How It Works

### Automatic Database Detection

The adapter checks for Postgres connection string:

```typescript
const isPostgres = !!(
  process.env.POSTGRES_URL || 
  (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres'))
);
```

- **If found**: Uses `lib/db/connection-postgres.ts` (Neon driver)
- **If not found**: Uses `lib/db/connection.ts` (SQLite with better-sqlite3)

### SQL Syntax Compatibility

All queries use Postgres syntax, which is automatically converted for SQLite:

**Postgres Syntax (Used Everywhere)**:
```sql
INSERT INTO messages (id, name, message, created_at, is_hidden)
VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
```

**SQLite Conversion (Automatic)**:
```sql
INSERT INTO messages (id, name, message, created_at, is_hidden)
VALUES (?, ?, ?, datetime('now'), ?)
```

Boolean values (`true`/`false`) are also automatically converted to integers (`1`/`0`) for SQLite.

## 🚨 Important Notes

1. **Current State**: Everything works with SQLite locally
2. **Production**: After adding `POSTGRES_URL` to Vercel, it will automatically switch to Postgres
3. **No Code Changes Needed**: The adapter handles everything automatically
4. **Data Migration**: SQLite data will NOT automatically transfer to Postgres
   - Postgres starts empty
   - This is fine for a new production launch
   - If you need to migrate existing data, we can create a migration script

## 📝 Next Steps

1. ✅ Test locally with SQLite (already working)
2. ⏳ Create Vercel Postgres database (follow Step 1)
3. ⏳ Add `POSTGRES_URL` to Vercel environment variables (follow Step 2)
4. ⏳ Initialize database schema (follow Step 3)
5. ✅ Deploy to Vercel - database will automatically use Postgres

## ❓ Troubleshooting

### "Database connection failed"
- Check that `POSTGRES_URL` is correctly set in Vercel
- Verify the connection string format
- Check Vercel Postgres dashboard for database status

### "Table does not exist"
- Run the schema initialization (Step 3)
- Check that tables were created in Vercel Postgres dashboard

### "Query execution failed"
- Check Vercel logs for detailed error messages
- Verify SQL syntax is using Postgres style (`$1, $2`)
- Check that environment variables are set in all environments (Production, Preview, Development)

## 💰 Pricing

Vercel Postgres (Neon) on Hobby plan:
- **Free tier**: 512MB storage, 60 compute hours/month
- **Perfect for**: Small to medium wedding websites
- **Upgrade**: Available if you exceed limits

Your wedding website should easily fit within the free tier!
