# Supabase Management API Documentation

**Version:** v1
**Base URL:** `https://api.supabase.com/v1`
**Last Updated:** October 29, 2025

---

## Overview

The Supabase Management API provides programmatic access to manage Supabase projects, databases, authentication, storage, functions, and more. This documentation is organized by feature category and includes real test results showing which endpoints work.

**Key Findings:**
- Total Endpoints Tested: 56
- Working Endpoints: 17 (30%)
- Missing Endpoints: 37 (66%)
- Critical Discovery: SQL query endpoint enables 60%+ functionality

---

## Quick Start

### Authentication

All Management API requests require a Personal Access Token (PAT):

```bash
# Generate token at: https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your_token_here"

# Make authenticated request
curl -X GET 'https://api.supabase.com/v1/projects' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

### Rate Limits

- **Limit:** 60 requests per minute per user
- **Response:** HTTP 429 when exceeded
- **Applies to:** All requests with personal access tokens

### Response Format

All endpoints return JSON responses:

```json
{
  "id": "project-ref",
  "name": "My Project",
  "status": "ACTIVE_HEALTHY"
}
```

---

## API Categories

Navigate to detailed endpoint documentation:

### Core Management
- [Projects](./endpoints/projects.md) - Project lifecycle, organizations, upgrades
- [Organizations](./endpoints/projects.md#organizations) - Organization management

### Database Operations
- [Database](./endpoints/database.md) - Queries, config, replicas
- [Migrations](./endpoints/migrations.md) - Schema migrations

### Authentication & Security
- [Auth](./endpoints/auth.md) - JWT, SSO, providers
- [Security](./endpoints/security.md) - Network restrictions, audit, policies

### Storage & Assets
- [Storage](./endpoints/storage.md) - Buckets, file management

### Functions & Compute
- [Functions](./endpoints/functions.md) - Edge Functions deployment

### Backup & Recovery
- [Backups](./endpoints/backups.md) - Backup management, PITR

### Branching & Environments
- [Branches](./endpoints/branches.md) - Preview branches, environments

### Monitoring & Analytics
- [Monitoring](./endpoints/monitoring.md) - Health, metrics, logs
- [Logs](./endpoints/logs.md) - Log querying and analysis

### Integrations
- [Integrations](./endpoints/integrations.md) - Third-party integrations, webhooks

---

## Endpoint Status Summary

See [ENDPOINT_STATUS.md](./ENDPOINT_STATUS.md) for complete test results.

**Quick Stats:**
- ✅ **Working (17):** Projects, backups, security, functions, branches, config
- ❌ **Not Found (37):** Replicas, schedules, some config endpoints
- ⚠️ **Needs Work (2):** Health check, custom domains
- 🎯 **Game Changer:** SQL query endpoint enables missing features

---

## Critical Discovery: SQL Query Endpoint

**Endpoint:** `POST /v1/projects/{ref}/database/query`
**Status:** ✅ Works (201 Created)

This endpoint allows executing arbitrary SQL queries, which enables implementing features that don't have REST endpoints:

```json
POST /v1/projects/{ref}/database/query
{
  "query": "SELECT * FROM pg_extension ORDER BY extname;"
}
```

**What You Can Do:**
- List database extensions
- Query schema information
- Get table lists and structures
- View RLS policies
- Check database roles
- Monitor connections
- Get database statistics

See [Database Documentation](./endpoints/database.md) for SQL query examples.

---

## CLI Command Mapping

This API documentation corresponds to CLI commands:

| CLI Command | API Endpoint | Status |
|-------------|--------------|--------|
| `projects:list` | `GET /v1/projects` | ✅ Works |
| `backup:list` | `GET /v1/projects/{ref}/database/backups` | ✅ Works |
| `db:query` | `POST /v1/projects/{ref}/database/query` | ✅ Works |
| `security:restrictions:list` | `GET /v1/projects/{ref}/network-restrictions` | ✅ Works |
| `security:audit` | `GET /v1/projects/{ref}/advisors/security` | ✅ Works |
| `functions:list` | `GET /v1/projects/{ref}/functions` | ✅ Works |
| `branches:list` | `GET /v1/projects/{ref}/branches` | ✅ Works |
| `db:replicas:*` | N/A | ❌ No API support |
| `backup:schedule:*` | N/A | ❌ No API support |

---

## Error Handling

### Common Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Missing required parameters, invalid input |
| 401 | Unauthorized | Invalid or missing access token |
| 403 | Forbidden | Plan tier restriction, insufficient permissions |
| 404 | Not Found | Endpoint or resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded (60/min) |
| 500 | Internal Server Error | API error, retry with backoff |

### Example Error Response

```json
{
  "message": "Project not found",
  "code": "PROJECT_NOT_FOUND"
}
```

---

## Plan Tier Requirements

Some endpoints require specific plan tiers:

| Feature | Free | Pro | Team | Enterprise |
|---------|------|-----|------|------------|
| List Projects | ✅ | ✅ | ✅ | ✅ |
| Backups | ❌ | ✅ | ✅ | ✅ |
| PITR | ❌ | ✅* | ✅ | ✅ |
| Network Restrictions | ❌ | ✅ | ✅ | ✅ |
| Read Replicas | ❌ | ✅ | ✅ | ✅ |
| Security Audit | ❌ | ✅ | ✅ | ✅ |

*PITR requires Pro plan + Small compute or larger

---

## Experimental & Beta Features

Many endpoints are marked as experimental or beta:

### Experimental (Subject to Removal)
- Security advisors
- Performance advisors
- Log querying

### Beta (Subject to Changes)
- Read replicas (no actual endpoints found)
- Network restrictions (some operations)
- Database migrations

**Recommendation:** Use with caution in production, monitor for API changes.

---

## API Limitations

### What's NOT Available via REST API

1. **Database Extensions** - Use SQL query instead
2. **Schema Information** - Use SQL query instead
3. **RLS Policies** - Use SQL query instead
4. **Read Replicas** - No endpoints found (despite documentation)
5. **Backup Schedules** - Plan-based, not configurable via API
6. **Manual Backup Creation** - Automatic backups only

### Workarounds

**Database Metadata:** Use `POST /v1/projects/{ref}/database/query` with SQL:
```sql
-- Extensions
SELECT * FROM pg_extension ORDER BY extname;

