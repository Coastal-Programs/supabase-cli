# Database API

Endpoints for database operations, queries, configuration, and replicas.

---

## 🎯 SQL Query Endpoint (Game Changer!)

### Execute SQL Query

**Endpoint:** `POST /v1/projects/{ref}/database/query`
**Status:** ✅ Works (201 Created)
**CLI Commands:** `db:query`, `db:extensions`, `db:schema`, `security:policies:list`

**This is the most important endpoint!** It allows executing arbitrary SQL queries, enabling features that don't have dedicated REST endpoints.

**Request:**
```bash
curl -X POST 'https://api.supabase.com/v1/projects/ygzhmowennlaehudyyey/database/query' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT version();"}'
```

**Response:**
```json
[
  {
    "version": "PostgreSQL 17.6 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 13.2.0, 64-bit"
  }
]
```

**Response Type:** Array of objects, each row is an object with column names as keys.

---

## SQL Queries for Missing Features

Since many REST endpoints don't exist, use SQL queries instead:

### List Extensions

**REST Endpoint:** ❌ `GET /v1/projects/{ref}/database/extensions` (404)
**SQL Alternative:** ✅ Works

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

**CLI Command:** `db:extensions`

---

### List Tables

**REST Endpoint:** ❌ `GET /v1/projects/{ref}/database/tables` (404)
**SQL Alternative:** ✅ Works

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

**CLI Command:** `db:tables` (not implemented yet)

---

### Get Schema Information

**REST Endpoint:** ❌ `GET /v1/projects/{ref}/database/schemas` (404)
**SQL Alternative:** ✅ Works

```sql
SELECT
  table_schema as schema,
  table_name as name,
  table_type as type,
  is_insertable_into,
  is_typed
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name;
```

**CLI Command:** `db:schema`

---

### List RLS Policies

**REST Endpoint:** ❌ `GET /v1/projects/{ref}/database/policies` (404)
**SQL Alternative:** ✅ Works

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

**CLI Command:** `security:policies:list`

---

### List Database Roles

**REST Endpoint:** ❌ `GET /v1/projects/{ref}/database/roles` (404)
**SQL Alternative:** ✅ Works

```sql
SELECT
  rolname as name,
  rolsuper as is_superuser,
  rolinherit as inherit,
  rolcreaterole as can_create_role,
  rolcreatedb as can_create_db,
  rolcanlogin as can_login,
  rolreplication as replication,
  rolconnlimit as connection_limit,
  rolvaliduntil as valid_until
FROM pg_roles
WHERE rolname NOT LIKE 'pg_%'
  AND rolname NOT LIKE 'supabase_%'
ORDER BY rolname;
```

**CLI Command:** `db:roles` (not implemented yet)

---

### List Database Functions

**REST Endpoint:** ❌ Not available
**SQL Alternative:** ✅ Works

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
  END as kind,
  CASE p.provolatile
    WHEN 'i' THEN 'immutable'
    WHEN 's' THEN 'stable'
    WHEN 'v' THEN 'volatile'
  END as volatility,
  p.prosecdef as security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, p.proname;
```

**CLI Command:** `db:functions` (not implemented yet)

---

### List Database Views

**REST Endpoint:** ❌ Not available
**SQL Alternative:** ✅ Works

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

**CLI Command:** `db:views` (not implemented yet)

---

### Database Size Statistics

**REST Endpoint:** ❌ Not available
**SQL Alternative:** ✅ Works

```sql
SELECT
  pg_size_pretty(pg_database_size(current_database())) as database_size,
  pg_size_pretty(sum(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename)))::bigint) as tables_size,
  count(*) as table_count
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema');
```

**CLI Command:** `db:size` (not implemented yet)

---

### Active Database Connections

**REST Endpoint:** ❌ `GET /v1/projects/{ref}/pool` (404)
**SQL Alternative:** ✅ Works

```sql
SELECT
  pid,
  datname as database,
  usename as user,
  application_name,
  client_addr,
  client_hostname,
  backend_start,
  state,
  wait_event_type,
  wait_event,
  query_start,
  state_change,
  left(query, 100) as query_preview
FROM pg_stat_activity
WHERE datname = current_database()
  AND pid != pg_backend_pid()
ORDER BY query_start DESC;
```

**CLI Command:** `db:connections` (not implemented yet)

---

### Database Configuration

**REST Endpoint:** ❌ `GET /v1/projects/{ref}/config/postgres` (404)
**SQL Alternative:** ✅ Works

```sql
SELECT
  name,
  setting,
  unit,
  category,
  short_desc as description,
  context,
  vartype as type,
  source,
  min_val as min,
  max_val as max,
  boot_val as default_value,
  reset_val as reset_value
