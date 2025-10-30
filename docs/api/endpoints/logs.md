# Logs & Analytics API

Endpoints for querying logs and analytics data.

**Note:** Most log endpoints are **NOT available** via Management API. Use dashboard or Supabase CLI instead.

---

## Project Logs (NOT AVAILABLE)

### Get Project Logs

**Endpoint:** ❌ `GET /v1/projects/{ref}/logs` (404)
**CLI Command:** Not available via Management API

**Finding:** No REST endpoint for project logs.

**Alternatives:**
1. **Dashboard:** View logs at https://supabase.com/dashboard/project/{ref}/logs
2. **Supabase CLI:** `supabase logs`
3. **Log streaming:** Configure external log destinations

---

### Query Logs (Experimental)

**Endpoint:** `GET /v1/projects/{ref}/analytics/endpoints/logs.all`
**Status:** 🔍 Not Tested (Experimental)
**CLI Command:** `logs:query`

Query project logs using BigQuery SQL syntax.

**Request:**
```bash
curl -X GET 'https://api.supabase.com/v1/projects/ygzhmowennlaehudyyey/analytics/endpoints/logs.all?sql=SELECT%20*%20FROM%20logs%20LIMIT%2010' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Query Parameters:**
- `sql` - BigQuery SQL query (URL encoded)

**Example Queries:**

**Recent Errors:**
```sql
SELECT timestamp, level, msg
FROM logs
WHERE level = 'error'
ORDER BY timestamp DESC
LIMIT 100
```

**Slow Queries:**
```sql
SELECT timestamp, msg, metadata
FROM logs
WHERE msg LIKE '%slow query%'
ORDER BY timestamp DESC
LIMIT 50
```

**Request Rate by Path:**
```sql
SELECT path, COUNT(*) as request_count
FROM logs
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
GROUP BY path
ORDER BY request_count DESC
LIMIT 20
```

**Warning:** This endpoint is **EXPERIMENTAL** and may change or be removed without notice.

---

## Function Logs (NOT AVAILABLE)

### Get Function Logs

**Endpoint:** ❌ `GET /v1/projects/{ref}/functions/logs` (404)
**CLI Command:** Not available via Management API

**Finding:** No REST endpoint for function logs.

**Alternatives:**
1. **Dashboard:** View function logs in dashboard
2. **Supabase CLI:** `supabase functions logs {function-name}`
3. **Real-time streaming:** Use CLI with `--follow` flag

---

## Function Statistics

### Get Function Stats

**Endpoint:** `GET /v1/projects/{ref}/analytics/endpoints/functions.combined-stats`
**Status:** 🔍 Not Tested
**CLI Command:** `functions:stats`

Get aggregated statistics for Edge Functions.

**Expected Response:**
```json
{
  "functions": [
    {
      "slug": "hello-world",
      "invocations": 1000,
      "errors": 5,
      "avg_duration_ms": 150,
      "p50_duration_ms": 120,
      "p95_duration_ms": 250,
      "p99_duration_ms": 400,
      "period_start": "2025-10-22T00:00:00Z",
      "period_end": "2025-10-29T00:00:00Z"
    }
  ]
}
```

**Metrics:**
- `invocations` - Total function invocations
- `errors` - Number of errors
- `avg_duration_ms` - Average execution time
- `p50_duration_ms` - 50th percentile (median)
- `p95_duration_ms` - 95th percentile
- `p99_duration_ms` - 99th percentile

---

## API Usage

### Get API Counts

**Endpoint:** `GET /v1/projects/{ref}/analytics/endpoints/usage.api-counts`
**Status:** 🔍 Not Tested
**CLI Command:** `monitoring:usage`

Get API usage statistics by endpoint.

**Expected Response:**
```json
{
  "period_start": "2025-10-22T00:00:00Z",
  "period_end": "2025-10-29T00:00:00Z",
  "endpoints": [
    {
      "path": "/rest/v1/users",
      "method": "GET",
      "count": 5000,
      "errors": 10,
      "avg_duration_ms": 50
    },
    {
      "path": "/rest/v1/posts",
      "method": "POST",
      "count": 1000,
      "errors": 5,
      "avg_duration_ms": 100
    }
  ]
}
```

---

### Get Request Counts

**Endpoint:** `GET /v1/projects/{ref}/analytics/endpoints/usage.api-requests-count`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Get total API request counts.

**Expected Response:**
```json
{
  "total_requests": 50000,
  "period_start": "2025-10-22T00:00:00Z",
  "period_end": "2025-10-29T00:00:00Z"
}
```

---

## Usage & Quotas (NOT AVAILABLE)

### Get Usage Statistics

**Endpoint:** ❌ `GET /v1/projects/{ref}/usage` (404)
**CLI Command:** Not available

**Finding:** No REST endpoint for usage statistics.

**Alternative:** View in dashboard at:
https://supabase.com/dashboard/project/{ref}/settings/billing

**Usage Metrics (Dashboard Only):**
- Database size
- Storage size
- Bandwidth usage
- Active users
- Function invocations
- Realtime connections

---

### Get Quotas

**Endpoint:** ❌ `GET /v1/projects/{ref}/quotas` (404)
**CLI Command:** Not available

**Finding:** No REST endpoint for quota information.

**Alternative:** View in dashboard settings/billing section.

---

## Log Streaming (Alternative)

Since log endpoints are limited, consider setting up log streaming:

### Configure Log Destinations

**Options:**
1. **Syslog:** Stream logs to external syslog server
2. **Webhook:** Send logs to webhook endpoint
3. **Cloud Services:** Send to Datadog, LogDNA, etc.

**Configuration:** Available in dashboard under Project Settings > Logs

---

## SQL-Based Log Queries

Use the database query endpoint to query Supabase system logs:

### Query Auth Logs

```sql
SELECT
  created_at,
  event_type,
  user_id,
  ip_address,
  metadata
