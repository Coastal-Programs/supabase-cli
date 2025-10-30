# Supabase Management API - Consolidated Reference

**Version:** v1
**Base URL:** `https://api.supabase.com/v1`
**Last Updated:** October 29, 2025
**Comprehensive Reference:** Single source of truth for all Management API endpoints

---

## Table of Contents

1. [Authentication & Rate Limits](#authentication--rate-limits)
2. [Testing Summary](#testing-summary)
3. [Projects & Organizations](#projects--organizations)
4. [Auth (JWT, Providers, SSO)](#auth-jwt-providers-sso)
5. [Database (Query, Schema, Extensions, Replicas, Config)](#database-query-schema-extensions-replicas-config)
6. [Functions (Edge Functions)](#functions-edge-functions)
7. [Security (Restrictions, Policies, Audit)](#security-restrictions-policies-audit)
8. [Branches (Preview Environments)](#branches-preview-environments)
9. [Backups & Recovery](#backups--recovery)
10. [Migrations](#migrations)
11. [Storage & Buckets](#storage--buckets)
12. [Integrations & Webhooks](#integrations--webhooks)
13. [Logs & Monitoring](#logs--monitoring)
14. [SQL Alternatives](#sql-alternatives)

---

## Authentication & Rate Limits

### Authentication Methods

All Management API requests require authentication via Bearer token:

```http
Authorization: Bearer <access_token>
```

**Two authentication methods:**

1. **Personal Access Tokens (PAT)**
   - Long-lived tokens manually generated
   - Full user account privileges
   - Generate at: `https://supabase.com/dashboard/account/tokens`
   - Best for: CI/CD, scripts, automation

2. **OAuth2**
   - Short-lived tokens
   - Scope-limited access
   - For third-party applications
   - Generates tokens on behalf of users

### Rate Limits

- **Limit:** 60 requests per minute per user
- **Scope:** Cumulative across all requests with your access tokens
- **Response:** HTTP 429 when exceeded
- **Best Practice:** Implement exponential backoff

### OAuth Scopes

| Scope | Read | Write | Description |
|-------|------|-------|-------------|
| `environment` | ✓ | ✓ | Retrieve/manage branches |
| `database` | ✓ | ✓ | Database config, queries, PITR backups |
| `projects` | ✓ | ✓ | View/manage projects and upgrades |
| `secrets` | ✓ | ✓ | API keys and secrets |
| `functions` | ✓ | ✓ | List/deploy Edge Functions |
| `migrations` | ✓ | ✓ | Migration history and application |
| `analytics` | ✓ | ✓ | Logs and usage metrics |

---

## Testing Summary

**Date:** October 29, 2025
**Total Endpoints Tested:** 56

### Results Breakdown

```
Total Endpoints:      56
✅ Working:          17 (30%)
❌ Not Found (404):  37 (66%)
⚠️ Bad Request:       2 (4%)
```

### Critical Discovery

🎯 **`POST /v1/projects/{ref}/database/query`** - Works! (201 Created)

This endpoint allows executing arbitrary SQL queries, enabling implementation of many features without dedicated REST endpoints:
- Database extensions
- Schema information
- RLS policies
- Database roles
- Connection stats
- Any database metadata

**Effective Coverage:** ~60% of desired functionality can be achieved via SQL queries.

---

## Projects & Organizations

### List All Projects

**Endpoint:** `GET /v1/projects`
**Status:** ✅ Tested - Works
**Authentication:** Required

**Response (200):**
```json
[
  {
    "id": "project-uuid",
    "organization_id": "org-uuid",
    "name": "My Project",
    "region": "us-east-1",
    "created_at": "2023-03-29T16:32:59Z",
    "inserted_at": "2023-03-29T16:32:59Z",
    "status": "ACTIVE_HEALTHY",
    "database": {
      "host": "db.project-ref.supabase.co",
      "port": 5432,
      "version": "15.1.0"
    },
    "ref": "project-ref"
  }
]
```

**Project Status Values:**
- `ACTIVE_HEALTHY` - Project running normally
- `ACTIVE_UNHEALTHY` - Project running but has issues
- `COMING_UP` - Project starting
- `GOING_DOWN` - Project shutting down
- `PAUSED` - Project paused
- `RESTORING` - Restoring from backup
- `UPGRADING` - Being upgraded

**Example:**
```bash
curl -X GET "https://api.supabase.com/v1/projects" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

---

### Get Project Details

**Endpoint:** `GET /v1/projects/{ref}`
**Status:** ✅ Tested - Works
**Authentication:** Required

**Parameters:**
- `ref` (path, required) - Project reference identifier

**Response (200):** Same structure as list endpoint, single object

**Example:**
```bash
curl -X GET "https://api.supabase.com/v1/projects/abcdefghijklmno" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

---

### Create Project

**Endpoint:** `POST /v1/projects`
**Status:** ⚠️ Not Tested (Destructive)
**Authentication:** Required

**Request Body:**
```json
{
  "organization_id": "org-uuid",
  "name": "My New Project",
  "region": "us-east-1",
  "db_pass": "secure-password-here",
  "plan": "free",
  "db_pricing_tier_id": "tier_free"
}
```

**Required Parameters:**
- `organization_id` - Organization ID
- `name` - Project name
- `region` - AWS region
- `db_pass` - Database password (must be secure)

**Optional Parameters:**
- `plan` - Subscription plan: `free`, `pro`, `team`, `enterprise`
- `db_pricing_tier_id` - Database pricing tier
- `db_region` - Database region (usually same as `region`)

**Response (201):** Project object with status `COMING_UP`

**Important Notes:**
- Database password must be stored securely
- Project creation is asynchronous
- Can take several minutes to initialize
- All resources subject to pricing

---

### Delete Project

**Endpoint:** `DELETE /v1/projects/{ref}`
**Status:** ⚠️ Not Tested (Destructive)
**Authentication:** Required

**Parameters:**
- `ref` (path, required) - Project reference identifier

**Response:** 204 No Content

**Important Notes:**
- **DESTRUCTIVE OPERATION**
- All project data permanently deleted
- Cannot be undone
- Billing stops after deletion

---

### Pause Project

**Endpoint:** `POST /v1/projects/{ref}/pause`
**Status:** ⚠️ Not Tested (Destructive)
**Authentication:** Required

**Parameters:**
- `ref` (path, required) - Project reference

**Response:** 204 No Content

**Notes:**
- Available on paid plans only
- Project becomes inaccessible
- Reduces costs
- Can be restored later

---

### Restore Project

**Endpoint:** `POST /v1/projects/{ref}/restore`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Parameters:**
- `ref` (path, required) - Project reference

**Response:** 204 No Content

**Notes:**
- Restores paused project
- May take several minutes
- Billing resumes

---

### Get Project API Keys

**Endpoint:** `GET /v1/projects/{ref}/api-keys`
**Status:** ✅ Tested - Works
**Authentication:** Required

**Parameters:**
- `ref` (path, required) - Project reference
- `reveal` (query, optional) - Set to `true` to reveal actual key values

**Response (200):**
```json
[
  {
    "name": "anon",
    "api_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "id": "anon",
    "type": "legacy",
    "hash": "U8ZGDmAW37yq...",
    "prefix": "S6jRs",
    "description": "Legacy anon API key"
  },
  {
    "name": "service_role",
    "api_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "id": "service_role",
    "type": "legacy",
    "hash": "Bz4Pjfq4T4im...",
    "prefix": "7LHpE",
    "description": "Legacy service_role API key"
  }
]
```

**Important:**
- `anon` key is safe for client-side use
- `service_role` key has admin privileges - keep secure
- Never expose service_role key in frontend code

---

### List Organizations

**Endpoint:** `GET /v1/organizations`
**Status:** ✅ Tested - Works
**Authentication:** Required

**Response (200):**
```json
[
  {
    "id": "org-uuid",
    "name": "My Organization",
    "billing_email": "billing@example.com",
    "created_at": "2023-01-15T10:00:00Z",
    "subscription": {
      "plan": "pro",
      "interval": "month"
    }
  }
]
```

**Organization Plans:**
- `free` - Free tier
- `pro` - Pro plan
- `team` - Team plan
- `enterprise` - Enterprise plan

**Subscription Intervals:**
- `month` - Monthly billing
- `year` - Annual billing

---

### Get Organization Details

**Endpoint:** `GET /v1/organizations/{id}`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Parameters:**
- `id` (path, required) - Organization ID

**Response (200):** Single organization object

---

### Available Regions

**Endpoint:** `GET /v1/projects/available-regions`
**Status:** ⚠️ Not Tested (Beta)

**North America:**
- `us-west-1` - West US (North California)
- `us-east-1` - East US (North Virginia)
- `us-east-2` - East US (Ohio)
- `ca-central-1` - Canada (Central)

**Europe:**
- `eu-west-1` - West EU (Ireland)
- `eu-west-2` - West EU (London)
- `eu-west-3` - West EU (Paris)
- `eu-central-1` - Central EU (Frankfurt)
- `eu-central-2` - Central EU (Zurich)
- `eu-north-1` - North EU (Stockholm)

**Asia Pacific:**
- `ap-south-1` - South Asia (Mumbai)
- `ap-southeast-1` - Southeast Asia (Singapore)
- `ap-northeast-1` - Northeast Asia (Tokyo)
- `ap-northeast-2` - Northeast Asia (Seoul)
- `ap-southeast-2` - Oceania (Sydney)

**South America:**
- `sa-east-1` - South America (Sao Paulo)

**Notes:**
- All infrastructure runs on AWS
- Region selection affects latency and compliance
- Cannot change region after project creation

---

## Auth (JWT, Providers, SSO)

### Get JWT Signing Key

**Endpoint:** `GET /v1/projects/{ref}/config/auth/signing-keys/legacy`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Parameters:**
- `ref` (path, required) - Project reference

**Response (200):**
```json
{
  "id": "jwt-key-uuid",
  "algorithm": "HS256",
  "key": "your-jwt-secret",
  "key_id": "key-identifier",
  "created_at": "2023-03-29T16:32:59Z"
}
```

---

### Rotate JWT Signing Key

**Endpoint:** `POST /v1/projects/{ref}/config/auth/signing-keys`
**Status:** ⚠️ Not Tested (Destructive)
**Authentication:** Required

**Parameters:**
- `ref` (path, required) - Project reference

**Request Body (optional):**
```json
{
  "new_secret": "optional-custom-secret"
}
```

**Response (200):** New JWT key object

**CRITICAL WARNING:**
- **DESTRUCTIVE OPERATION**
- All current API secrets immediately invalidated
- All active connections using old keys severed
- Must deploy new secrets to restore functionality
- `anon` and `service_role` keys regenerated
- Cannot be undone

---

### Get Auth Service Configuration

**Endpoint:** `GET /v1/projects/{ref}/config/auth`
**Status:** ✅ Tested - Works
**Authentication:** Required

**Parameters:**
- `ref` (path, required) - Project reference

**Response (200):**
```json
{
  "site_url": "https://myapp.com",
  "disable_signup": false,
  "enable_signup": true,
  "enable_confirmations": true,
  "enable_anonymous_sign_ins": false,
  "auto_confirm": false,
  "mailer_autoconfirm": false,
  "mailer_secure_email_change_enabled": true,
  "external_email_enabled": true,
  "external_phone_enabled": false,
  "jwt_exp": 3600,
  "refresh_token_rotation_enabled": true,
  "security_refresh_token_reuse_interval": 10,
  "password_min_length": 8,
  "password_required_characters": "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
}
```

---

### Update Auth Service Configuration

**Endpoint:** `PATCH /v1/projects/{ref}/config/auth`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Parameters:**
- `ref` (path, required) - Project reference

**Request Body:**
```json
{
  "disable_signup": false,
  "enable_signup": true,
  "site_url": "https://myapp.com",
  "jwt_exp": 3600,
  "password_min_length": 12,
  "external_google_enabled": true,
  "external_google_client_id": "google-client-id",
  "external_google_secret": "google-client-secret"
}
```

**Available Parameters:**

**General Auth Settings:**
- `disable_signup` - Disable new user signups
- `enable_signup` - Enable new user signups
- `enable_confirmations` - Require email confirmation
- `enable_anonymous_sign_ins` - Allow anonymous users
- `site_url` - Primary site URL
- `jwt_exp` - JWT expiration in seconds
- `password_min_length` - Minimum password length

**External Auth Providers (Standard Parameters):**
Each provider has three parameters:
- `external_{provider}_enabled` - Enable the provider
- `external_{provider}_client_id` - OAuth client ID
- `external_{provider}_secret` - OAuth client secret

**Supported Providers:**
- `apple` - Apple Sign In
- `azure` - Microsoft Azure AD
- `bitbucket` - Bitbucket
- `discord` - Discord
- `facebook` - Facebook
- `figma` - Figma
- `github` - GitHub
- `gitlab` - GitLab
- `google` - Google
- `keycloak` - Keycloak
- `linkedin` - LinkedIn
- `notion` - Notion
- `slack` - Slack
- `spotify` - Spotify
- `twitch` - Twitch
- `twitter` - Twitter
- `workos` - WorkOS

**Response (200):** Updated configuration object

---

### List SSO Providers (SAML 2.0)

**Endpoint:** `GET /v1/projects/{ref}/config/auth/sso/providers`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Response (200):**
```json
[
  {
    "id": "provider-uuid",
    "provider": "saml",
    "name": "Corporate SSO",
    "enabled": true,
    "config": {
      "metadata_url": "https://idp.example.com/metadata.xml"
    },
    "created_at": "2023-03-29T16:32:59Z",
    "updated_at": "2023-03-29T16:32:59Z"
  }
]
```

---

### Create SSO Provider

**Endpoint:** `POST /v1/projects/{ref}/config/auth/sso/providers`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Request Body:**
```json
{
  "provider": "saml",
  "name": "Corporate SSO",
  "config": {
    "metadata_url": "https://idp.example.com/metadata.xml"
  }
}
```

**Response (201):** SSO provider object

---

### Get SSO Provider

**Endpoint:** `GET /v1/projects/{ref}/config/auth/sso/providers/{provider_id}`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Parameters:**
- `ref` (path, required) - Project reference
- `provider_id` (path, required) - SSO provider ID

---

### Update SSO Provider

**Endpoint:** `PUT /v1/projects/{ref}/config/auth/sso/providers/{provider_id}`
**Status:** ⚠️ Not Tested
**Authentication:** Required

---

### Delete SSO Provider

**Endpoint:** `DELETE /v1/projects/{ref}/config/auth/sso/providers/{provider_id}`
**Status:** ⚠️ Not Tested (Destructive)
**Authentication:** Required

---

### List Third-Party Auth Integrations

**Endpoint:** `GET /v1/projects/{ref}/config/auth/third-party-auth`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Response (200):**
```json
[
  {
    "id": "tpa_123",
    "provider": "github",
    "enabled": true,
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

---

### Create Third-Party Auth Integration

**Endpoint:** `POST /v1/projects/{ref}/config/auth/third-party-auth`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Request Body:**
```json
{
  "provider": "github",
  "client_id": "your-client-id",
  "client_secret": "your-client-secret",
  "redirect_uri": "https://yourapp.com/callback",
  "enabled": true
}
```

---

### Get Third-Party Auth Integration

**Endpoint:** `GET /v1/projects/{ref}/config/auth/third-party-auth/{tpa_id}`
**Status:** ⚠️ Not Tested
**Authentication:** Required

---

### Delete Third-Party Auth Integration

**Endpoint:** `DELETE /v1/projects/{ref}/config/auth/third-party-auth/{tpa_id}`
**Status:** ⚠️ Not Tested (Destructive)
**Authentication:** Required

---

## Database (Query, Schema, Extensions, Replicas, Config)

### 🎯 Execute SQL Query (GAME CHANGER)

**Endpoint:** `POST /v1/projects/{ref}/database/query`
**Status:** ✅ Tested - Works (201 Created)
**Authentication:** Required
**Beta Status:** OAuth partners only

**This is the most important endpoint - it enables implementing most database operations via SQL!**

**Parameters:**
- `ref` (path, required) - Project reference

**Request Body:**
```json
{
  "query": "SELECT version();",
  "read_only": false
}
```

- `query` (string, required) - SQL query to execute
- `read_only` (boolean, optional) - Restricts to read-only mode

**Response (201):**
```json
[
  {
    "version": "PostgreSQL 17.6 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 13.2.0, 64-bit"
  }
]
```

**Example:**
```bash
curl -X POST "https://api.supabase.com/v1/projects/my-project/database/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT * FROM users LIMIT 10;",
    "read_only": true
  }'
```

**What You Can Do:**
- ✅ List database extensions
- ✅ Get table schemas
- ✅ List RLS policies
- ✅ Get database roles
- ✅ View active connections
- ✅ Query any database metadata
- ✅ Execute DDL/DML operations

**See [SQL Alternatives](#sql-alternatives) section for ready-to-use queries.**

---

### List Migrations

**Endpoint:** `GET /v1/projects/{ref}/database/migrations`
**Status:** ❌ Not Found (404)
**Alternative:** Use SQL query

**SQL Alternative:**
```sql
SELECT version, name, applied_at
FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

---

### Apply Migration

**Endpoint:** `POST /v1/projects/{ref}/database/migrations`
**Status:** ❌ Not Found (404)
**Alternative:** Use `database/query` endpoint

**Beta Status:** OAuth partners only (when available)

**Request Body:**
```json
{
  "query": "CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT);",
  "name": "add_users_table"
}
```

---

### Upsert Migration

**Endpoint:** `PUT /v1/projects/{ref}/database/migrations`
**Status:** ❌ Not Found (404)
**Alternative:** Use `database/query` endpoint

**Beta Status:** OAuth partners only (when available)

**Description:** Creates or updates migration without applying it

---

### Get Postgres Configuration

**Endpoint:** `GET /v1/projects/{ref}/config/database/postgres`
**Status:** ❌ Not Found (404)
**Alternative:** Use SQL query

**SQL Alternative:**
```sql
SELECT name, setting, unit, context, category
FROM pg_settings
WHERE name IN ('max_connections', 'shared_buffers', 'effective_cache_size', 'work_mem')
ORDER BY name;
```

---

### Update Postgres Configuration

**Endpoint:** `PUT /v1/projects/{ref}/config/database/postgres`
**Status:** ❌ Not Found (404)
**Alternative:** Contact Supabase support or use Dashboard

**Note:** Postgres configuration changes typically require database restart and should be done via Dashboard.

---

### Get Pooler Configuration

**Endpoint:** `GET /v1/projects/{ref}/config/database/pooler`
**Status:** ❌ Not Found (404)
**Alternative:** Check via Dashboard or contact support

---

### Update Pooler Configuration

**Endpoint:** `PATCH /v1/projects/{ref}/config/database/pooler`
**Status:** ❌ Not Found (404)
**Alternative:** Use Dashboard

---

### Get SSL Enforcement Configuration

**Endpoint:** `GET /v1/projects/{ref}/ssl-enforcement`
**Status:** ✅ Tested - Works
**Authentication:** Required

**Response (200):**
```json
{
  "currentConfig": {
    "database": false
  },
  "appliedSuccessfully": true
}
```

---

### Update SSL Enforcement Configuration

**Endpoint:** `PUT /v1/projects/{ref}/ssl-enforcement`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Request Body:**
```json
{
  "requestedConfig": {
    "database": true
  }
}
```

---

### Setup Read Replica

**Endpoint:** `POST /v1/projects/{ref}/read-replicas/setup`
**Status:** ❌ Not Found (404)
**Implementation:** Not available via API

**Note:** Read replicas may need to be set up via Dashboard or contact support.

---

### Remove Read Replica

**Endpoint:** `POST /v1/projects/{ref}/read-replicas/remove`
**Status:** ❌ Not Found (404)
**Implementation:** Not available via API

---

### List Read Replicas

**Endpoint:** `GET /v1/projects/{ref}/read-replicas`
**Status:** ❌ Not Found (404)
**Alternative:** Use SQL query

**SQL Alternative:**
```sql
SELECT * FROM pg_stat_replication;
```

---

### Get Database Context (Experimental)

**Endpoint:** `GET /v1/projects/{ref}/database/context`
**Status:** ❌ Not Found (404)
**Alternative:** Use SQL query

**SQL Alternative:**
```sql
SELECT
  d.datname as database,
  n.nspname as schema
FROM pg_database d
CROSS JOIN pg_namespace n
WHERE d.datname = current_database()
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname;
```

---

### Generate TypeScript Types

**Endpoint:** `GET /v1/projects/{ref}/types/typescript`
**Status:** ✅ Tested - Works
**Authentication:** Required

**Query Parameters:**
- `included_schemas` (string, optional) - Comma-separated schema names

**Response (200):**
```json
{
  "types": "export type Database = {\n  public: {\n    Tables: {\n      users: {\n        Row: {\n          id: string\n          email: string\n        }\n      }\n    }\n  }\n}"
}
```

**Example:**
```bash
curl "https://api.supabase.com/v1/projects/my-project/types/typescript?included_schemas=public,auth" \
  -H "Authorization: Bearer $TOKEN"
```

**Usage with supabase-js:**
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabase = createClient<Database>(url, anonKey)
```

---

### Enable Database Webhooks

**Endpoint:** `POST /v1/projects/{ref}/database/webhooks/enable`
**Status:** ❌ Not Found (404)
**Beta Status:** When available

**Description:** Enables Database Webhooks functionality

---

### JIT (Just-In-Time) Access Endpoints

**All JIT endpoints return 404:**
- `POST /v1/projects/{ref}/database/jit` - Authorize JIT access
- `GET /v1/projects/{ref}/database/jit` - Get JIT mappings
- `PUT /v1/projects/{ref}/database/jit` - Update JIT access
- `GET /v1/projects/{ref}/database/jit/list` - List JIT mappings
- `DELETE /v1/projects/{ref}/database/jit/{user_id}` - Delete JIT access

**Status:** ❌ Not available via API

---

### Readonly Mode

**Get Readonly Status:**

**Endpoint:** `GET /v1/projects/{ref}/readonly`
**Status:** ✅ Tested - Works
**Authentication:** Required

**Response (200):**
```json
{
  "enabled": false,
  "override_enabled": false,
  "override_active_until": "1970-01-01 00:00:00+00"
}
```

---

**Disable Readonly Mode (Temporary):**

**Endpoint:** `POST /v1/projects/{ref}/readonly/temporary-disable`
**Status:** ⚠️ Not Tested
**Description:** Disables readonly mode for 15 minutes

---

### CLI Login Role

**Create CLI Login Role:**

**Endpoint:** `POST /v1/projects/{ref}/cli/login-role`
**Status:** ⚠️ Not Tested (Beta)

**Response (200):**
```json
{
  "role": "cli_temp_role_abc123",
  "password": "temp_password_xyz"
}
```

---

**Delete CLI Login Roles:**

**Endpoint:** `DELETE /v1/projects/{ref}/cli/login-role`
**Status:** ⚠️ Not Tested (Beta)

---

## Functions (Edge Functions)

### List All Functions

**Endpoint:** `GET /v1/projects/{ref}/functions`
**Status:** ✅ Tested - Works
**Authentication:** Required

**Response (200):**
```json
[
  {
    "id": "func-123",
    "slug": "hello-world",
    "name": "Hello World Function",
    "status": "ACTIVE",
    "version": 5,
    "created_at": 1701388800,
    "updated_at": 1701475200,
    "verify_jwt": true,
    "import_map": true,
    "entrypoint_path": "index.ts",
    "import_map_path": "import_map.json",
    "ezbr_sha256": "abc123..."
  }
]
```

**Fields:**
- `status` - `ACTIVE`, `INACTIVE`, or `PENDING`
- `version` - Deployment version number
- `verify_jwt` - JWT verification enabled
- `import_map` - Import map usage

---

### Get Function Details

**Endpoint:** `GET /v1/projects/{ref}/functions/{function_slug}`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Parameters:**
- `ref` (path, required) - Project reference
- `function_slug` (path, required) - Function slug

**Response (200):** Single function object

---

### Get Function Body

**Endpoint:** `GET /v1/projects/{ref}/functions/{function_slug}/body`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Response (200):** Function source code

**Example:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  return new Response(
    JSON.stringify({ message: "Hello World!" }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

---

### Deploy Function

**Endpoint:** `POST /v1/projects/{ref}/functions/deploy`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Query Parameters:**
- `slug` (string, optional) - Function slug (creates/updates)
- `bundleOnly` (boolean, optional) - Return bundle metadata without deploying

**Request Format:** `multipart/form-data`

**Form Fields:**
- `metadata` (JSON, required) - Function metadata
- `file` (file, optional) - Function source files

**Metadata Format:**
```json
{
  "entrypoint_path": "index.ts",
  "name": "My Test Function",
  "verify_jwt": true,
  "import_map": false
}
```

**Response (201):** Function object

**Example:**
```bash
curl -X POST "https://api.supabase.com/v1/projects/my-project/functions/deploy?slug=my-func" \
  -H "Authorization: Bearer $TOKEN" \
  -F 'metadata={"entrypoint_path":"index.ts","name":"My Test"}' \
  -F 'file=@./function-code.zip'
```

**Bulk Deployment Workflow:**

1. Deploy each function with `bundleOnly=1`
2. Collect all responses
3. Use bulk update endpoint to apply atomically

---

### Update Function

**Endpoint:** `PATCH /v1/projects/{ref}/functions/{function_slug}`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Request Body:**
```json
{
  "name": "Updated Function Name",
  "verify_jwt": false
}
```

**Response (200):** Updated function object

---

### Delete Function

**Endpoint:** `DELETE /v1/projects/{ref}/functions/{function_slug}`
**Status:** ⚠️ Not Tested (Destructive)
**Authentication:** Required

**Response (200):** Empty object

---

### Bulk Update Functions

**Endpoint:** `PUT /v1/projects/{ref}/functions`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Description:** Atomically create or replace multiple functions

**Request Body:**
```json
[
  {
    "slug": "func1",
    "name": "Function 1",
    "entrypoint_path": "index.ts",
    "verify_jwt": true
  },
  {
    "slug": "func2",
    "name": "Function 2",
    "entrypoint_path": "index.ts",
    "verify_jwt": false
  }
]
```

**Response (200):** Array of function objects

---

### Invoke Edge Function

**Endpoint:** `POST https://{project_ref}.supabase.co/functions/v1/{function_name}`
**Note:** Uses project URL, not Management API base URL

**Authentication:**
- `anon key` - For public functions
- `User JWT` - For authenticated requests

**Headers:**
- `Authorization: Bearer <anon_key_or_jwt>` (required)
- `Content-Type: application/json` (recommended)

**Request Body:** Any JSON payload your function expects

**Example (cURL):**
```bash
curl -X POST "https://my-project.supabase.co/functions/v1/hello-world" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Functions"}'
```

**Example (JavaScript):**
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, anonKey)

const { data, error } = await supabase.functions.invoke('hello-world', {
  method: 'POST',
  body: { name: 'Functions' }
})
```

**Security Notes:**
- Use `verify_jwt: true` to enforce JWT verification
- Be cautious with `--no-verify-jwt` flag (allows unauthenticated access)
- Authorization header sets Auth context for RLS policies

---

### Function Secrets

**List All Secrets:**

**Endpoint:** `GET /v1/projects/{ref}/secrets`
**Status:** ✅ Tested - Works
**Authentication:** Required

**Response (200):**
```json
{
  "secrets": [
    {
      "name": "API_KEY",
      "value": "***"
    },
    {
      "name": "DATABASE_URL",
      "value": "***"
    }
  ]
}
```

---

**Bulk Create Secrets:**

**Endpoint:** `POST /v1/projects/{ref}/secrets`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Request Body:**
```json
{
  "secrets": {
    "API_KEY": "value1",
    "DATABASE_URL": "value2"
  }
}
```

---

**Bulk Delete Secrets:**

**Endpoint:** `DELETE /v1/projects/{ref}/secrets`
**Status:** ⚠️ Not Tested (Destructive)
**Authentication:** Required

**Request Body:**
```json
{
  "names": ["API_KEY", "OLD_SECRET"]
}
```

---

## Security (Restrictions, Policies, Audit)

### List Network Restrictions

**Endpoint:** `GET /v1/projects/{ref}/network-restrictions`
**Status:** ✅ Tested - Works
**Authentication:** Required
**Beta Status:** Beta

**Response (200):**
```json
{
  "entitlement": "allowed",
  "config": {
    "dbAllowedCidrs": ["0.0.0.0/0"],
    "dbAllowedCidrsV6": ["::/0"]
  }
}
```

---

### Update Network Restrictions

**Endpoint:** `PATCH /v1/projects/{ref}/network-restrictions`
**Status:** ⚠️ Not Tested (Alpha)
**Authentication:** Required

**Request Body:**
```json
{
  "dbAllowedCidrs": ["192.168.1.0/24", "10.0.0.0/8"]
}
```

---

### Apply Network Restrictions

**Endpoint:** `POST /v1/projects/{ref}/network-restrictions/apply`
**Status:** ⚠️ Not Tested (Beta)
**Authentication:** Required

---

### Get Network Bans

**Endpoint:** `POST /v1/projects/{ref}/network-bans/retrieve`
**Status:** ⚠️ Not Tested (Beta)
**Authentication:** Required

---

### Remove Network Bans

**Endpoint:** `DELETE /v1/projects/{ref}/network-bans`
**Status:** ⚠️ Not Tested (Beta, Destructive)
**Authentication:** Required

---

### Security Advisors

**Endpoint:** `GET /v1/projects/{ref}/advisors/security`
**Status:** ✅ Tested - Works
**Authentication:** Required

**Response (200):**
```json
{
  "lints": []
}
```

**When issues exist:**
```json
{
  "lints": [
    {
      "level": "CRITICAL",
      "title": "RLS not enabled on table",
      "description": "Row Level Security is not enabled on public.users",
      "categories": ["SECURITY"],
      "metadata": {
        "schema": "public",
        "table": "users"
      }
    }
  ]
}
```

**Severity Levels:**
- `CRITICAL` - Critical security issues
- `HIGH` - High priority issues
- `MEDIUM` - Medium priority issues
- `LOW` - Low priority issues

---

### Performance Advisors

**Endpoint:** `GET /v1/projects/{ref}/advisors/performance`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Expected Response:** Performance recommendations

---

### List Security Policies (RLS)

**Endpoint:** ❌ No dedicated endpoint
**Alternative:** Use SQL query

**SQL Alternative:**
```sql
SELECT
  schemaname as schema,
  tablename as table,
  policyname as name,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
ORDER BY schemaname, tablename, policyname;
```

---

## Branches (Preview Environments)

### List Branches

**Endpoint:** `GET /v1/projects/{ref}/branches`
**Status:** ✅ Tested - Works
**Authentication:** Required

**Response (200):**
```json
[
  {
    "id": "string",
    "name": "string",
    "project_ref": "string",
    "status": "ACTIVE",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z",
    "git_branch": "feature/new-feature",
    "persistent": true
  }
]
```

**Notes:**
- Each branch is a separate Supabase instance
- Branches do NOT inherit production data (security feature)
- Two types: Preview Branches (temporary) and Persistent Branches (long-lived)

---

### Create Branch

**Endpoint:** `POST /v1/projects/{ref}/branches`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Request Body:**
```json
{
  "branch_name": "feature-branch",
  "git_branch": "feature/new-feature",
  "is_default": false,
  "persistent": true,
  "region": "us-east-1",
  "desired_instance_size": "t4g.small",
  "release_channel": "stable",
  "postgres_engine": "postgres-15",
  "secrets": {
    "API_KEY": "value"
  },
  "with_data": false,
  "notify_url": "https://example.com/webhook"
}
```

**Response (201):** Branch object

---

### Get Branch Details

**Endpoint:** `GET /v1/projects/{ref}/branches/{name}`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Parameters:**
- `ref` (path, required) - Project reference
- `name` (path, required) - Branch name

---

### Get Branch Config

**Endpoint:** `GET /v1/branches/{branch_id_or_ref}`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Parameters:**
- `branch_id_or_ref` (path, required) - Branch ID or reference

---

### Update Branch Config

**Endpoint:** `PATCH /v1/branches/{branch_id_or_ref}`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Request Body:**
```json
{
  "branch_name": "new-name",
  "git_branch": "feature/updated",
  "persistent": true
}
```

---

### Delete Branch

**Endpoint:** `DELETE /v1/branches/{branch_id_or_ref}`
**Status:** ⚠️ Not Tested (Destructive)
**Authentication:** Required

**Response (200):**
```json
{
  "message": "Branch deleted successfully"
}
```

---

### Push Branch

**Endpoint:** `POST /v1/branches/{branch_id_or_ref}/push`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Description:** Pushes changes to the specified branch

**Request Body:**
```json
{
  "commit_message": "Add new feature"
}
```

---

### Merge Branch

**Endpoint:** `POST /v1/branches/{branch_id_or_ref}/merge`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Description:** Merges branch changes into production

**Automatic Deployment Workflow:**
1. Clone (checkout git branch)
2. Pull (retrieve migrations)
3. Health (verify services)
4. Configure (update configs)
5. Migrate (apply migrations)
6. Seed (populate data)
7. Deploy (push Edge Functions)

**Request Body:**
```json
{
  "notify_url": "https://example.com/webhook",
  "auto_commit": true
}
```

---

### Reset Branch

**Endpoint:** `POST /v1/branches/{branch_id_or_ref}/reset`
**Status:** ⚠️ Not Tested (Destructive)
**Authentication:** Required

**Description:** Resets branch to a previous state

**Request Body:**
```json
{
  "recovery_time_target_unix": 1705320000
}
```

---

### Get Branch Diff

**Endpoint:** `GET /v1/branches/{branch_id_or_ref}/diff`
**Status:** ⚠️ Not Tested (Beta)
**Authentication:** Required

**Description:** Compare branch differences

---

### Disable Preview Branching

**Endpoint:** `DELETE /v1/projects/{ref}/branches`
**Status:** ⚠️ Not Tested (Destructive)
**Authentication:** Required

**Description:** Disables preview branching for entire project

---

## Backups & Recovery

### List Backups

**Endpoint:** `GET /v1/projects/{ref}/database/backups`
**Status:** ✅ Tested - Works
**Authentication:** Required

**Response (200):**
```json
{
  "region": "us-east-1",
  "walg_enabled": true,
  "pitr_enabled": true,
  "backups": [
    {
      "is_physical_backup": true,
      "status": "completed",
      "inserted_at": "2023-12-01T00:00:00Z"
    }
  ],
  "physical_backup_data": {
    "earliest_physical_backup_date_unix": 1701388800,
    "latest_physical_backup_date_unix": 1701475200
  }
}
```

**Fields:**
- `walg_enabled` - WAL-G archiving status
- `pitr_enabled` - Point-in-time recovery capability
- `backups` - Array of backup objects

---

### Create Backup

**Endpoint:** `POST /v1/projects/{ref}/database/backups`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Description:** Creates an on-demand backup

---

### Delete Backup

**Endpoint:** `DELETE /v1/projects/{ref}/database/backups/{backup_id}`
**Status:** ⚠️ Not Tested (Destructive)
**Authentication:** Required

---

### Restore PITR Backup

**Endpoint:** `POST /v1/projects/{ref}/database/backups/restore-pitr`
**Status:** ⚠️ Not Tested (Destructive)
**Authentication:** Required

**Request Body:**
```json
{
  "recovery_time_target_unix": 1701388800
}
```

**Response (201):** Empty object

**Notes:**
- PITR available on Pro, Team, and Enterprise plans
- Requires Small compute add-on or larger
- RPO (Recovery Point Objective): ~2 minutes
- Pro plan: 7 days retention
- Enterprise plan: 30 days retention

---

### Create Restore Point

**Endpoint:** `POST /v1/projects/{ref}/database/backups/restore-point`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Description:** Creates a named restore point

---

### Get Restore Points

**Endpoint:** `GET /v1/projects/{ref}/database/backups/restore-point`
**Status:** ⚠️ Not Tested
**Authentication:** Required

---

### Undo to Restore Point

**Endpoint:** `POST /v1/projects/{ref}/database/backups/undo`
**Status:** ⚠️ Not Tested (Destructive)
**Authentication:** Required

---

### List Backup Schedules

**Endpoint:** `GET /v1/projects/{ref}/database/backups/schedules`
**Status:** ❌ Not Found (404)
**Implementation:** Not available via API

---

### Create Backup Schedule

**Endpoint:** `POST /v1/projects/{ref}/database/backups/schedules`
**Status:** ❌ Not Found (404)
**Implementation:** Not available via API

---

## Migrations

**Note:** Migration endpoints require OAuth partner status and are currently not found (404) for standard access tokens.

### List Migrations

**Endpoint:** `GET /v1/projects/{ref}/database/migrations`
**Status:** ❌ Not Found (404)
**Beta Status:** OAuth partners only
**Alternative:** Use SQL query

**SQL Alternative:**
```sql
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

---

### Apply Migration

**Endpoint:** `POST /v1/projects/{ref}/database/migrations`
**Status:** ❌ Not Found (404)
**Beta Status:** OAuth partners only
**Alternative:** Use `database/query` endpoint

**When Available - Request Body:**
```json
{
  "query": "CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT);",
  "name": "add_users_table"
}
```

---

### Upsert Migration

**Endpoint:** `PUT /v1/projects/{ref}/database/migrations`
**Status:** ❌ Not Found (404)
**Beta Status:** OAuth partners only
**Alternative:** Use `database/query` endpoint

**Description:** Creates or updates migration without applying it

---

## Storage & Buckets

### List Buckets (Management API)

**Endpoint:** `GET /v1/projects/{ref}/storage/buckets`
**Status:** ✅ Tested - Works
**Authentication:** Required

**Response (200):**
```json
{
  "buckets": [
    {
      "id": "avatars",
      "name": "avatars",
      "public": true,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z",
      "file_size_limit": 52428800,
      "allowed_mime_types": ["image/png", "image/jpeg"]
    }
  ]
}
```

---

### Get Storage Configuration

**Endpoint:** `GET /v1/projects/{ref}/config/storage`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Expected Response:**
```json
{
  "file_size_limit": 52428800,
  "features": {
    "image_transformation": true
  }
}
```

---

### Update Storage Configuration

**Endpoint:** `PATCH /v1/projects/{ref}/config/storage`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Request Body:**
```json
{
  "file_size_limit": 104857600
}
```

---

### Storage REST API

**Note:** Storage object operations use project URL, not Management API base URL.

**Base URL:** `https://{project_ref}.supabase.co/storage/v1`

**Authentication:** Use `service_role` key for admin operations

---

### Create Bucket

**Endpoint:** `POST /storage/v1/bucket`
**Status:** ⚠️ Not Tested
**Authentication:** `service_role` key

**Request Body:**
```json
{
  "name": "avatars",
  "public": true,
  "file_size_limit": 52428800,
  "allowed_mime_types": ["image/png", "image/jpeg", "image/gif"]
}
```

**Response (200):**
```json
{
  "name": "avatars"
}
```

---

### List Buckets (Storage API)

**Endpoint:** `GET /storage/v1/bucket`
**Status:** ⚠️ Not Tested
**Authentication:** `service_role` key

---

### Get Bucket

**Endpoint:** `GET /storage/v1/bucket/{bucket_id}`
**Status:** ⚠️ Not Tested
**Authentication:** Required

---

### Update Bucket

**Endpoint:** `PUT /storage/v1/bucket/{bucket_id}`
**Status:** ⚠️ Not Tested
**Authentication:** `service_role` key

**Request Body:**
```json
{
  "public": false,
  "file_size_limit": 104857600
}
```

---

### Empty Bucket

**Endpoint:** `POST /storage/v1/bucket/{bucket_id}/empty`
**Status:** ⚠️ Not Tested (Destructive)
**Authentication:** `service_role` key

**Description:** Removes all objects from bucket

---

### Delete Bucket

**Endpoint:** `DELETE /storage/v1/bucket/{bucket_id}`
**Status:** ⚠️ Not Tested (Destructive)
**Authentication:** `service_role` key

**Note:** Bucket must be empty first

---

### Upload File

**Endpoint:** `POST /storage/v1/object/{bucket_name}/{file_path}`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: <file_mime_type>`
- `x-upsert: true` (optional) - Overwrite if exists

**Request Body:** Binary file data

**Example:**
```bash
curl -X POST "https://my-project.supabase.co/storage/v1/object/avatars/user1/profile.jpg" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@profile.jpg"
```

---

### Download File

**Endpoint:** `GET /storage/v1/object/{bucket_name}/{file_path}`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Response:** Binary file data

---

### Delete File

**Endpoint:** `DELETE /storage/v1/object/{bucket_name}/{file_path}`
**Status:** ⚠️ Not Tested (Destructive)
**Authentication:** Required

---

### List Files

**Endpoint:** `POST /storage/v1/object/list/{bucket_name}`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Request Body:**
```json
{
  "prefix": "user1/",
  "limit": 100,
  "offset": 0,
  "sortBy": {
    "column": "name",
    "order": "asc"
  },
  "search": "profile"
}
```

---

### Public URLs

For public buckets:
```
https://{project_ref}.supabase.co/storage/v1/object/public/{bucket_name}/{file_path}
```

No authentication required for public buckets.

---

### Create Signed URL

**Endpoint:** `POST /storage/v1/object/sign/{bucket_name}/{file_path}`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Request Body:**
```json
{
  "expiresIn": 3600
}
```

**Response:**
```json
{
  "signedURL": "https://my-project.supabase.co/storage/v1/object/sign/documents/report.pdf?token=abc123..."
}
```

---

### Image Transformation

For image buckets:
```
https://{project_ref}.supabase.co/storage/v1/render/image/public/{bucket_name}/{file_path}?width=300&height=300
```

**Transformation Parameters:**
- `width` - Resize width
- `height` - Resize height
- `quality` - JPEG quality (1-100)
- `format` - Output format (webp, jpg, png)

---

## Integrations & Webhooks

### Database Webhooks

**Enable Database Webhooks:**

**Endpoint:** `POST /v1/projects/{ref}/database/webhooks/enable`
**Status:** ❌ Not Found (404)
**Beta Status:** When available

**Description:** Enables Database Webhooks functionality

**Features:**
- Event Types: INSERT, UPDATE, DELETE
- Built on pg_net (asynchronous)
- Payload Formats: Automatic JSON generation
- HTTP Methods: POST or GET requests

**Payload Structures:**

**INSERT:**
```json
{
  "type": "INSERT",
  "table": "users",
  "schema": "public",
  "record": {
    "id": 1,
    "email": "user@example.com"
  },
  "old_record": null
}
```

**UPDATE:**
```json
{
  "type": "UPDATE",
  "table": "users",
  "schema": "public",
  "record": {
    "id": 1,
    "email": "newemail@example.com"
  },
  "old_record": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**DELETE:**
```json
{
  "type": "DELETE",
  "table": "users",
  "schema": "public",
  "record": null,
  "old_record": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

---

### Third-Party Auth Integrations

See [Auth Section](#auth-jwt-providers-sso) for third-party auth integration endpoints.

---

## Logs & Monitoring

### Get Project Health

**Endpoint:** `GET /v1/projects/{ref}/health`
**Status:** ⚠️ Bad Request (400) - Requires parameters
**Authentication:** Required

**Required Query Parameter:**
- `services` - Comma-separated service names (e.g., `postgres,kong,auth`)

**Example:**
```bash
curl "https://api.supabase.com/v1/projects/my-project/health?services=postgres,kong,auth" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Analytics Endpoints

**All analytics endpoints return 404:**
- `GET /v1/projects/{ref}/analytics` - Not available
- `GET /v1/projects/{ref}/analytics/endpoints/functions.combined-stats` - Not available
- `GET /v1/projects/{ref}/analytics/endpoints/logs.all` - Not available
- `GET /v1/projects/{ref}/analytics/endpoints/usage.api-counts` - Not available
- `GET /v1/projects/{ref}/analytics/endpoints/usage.api-requests-count` - Not available

**Status:** ❌ Not available via API
**Alternative:** Use Dashboard or contact support

---

### Logs Endpoints

**All logs endpoints return 404:**
- `GET /v1/projects/{ref}/logs` - Not available
- `GET /v1/projects/{ref}/functions/logs` - Not available

**Status:** ❌ Not available via API
**Alternative:** Use Dashboard

---

### Usage & Quotas

**All usage endpoints return 404:**
- `GET /v1/projects/{ref}/usage` - Not available
- `GET /v1/projects/{ref}/quotas` - Not available
- `GET /v1/projects/{ref}/metrics` - Not available

**Status:** ❌ Not available via API
**Alternative:** Use Dashboard

---

### Upgrade Management

**Check Upgrade Eligibility:**

**Endpoint:** `GET /v1/projects/{ref}/upgrade/eligibility`
**Status:** ✅ Tested - Works (Beta)
**Authentication:** Required

**Response (200):**
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

**Upgrade Postgres:**

**Endpoint:** `POST /v1/projects/{ref}/upgrade`
**Status:** ❌ Not Found (404)
**Alternative:** Use Dashboard

---

**Get Upgrade Status:**

**Endpoint:** `GET /v1/projects/{ref}/upgrade/status`
**Status:** ⚠️ Not Tested (Beta)
**Authentication:** Required

---

### Action Runs (Branch Operations)

**List Action Runs:**

**Endpoint:** `GET /v1/projects/{ref}/actions`
**Status:** ⚠️ Not Tested
**Authentication:** Required

**Description:** Lists action runs (branch merge/push operations)

---

**Count Action Runs:**

**Endpoint:** `HEAD /v1/projects/{ref}/actions`
**Status:** ⚠️ Not Tested
**Authentication:** Required

---

**Get Action Status:**

**Endpoint:** `GET /v1/projects/{ref}/actions/{run_id}`
**Status:** ⚠️ Not Tested
**Authentication:** Required

---

**Get Action Logs:**

**Endpoint:** `GET /v1/projects/{ref}/actions/{run_id}/logs`
**Status:** ⚠️ Not Tested
**Authentication:** Required

---

**Update Action Status:**

**Endpoint:** `PATCH /v1/projects/{ref}/actions/{run_id}/status`
**Status:** ⚠️ Not Tested
**Authentication:** Required

---

## SQL Alternatives

**Since `POST /v1/projects/{ref}/database/query` works, here are ready-to-use SQL queries for missing REST endpoints.**

### Database Extensions

```sql
SELECT
  e.extname as name,
  e.extversion as version,
  n.nspname as schema,
  c.description as comment
FROM pg_extension e
LEFT JOIN pg_namespace n ON n.oid = e.extnamespace
LEFT JOIN pg_description c ON c.objoid = e.oid
ORDER BY e.extname;
```

**Use Case:** Implement `db:extensions` command

---

### Database Tables

```sql
SELECT
  schemaname as schema,
  tablename as name,
  tableowner as owner,
  hasindexes as has_indexes,
  hasrules as has_rules,
  hastriggers as has_triggers
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename;
```

**Use Case:** Implement `db:tables` command

---

### Database Views

```sql
SELECT
  schemaname as schema,
  viewname as name,
  viewowner as owner,
  definition
FROM pg_views
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, viewname;
```

**Use Case:** Implement `db:views` command

---

### Database Functions

```sql
SELECT
  n.nspname as schema,
  p.proname as name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_function_arguments(p.oid) as arguments,
  CASE p.prokind
    WHEN 'f' THEN 'function'
    WHEN 'p' THEN 'procedure'
    WHEN 'a' THEN 'aggregate'
    WHEN 'w' THEN 'window'
  END as kind
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, p.proname;
```

**Use Case:** Implement `db:functions` command

---

### Row Level Security Policies

```sql
SELECT
  schemaname as schema,
  tablename as table,
  policyname as name,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
ORDER BY schemaname, tablename, policyname;
```

**Use Case:** Implement `security:policies:list` command

---

### Database Roles

```sql
SELECT
  rolname as name,
  rolsuper as is_superuser,
  rolinherit as inherit,
  rolcreaterole as can_create_role,
  rolcreatedb as can_create_db,
  rolcanlogin as can_login,
  rolreplication as replication,
  rolconnlimit as connection_limit
FROM pg_roles
WHERE rolname NOT LIKE 'pg_%'
ORDER BY rolname;
```

**Use Case:** Implement `db:roles` command

---

### Database Size

```sql
SELECT
  pg_size_pretty(pg_database_size(current_database())) as database_size,
  pg_size_pretty(sum(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename)))::bigint) as tables_size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema');
```

**Use Case:** Implement `db:size` command

---

### Active Connections

```sql
SELECT
  datname as database,
  usename as user,
  application_name,
  client_addr,
  state,
  query_start,
  state_change
FROM pg_stat_activity
WHERE datname = current_database()
ORDER BY query_start DESC;
```

**Use Case:** Implement `db:connections` command

---

### Postgres Configuration

```sql
SELECT
  name,
  setting,
  unit,
  context,
  category
FROM pg_settings
WHERE name IN (
  'max_connections',
  'shared_buffers',
  'effective_cache_size',
  'work_mem',
  'maintenance_work_mem'
)
ORDER BY name;
```

**Use Case:** Implement `db:config:get` command

---

### Table Indexes

```sql
SELECT
  schemaname as schema,
  tablename as table,
  indexname as name,
  indexdef as definition
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename, indexname;
```

**Use Case:** Implement `db:indexes` command

---

### Foreign Keys

```sql
SELECT
  tc.constraint_name as name,
  tc.table_schema as schema,
  tc.table_name as table,
  kcu.column_name as column,
  ccu.table_schema as foreign_schema,
  ccu.table_name as foreign_table,
  ccu.column_name as foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY tc.table_schema, tc.table_name, tc.constraint_name;
```

**Use Case:** Implement `db:foreign-keys` command

---

### Triggers

```sql
SELECT
  trigger_schema as schema,
  event_object_table as table,
  trigger_name as name,
  event_manipulation as event,
  action_timing as timing,
  action_statement as definition
FROM information_schema.triggers
WHERE trigger_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY trigger_schema, event_object_table, trigger_name;
```

**Use Case:** Implement `db:triggers` command

---

### Schemas

```sql
SELECT
  schema_name as name,
  schema_owner as owner
FROM information_schema.schemata
WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY schema_name;
```

**Use Case:** Implement `db:schemas` command

---

### Read Replication Status

```sql
SELECT * FROM pg_stat_replication;
```

**Use Case:** Check if read replicas exist (empty result = no replicas)

---

### Migrations

```sql
SELECT
  version,
  name
FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

**Use Case:** Implement `migrations:list` command

---

## Error Responses

### Error Response Format

```json
{
  "message": "Error description",
  "error": {
    "message": "Detailed error message",
    "code": "ERROR_CODE",
    "details": {}
  },
  "statusCode": 400
}
```

### HTTP Status Codes

**2xx Success:**
- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `204 No Content` - Request succeeded with no response body

**4xx Client Errors:**
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found / Endpoint does not exist
- `409 Conflict` - Resource conflict (e.g., duplicate name)
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded

**5xx Server Errors:**
- `500 Internal Server Error` - Server error
- `502 Bad Gateway` - Gateway error
- `503 Service Unavailable` - Service temporarily unavailable
- `504 Gateway Timeout` - Gateway timeout

### Error Handling Best Practices

1. **Check HTTP status code** before parsing response
2. **Implement retry logic** for 5xx errors and 429
3. **Use exponential backoff** for retries
4. **Log error details** for debugging
5. **Handle rate limits** gracefully

**Example Error Handling (TypeScript):**
```typescript
try {
  const response = await fetch(url, options)

  if (!response.ok) {
    const error = await response.json()

    // Handle rate limiting
    if (response.status === 429) {
      await delay(60000) // Wait 1 minute
      return retry()
    }

    // Handle not found
    if (response.status === 404) {
      throw new Error('Endpoint not available')
    }

    throw new Error(error.message || 'API request failed')
  }

  return await response.json()
} catch (error) {
  console.error('API Error:', error)
  throw error
}
```

---

## Implementation Notes

### API Coverage Summary

| Category | Working Endpoints | Total Known | Coverage |
|----------|-------------------|-------------|----------|
| Core Management | 3 | 3 | 100% |
| Branches | 1 | 10 | 10% |
| Security | 3 | 8 | 38% |
| Functions | 1 | 8 | 13% |
| Backups | 1 | 8 | 13% |
| Storage | 1 | 15 | 7% |
| Database | 1 | 30+ | 3% |
| **TOTAL** | **17** | **~100** | **~17%** |

**With SQL Workarounds:** ~60% effective coverage

---

### Commands to Keep (Working Endpoints)

1. ✅ `projects:list` - List all projects
2. ✅ `projects:get` - Get project details
3. ✅ `backup:list` - List backups
4. ✅ `security:restrictions:list` - List network restrictions
5. ✅ `security:audit` - Security audit
6. ✅ `functions:list` - List edge functions
7. ✅ `branches:list` - List preview branches
8. ✅ `organizations:list` - List organizations

---

### Commands to Refactor (Use SQL)

1. 🔄 `db:extensions` - Refactor to use SQL query
2. 🔄 `db:schema` - Refactor to use SQL query
3. 🔄 `security:policies:list` - Refactor to use SQL query
4. 🔄 `db:tables` - New command using SQL
5. 🔄 `db:views` - New command using SQL
6. 🔄 `db:functions` - New command using SQL
7. 🔄 `db:roles` - New command using SQL

---

### Commands to Remove (No API Support)

1. ❌ `db:replicas:list` - No endpoint exists
2. ❌ `db:replicas:create` - No endpoint exists
3. ❌ `db:replicas:delete` - No endpoint exists
4. ❌ `backup:schedule:list` - No endpoint exists
5. ❌ `backup:schedule:create` - No endpoint exists

---

### Commands to Add (New Discoveries)

1. ✅ `db:query` - Execute arbitrary SQL
2. ✅ `types:generate` - Generate TypeScript types
3. ✅ `upgrade:check` - Check upgrade eligibility
4. ✅ `config:auth:get` - Get auth config
5. ✅ `config:ssl:get` - Get SSL enforcement
6. ✅ `storage:buckets:list` - List storage buckets
7. ✅ `readonly:status` - Get readonly mode status

---

### Commands to Test (Write Operations)

1. 🔍 `backup:create` - Test POST endpoint
2. 🔍 `security:restrictions:add` - Test POST endpoint
3. 🔍 `functions:deploy` - Test POST endpoint
4. 🔍 `storage:buckets:create` - Test POST endpoint
5. 🔍 `branches:create` - Test POST endpoint
6. 🔍 `branches:merge` - Test POST endpoint

---

## Resources

### Official Documentation
- **Management API Reference:** https://supabase.com/docs/reference/api/introduction
- **OpenAPI Spec:** https://api.supabase.com/api/v1
- **Interactive API Explorer:** https://api.supabase.com/api/v1

### Swagger/OpenAPI UIs
- **Storage API:** https://supabase.github.io/storage/
- **Postgres Meta API:** https://supabase.github.io/postgres-meta/
- **Realtime API:** https://realtime.supabase.com/swaggerui

### Guides
- **Branching Guide:** https://supabase.com/docs/guides/deployment/branching
- **Migrations Guide:** https://supabase.com/docs/guides/deployment/database-migrations
- **Edge Functions Guide:** https://supabase.com/docs/guides/functions
- **Database Webhooks:** https://supabase.com/docs/guides/database/webhooks

### Integration Development
- **Build Integration Guide:** https://supabase.com/docs/guides/integrations/build-a-supabase-integration
- **OAuth Scopes:** https://supabase.com/docs/guides/integrations/build-a-supabase-integration/oauth-scopes
- **Marketplace:** https://supabase.com/docs/guides/integrations/supabase-marketplace

### CLI Reference
- **Branches CLI:** https://supabase.com/docs/reference/cli/supabase-branches
- **Migrations CLI:** https://supabase.com/docs/reference/cli/supabase-migration
- **Functions CLI:** https://supabase.com/docs/reference/cli/supabase-functions

### Community Libraries
- **supabase-management-js:** https://github.com/supabase-community/supabase-management-js
- **supabase-management-rs:** https://github.com/tembo-io/supabase-management-rs
- **postgres-meta:** https://github.com/supabase/postgres-meta

---

## Conclusion

This consolidated reference provides a complete overview of the Supabase Management API, including:

- **93 documented endpoints** from official OpenAPI specs
- **56 tested endpoints** with real-world results
- **17 confirmed working endpoints** (30% success rate)
- **SQL alternatives** for missing REST endpoints (~60% effective coverage)

### Key Takeaways

1. **Database Query Endpoint is Game-Changing:** The `/database/query` endpoint enables implementing most database features via SQL
2. **Limited REST Coverage:** Only ~30% of endpoints work with standard access tokens
3. **OAuth Partner Benefits:** Many advanced features require OAuth partner status
4. **SQL is Powerful:** Can implement 60%+ of desired functionality via SQL queries
5. **Focus on Working Endpoints:** Build CLI around confirmed working endpoints
6. **Test Before Implementing:** Many documented endpoints return 404

### Recommended Strategy

1. **Implement `db:query` command first** - Enables all SQL-based features
2. **Refactor existing database commands** - Use SQL queries instead of REST endpoints
3. **Add new commands for working endpoints** - Types, organizations, upgrade check
4. **Test write operations** - Backup, security, functions, storage
5. **Remove unsupported commands** - Replicas, schedules
6. **Document limitations** - Clear communication about what works

---

**Document Version:** 1.0
**Last Updated:** October 29, 2025
**Maintained By:** Coastal Programs
**License:** MIT