FROM pg_settings
WHERE name NOT LIKE 'pg_stat%'
ORDER BY category, name;
```

**CLI Command:** `db:config:get` (not implemented yet)

---

## Read Replicas

### List Read Replicas

**Endpoint:** `GET /v1/projects/{ref}/read-replicas`
**Status:** ❌ Not Found (404)
**CLI Command:** Not available

**Finding:** No REST endpoint exists for listing replicas despite documentation.

**Alternative:** Check readonly status (may contain replica info)

---

### Create Read Replica

**Endpoint:** `POST /v1/projects/{ref}/read-replicas/setup`
**Status:** ❌ Not Found (404) (Beta)
**CLI Command:** Not available

**Finding:** Endpoint documented as Beta but doesn't exist in testing.

---

### Delete Read Replica

**Endpoint:** `POST /v1/projects/{ref}/read-replicas/remove`
**Status:** ❌ Not Found (404) (Beta)
**CLI Command:** Not available

**Finding:** Endpoint documented as Beta but doesn't exist in testing.

**Recommendation:** Remove `db:replicas:*` commands from CLI.

---

## Database Configuration

### Get PgBouncer Config

**Endpoint:** `GET /v1/projects/{ref}/config/database/pgbouncer`
**Status:** ❌ Not Found (404)
**CLI Command:** Not available

Use SQL query alternative: `SELECT * FROM pg_settings WHERE name LIKE '%pgbouncer%';`

---

### Get Supavisor Config

**Endpoint:** `GET /v1/projects/{ref}/config/database/pooler`
**Status:** ❌ Not Found (404)
**CLI Command:** Not available

---

### Update Supavisor Config

**Endpoint:** `PATCH /v1/projects/{ref}/config/database/pooler`
**Status:** ❌ Not Found (404)
**CLI Command:** Not available

---

### Get Postgres Config

**Endpoint:** `GET /v1/projects/{ref}/config/database/postgres`
**Status:** ❌ Not Found (404)
**CLI Command:** Not available

Use SQL query alternative (see above).

---

### Update Postgres Config

**Endpoint:** `PUT /v1/projects/{ref}/config/database/postgres`
**Status:** ❌ Not Found (404)
**CLI Command:** `db:config:set` (needs removal or refactoring)

**Recommendation:** Remove this command or convert to SQL-based configuration where possible.

---

## Database Context

### Get Database Metadata

**Endpoint:** `GET /v1/projects/{ref}/database/context`
**Status:** ❌ Not Found (404)
**CLI Command:** Not available

Use SQL queries for database metadata.

---

## SSL Enforcement

### Get SSL Enforcement

**Endpoint:** `GET /v1/projects/{ref}/ssl-enforcement`
**Status:** ✅ Works (200 OK) (Beta)
**CLI Command:** `config:ssl:get`

**Request:**
```bash
curl -X GET 'https://api.supabase.com/v1/projects/ygzhmowennlaehudyyey/ssl-enforcement' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Response:**
```json
{
  "currentConfig": {
    "database": false
  },
  "appliedSuccessfully": true
}
```

---

### Update SSL Enforcement

**Endpoint:** `PUT /v1/projects/{ref}/ssl-enforcement`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** `config:ssl:set`

**Expected Request:**
```json
{
  "database": true
}
```

---

## Database Webhooks

### Enable Database Webhooks

**Endpoint:** `POST /v1/projects/{ref}/database/webhooks/enable`
**Status:** ❌ Not Found (404) (Beta)
**CLI Command:** Not available

---

## Readonly Mode

### Get Readonly Status

**Endpoint:** `GET /v1/projects/{ref}/readonly`
**Status:** ✅ Works (200 OK)
**CLI Command:** `monitoring:readonly`

Check if project is in readonly mode.

**Request:**
```bash
curl -X GET 'https://api.supabase.com/v1/projects/ygzhmowennlaehudyyey/readonly' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Response:**
```json
{
  "enabled": false,
  "override_enabled": false,
  "override_active_until": "1970-01-01 00:00:00+00"
}
```

**Fields:**
- `enabled` - Whether readonly mode is active
- `override_enabled` - Whether override is active
- `override_active_until` - When override expires

---

### Temporarily Disable Readonly

**Endpoint:** `POST /v1/projects/{ref}/readonly/temporary-disable`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Temporarily disable readonly mode for 15 minutes.

---

## Summary

### Working Endpoints (2)
- ✅ `POST /v1/projects/{ref}/database/query` - Execute SQL (CRITICAL)
- ✅ `GET /v1/projects/{ref}/readonly` - Readonly status
- ✅ `GET /v1/projects/{ref}/ssl-enforcement` - SSL config

### Not Found (10+)
- ❌ All read replica endpoints
- ❌ Database extensions, tables, schemas, policies (use SQL)
- ❌ Database roles (use SQL)
- ❌ Pooler configuration
- ❌ Postgres configuration endpoints
- ❌ Database webhooks

### Recommended Implementation

1. ✅ **Implement `db:query` command** (highest priority)
   - Allows arbitrary SQL execution
   - Enables all missing database features

2. 🔄 **Refactor existing commands to use SQL:**
   - `db:extensions` → SQL query
   - `db:schema` → SQL query
   - `security:policies:list` → SQL query

3. ➕ **Add new SQL-based commands:**
   - `db:tables` → SQL query
   - `db:views` → SQL query
   - `db:functions` → SQL query
   - `db:roles` → SQL query
   - `db:connections` → SQL query
   - `db:size` → SQL query

4. ❌ **Remove non-functional commands:**
   - `db:replicas:*` → No API support
   - `db:config:set` → No API support (or convert to SQL)

5. 📚 **Create SQL query library:**
   - Reusable SQL queries for common operations
   - Query validation and sanitization
   - Result formatting utilities
