# Edge Functions API

Endpoints for managing Supabase Edge Functions (Deno runtime).

---

## Functions

### List Functions

**Endpoint:** `GET /v1/projects/{ref}/functions`
**Status:** ✅ Works (200 OK)
**CLI Command:** `functions:list`

List all Edge Functions deployed in the project.

**Request:**
```bash
curl -X GET 'https://api.supabase.com/v1/projects/ygzhmowennlaehudyyey/functions' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Response (Empty):**
```json
[]
```

**Response (With Functions):**
```json
[
  {
    "id": "func-123",
    "slug": "hello-world",
    "name": "hello-world",
    "status": "ACTIVE",
    "version": 3,
    "created_at": "2025-10-20T10:00:00Z",
    "updated_at": "2025-10-29T15:30:00Z",
    "verify_jwt": true,
    "import_map": false,
    "entrypoint_path": "index.ts"
  }
]
```

**Response Fields:**
- `id` - Function ID
- `slug` - Function slug (used in URL)
- `name` - Function name
- `status` - Status (ACTIVE, INACTIVE, ERROR)
- `version` - Deployment version number
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `verify_jwt` - Whether JWT verification is enabled
- `import_map` - Whether using import map
- `entrypoint_path` - Entry point file (e.g., "index.ts")

---

### Create Function

**Endpoint:** `POST /v1/projects/{ref}/functions`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Create a new Edge Function.

**Expected Request:**
```json
{
  "slug": "hello-world",
  "name": "hello-world",
  "verify_jwt": true,
  "import_map": false
}
```

**Note:** Creating a function doesn't deploy code. Use `functions:deploy` for deployment.

---

### Get Function

**Endpoint:** `GET /v1/projects/{ref}/functions/{function_slug}`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Get details of a specific function.

**Response:** Same as single function object from list.

---

### Update Function

**Endpoint:** `PATCH /v1/projects/{ref}/functions/{function_slug}`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Update function configuration (name, JWT verification, etc.).

**Expected Request:**
```json
{
  "name": "hello-world-v2",
  "verify_jwt": false
}
```

---

### Delete Function

**Endpoint:** `DELETE /v1/projects/{ref}/functions/{function_slug}`
**Status:** 🔍 Not Tested
**CLI Command:** `functions:delete`

Delete an Edge Function.

**Warning:** This is a destructive operation. Function code and history will be permanently deleted.

---

### Get Function Body

**Endpoint:** `GET /v1/projects/{ref}/functions/{function_slug}/body`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Download the deployed function code.

**Response:** Function source code (TypeScript/JavaScript).

---

## Function Deployment

### Deploy Function

**Endpoint:** `POST /v1/projects/{ref}/functions/deploy`
**Status:** 🔍 Not Tested
**CLI Command:** `functions:deploy`

Deploy function code to an existing function.

**Expected Request:**
```json
{
  "slug": "hello-world",
  "version": 4,
  "verify_jwt": true,
  "import_map": false
}
```

**Body:** Multipart form data with function code bundle.

**Note:** Actual implementation likely requires multipart/form-data with:
- Function code (TypeScript/JavaScript files)
- Import map (optional)
- Configuration

---

### Bulk Update Functions

**Endpoint:** `PUT /v1/projects/{ref}/functions`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Update multiple functions at once.

---

## Function Invocation

### Invoke Function

**Endpoint:** Not via Management API
**CLI Command:** `functions:invoke`

**Note:** Function invocation uses the project-specific endpoint, not Management API:

```bash
# Invoke via project endpoint
curl -X POST 'https://{project-ref}.supabase.co/functions/v1/hello-world' \
  -H "Authorization: Bearer {anon_key}" \
  -H "Content-Type: application/json" \
  -d '{"name": "World"}'
