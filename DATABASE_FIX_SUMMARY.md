# Database Error Fix - Scans Table Missing

## 🐛 Error Encountered

**Error Message**: `relation "scans" does not exist`

**Location**: `POST /api/scan` endpoint (line 73 in `app/api/scan/route.ts`)

**Root Cause**: The `scans` table was defined in the Drizzle schema (`lib/db/schema.ts`) but never created in the PostgreSQL database.

---

## 🔍 Investigation Process

1. **Error Analysis**
   - User tried to start a scan from `/scan/system` page
   - Frontend called `POST /api/scan` with client system info
   - API tried to insert into `scans` table
   - PostgreSQL returned error: `relation "scans" does not exist`

2. **Schema Review**
   - Found `scans` table definition in `lib/db/schema.ts` (lines 63-92)
   - Checked existing migrations in `lib/db/migrations/`
   - Only found migrations for: `scan_sessions`, `users`, `activity_logs`, etc.
   - `scans` table was defined but never migrated to database

3. **Database Connection**
   - PostgreSQL middleware was bound to environment
   - Correct credentials: `postgres:OuVGhVpr@127.0.0.1:5432`
   - Updated `.env.local` with correct password

---

## ✅ Solution Implemented

### 1. Created Migration File
**File**: `lib/db/migrations/0002_scans_table.sql`

```sql
CREATE TABLE IF NOT EXISTS "scans" (
  "id" varchar(32) PRIMARY KEY NOT NULL,
  "organization_id" varchar(32) NOT NULL,
  "user_id" varchar(32) NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "type" varchar(50) NOT NULL,
  "status" varchar(50) DEFAULT 'pending' NOT NULL,
  "priority" varchar(20) DEFAULT 'medium' NOT NULL,
  "config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "files" jsonb DEFAULT '[]'::jsonb,
  "results" jsonb DEFAULT '{}'::jsonb,
  "metrics" jsonb DEFAULT '{}'::jsonb,
  "progress" integer DEFAULT 0 NOT NULL,
  "error" text,
  "started_at" timestamp,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "scans_organization_idx" ON "scans" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "scans_user_idx" ON "scans" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "scans_status_idx" ON "scans" USING btree ("status");
CREATE INDEX IF NOT EXISTS "scans_type_idx" ON "scans" USING btree ("type");
CREATE INDEX IF NOT EXISTS "scans_created_at_idx" ON "scans" USING btree ("created_at");
```

### 2. Created Migration Script
**File**: `scripts/run-migration.ts`

- Uses `dotenv` to load environment variables
- Connects to PostgreSQL with proper SSL configuration
- Parses and executes SQL statements
- Handles errors gracefully

### 3. Updated Database Configuration
- Fixed `DATABASE_URL` in `.env.local`
- Changed from incorrect password `password` to correct `OuVGhVpr`
- Format: `postgresql://postgres:OuVGhVpr@127.0.0.1:5432/appcompatcheck`

### 4. Executed Migration
```bash
$ npx tsx scripts/run-migration.ts

✅ Migration completed successfully!
Scans table created with indexes.
```

---

## 📊 Scans Table Structure

### Columns:
- `id` (varchar 32) - Primary key, UUID format
- `organization_id` (varchar 32) - Organization identifier
- `user_id` (varchar 32) - User who created the scan
- `name` (varchar 255) - Scan name
- `description` (text) - Optional description
- `type` (varchar 50) - Scan type (e.g., 'compatibility', 'security')
- `status` (varchar 50) - Current status ('pending', 'running', 'completed', 'failed')
- `priority` (varchar 20) - Priority level ('low', 'medium', 'high')
- `config` (jsonb) - Scan configuration (includes sessionId, dataType, etc.)
- `files` (jsonb) - Array of files to scan
- `results` (jsonb) - Scan results including **systemInformation** ✅
- `metrics` (jsonb) - Scan metrics (riskScore, completedChecks, etc.)
- `progress` (integer) - Progress percentage (0-100)
- `error` (text) - Error message if failed
- `started_at` (timestamp) - When scan started
- `completed_at` (timestamp) - When scan completed
- `created_at` (timestamp) - Record creation time
- `updated_at` (timestamp) - Last update time

### Indexes (for query performance):
- `scans_organization_idx` - On organization_id
- `scans_user_idx` - On user_id
- `scans_status_idx` - On status
- `scans_type_idx` - On type
- `scans_created_at_idx` - On created_at

---

## 🔗 Integration with Client System Info

The `scans` table stores scan results in the `results` JSONB column with this structure:

