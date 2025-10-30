# Supabase Management API - Quick Reference Card

**Base URL:** `https://api.supabase.com/v1`
**Auth Header:** `Authorization: Bearer <access_token>`
**Rate Limit:** 60 requests/minute

---

## 🎯 Most Important Endpoint

### Execute SQL Query (GAME CHANGER)

```bash
POST /v1/projects/{ref}/database/query

{
  "query": "SELECT version();",
  "read_only": false
}
```

**Status:** ✅ Works (201 Created)
**Why:** Enables implementing most database features via SQL

---

## ✅ Confirmed Working Endpoints (17)

### Core Management (3)

```bash
GET /v1/projects                    # List all projects
GET /v1/projects/{ref}              # Get project details
GET /v1/organizations               # List organizations
```

### Database (1)

```bash
POST /v1/projects/{ref}/database/query    # Execute SQL (CRITICAL)
```

### Security (3)

```bash
GET /v1/projects/{ref}/network-restrictions    # List restrictions
GET /v1/projects/{ref}/advisors/security       # Security audit
GET /v1/projects/{ref}/ssl-enforcement         # SSL settings
```

### Functions (1)

```bash
GET /v1/projects/{ref}/functions    # List Edge Functions
```

### Branches (1)

```bash
GET /v1/projects/{ref}/branches     # List preview branches
```

### Backups (1)

```bash
GET /v1/projects/{ref}/database/backups    # List backups
```

### Configuration (5)

```bash
GET /v1/projects/{ref}/secrets          # List secrets
GET /v1/projects/{ref}/api-keys         # Get API keys (anon, service_role)
GET /v1/projects/{ref}/config/auth      # Auth configuration
GET /v1/projects/{ref}/readonly         # Readonly status
GET /v1/projects/{ref}/storage/buckets  # List storage buckets
```

### Utilities (2)

```bash
GET /v1/projects/{ref}/upgrade/eligibility    # Check upgrade eligibility
GET /v1/projects/{ref}/types/typescript       # Generate TypeScript types
```

---

## 🔍 Common SQL Queries

### Database Extensions

```sql
SELECT extname, extversion, nspname as schema
FROM pg_extension e
LEFT JOIN pg_namespace n ON n.oid = e.extnamespace
ORDER BY extname;
```

### Database Tables

```sql
SELECT schemaname, tablename, tableowner
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename;
```

### RLS Policies

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
ORDER BY schemaname, tablename, policyname;
```

### Database Size

```sql
SELECT pg_size_pretty(pg_database_size(current_database())) as size;
```

### Active Connections

```sql
SELECT datname, usename, application_name, client_addr, state
FROM pg_stat_activity
WHERE datname = current_database()
ORDER BY query_start DESC;
```

### Database Roles

```sql
SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin
FROM pg_roles
WHERE rolname NOT LIKE 'pg_%'
ORDER BY rolname;
```

### Table Indexes

```sql
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename;
```

---

## ❌ Endpoints That Don't Exist (404)

### Database Operations (9)

```
/v1/projects/{ref}/database/extensions
/v1/projects/{ref}/database/tables
/v1/projects/{ref}/database/schemas
/v1/projects/{ref}/database/policies
/v1/projects/{ref}/database/roles
/v1/projects/{ref}/database/pooler
/v1/projects/{ref}/database/password
/v1/projects/{ref}/database/webhooks
/v1/projects/{ref}/database
```

**Alternative:** Use `database/query` with SQL

### Read Replicas (1)

```
/v1/projects/{ref}/read-replicas
```

**Alternative:** None available

### Backup Schedules (1)

```
/v1/projects/{ref}/database/backups/schedules
```

**Alternative:** None available

### Analytics & Logs (7)

```
/v1/projects/{ref}/analytics
/v1/projects/{ref}/usage
/v1/projects/{ref}/quotas
/v1/projects/{ref}/logs
/v1/projects/{ref}/functions/logs
/v1/projects/{ref}/metrics
/v1/projects/{ref}/pool
```

**Alternative:** Use Dashboard

---

## ⚠️ Not Tested (May Work)

### Write Operations

```bash
POST   /v1/projects/{ref}/database/backups              # Create backup
POST   /v1/projects/{ref}/network-restrictions/apply    # Apply restrictions
POST   /v1/projects/{ref}/functions/deploy              # Deploy function
POST   /v1/projects/{ref}/branches                      # Create branch
DELETE /v1/projects/{ref}                               # Delete project (DESTRUCTIVE)
DELETE /v1/projects/{ref}/functions/{slug}              # Delete function
```

### Configuration

```bash
PATCH /v1/projects/{ref}/config/auth          # Update auth config
PUT   /v1/projects/{ref}/ssl-enforcement      # Update SSL config
PATCH /v1/projects/{ref}/config/storage       # Update storage config
```

### Branch Operations

```bash
POST   /v1/branches/{id}/merge    # Merge branch
POST   /v1/branches/{id}/push     # Push branch
POST   /v1/branches/{id}/reset    # Reset branch (DESTRUCTIVE)
DELETE /v1/branches/{id}          # Delete branch (DESTRUCTIVE)
```

---

## 📊 Coverage Summary

```
Total Documented:  93 endpoints
Total Tested:      56 endpoints
Working:           17 endpoints (30%)
Not Found:         37 endpoints (66%)
Bad Request:        2 endpoints (4%)

Effective Coverage (with SQL): ~60%
```

---

## 🚀 Quick Start

### List All Projects

```bash
curl -X GET "https://api.supabase.com/v1/projects" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

### Execute SQL Query

```bash
curl -X POST "https://api.supabase.com/v1/projects/abc123/database/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT * FROM pg_extension ORDER BY extname;"
  }'
```

### Generate TypeScript Types

```bash
curl "https://api.supabase.com/v1/projects/abc123/types/typescript" \
  -H "Authorization: Bearer $TOKEN"
```

### List Edge Functions

```bash
curl "https://api.supabase.com/v1/projects/abc123/functions" \
  -H "Authorization: Bearer $TOKEN"
```

### Security Audit

```bash
curl "https://api.supabase.com/v1/projects/abc123/advisors/security" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔑 Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 204 | No Content | Success with no body |
| 400 | Bad Request | Check parameters |
| 401 | Unauthorized | Check auth token |
| 403 | Forbidden | Check permissions/scopes |
| 404 | Not Found | Endpoint doesn't exist |
| 429 | Too Many Requests | Wait 60s, retry |
| 500 | Server Error | Retry with backoff |

---

## 📚 Full Reference

For complete documentation, see:
- **[CONSOLIDATED_API_REFERENCE.md](./CONSOLIDATED_API_REFERENCE.md)** - Master reference
- **[INDEX.md](./INDEX.md)** - Quick navigation

---

**Last Updated:** October 29, 2025
**Version:** 1.0
