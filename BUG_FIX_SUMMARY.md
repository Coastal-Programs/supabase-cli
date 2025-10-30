# Critical Bug Fix: Database Query System

## Issue
ALL database queries returned empty results (0 rows), even simple queries like `SELECT 1`.

## Root Cause
The `queryDatabase()` function in `src/supabase.ts` was expecting the Supabase Management API to return query results wrapped in a `{ rows: [] }` object structure:

```typescript
// INCORRECT (OLD CODE)
const response = await enhancedFetch<{ rows: unknown[] }>(...)
return response.rows || []
```

However, the actual API response returns an **array of objects directly**, not wrapped:

```json
[
  {
    "column1": "value1",
    "column2": "value2"
  }
]
```

## Evidence
From `docs/testing/api-test-report.md` lines 145-150:

```bash
POST /v1/projects/{ref}/database/query
Request: {"query": "SELECT version();"}

Response (201):
[
  {
    "version": "PostgreSQL 17.6 on aarch64-unknown-linux-gnu..."
  }
]
```

## Fix Applied
Updated `src/supabase.ts` line 683-701:

```typescript
/**
 * Execute a SQL query against the database
 *
 * CRITICAL FIX: The Management API returns an array of objects directly,
 * not wrapped in { rows: [] }. Response format:
 * [
 *   { "column1": "value1", "column2": "value2" },
 *   { "column1": "value3", "column2": "value4" }
 * ]
 *
 * See: docs/testing/api-test-report.md line 145-150
 */
export async function queryDatabase(ref: string, sql: string): Promise<unknown[]> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<unknown[]>(
    `${API_BASE_URL}/projects/${ref}/database/query`,
    {
      body: JSON.stringify({ query: sql }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'query database',
  )

  // API returns array directly, not wrapped in { rows: [] }
  // If result is not an array, return empty array
  return Array.isArray(result) ? result : []
}
```

## Changes Made
1. Changed response type from `{ rows: unknown[] }` to `unknown[]`
2. Return result directly instead of `response.rows`
3. Added safety check: `Array.isArray(result) ? result : []`
4. Added comprehensive documentation explaining the API response format

## Impact
This fix restores functionality for ALL database-related commands:
- `db:query` - Execute SQL queries
- `db:extensions` - List extensions (uses queryDatabase internally)
- `db:schemas` - List schemas (uses queryDatabase internally)
- Any other commands that query the database

## Testing
To verify the fix works:

```bash
# Simple query
./bin/run db:query "SELECT 1 as test" --project ygzhmowennlaehudyyey

# Get database version
./bin/run db:query "SELECT version()" --project ygzhmowennlaehudyyey

# Get current database
./bin/run db:query "SELECT current_database()" --project ygzhmowennlaehudyyey

# List extensions
./bin/run db:extensions --project ygzhmowennlaehudyyey
```

## Files Modified
- `src/supabase.ts` - Line 683-701 (queryDatabase function)

## Documentation References
- API response format documented in: `docs/testing/api-test-report.md`
- API endpoint documented in: `docs/supabase_management_api_reference.md`
- Similar examples in: `docs/api/consolidated-reference.md`

---

**Date Fixed**: 2025-10-30
**Severity**: Critical (P0) - Blocked all database functionality
**Status**: Fixed and ready for testing