```json
{
  "items": [...],  // Analysis results
  "summary": {
    "total": 0,
    "passed": 0,
    "warning": 0,
    "failed": 0
  },
  "bySeverity": {
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0
  },
  "systemInformation": {
    // SERVER INFO
    "serverHostname": "clackysi-machine",
    "serverPlatform": "linux",
    "serverArchitecture": "x64",
    "serverCpus": 4,
    
    // CLIENT INFO (from browser)
    "clientPlatform": "MacIntel",
    "clientIpAddress": "203.0.113.42",
    "clientTimezone": "America/New_York",
    "clientLanguage": "en-US",
    "clientScreenResolution": "1920x1080",
    "clientUserAgent": "Mozilla/5.0...",
    
    // LEGACY FIELDS
    "hostname": "clackysi-machine",
    "deviceName": "MacIntel",
    "ipAddress": "203.0.113.42"
  }
}
```

---

## 🧪 Testing Steps

### 1. Database Verification
```bash
# Connect to database
psql "postgresql://postgres:OuVGhVpr@127.0.0.1:5432/appcompatcheck"

# Check if table exists
\dt scans

# Check table structure
\d scans

# Check indexes
\di scans_*
```

### 2. API Testing
```bash
# Start the application
npm run dev

# Navigate to scan page
open http://localhost:3000/scan/system

# Click "Start Scan" button
# Monitor browser console for:
# - Client System Info being captured
# - POST request to /api/scan
# - Polling for scan status
# - Results displayed

# Check database for scan record
psql -c "SELECT id, name, status, progress FROM scans ORDER BY created_at DESC LIMIT 1;"
```

### 3. Verification Checklist
- [ ] Scan can be initiated without "relation does not exist" error
- [ ] Client system info is captured from browser
- [ ] Scan record is created in database with status 'pending'
- [ ] Background process updates status to 'running'
- [ ] Scan completes with status 'completed'
- [ ] Results include systemInformation with client fields
- [ ] Reports display client device information correctly

---

## 📝 Files Modified/Created

### Created:
1. `lib/db/migrations/0002_scans_table.sql` - SQL migration for scans table
2. `scripts/run-migration.ts` - Migration execution script
3. `DATABASE_FIX_SUMMARY.md` - This documentation

### Modified:
4. `.env.local` - Updated DATABASE_URL with correct password

### Existing (No Changes Needed):
- `lib/db/schema.ts` - Already had scans table definition
- `app/api/scan/route.ts` - Already uses scans table
- `lib/utils/system-info.ts` - Already merges client+server info
- `components/scans/SystemScanInterface.tsx` - Already sends client info

---

## 🎯 Expected Flow After Fix

```
1. User clicks "Start Scan" on /scan/system page
   ↓
2. Frontend captures client system info (platform, timezone, etc.)
   ↓
3. POST /api/scan with clientSystemInfo in body
   ↓
4. API creates record in scans table ✅ (NOW WORKS)
   - id: generated UUID
   - status: 'pending'
   - config: includes clientSystemInfo
   ↓
5. Background processor starts
   - Merges client + server system info
   - Runs analysis
   - Updates scan record with results
   ↓
6. Frontend polls GET /api/scan?scanId=XXX
   - Receives scan status updates
   - Gets final results when completed
   ↓
7. Results displayed with client device info
   - Client Device (Browser): MacIntel, timezone, etc.
   - Scan Server: clackysi-machine (clearly labeled)
```

---

## ⚠️ Important Notes

1. **Database Password**: Updated `.env.local` with correct PostgreSQL password from middleware
2. **JSONB Columns**: The `results` column stores complex nested data including system information
3. **Backward Compatibility**: Table structure supports both new scans (with client info) and old scans
4. **Indexes**: Created for query performance on common filters (organization, user, status, type)
5. **Migration Script**: Can be reused for future manual migrations if needed

---

## 🚀 Next Steps

1. ✅ **Database table created** - scans table exists with indexes
2. ✅ **Configuration updated** - DATABASE_URL has correct password
3. ⏳ **Testing needed** - Verify end-to-end scan functionality
4. ⏳ **Verify reports** - Check that client info appears in PDF/dashboard

---

## 📚 Related Documentation

- `SYSTEM_INFO_ARCHITECTURE.md` - Complete system info capture architecture
- `VERIFICATION_COMPLETE.md` - Frontend/backend integration verification
- `SOLUTION_SUMMARY.md` - User-friendly summary of hostname fix

---

**Status**: ✅ **DATABASE ERROR RESOLVED**

The `scans` table has been successfully created in the database. The API endpoint should now work correctly when users initiate scans.

**Date**: October 31, 2024  
**Issue**: PostgreSQL error - relation "scans" does not exist  
**Resolution**: Created migration and executed to create scans table with proper structure
