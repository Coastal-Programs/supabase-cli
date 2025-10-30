# Backup & Recovery API

Endpoints for backup management and point-in-time recovery (PITR).

---

## Critical Finding: Limited Backup API

**Important:** The Management API has **very limited** backup functionality:
- ✅ Can LIST backups
- ✅ Can RESTORE from PITR
- ❌ Cannot CREATE manual backups
- ❌ Cannot DELETE backups
- ❌ Cannot configure schedules

Backups are **automatic** and **plan-based**, not user-configurable via API.

---

## Backups

### List Backups

**Endpoint:** `GET /v1/projects/{ref}/database/backups`
**Status:** ✅ Works (200 OK)
**CLI Command:** `backup:list`

List available backups for a project.

**Request:**
```bash
curl -X GET 'https://api.supabase.com/v1/projects/ygzhmowennlaehudyyey/database/backups' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Response:**
```json
{
  "region": "ap-southeast-2",
  "pitr_enabled": false,
  "walg_enabled": false,
  "backups": [],
  "physical_backup_data": {}
}
```

**Response with Backups:**
```json
{
  "region": "us-east-1",
  "pitr_enabled": true,
  "walg_enabled": true,
  "backups": [
    {
      "id": "backup-123",
      "created_at": "2025-10-28T00:00:00Z",
      "size_bytes": 1048576000,
      "status": "completed"
    }
  ],
  "physical_backup_data": {
    "earliest_pitr_timestamp": "2025-10-21T00:00:00Z",
    "latest_pitr_timestamp": "2025-10-29T00:00:00Z"
  }
}
```

**Response Fields:**
- `region` - AWS region where backups are stored
- `pitr_enabled` - Whether PITR is enabled
- `walg_enabled` - Whether WAL-G (backup tool) is enabled
- `backups` - Array of daily backup snapshots
- `physical_backup_data.earliest_pitr_timestamp` - Earliest PITR restore point
- `physical_backup_data.latest_pitr_timestamp` - Latest PITR restore point

**Backup Retention by Plan:**
- **Free:** No backups
- **Pro:** 7 days of daily backups
- **Team:** 14 days of daily backups
- **Enterprise:** Up to 30 days

**PITR Retention:**
- 1 day: Included with Small compute or larger
- 7 days: $100/month
- 14 days: $200/month
- 28 days: $400/month

---

### Create Backup (NOT AVAILABLE)

**Endpoint:** ❌ Does not exist
**CLI Command:** `backup:create` (should be removed)

**Finding:** No REST endpoint exists for creating manual backups.

**Alternatives:**
1. **Supabase CLI:** `supabase db dump > backup.sql`
2. **pg_dump directly:** Connect to database and run pg_dump
3. **Dashboard:** Use web interface to download backup

**Recommendation:** Remove `backup:create` command or convert to wrapper for `supabase db dump`.

---

### Delete Backup (NOT AVAILABLE)

**Endpoint:** ❌ Does not exist
**CLI Command:** `backup:delete` (should be removed)

**Finding:** No REST endpoint exists for deleting backups.

**Reason:** Backups are managed by Supabase and automatically expire based on retention policy.

**Recommendation:** Remove `backup:delete` command entirely.

---

### Get Backup Details (UNCLEAR)

**Endpoint:** ❌ No dedicated endpoint found
**CLI Command:** `backup:get` (questionable)

**Finding:** No dedicated "get single backup" endpoint. Details are included in `backup:list` response.

**Recommendation:** Remove `backup:get` command or implement as client-side filter of `backup:list`.

---

## Point-in-Time Recovery (PITR)

### Restore from PITR

**Endpoint:** `POST /v1/projects/{ref}/database/backups/restore-pitr`
**Status:** 🔍 Not Tested (Destructive operation)
**CLI Command:** `backup:pitr:restore`

Restore database to a specific point in time.

**Request:**
```json
{
  "timestamp": "2025-10-28T12:00:00Z"
}
```

**Requirements:**
- PITR must be enabled ($100-$400/month depending on retention)
- Requires Small compute or larger
- Timestamp must be within retention window

**Impact:**
- **Causes downtime** (duration depends on database size)
- **All data after target timestamp is PERMANENTLY LOST**
- Cannot be undone

**CLI Implementation:**
Must require confirmation unless `--yes` flag:
```typescript
const confirmed = await this.confirm(
  `⚠️  DESTRUCTIVE OPERATION ⚠️

This will restore your database to ${targetTime}.
ALL data after this time will be PERMANENTLY LOST.
This operation will cause downtime.

Are you absolutely sure you want to continue?`,
  false
)
```

---

## Restore Points

### Create Restore Point

**Endpoint:** `POST /v1/projects/{ref}/database/backups/restore-point`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Create a named restore point for easy recovery.

**Expected Request:**
```json
{
  "name": "before-migration",
  "description": "Backup before running schema migration"
}
```

---

### Get Restore Points

**Endpoint:** `GET /v1/projects/{ref}/database/backups/restore-point`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

List all restore points.

---

### Restore to Point

**Endpoint:** `POST /v1/projects/{ref}/database/backups/undo`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Restore to a named restore point.

**Expected Request:**
```json
{
  "restore_point_id": "rp-123"
}
```

---

## Backup Schedules (NOT AVAILABLE)

### List Backup Schedules

**Endpoint:** ❌ `GET /v1/projects/{ref}/database/backups/schedules` (404)
**CLI Command:** `backup:schedule:list` (should be removed or converted)

**Finding:** No REST endpoint for backup schedules.

**Reason:** Backup schedules are automatic and plan-based:
- **Pro:** Daily backups at ~2AM UTC (7 days retention)
- **Team:** Daily backups at ~2AM UTC (14 days retention)
- **Enterprise:** Daily backups at ~2AM UTC (up to 30 days retention)
- **PITR:** Continuous archiving (when enabled)

**Recommendation:**
- **Option A:** Remove command entirely
- **Option B:** Convert to informational display showing plan-based schedule

Example informational output:
```
Backup Schedule (Pro Plan)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Schedule:     Daily at ~2:00 AM UTC
Retention:    7 days
PITR:         Disabled (Enable in dashboard for $100-$400/month)