```

**CLI Implementation:** Uses project endpoint with anon/service_role key.

---

## Function Logs (NOT AVAILABLE)

### Get Function Logs

**Endpoint:** ❌ `GET /v1/projects/{ref}/functions/logs` (404)
**CLI Command:** Not available

**Finding:** No REST endpoint for function logs.

**Alternative:** View logs in dashboard or use Supabase CLI.

---

### Get Function Slugs

**Endpoint:** ❌ `GET /v1/projects/{ref}/functions/slugs` (404)
**CLI Command:** Not available

**Finding:** No dedicated endpoint. Use `functions:list` instead.

---

## Function Statistics

### Get Function Stats

**Endpoint:** `GET /v1/projects/{ref}/analytics/endpoints/functions.combined-stats`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Get usage statistics for Edge Functions.

**Expected Response:**
```json
{
  "invocations": 1000,
  "errors": 5,
  "avg_duration_ms": 150,
  "period_start": "2025-10-22T00:00:00Z",
  "period_end": "2025-10-29T00:00:00Z"
}
```

---

## Summary

### Working Endpoints (1)
- ✅ `GET /v1/projects/{ref}/functions` - List functions

### Not Tested (7)
- 🔍 `POST /v1/projects/{ref}/functions` - Create function
- 🔍 `GET /v1/projects/{ref}/functions/{slug}` - Get function
- 🔍 `PATCH /v1/projects/{ref}/functions/{slug}` - Update function
- 🔍 `DELETE /v1/projects/{ref}/functions/{slug}` - Delete function
- 🔍 `GET /v1/projects/{ref}/functions/{slug}/body` - Get function code
- 🔍 `POST /v1/projects/{ref}/functions/deploy` - Deploy function
- 🔍 `PUT /v1/projects/{ref}/functions` - Bulk update functions

### Not Available (2)
- ❌ `GET /v1/projects/{ref}/functions/logs` - Use dashboard/CLI
- ❌ `GET /v1/projects/{ref}/functions/slugs` - Use `functions:list`

### Recommended Implementation

1. ✅ **Keep existing:**
   - `functions:list` (working)
   - `functions:invoke` (uses project endpoint, not Management API)

2. 🔍 **Test and implement:**
   - `functions:create` - Create new function
   - `functions:deploy` - Deploy function code
   - `functions:delete` - Delete function
   - `functions:get` - Get function details
   - `functions:update` - Update function config

3. 🔍 **Implement code management:**
   - `functions:download` - Download function code
   - `functions:stats` - View function statistics

4. 📚 **Document limitations:**
   - Function invocation uses project endpoint
   - Logs only available in dashboard/CLI
   - Deployment requires code bundling

### Example Usage

**List Functions:**
```bash
$ supabase-cli functions:list
```

**Create Function:**
```bash
$ supabase-cli functions:create hello-world --verify-jwt
```

**Deploy Function:**
```bash
$ supabase-cli functions:deploy hello-world ./functions/hello-world
```

**Invoke Function:**
```bash
$ supabase-cli functions:invoke hello-world --data '{"name": "World"}'
```

**Delete Function:**
```bash
$ supabase-cli functions:delete hello-world --yes
```

### Configuration Options

**JWT Verification:**
- `verify_jwt: true` - Requires valid Supabase JWT in Authorization header
- `verify_jwt: false` - Public function, no authentication required

**Import Map:**
- Allows using import maps for dependency management
- Enables `import { serve } from "https://deno.land/std/http/server.ts"`

**Environment Variables:**
- Set via secrets (`POST /v1/projects/{ref}/secrets`)
- Accessed via `Deno.env.get("VAR_NAME")`

### Deployment Process

1. Create function (if doesn't exist)
2. Bundle function code (TypeScript/JavaScript)
3. Deploy to Supabase (upload code + config)
4. Function becomes available at: `https://{project-ref}.supabase.co/functions/v1/{slug}`

### Notes

- Edge Functions run on Deno runtime
- Support TypeScript out of the box
- Can access Supabase client with service role
- Limited execution time (varies by plan)
- Cold start latency on first invocation
- Logs available in dashboard (not via API)
