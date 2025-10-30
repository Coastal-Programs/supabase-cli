# Supabase Management API Documentation

This directory contains the consolidated and authoritative API reference for the Supabase Management API.

## Quick Links

- **[CONSOLIDATED_API_REFERENCE.md](./CONSOLIDATED_API_REFERENCE.md)** - Complete master reference (SINGLE SOURCE OF TRUTH)

## What's Inside

The consolidated reference document contains:

- **Complete endpoint catalog** - All 93 endpoints from official OpenAPI specs
- **Testing results** - 56 endpoints tested with real-world results
- **Working endpoints** - 17 confirmed working endpoints (30% success rate)
- **SQL alternatives** - Ready-to-use SQL queries for missing REST endpoints
- **Code examples** - cURL and TypeScript examples for all operations
- **Implementation notes** - What to build, what to refactor, what to remove
- **Error handling** - Complete error codes and handling strategies

## Quick Stats

```
Total Documented Endpoints:  93
Total Tested Endpoints:      56
Working Endpoints:           17 (30%)
Not Found (404):             37 (66%)
Bad Request (400):            2 (4%)
```

## Critical Discovery

🎯 **`POST /v1/projects/{ref}/database/query`** - Works! (201 Created)

This endpoint allows executing arbitrary SQL queries, enabling ~60% effective coverage despite limited REST API availability.

## Organization

The consolidated reference is organized by CLI command structure:

1. **Projects & Organizations** - Project management, orgs, regions
2. **Auth** - JWT, providers, SSO, third-party auth
3. **Database** - Query execution, schema, extensions, replicas, config
4. **Functions** - Edge Functions deployment and management
5. **Security** - Network restrictions, policies, audit
6. **Branches** - Preview environments
7. **Backups & Recovery** - Backup management and PITR
8. **Migrations** - Database migrations
9. **Storage & Buckets** - File storage management
10. **Integrations & Webhooks** - Third-party integrations
11. **Logs & Monitoring** - Health checks, analytics, logs
12. **SQL Alternatives** - Ready-to-use SQL queries

## Quick Reference Tables

### Endpoint Status Legend

- ✅ **Tested - Works** - Confirmed working with real API calls
- ⚠️ **Not Tested** - Documented but not tested (may work)
- ❌ **Not Found (404)** - Endpoint does not exist
- 🎯 **Game Changer** - Critical discovery

### Coverage by Category

| Category | Working | Total | Coverage | SQL Alternative |
|----------|---------|-------|----------|----------------|
| Core Management | 3 | 3 | 100% | - |
| Branches | 1 | 10 | 10% | - |
| Security | 3 | 8 | 38% | Yes (policies) |
| Functions | 1 | 8 | 13% | - |
| Backups | 1 | 8 | 13% | - |
| Storage | 1 | 15 | 7% | - |
| Database | 1 | 30+ | 3% | Yes (most ops) |
| **TOTAL** | **17** | **~100** | **~17%** | **~60% effective** |

## Implementation Priorities

### Priority 1: Implement Now

1. ✅ `db:query` - Execute SQL queries
2. ✅ `types:generate` - Generate TypeScript types
3. ✅ `organizations:list` - List organizations
4. ✅ `upgrade:check` - Check upgrade eligibility
5. ✅ `config:auth:get` - Get auth config
6. ✅ `storage:buckets:list` - List storage buckets

### Priority 2: Refactor to Use SQL

1. 🔄 `db:extensions` - Refactor to use SQL query
2. 🔄 `db:schema` - Refactor to use SQL query
3. 🔄 `security:policies:list` - Refactor to use SQL query

### Priority 3: Remove (No API Support)

1. ❌ `db:replicas:*` - Remove all replica commands
2. ❌ `backup:schedule:*` - Remove all schedule commands

### Priority 4: Test Write Operations

1. 🔍 `backup:create` - Test POST endpoint
2. 🔍 `security:restrictions:add` - Test POST endpoint
3. 🔍 `functions:deploy` - Test POST endpoint

## SQL Alternatives Quick Reference

Since `POST /v1/projects/{ref}/database/query` works, here are the most common SQL queries:

### Extensions
```sql
SELECT extname, extversion, nspname as schema
FROM pg_extension e
LEFT JOIN pg_namespace n ON n.oid = e.extnamespace
ORDER BY extname;
```

### Tables
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

**See full SQL reference in the [consolidated document](./CONSOLIDATED_API_REFERENCE.md#sql-alternatives).**

## Source Documents Consolidated

This master reference consolidates information from:

1. `SUPABASE_API_DOCUMENTATION_REPORT.md` - Official OpenAPI specs (93 endpoints)
2. `docs/SUPABASE_MANAGEMENT_API_CORE_ENDPOINTS.md` - Core endpoints documentation
3. `docs/SUPABASE_MANAGEMENT_API_REFERENCE.md` - Database, functions, storage endpoints
4. `docs/ADVANCED_API_FEATURES.md` - Branches, migrations, integrations, webhooks
5. `SUPABASE_API_TEST_REPORT.md` - Detailed test results with examples
6. `API_TEST_SUMMARY.md` - Quick test summary
7. `API_ENDPOINT_MATRIX.md` - Visual endpoint matrix

**All duplicates removed. All information preserved. Single source of truth established.**

## Resources

### Official Documentation
- **Management API Reference:** https://supabase.com/docs/reference/api/introduction
- **Interactive API Explorer:** https://api.supabase.com/api/v1
- **OpenAPI Spec (Download):** https://raw.githubusercontent.com/supabase/supabase/master/apps/docs/spec/api_v1_openapi.json

### Community Libraries
- **supabase-management-js:** https://github.com/supabase-community/supabase-management-js
- **postgres-meta:** https://github.com/supabase/postgres-meta

### Guides
- **Build an Integration:** https://supabase.com/docs/guides/integrations/build-a-supabase-integration
- **Database Branching:** https://supabase.com/docs/guides/deployment/branching
- **Edge Functions:** https://supabase.com/docs/guides/functions

## Maintenance

This documentation should be updated when:

1. New Management API endpoints are discovered
2. API testing reveals changes in endpoint availability
3. OpenAPI specifications are updated
4. CLI commands are added/removed/refactored
5. SQL alternatives are discovered or improved

**Last Updated:** October 29, 2025
**Maintained By:** Coastal Programs
**Version:** 1.0

---

For the complete reference, see **[CONSOLIDATED_API_REFERENCE.md](./CONSOLIDATED_API_REFERENCE.md)**.
