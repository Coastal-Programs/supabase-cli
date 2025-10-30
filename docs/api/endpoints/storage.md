# Storage API

Endpoints for managing storage buckets and files.

**Note:** This documents the Management API for **bucket configuration**, not the Storage API for file operations. For file upload/download, use the Storage API directly.

---

## Buckets

### List Storage Buckets

**Endpoint:** `GET /v1/projects/{ref}/storage/buckets`
**Status:** ✅ Works (200 OK)
**CLI Command:** `storage:buckets:list`

List all storage buckets in the project.

**Request:**
```bash
curl -X GET 'https://api.supabase.com/v1/projects/ygzhmowennlaehudyyey/storage/buckets' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Response (Empty):**
```json
[]
```

**Response (With Buckets):**
```json
[
  {
    "id": "avatars",
    "name": "avatars",
    "public": true,
    "file_size_limit": 52428800,
    "allowed_mime_types": ["image/jpeg", "image/png", "image/gif"],
    "created_at": "2025-10-20T10:00:00Z",
    "updated_at": "2025-10-29T15:30:00Z"
  },
  {
    "id": "documents",
    "name": "documents",
    "public": false,
    "file_size_limit": 104857600,
    "allowed_mime_types": null,
    "created_at": "2025-10-21T11:00:00Z",
    "updated_at": "2025-10-28T14:20:00Z"
  }
]
```

**Response Fields:**
- `id` - Bucket ID
- `name` - Bucket name
- `public` - Whether bucket is publicly accessible
- `file_size_limit` - Max file size in bytes (null = unlimited)
- `allowed_mime_types` - Array of allowed MIME types (null = all)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### Create Bucket

**Endpoint:** `POST /v1/projects/{ref}/storage/buckets`
**Status:** 🔍 Not Tested
**CLI Command:** `storage:buckets:create`

Create a new storage bucket.

**Expected Request:**
```json
{
  "name": "avatars",
  "public": true,
  "file_size_limit": 52428800,
  "allowed_mime_types": ["image/jpeg", "image/png", "image/gif"]
}
```

**Parameters:**
- `name` (required) - Bucket name (lowercase, alphanumeric, hyphens)
- `public` (optional) - Public access (default: false)
- `file_size_limit` (optional) - Max file size in bytes
- `allowed_mime_types` (optional) - Array of allowed MIME types

---

### Get Bucket

**Endpoint:** `GET /v1/projects/{ref}/storage/buckets/{bucket_id}`
**Status:** 🔍 Not Tested
**CLI Command:** `storage:buckets:get`

Get details of a specific bucket.

---

### Update Bucket

**Endpoint:** `PATCH /v1/projects/{ref}/storage/buckets/{bucket_id}`
**Status:** 🔍 Not Tested
**CLI Command:** `storage:buckets:update`

Update bucket configuration.

**Expected Request:**
```json
{
  "public": false,
  "file_size_limit": 104857600,
  "allowed_mime_types": ["application/pdf", "image/jpeg"]
}
```

---

### Delete Bucket

**Endpoint:** `DELETE /v1/projects/{ref}/storage/buckets/{bucket_id}`
**Status:** 🔍 Not Tested
**CLI Command:** `storage:buckets:delete`

Delete a storage bucket.

**Warning:** This is destructive and will delete all files in the bucket.

---

## Storage Configuration

### Get Storage Config

**Endpoint:** `GET /v1/projects/{ref}/config/storage`
**Status:** 🔍 Not Tested
**CLI Command:** `config:storage:get`

Get storage configuration for the project.

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

### Update Storage Config

**Endpoint:** `PATCH /v1/projects/{ref}/config/storage`
**Status:** 🔍 Not Tested
**CLI Command:** `config:storage:set`

Update storage configuration.

---

## Storage Policies (NOT AVAILABLE via Management API)

### List Storage Policies

**Endpoint:** ❌ `GET /v1/projects/{ref}/storage/policies` (404)
**CLI Command:** Not available

**Finding:** No REST endpoint for storage policies.

**Alternative:** Use SQL query via `database/query` endpoint:

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;
```

---

## Storage Usage (NOT AVAILABLE)

### Get Storage Usage

**Endpoint:** ❌ `GET /v1/projects/{ref}/storage` (404)
**CLI Command:** Not available

**Finding:** No dedicated endpoint for storage usage statistics.

**Alternative:** Query via SQL:

```sql
SELECT
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_size_bytes,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
GROUP BY bucket_id
ORDER BY total_size_bytes DESC;
```

---

## File Operations (Use Storage API)