-- Tables
SELECT * FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema');

-- Policies
SELECT * FROM pg_policies ORDER BY schemaname, tablename;
```

See [Database Documentation](./endpoints/database.md) for more SQL queries.

---

## Official Resources

- **Interactive API Docs:** https://api.supabase.com/api/v1 (Scalar UI)
- **Main Documentation:** https://supabase.com/docs/reference/api/introduction
- **OpenAPI Spec:** https://github.com/supabase/supabase/tree/master/apps/docs/spec
- **Community Library:** https://github.com/supabase-community/supabase-management-js

---

## Testing Information

This documentation is based on comprehensive testing:

- **Test Date:** October 29, 2025
- **Endpoints Tested:** 56 unique endpoints
- **Test Project:** ygzhmowennlaehudyyey
- **Test Scripts:** `test-api.js`, `test-api-extended.js`, `test-api-writes.js`

See [ENDPOINT_STATUS.md](./ENDPOINT_STATUS.md) for detailed test results.

---

## Using This Documentation

1. **Browse by Category** - Navigate to specific endpoint documentation
2. **Check Status** - See which endpoints work vs. don't work
3. **View Examples** - Real request/response examples from tests
4. **Find Alternatives** - SQL queries for missing features
5. **Map to CLI** - Understand CLI command implementation

---

## Contributing

Found an endpoint that works but isn't documented? See an error in the documentation? Contributions welcome!

1. Test the endpoint against your Supabase project
2. Document request/response format
3. Submit pull request with updates

---

## Changelog

### 2025-10-29
- Initial comprehensive API documentation
- Tested 56 endpoints
- Discovered SQL query endpoint (game changer)
- Identified 37 missing endpoints
- Created category-based organization
- Added SQL alternatives for missing features