Note: Backup schedules are automatic and cannot be customized.
To enable PITR, upgrade to Small compute or larger and enable in dashboard.
```

---

### Create Backup Schedule

**Endpoint:** ❌ `POST /v1/projects/{ref}/database/backups/schedules` (404)
**CLI Command:** `backup:schedule:create` (should be removed)

**Finding:** No REST endpoint for creating custom schedules.

**Reason:** Schedules are determined by plan tier and cannot be customized.

**Recommendation:** Remove `backup:schedule:create` command entirely.

---

## Project Restore

### List Restore Versions

**Endpoint:** `GET /v1/projects/{ref}/restore`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

List available versions for project restore (paused/deleted projects).

---

### Restore Project

**Endpoint:** `POST /v1/projects/{ref}/restore`
**Status:** 🔍 Not Tested
**CLI Command:** `backup:restore`

Restore a paused or soft-deleted project.

**Note:** This is different from PITR restore. This restores the entire project, not just the database.

---

### Cancel Restoration

**Endpoint:** `POST /v1/projects/{ref}/restore/cancel`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Cancel an in-progress project restoration.

---

## Summary

### Working Endpoints (1)
- ✅ `GET /v1/projects/{ref}/database/backups` - List backups

### Not Tested (5)
- 🔍 `POST /v1/projects/{ref}/database/backups/restore-pitr` - PITR restore
- 🔍 `POST /v1/projects/{ref}/database/backups/restore-point` - Create restore point
- 🔍 `GET /v1/projects/{ref}/database/backups/restore-point` - List restore points
- 🔍 `POST /v1/projects/{ref}/database/backups/undo` - Restore to point
- 🔍 `POST /v1/projects/{ref}/restore` - Restore project

### Not Available (4)
- ❌ Create manual backup
- ❌ Delete backup
- ❌ List backup schedules
- ❌ Create backup schedule

### Recommended CLI Changes

**Keep:**
1. ✅ `backup:list` - Works, shows available backups

**Test & Implement:**
2. 🔍 `backup:pitr:restore` - Test PITR restore with confirmation prompt

**Convert to Informational:**
3. 🔄 `backup:schedule:list` - Show plan-based schedule (no API call)

**Remove:**
4. ❌ `backup:create` - No API support
5. ❌ `backup:delete` - No API support
6. ❌ `backup:schedule:create` - No API support
7. ❌ `backup:get` - No dedicated endpoint

**Add:**
8. ➕ `backup:restore-points:list` - List restore points
9. ➕ `backup:restore-points:create` - Create restore point
10. ➕ `backup:restore-points:restore` - Restore to point

### Documentation Updates

**Add to `backup:list` help:**
```
Backups are automatic and retention depends on plan:
- Pro: Last 7 days of daily backups
- Team: Last 14 days of daily backups
- Enterprise: Up to 30 days of daily backups

For manual backups, use: supabase db dump > backup.sql
```

**Add to `backup:pitr:restore` help:**
```
REQUIREMENTS:
- PITR addon enabled ($100-$400/month depending on retention)
- At least Small compute addon
- Timestamp within retention window (1-28 days)

IMPACT:
- This operation causes downtime
- All data after target time will be lost
- Duration depends on database size (typically 1-2 hours)

Example:
  backup:pitr:restore --timestamp "2025-10-28T12:00:00Z"
  backup:pitr:restore --timestamp "2025-10-28T12:00:00Z" --yes
```

### Alternatives for Missing Features

**Manual Backup Creation:**
```bash
# Using Supabase CLI
supabase db dump > backup.sql

# Using pg_dump directly
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" > backup.sql

# Via dashboard
# Navigate to Database > Backups > Download
```

**Backup Schedule Configuration:**
- Use dashboard to enable PITR
- Contact support for custom Enterprise schedules
- Schedules are automatic based on plan tier
