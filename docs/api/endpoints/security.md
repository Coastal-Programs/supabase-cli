# Security & Network API

Endpoints for network restrictions, security audits, and network ban management.

---

## Network Restrictions

### List Network Restrictions

**Endpoint:** `GET /v1/projects/{ref}/network-restrictions`
**Status:** ✅ Works (200 OK) (Beta)
**CLI Command:** `security:restrictions:list`

Get current network restrictions configuration.

**Request:**
```bash
curl -X GET 'https://api.supabase.com/v1/projects/ygzhmowennlaehudyyey/network-restrictions' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Response:**
```json
{
  "entitlement": "allowed",
  "config": {
    "dbAllowedCidrs": ["0.0.0.0/0"],
    "dbAllowedCidrsV6": ["::/0"]
  }
}
```

**Response Fields:**
- `entitlement` - Whether feature is allowed for plan ("allowed", "disallowed")
- `config.dbAllowedCidrs` - IPv4 CIDR blocks (default: "0.0.0.0/0" = all)
- `config.dbAllowedCidrsV6` - IPv6 CIDR blocks (default: "::/0" = all)

**Important Limitation:**
Network restrictions only apply to:
- Direct Postgres database connections
- Connection pooler (PgBouncer/Supavisor)

**DO NOT apply to:**
- PostgREST API (HTTP/HTTPS)
- Storage API
- Auth API
- Realtime API
- Supabase client libraries (supabase-js, etc.)

---

### Apply Network Restrictions

**Endpoint:** `POST /v1/projects/{ref}/network-restrictions/apply`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** `security:restrictions:add`, `security:restrictions:remove`

**IMPORTANT:** This endpoint **REPLACES ALL** existing restrictions. It does not add incrementally.

**Request:**
```json
{
  "dbAllowedCidrs": [
    "192.168.1.0/24",
    "10.0.0.0/8"
  ]
}
```

**Implementation Note for CLI:**
To add a single CIDR:
1. GET current restrictions
2. Merge new CIDR with existing list
3. POST complete list

To remove a CIDR:
1. GET current restrictions
2. Filter out CIDR to remove
3. POST remaining list

---

### Update Network Restrictions

**Endpoint:** `PATCH /v1/projects/{ref}/network-restrictions`
**Status:** 🔍 Not Tested (Alpha)
**CLI Command:** Not implemented

**Note:** Endpoint marked as Alpha, behavior may differ from `apply`.

---

## Network Bans

### Get Network Bans

**Endpoint:** `POST /v1/projects/{ref}/network-bans/retrieve`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** `security:bans:list`

Retrieve list of banned IP addresses.

**Request:**
```json
{}
```

**Expected Response:**
```json
{
  "bans": [
    {
      "ip": "1.2.3.4",
      "reason": "Suspicious activity",
      "banned_at": "2025-10-29T00:00:00Z"
    }
  ]
}
```

---

### Get Enriched Network Bans

**Endpoint:** `POST /v1/projects/{ref}/network-bans/retrieve/enriched`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** Not implemented

Retrieve network bans with additional context (geolocation, ISP, etc.).

---

### Remove Network Bans

**Endpoint:** `DELETE /v1/projects/{ref}/network-bans`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** `security:bans:remove`

Remove one or more IP addresses from ban list.

**Request:**
```json
{
  "ips": ["1.2.3.4", "5.6.7.8"]
}
```

---

## Security Advisors

### Run Security Audit

**Endpoint:** `GET /v1/projects/{ref}/advisors/security`
**Status:** ✅ Works (200 OK) (Experimental)
**CLI Command:** `security:audit`

Get security audit results with findings and recommendations.

**Request:**
```bash
curl -X GET 'https://api.supabase.com/v1/projects/ygzhmowennlaehudyyey/advisors/security' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Response:**
```json
{
  "lints": [
    {
      "level": "WARN",
      "title": "RLS not enabled on public tables",
      "description": "Tables in the public schema do not have row-level security enabled",
      "remediation": "Enable RLS: ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;",
      "categories": ["security", "database"],
      "metadata": {
        "tables": ["users", "posts"]
      }
    }
  ]
}
```

**Lint Levels:**
- `CRITICAL` - Immediate action required (red)
- `ERROR` - High priority issue (red)
- `WARN` - Warning (yellow)
- `INFO` - Informational (blue)

