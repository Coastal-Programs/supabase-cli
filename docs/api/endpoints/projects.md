# Projects & Organizations API

Endpoints for managing Supabase projects and organizations.

---

## Projects

### List All Projects

**Endpoint:** `GET /v1/projects`
**Status:** ✅ Works (200 OK)
**CLI Command:** `projects:list`

List all projects you have access to.

**Request:**
```bash
curl -X GET 'https://api.supabase.com/v1/projects' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Response:**
```json
[
  {
    "id": "ygzhmowennlaehudyyey",
    "organization_id": "ltmwjzelwrxcihcojtgh",
    "name": "Testing",
    "region": "ap-southeast-2",
    "status": "ACTIVE_HEALTHY",
    "database": {
      "host": "db.ygzhmowennlaehudyyey.supabase.co",
      "version": "17.6.1.029",
      "postgres_engine": "17",
      "release_channel": "ga"
    },
    "created_at": "2025-10-29T06:03:31.40113Z"
  }
]
```

**Response Fields:**
- `id` - Project reference ID
- `organization_id` - Parent organization ID
- `name` - Project name
- `region` - AWS region (e.g., "ap-southeast-2")
- `status` - Project status (ACTIVE_HEALTHY, PAUSED, etc.)
- `database.host` - Database connection host
- `database.version` - Postgres version
- `created_at` - ISO 8601 timestamp

---

### Get Project Details

**Endpoint:** `GET /v1/projects/{ref}`
**Status:** ✅ Works (200 OK)
**CLI Command:** `projects:get`

Get detailed information about a specific project.

**Request:**
```bash
curl -X GET 'https://api.supabase.com/v1/projects/ygzhmowennlaehudyyey' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Response:** Same as single project object from list.

---

### Create Project

**Endpoint:** `POST /v1/projects`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

**Expected Request:**
```json
{
  "name": "My New Project",
  "organization_id": "org-id",
  "region": "us-east-1",
  "plan": "pro",
  "db_pass": "your-db-password"
}
```

---

### Delete Project

**Endpoint:** `DELETE /v1/projects/{ref}`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Permanently deletes a project. **This is destructive and cannot be undone.**

---

### Available Regions

**Endpoint:** `GET /v1/projects/available-regions`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** Not implemented

List available AWS regions for project deployment.

---

### Project Health

**Endpoint:** `GET /v1/projects/{ref}/health`
**Status:** ⚠️ Needs Parameters (400)
**CLI Command:** `monitoring:health`

Check health status of project services.

**Required Query Parameter:**
- `?services=postgres,kong,auth,realtime,rest,storage`

**Request:**
```bash
curl -X GET 'https://api.supabase.com/v1/projects/ygzhmowennlaehudyyey/health?services=postgres,kong,auth' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "postgres": "healthy",
  "kong": "healthy",
  "auth": "healthy"
}
```

---

### Pause Project

**Endpoint:** `POST /v1/projects/{ref}/pause`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Pause a project to save costs (Pro plan and above).

---

### Restore Project

**Endpoint:** `POST /v1/projects/{ref}/restore`
**Status:** 🔍 Not Tested
**CLI Command:** `backup:restore`

Restore a paused or deleted project.

---

### Upgrade Eligibility

**Endpoint:** `GET /v1/projects/{ref}/upgrade/eligibility`
**Status:** ✅ Works (200 OK)
**CLI Command:** `upgrade:check`

Check if project is eligible for Postgres version upgrade.

**Request:**
```bash
curl -X GET 'https://api.supabase.com/v1/projects/ygzhmowennlaehudyyey/upgrade/eligibility' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Response:**
```json
{
  "eligible": true,
  "current_app_version": "supabase-postgres-17.6.1.029",
  "latest_app_version": "supabase-postgres-17.6.1.031",
  "target_upgrade_versions": [
    {
      "postgres_version": "17",
      "release_channel": "ga",
      "app_version": "supabase-postgres-17.6.1.031"
    }
  ],
  "duration_estimate_hours": 1
}
```

---

### Upgrade Project

**Endpoint:** `POST /v1/projects/{ref}/upgrade`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** Not implemented

Initiate Postgres version upgrade.

**Warning:** Causes downtime.

---

## Organizations

### List Organizations

**Endpoint:** `GET /v1/organizations`
**Status:** ✅ Works (200 OK)
**CLI Command:** `organizations:list`

List all organizations you belong to.

**Request:**
```bash
curl -X GET 'https://api.supabase.com/v1/organizations' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Response:**
```json
[
  {
    "id": "wodkxksurycbhoucblis",
    "name": "Coastal Programs"
  },
  {
    "id": "bwhcnyahdgxdbgghcrfw",
    "name": "GTBC"
  },
  {
    "id": "ltmwjzelwrxcihcojtgh",
    "name": "Revelry"
  }
]
```

---

### Get Organization

**Endpoint:** `GET /v1/organizations/{slug}`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Get detailed information about an organization.

---

### Create Organization

**Endpoint:** `POST /v1/organizations`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Create a new organization.

---

### List Organization Members

**Endpoint:** `GET /v1/organizations/{slug}/members`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

List members of an organization.

---

## Claim Tokens

### Get Claim Token

**Endpoint:** `GET /v1/projects/{ref}/claim-token`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Get project claim token for transferring ownership.

---

### Create Claim Token

**Endpoint:** `POST /v1/projects/{ref}/claim-token`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Generate a new claim token.

---

### Revoke Claim Token

**Endpoint:** `DELETE /v1/projects/{ref}/claim-token`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Revoke an existing claim token.

---

## Summary

### Working Endpoints (3)
- ✅ `GET /v1/projects` - List projects
- ✅ `GET /v1/projects/{ref}` - Get project details
- ✅ `GET /v1/organizations` - List organizations
- ✅ `GET /v1/projects/{ref}/upgrade/eligibility` - Check upgrade

### Needs Parameters (1)
- ⚠️ `GET /v1/projects/{ref}/health` - Add `?services=` param

### Not Tested (10+)
- 🔍 Project creation, deletion, pause, restore
- 🔍 Organization management
- 🔍 Claim tokens
- 🔍 Upgrades

### Recommended Implementation
1. ✅ Implement `projects:list` and `projects:get` (already working)
2. ✅ Implement `organizations:list` (already working)
3. ✅ Implement `upgrade:check` (already working)
4. 🔍 Test project creation and deletion
5. 🔍 Test pause/restore operations
6. ⚠️ Fix health check with proper parameters
