# Monitoring & Health API

Endpoints for health checks, readonly mode, performance monitoring, and metrics.

---

## Health Checks

### Get Service Health

**Endpoint:** `GET /v1/projects/{ref}/health`
**Status:** ⚠️ Needs Parameters (400)
**CLI Command:** `monitoring:health`

Check health status of project services.

**Required Query Parameter:**
- `services` - Comma-separated list of services to check

**Request:**
```bash
curl -X GET 'https://api.supabase.com/v1/projects/ygzhmowennlaehudyyey/health?services=postgres,kong,auth,realtime,rest,storage' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Available Services:**
- `postgres` - PostgreSQL database
- `kong` - API Gateway
- `auth` - Authentication service (GoTrue)
- `realtime` - Realtime service
- `rest` - PostgREST API
- `storage` - Storage service

**Expected Response:**
```json
{
  "postgres": "healthy",
  "kong": "healthy",
  "auth": "healthy",
  "realtime": "healthy",
  "rest": "healthy",
  "storage": "healthy"
}
```

**Status Values:**
- `healthy` - Service is operational
- `degraded` - Service experiencing issues
- `down` - Service unavailable

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

**Response Fields:**
- `enabled` - Whether readonly mode is currently active
- `override_enabled` - Whether temporary override is active
- `override_active_until` - When override expires (ISO 8601)

**Readonly Mode Causes:**
- Plan tier limits exceeded
- Payment issues
- Manual activation by Supabase
- Security concerns

---

### Temporarily Disable Readonly

**Endpoint:** `POST /v1/projects/{ref}/readonly/temporary-disable`
**Status:** 🔍 Not Tested
**CLI Command:** `monitoring:readonly:disable`

Temporarily disable readonly mode for 15 minutes.

**Use Case:** Emergency write access to resolve issues.

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
      "remediation": "CREATE INDEX idx_users_email ON public.users(email);",
      "categories": ["performance", "database"],
      "metadata": {
        "table": "users",
        "column": "email",
        "query_count": 1000,
        "avg_execution_time_ms": 250
      }
    },
    {
      "level": "INFO",
      "title": "Table needs VACUUM",
      "description": "Table 'posts' has high dead tuple ratio",
      "remediation": "VACUUM ANALYZE public.posts;",
      "categories": ["performance", "maintenance"]
    }
  ]
}
```

**Common Performance Issues:**
- Missing indexes
- Slow queries
- N+1 query patterns
- Tables needing VACUUM/ANALYZE
- Connection pool exhaustion
- Inefficient RLS policies
- Large table scans

**Warning:** This endpoint is **EXPERIMENTAL** and may change or be removed.

---

## Metrics (NOT AVAILABLE via Management API)

### Prometheus Metrics

**Endpoint:** ❌ Not in Management API
**Status:** Available via different endpoint
**CLI Command:** `monitoring:metrics`

**Alternative Endpoint:**
```
https://{project-ref}.supabase.co/customer/v1/privileged/metrics
```

**Authentication:** HTTP Basic Auth
- Username: `service_role`
- Password: Service role key (not PAT)

**Request:**
```bash
curl -X GET 'https://ygzhmowennlaehudyyey.supabase.co/customer/v1/privileged/metrics' \
  -u "service_role:$SERVICE_ROLE_KEY"
```

**Response:** Prometheus-formatted metrics

**Metrics Available:**
- Database connections
- Query execution times
- Cache hit rates
- Storage usage
- API request rates
- Error rates

---

### Get Project Metrics

**Endpoint:** ❌ `GET /v1/projects/{ref}/metrics` (404)
**CLI Command:** Not available

**Alternative:** Use Prometheus endpoint or SQL queries.

---

## Database Statistics (SQL)

### Connection Statistics

```sql
SELECT
  COUNT(*) as total_connections,
  COUNT(*) FILTER (WHERE state = 'active') as active_connections,
  COUNT(*) FILTER (WHERE state = 'idle') as idle_connections,
  COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
FROM pg_stat_activity
WHERE datname = current_database();
```

### Query Performance

```sql
SELECT
  queryid,
  left(query, 80) as query_preview,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Table Statistics

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  ROUND(100 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_ratio_pct,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
```

### Index Usage

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC
LIMIT 20;
```

### Cache Hit Ratio

```sql
SELECT
  'cache hit rate' as metric,
  ROUND(
    100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0),
    2
  ) as percentage