FROM auth.audit_log_entries
ORDER BY created_at DESC
LIMIT 100;
```

### Query Realtime Logs

```sql
-- Note: Realtime logs may not be available via SQL
-- Use dashboard or CLI instead
```

### Query Storage Access

```sql
SELECT
  created_at,
  bucket_id,
  name as file_path,
  metadata->>'size' as file_size,
  owner as user_id
FROM storage.objects
ORDER BY created_at DESC
LIMIT 100;
```

---

## Summary

### Not Tested (3)
- 🔍 `GET /v1/projects/{ref}/analytics/endpoints/logs.all` - Query logs (Experimental)
- 🔍 `GET /v1/projects/{ref}/analytics/endpoints/functions.combined-stats` - Function stats
- 🔍 `GET /v1/projects/{ref}/analytics/endpoints/usage.api-counts` - API usage
- 🔍 `GET /v1/projects/{ref}/analytics/endpoints/usage.api-requests-count` - Request counts

### Not Available (4)
- ❌ `GET /v1/projects/{ref}/logs` - Use dashboard or CLI
- ❌ `GET /v1/projects/{ref}/functions/logs` - Use dashboard or CLI
- ❌ `GET /v1/projects/{ref}/usage` - Use dashboard
- ❌ `GET /v1/projects/{ref}/quotas` - Use dashboard

### Recommended Implementation

1. 🔍 **Test experimental log query:**
   - `logs:query` - Query logs with BigQuery SQL (Experimental)
   - Add warning about experimental status

2. 🔍 **Implement analytics commands:**
   - `functions:stats` - Function statistics
   - `monitoring:usage` - API usage statistics

3. ➕ **Add SQL-based log queries:**
   - `logs:auth` - Query auth logs
   - `logs:storage` - Query storage access logs

4. 📚 **Document alternatives:**
   - Dashboard for full log viewing
   - CLI for real-time log streaming
   - Log streaming configuration

### Example Usage

**Query Recent Errors (Experimental):**
```bash
$ supabase-cli logs:query "
  SELECT timestamp, level, msg
  FROM logs
  WHERE level = 'error'
    AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
  ORDER BY timestamp DESC
  LIMIT 20
"

⚠️  EXPERIMENTAL: This API may change without notice

2025-10-29 10:15:23 | ERROR | Database connection timeout
2025-10-29 10:14:05 | ERROR | RLS policy violation on table users
2025-10-29 10:10:11 | ERROR | Function execution failed: hello-world
```

**Get Function Statistics:**
```bash
$ supabase-cli functions:stats

Edge Function Statistics (Last 7 Days)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

hello-world:
  Invocations: 1,000
  Errors: 5 (0.5%)
  Avg Duration: 150ms
  P95 Duration: 250ms

send-email:
  Invocations: 500
  Errors: 2 (0.4%)
  Avg Duration: 300ms
  P95 Duration: 450ms
```

**Get API Usage:**
```bash
$ supabase-cli monitoring:usage --last 24h

API Usage (Last 24 Hours)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GET /rest/v1/users: 5,000 requests (10 errors)
POST /rest/v1/posts: 1,000 requests (5 errors)
GET /rest/v1/posts: 3,000 requests (2 errors)
```

**Query Auth Logs (SQL):**
```bash
$ supabase-cli logs:auth --limit 20

Auth Logs (Last 20 Events)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2025-10-29 10:15:23 | login_success | user-123 | 1.2.3.4
2025-10-29 10:14:05 | token_refresh | user-456 | 5.6.7.8
2025-10-29 10:10:11 | login_failed | user-789 | 9.10.11.12
```

### Notes

- Most log endpoints are NOT available via Management API
- Experimental log query endpoint may change or be removed
- Dashboard provides comprehensive log viewing
- CLI provides real-time log streaming
- Consider log streaming for production monitoring
- Auth logs available via SQL query
- Function logs only in dashboard/CLI
- Usage/quota information only in dashboard

### Alternatives to API

**For Log Viewing:**
1. Dashboard: Full-featured log viewer
2. CLI: `supabase logs` (real-time streaming)
3. Log streaming: Configure external destinations

**For Analytics:**
1. Dashboard: Usage and quota information
2. SQL queries: Custom analytics via database
3. External tools: Datadog, LogDNA, etc.

**For Monitoring:**
1. SQL-based monitoring (see monitoring.md)
2. Prometheus metrics endpoint
3. External APM tools