**Common Security Findings:**
- RLS not enabled on tables
- Weak policies allowing unauthorized access
- Exposed service role key in client code
- Missing unique constraints on auth columns
- Overly permissive database roles
- Weak password policies
- Missing MFA enforcement

**Warning:** This endpoint is **EXPERIMENTAL** and may change or be removed.

---

## Performance Advisors

### Get Performance Advisors

**Endpoint:** `GET /v1/projects/{ref}/advisors/performance`
**Status:** 🔍 Not Tested (Experimental)
**CLI Command:** `monitoring:performance`

Get performance optimization recommendations.

**Expected Response:**
```json
{
  "lints": [
    {
      "level": "WARN",
      "title": "Missing index on frequently queried column",
      "description": "Table 'users' column 'email' is frequently queried but not indexed",
      "remediation": "CREATE INDEX idx_users_email ON users(email);",
      "categories": ["performance", "database"],
      "metadata": {
        "table": "users",
        "column": "email",
        "query_count": 1000
      }
    }
  ]
}
```

**Common Performance Findings:**
- Missing indexes on frequently queried columns
- N+1 query patterns
- Slow queries needing optimization
- Tables needing VACUUM/ANALYZE
- Connection pool exhaustion
- Inefficient RLS policies

**Warning:** This endpoint is **EXPERIMENTAL** and may change or be removed.

---

## RLS Policies (SQL Only)

### List RLS Policies

**Endpoint:** ❌ `GET /v1/projects/{ref}/policies` (404)
**Status:** Not available via REST API
**CLI Command:** `security:policies:list`

**Alternative:** Use SQL query via `database/query` endpoint:

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

**CLI Implementation:** Already uses SQL query.

---

### Check RLS Status

**SQL Query via `database/query`:**

```sql
SELECT
  schemaname as schema,
  tablename as table,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename;
```

---

### Find Tables Without RLS

**SQL Query via `database/query`:**

```sql
SELECT
  schemaname as schema,
  tablename as table,
  tableowner as owner
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;
```

---

## Summary

### Working Endpoints (2)
- ✅ `GET /v1/projects/{ref}/network-restrictions` - List restrictions
- ✅ `GET /v1/projects/{ref}/advisors/security` - Security audit (Experimental)

### Not Tested (6)
- 🔍 `POST /v1/projects/{ref}/network-restrictions/apply` - Apply restrictions
- 🔍 `PATCH /v1/projects/{ref}/network-restrictions` - Update restrictions (Alpha)
- 🔍 `POST /v1/projects/{ref}/network-bans/retrieve` - List bans (Beta)
- 🔍 `POST /v1/projects/{ref}/network-bans/retrieve/enriched` - Enriched bans (Beta)
- 🔍 `DELETE /v1/projects/{ref}/network-bans` - Remove bans (Beta)
- 🔍 `GET /v1/projects/{ref}/advisors/performance` - Performance audit (Experimental)

### Not Available (1)
- ❌ `GET /v1/projects/{ref}/policies` - Use SQL instead

### Recommended Implementation

1. ✅ **Keep existing commands:**
   - `security:restrictions:list` (working)
   - `security:audit` (working, add experimental warning)

2. 🔍 **Test and implement:**
   - `security:restrictions:add` (verify GET→merge→POST logic)
   - `security:restrictions:remove` (verify GET→filter→POST logic)

3. 🔍 **Implement network bans (Beta):**
   - `security:bans:list`
   - `security:bans:remove`

4. 🔍 **Implement performance advisors (Experimental):**
   - `monitoring:performance`

5. ✅ **Keep SQL-based policy commands:**
   - `security:policies:list` (already uses SQL)

6. ➕ **Add new SQL-based commands:**
   - `security:rls:status` - Check which tables have RLS
   - `security:rls:check` - Find tables without RLS

### Important Notes

**Network Restrictions Limitations:**
Must clearly document that restrictions only apply to Postgres connections, NOT to HTTP APIs.

**Experimental Endpoints:**
Add warnings that security and performance advisors are experimental:
```typescript
this.warning('⚠️  EXPERIMENTAL: This API may change or be removed without notice')
```

**Beta Features:**
Network bans and some network restriction operations are in Beta.

**REPLACE Behavior:**
Network restrictions `apply` endpoint replaces ALL restrictions, not incremental add.