FROM pg_statio_user_tables;
```

---

## Logs (NOT AVAILABLE)

### Get Project Logs

**Endpoint:** ❌ `GET /v1/projects/{ref}/logs` (404)
**CLI Command:** Not available

**Alternative:** Use dashboard or Supabase CLI.

---

### Get Function Logs

**Endpoint:** ❌ `GET /v1/projects/{ref}/functions/logs` (404)
**CLI Command:** Not available

**Alternative:** Use dashboard.

---

### Query Logs (Experimental)

**Endpoint:** `GET /v1/projects/{ref}/analytics/endpoints/logs.all`
**Status:** 🔍 Not Tested (Experimental)
**CLI Command:** `logs:query`

Query project logs with BigQuery SQL (experimental).

**Expected Request:**
```
GET /v1/projects/{ref}/analytics/endpoints/logs.all?sql=SELECT * FROM logs LIMIT 10
```

**Warning:** Experimental endpoint that may change or be removed.

---

## Usage & Quotas (NOT AVAILABLE)

### Get Usage Statistics

**Endpoint:** ❌ `GET /v1/projects/{ref}/usage` (404)
**CLI Command:** Not available

**Alternative:** View in dashboard.

---

### Get Quotas

**Endpoint:** ❌ `GET /v1/projects/{ref}/quotas` (404)
**CLI Command:** Not available

**Alternative:** View in dashboard.

---

### Get API Usage

**Endpoint:** `GET /v1/projects/{ref}/analytics/endpoints/usage.api-counts`
**Status:** 🔍 Not Tested
**CLI Command:** `monitoring:usage`

Get API usage statistics.

---

### Get Request Counts

**Endpoint:** `GET /v1/projects/{ref}/analytics/endpoints/usage.api-requests-count`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Get API request counts.

---

## Summary

### Working Endpoints (1)
- ✅ `GET /v1/projects/{ref}/readonly` - Readonly status

### Needs Parameters (1)
- ⚠️ `GET /v1/projects/{ref}/health` - Add `?services=` param

### Not Tested (5)
- 🔍 `POST /v1/projects/{ref}/readonly/temporary-disable` - Disable readonly
- 🔍 `GET /v1/projects/{ref}/advisors/performance` - Performance audit (Experimental)
- 🔍 `GET /v1/projects/{ref}/analytics/endpoints/logs.all` - Query logs (Experimental)
- 🔍 `GET /v1/projects/{ref}/analytics/endpoints/usage.api-counts` - API usage
- 🔍 `GET /v1/projects/{ref}/analytics/endpoints/usage.api-requests-count` - Request counts

### Not Available (5)
- ❌ `GET /v1/projects/{ref}/metrics` - Use Prometheus endpoint
- ❌ `GET /v1/projects/{ref}/logs` - Use dashboard
- ❌ `GET /v1/projects/{ref}/functions/logs` - Use dashboard
- ❌ `GET /v1/projects/{ref}/usage` - Use dashboard
- ❌ `GET /v1/projects/{ref}/quotas` - Use dashboard

### Alternative Endpoints
- Prometheus metrics: `https://{project-ref}.supabase.co/customer/v1/privileged/metrics`
  - Auth: Basic auth with service_role key (not PAT)

### Recommended Implementation

1. ✅ **Keep existing:**
   - `monitoring:readonly` (working)

2. ⚠️ **Fix health check:**
   - `monitoring:health` - Add proper `?services=` parameter

3. 🔍 **Test and implement:**
   - `monitoring:performance` - Performance advisors (Experimental)
   - `monitoring:readonly:disable` - Temporarily disable readonly
   - `monitoring:usage` - API usage statistics
   - `logs:query` - Query logs (Experimental)

4. ➕ **Add SQL-based monitoring:**
   - `monitoring:connections` - Connection statistics
   - `monitoring:queries` - Query performance
   - `monitoring:tables` - Table statistics
   - `monitoring:indexes` - Index usage
   - `monitoring:cache` - Cache hit ratio

5. ➕ **Add Prometheus metrics:**
   - `monitoring:metrics` - Fetch Prometheus metrics
   - Requires service_role key (different auth)

### Example Usage

**Check Service Health:**
```bash
$ supabase-cli monitoring:health --services postgres,kong,auth
✓ postgres: healthy
✓ kong: healthy
✓ auth: healthy
```

**Check Readonly Status:**
```bash
$ supabase-cli monitoring:readonly
Readonly Mode: Disabled
Override Active: No
```

**Get Performance Recommendations:**
```bash
$ supabase-cli monitoring:performance
⚠️  EXPERIMENTAL: This API may change without notice

Performance Issues Found: 3

[WARN] Missing index on frequently queried column
  Table: users, Column: email
  Query Count: 1000, Avg Time: 250ms
  Fix: CREATE INDEX idx_users_email ON public.users(email);

[INFO] Table needs VACUUM
  Table: posts
  Fix: VACUUM ANALYZE public.posts;
```

**Get Connection Statistics (SQL):**
```bash
$ supabase-cli monitoring:connections
Total Connections: 15
Active: 3
Idle: 10
Idle in Transaction: 2
```

### Notes

- Health check requires explicit service list
- Readonly mode can be triggered by various conditions
- Performance advisors are experimental
- Most analytics require dashboard access
- Prometheus metrics use different authentication
- SQL queries provide detailed database statistics