File upload, download, move, copy, and delete operations use the **Storage API**, not the Management API.

**Storage API Base URL:** `https://{project-ref}.supabase.co/storage/v1`

### Upload File
```bash
POST /storage/v1/object/{bucket}/{path}
Authorization: Bearer {anon_key or service_role_key}
Content-Type: {file_mime_type}
Body: {file_data}
```

### Download File
```bash
GET /storage/v1/object/public/{bucket}/{path}
# or for private buckets:
GET /storage/v1/object/authenticated/{bucket}/{path}
Authorization: Bearer {anon_key}
```

### Delete File
```bash
DELETE /storage/v1/object/{bucket}/{path}
Authorization: Bearer {service_role_key}
```

### List Files
```bash
POST /storage/v1/object/list/{bucket}
Authorization: Bearer {anon_key}
Content-Type: application/json
{
  "prefix": "folder/",
  "limit": 100,
  "offset": 0
}
```

---

## Image Transformation

**Endpoint:** `GET /storage/v1/object/public/{bucket}/{path}?width=300&height=300`

Transform images on-the-fly (requires plan with image transformation).

**Parameters:**
- `width` - Target width
- `height` - Target height
- `quality` - JPEG quality (1-100)
- `format` - Output format (webp, jpeg, png)

---

## Summary

### Working Endpoints (1)
- ✅ `GET /v1/projects/{ref}/storage/buckets` - List buckets

### Not Tested (6)
- 🔍 `POST /v1/projects/{ref}/storage/buckets` - Create bucket
- 🔍 `GET /v1/projects/{ref}/storage/buckets/{id}` - Get bucket
- 🔍 `PATCH /v1/projects/{ref}/storage/buckets/{id}` - Update bucket
- 🔍 `DELETE /v1/projects/{ref}/storage/buckets/{id}` - Delete bucket
- 🔍 `GET /v1/projects/{ref}/config/storage` - Get storage config
- 🔍 `PATCH /v1/projects/{ref}/config/storage` - Update storage config

### Not Available (2)
- ❌ `GET /v1/projects/{ref}/storage` - Use SQL for usage stats
- ❌ `GET /v1/projects/{ref}/storage/policies` - Use SQL for policies

### Recommended Implementation

1. ✅ **Keep existing:**
   - `storage:buckets:list` (working)

2. 🔍 **Test and implement:**
   - `storage:buckets:create` - Create bucket
   - `storage:buckets:get` - Get bucket details
   - `storage:buckets:update` - Update bucket config
   - `storage:buckets:delete` - Delete bucket
   - `config:storage:get` - Get storage config
   - `config:storage:set` - Update storage config

3. ➕ **Add SQL-based commands:**
   - `storage:usage` - Get storage usage (SQL query)
   - `storage:policies:list` - List policies (SQL query)

4. 📚 **Document Storage API separately:**
   - File upload/download uses different API
   - Different authentication (project keys vs PAT)
   - Different base URL

### Example Usage

**List Buckets:**
```bash
$ supabase-cli storage:buckets:list
```

**Create Bucket:**
```bash
$ supabase-cli storage:buckets:create avatars \
  --public \
  --file-size-limit 50MB \
  --allowed-mime-types image/jpeg,image/png
```

**Update Bucket:**
```bash
$ supabase-cli storage:buckets:update avatars \
  --public=false \
  --file-size-limit 100MB
```

**Delete Bucket:**
```bash
$ supabase-cli storage:buckets:delete avatars --yes
```

**Get Storage Usage (SQL):**
```bash
$ supabase-cli db:query "
SELECT
  bucket_id,
  COUNT(*) as file_count,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
GROUP BY bucket_id;"
```

### Bucket Configuration

**Public vs Private:**
- **Public:** Files accessible without authentication
- **Private:** Requires authentication + RLS policies

**File Size Limits:**
- Default: 50 MB
- Can be increased per bucket
- Max: Varies by plan

**Allowed MIME Types:**
- `null` - All file types allowed
- `[]` - Empty array = no files allowed
- `["image/jpeg", "image/png"]` - Only specified types

**RLS Policies:**
- Control access to files
- Defined in `storage.objects` table
- Use SQL or dashboard to configure

### Storage API Documentation

For file operations, refer to separate Storage API documentation:
- **Base URL:** `https://{project-ref}.supabase.co/storage/v1`
- **Auth:** Anon key or service role key (not PAT)
- **Operations:** Upload, download, list, move, copy, delete
- **Features:** Presigned URLs, resumable uploads, image transformation

**Swagger UI:** https://supabase.github.io/storage/
