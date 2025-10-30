# Supabase Management API Reference
## Database, Functions, and Storage Endpoints

**Base URL**: `https://api.supabase.com`

**Version**: v1

**Rate Limit**: 60 requests per minute per user (cumulative across all endpoints)

---

## Authentication

All Management API requests require authentication via Bearer token:

```bash
Authorization: Bearer <access_token>
```

### Token Types

1. **Personal Access Tokens (PAT)**
   - Long-lived tokens
   - Manually generated
   - Full user account privileges
   - Useful for automation and workflows

2. **OAuth2 Tokens**
   - Short-lived tokens
   - Scope-limited access
   - For third-party applications
   - Generates tokens on behalf of users

### OAuth Scopes

- `database:read` - Read database resources
- `database:write` - Modify database resources
- `edge_functions:read` - Read edge functions
- `edge_functions:write` - Modify edge functions
- `storage:read` - Read storage resources
- `storage:write` - Modify storage resources

---

## Error Codes

All endpoints return standard HTTP status codes:

- **200** - Success
- **201** - Created
- **401** - Unauthorized (missing or invalid authentication)
- **403** - Forbidden (insufficient permissions)
- **429** - Too Many Requests (rate limit exceeded)
- **500** - Internal Server Error

---

# Database API

## Query Execution

### Execute SQL Query

**POST** `/v1/projects/{ref}/database/query`

**Status**: Beta (Partner OAuth apps only)

Execute SQL queries programmatically against your project's database.

#### Path Parameters
- `ref` (string, required) - Project reference identifier

#### Request Body
```json
{
  "query": "SELECT * FROM users WHERE id = $1",
  "read_only": false
}
```

- `query` (string, required) - SQL query to execute
- `read_only` (boolean, optional) - Restricts operation to read-only mode

#### Response (201)
```json
{}
```

#### Example
```bash
curl -X POST "https://api.supabase.com/v1/projects/my-project/database/query" \
  -H "Authorization: Bearer sbp_..." \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT * FROM users LIMIT 10",
    "read_only": true
  }'
```

---

## Database Migrations

### List Migrations

**GET** `/v1/projects/{ref}/database/migrations`

Lists all applied migration versions.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Response (200)
```json
{
  "migrations": [
    {
      "version": "20231201000000",
      "name": "create_users_table",
      "applied_at": "2023-12-01T10:30:00Z"
    }
  ]
}
```

#### Example
```bash
curl "https://api.supabase.com/v1/projects/my-project/database/migrations" \
  -H "Authorization: Bearer sbp_..."
```

---

### Apply Migration

**POST** `/v1/projects/{ref}/database/migrations`

**Status**: Beta

Applies a database migration.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Headers
- `Idempotency-Key` (string, optional) - For request tracking

#### Request Body
```json
{
  "query": "CREATE TABLE users (id uuid PRIMARY KEY, email text);",
  "name": "create_users_table"
}
```

- `query` (string, required) - Migration SQL
- `name` (string, optional) - Migration name

#### Response (201)
```json
{}
```

#### Example
```bash
curl -X POST "https://api.supabase.com/v1/projects/my-project/database/migrations" \
  -H "Authorization: Bearer sbp_..." \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: migration-001" \
  -d '{
    "query": "ALTER TABLE users ADD COLUMN created_at timestamp;",
    "name": "add_created_at_column"
  }'
```

---

### Upsert Migration (Without Applying)

**PUT** `/v1/projects/{ref}/database/migrations`

Upserts a migration without applying it to the database.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Request Body
```json
{
  "query": "CREATE TABLE posts (id uuid PRIMARY KEY);",
  "name": "create_posts_table"
}
```

#### Response (200)
```json
{}
```

---

## Database Configuration

### Get Postgres Configuration

**GET** `/v1/projects/{ref}/config/database/postgres`

Retrieves current Postgres configuration settings.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Response (200)
```json
{
  "max_connections": 100,
  "shared_buffers": "256MB",
  "effective_cache_size": "1GB",
  "work_mem": "4MB"
}
```

#### Example
```bash
curl "https://api.supabase.com/v1/projects/my-project/config/database/postgres" \
  -H "Authorization: Bearer sbp_..."
```

---

### Update Postgres Configuration

**PUT** `/v1/projects/{ref}/config/database/postgres`

Updates Postgres configuration settings.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Request Body
```json
{
  "max_connections": 150,
  "shared_buffers": "512MB"
}
```

#### Response (200)
```json
{}
```

#### Example
```bash
curl -X PUT "https://api.supabase.com/v1/projects/my-project/config/database/postgres" \
  -H "Authorization: Bearer sbp_..." \
  -H "Content-Type: application/json" \
  -d '{
    "max_connections": 150
  }'
```

---

## Connection Pooler (Supavisor)

### Get Pooler Configuration

**GET** `/v1/projects/{ref}/config/database/pooler`

Retrieves supavisor connection pooler settings.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Response (200)
```json
{
  "identifier": "db-pooler-123",
  "database_type": "PRIMARY",
  "db_user": "postgres",
  "db_host": "db.example.supabase.co",
  "db_port": 5432,
  "db_name": "postgres",
  "connection_string": "postgresql://...",
  "default_pool_size": 20,
  "max_client_conn": 100,
  "pool_mode": "transaction"
}
```

#### Example
```bash
curl "https://api.supabase.com/v1/projects/my-project/config/database/pooler" \
  -H "Authorization: Bearer sbp_..."
```

---

### Update Pooler Configuration

**PATCH** `/v1/projects/{ref}/config/database/pooler`

Updates connection pooler configuration.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Request Body
```json
{
  "default_pool_size": 30,
  "pool_mode": "transaction"
}
```

- `default_pool_size` (integer, optional) - Number of connections per pool
- `pool_mode` (enum, optional) - Pooling mode: `transaction`, `session`, or `statement`

#### Response (200)
```json
{}
```

#### Example
```bash
curl -X PATCH "https://api.supabase.com/v1/projects/my-project/config/database/pooler" \
  -H "Authorization: Bearer sbp_..." \
  -H "Content-Type: application/json" \
  -d '{
    "default_pool_size": 30,
    "pool_mode": "transaction"
  }'
```

---

## SSL Enforcement

### Get SSL Enforcement Configuration

**GET** `/v1/projects/{ref}/ssl-enforcement`

Retrieves current SSL enforcement settings.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Response (200)
```json
{
  "currentConfig": {
    "database": true
  },
  "appliedSuccessfully": true
}
```

#### Example
```bash
curl "https://api.supabase.com/v1/projects/my-project/ssl-enforcement" \
  -H "Authorization: Bearer sbp_..."
```

---

### Update SSL Enforcement Configuration

**PUT** `/v1/projects/{ref}/ssl-enforcement`

Updates SSL enforcement settings.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Request Body
```json
{
  "requestedConfig": {
    "database": true
  }
}
```

- `requestedConfig` (object, required) - Configuration object

#### Response (200)
```json
{
  "currentConfig": {
    "database": true
  },
  "appliedSuccessfully": true
}
```

#### Example
```bash
curl -X PUT "https://api.supabase.com/v1/projects/my-project/ssl-enforcement" \
  -H "Authorization: Bearer sbp_..." \
  -H "Content-Type: application/json" \
  -d '{
    "requestedConfig": {
      "database": true
    }
  }'
```

---

## Backups & Recovery

### List Backups

**GET** `/v1/projects/{ref}/database/backups`

Lists all backups for a project.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Response (200)
```json
{
  "region": "us-east-1",
  "walg_enabled": true,
  "pitr_enabled": true,
  "backups": [
    {
      "is_physical_backup": true,
      "status": "completed",
      "inserted_at": "2023-12-01T00:00:00Z"
    }
  ],
  "physical_backup_data": {
    "earliest_physical_backup_date_unix": 1701388800,
    "latest_physical_backup_date_unix": 1701475200
  }
}
```

#### Fields
- `region` - Geographic location of backups
- `walg_enabled` - WAL-G archiving status
- `pitr_enabled` - Point-in-time recovery capability
- `backups` - Array of backup objects
- `physical_backup_data` - Unix timestamps for backup range

#### Example
```bash
curl "https://api.supabase.com/v1/projects/my-project/database/backups" \
  -H "Authorization: Bearer sbp_..."
```

---

### Restore PITR Backup

**POST** `/v1/projects/{ref}/database/backups/restore-pitr`

Restores database to a specific point in time.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Request Body
```json
{
  "recovery_time_target_unix": 1701388800
}
```

- `recovery_time_target_unix` (integer, required) - Unix timestamp for restore point

#### Response (201)
```json
{}
```

#### Example
```bash
curl -X POST "https://api.supabase.com/v1/projects/my-project/database/backups/restore-pitr" \
  -H "Authorization: Bearer sbp_..." \
  -H "Content-Type: application/json" \
  -d '{
    "recovery_time_target_unix": 1701388800
  }'
```

#### Notes
- PITR available on Pro, Team, and Enterprise plans
- Requires Small compute add-on or larger
- RPO (Recovery Point Objective): ~2 minutes
- Pro plan: 7 days retention
- Enterprise plan: 30 days retention

---

## Read Replicas

### Setup Read Replica

**POST** `/v1/projects/{ref}/read-replicas/setup`

**Status**: Beta

Creates a read replica in specified region.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Request Body
```json
{
  "read_replica_region": "us-west-1"
}
```

- `read_replica_region` (enum, required) - Geographic region for replica

#### Available Regions
- `us-east-1` - US East (N. Virginia)
- `us-west-1` - US West (N. California)
- `eu-west-1` - Europe (Ireland)
- `ap-southeast-1` - Asia Pacific (Singapore)
- `ap-northeast-1` - Asia Pacific (Tokyo)
- Additional regions available

#### Response (201)
```json
{}
```

#### Example
```bash
curl -X POST "https://api.supabase.com/v1/projects/my-project/read-replicas/setup" \
  -H "Authorization: Bearer sbp_..." \
  -H "Content-Type: application/json" \
  -d '{
    "read_replica_region": "eu-west-1"
  }'
```

---

### Remove Read Replica

**POST** `/v1/projects/{ref}/read-replicas/remove`

**Status**: Beta

Removes an active read replica.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Request Body
```json
{
  "database_identifier": "replica-db-123"
}
```

- `database_identifier` (string, required) - Identifier for the replica to remove

#### Response (201)
```json
{}
```

#### Example
```bash
curl -X POST "https://api.supabase.com/v1/projects/my-project/read-replicas/remove" \
  -H "Authorization: Bearer sbp_..." \
  -H "Content-Type: application/json" \
  -d '{
    "database_identifier": "replica-db-123"
  }'
```

---

## Database Metadata

### Get Database Context

**GET** `/v1/projects/{ref}/database/context`

**Status**: Experimental (Deprecated)

Retrieves database schema metadata.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Response (200)
```json
{
  "databases": [
    {
      "name": "postgres",
      "schemas": [
        {
          "name": "public"
        },
        {
          "name": "auth"
        }
      ]
    }
  ]
}
```

#### Example
```bash
curl "https://api.supabase.com/v1/projects/my-project/database/context" \
  -H "Authorization: Bearer sbp_..."
```

#### Notes
- **Experimental**: Subject to change or removal
- Use with caution
- Consider using TypeScript types generation instead

---

## TypeScript Types

### Generate TypeScript Types

**GET** `/v1/projects/{ref}/types/typescript`

Returns TypeScript type definitions for your database schema.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Query Parameters
- `included_schemas` (string, optional) - Comma-separated schema names

#### Response (200)
```json
{
  "types": "export type Database = {\n  public: {\n    Tables: {\n      users: {\n        Row: {\n          id: string\n          email: string\n        }\n      }\n    }\n  }\n}"
}
```

#### Example
```bash
curl "https://api.supabase.com/v1/projects/my-project/types/typescript?included_schemas=public,auth" \
  -H "Authorization: Bearer sbp_..."
```

#### Usage with supabase-js
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabase = createClient<Database>(url, anonKey)
```

---

## Database Webhooks

### Enable Database Webhooks

**POST** `/v1/projects/{ref}/database/webhooks/enable`

Enables Database Webhooks functionality on the project.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Response (200)
```json
{}
```

#### Example
```bash
curl -X POST "https://api.supabase.com/v1/projects/my-project/database/webhooks/enable" \
  -H "Authorization: Bearer sbp_..."
```

---

## JIT (Just-In-Time) Access

### Authorize JIT Access

**POST** `/v1/projects/{ref}/database/jit`

Authorizes user to assume a specific database role.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Request Body
```json
{
  "user_id": "user-123",
  "role": "postgres",
  "duration": 3600
}
```

#### Response (200)
```json
{
  "user_id": "user-123",
  "role": "postgres",
  "expires_at": "2023-12-01T11:30:00Z"
}
```

---

### Get JIT Mappings

**GET** `/v1/projects/{ref}/database/jit`

Retrieves user-id to role mappings.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Response (200)
```json
{
  "mappings": [
    {
      "user_id": "user-123",
      "role": "postgres",
      "expires_at": "2023-12-01T11:30:00Z"
    }
  ]
}
```

---

### List All JIT Mappings

**GET** `/v1/projects/{ref}/database/jit/list`

Lists all JIT access mappings.

#### Response (200)
```json
{
  "mappings": [...]
}
```

---

### Update JIT Access

**PUT** `/v1/projects/{ref}/database/jit`

Modifies assignable roles and duration.

#### Request Body
```json
{
  "user_id": "user-123",
  "role": "postgres",
  "duration": 7200
}
```

#### Response (200)
```json
{}
```

---

### Delete JIT Access

**DELETE** `/v1/projects/{ref}/database/jit/{user_id}`

Revokes all JIT database access for a user.

#### Path Parameters
- `ref` (string, required) - Project reference
- `user_id` (string, required) - User identifier

#### Response (200)
```json
{}
```

---

## Maintenance & Utilities

### Disable Readonly Mode (Temporary)

**POST** `/v1/projects/{ref}/readonly/temporary-disable`

Disables readonly mode for 15 minutes.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Response (200)
```json
{}
```

---

### Get Readonly Mode Status

**GET** `/v1/projects/{ref}/readonly`

Retrieves current readonly mode status.

#### Response (200)
```json
{
  "readonly": false
}
```

---

### Create CLI Login Role

**POST** `/v1/projects/{ref}/cli/login-role`

Creates a temporary login role for CLI access.

#### Response (200)
```json
{
  "role": "cli_temp_role_abc123",
  "password": "temp_password_xyz"
}
```

---

### Delete CLI Login Roles

**DELETE** `/v1/projects/{ref}/cli/login-role`

Deletes all CLI login roles.

#### Response (200)
```json
{}
```

---

# Edge Functions API

## CRUD Operations

### List All Functions

**GET** `/v1/projects/{ref}/functions`

Retrieves all Edge Functions deployed to the project.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Response (200)
```json
[
  {
    "id": "func-123",
    "slug": "hello-world",
    "name": "Hello World Function",
    "status": "ACTIVE",
    "version": 5,
    "created_at": 1701388800,
    "updated_at": 1701475200,
    "verify_jwt": true,
    "import_map": true,
    "entrypoint_path": "index.ts",
    "import_map_path": "import_map.json",
    "ezbr_sha256": "abc123..."
  }
]
```

#### Fields
- `id` - Function identifier
- `slug` - Unique function slug
- `name` - Display name
- `status` - `ACTIVE`, `INACTIVE`, or `PENDING`
- `version` - Deployment version number
- `created_at` - Unix timestamp
- `updated_at` - Unix timestamp
- `verify_jwt` - JWT verification enabled
- `import_map` - Import map usage
- `entrypoint_path` - Main function file
- `import_map_path` - Import map file
- `ezbr_sha256` - Bundle hash

#### Example
```bash
curl "https://api.supabase.com/v1/projects/my-project/functions" \
  -H "Authorization: Bearer sbp_..."
```

---

### Get Function Details

**GET** `/v1/projects/{ref}/functions/{function_slug}`

Retrieves details for a specific function.

#### Path Parameters
- `ref` (string, required) - Project reference
- `function_slug` (string, required) - Function slug

#### Response (200)
```json
{
  "id": "func-123",
  "slug": "hello-world",
  "name": "Hello World Function",
  "status": "ACTIVE",
  "version": 5,
  "created_at": 1701388800,
  "updated_at": 1701475200,
  "verify_jwt": true,
  "import_map": true,
  "entrypoint_path": "index.ts",
  "import_map_path": "import_map.json",
  "ezbr_sha256": "abc123..."
}
```

#### Example
```bash
curl "https://api.supabase.com/v1/projects/my-project/functions/hello-world" \
  -H "Authorization: Bearer sbp_..."
```

---

### Get Function Body

**GET** `/v1/projects/{ref}/functions/{function_slug}/body`

Retrieves the source code for a function.

#### Path Parameters
- `ref` (string, required) - Project reference
- `function_slug` (string, required) - Function slug

#### Response (200)
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  return new Response(
    JSON.stringify({ message: "Hello World!" }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

#### Example
```bash
curl "https://api.supabase.com/v1/projects/my-project/functions/hello-world/body" \
  -H "Authorization: Bearer sbp_..."
```

---

### Deploy Function

**POST** `/v1/projects/{ref}/functions/deploy`

Deploys a new function or updates an existing one.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Query Parameters
- `slug` (string, optional) - Function slug (creates if not exists, updates if exists)
- `bundleOnly` (boolean, optional) - Return bundle metadata without deploying (default: false)

#### Request Format
`multipart/form-data`

#### Form Fields
- `metadata` (JSON, required) - Function metadata
- `file` (file, optional) - Function source files

#### Metadata Format
```json
{
  "entrypoint_path": "index.ts",
  "name": "My Test Function",
  "verify_jwt": true,
  "import_map": false
}
```

#### Response (201)
```json
{
  "id": "func-456",
  "slug": "my-func",
  "name": "My Test Function",
  "status": "ACTIVE",
  "version": 1,
  "created_at": 1701388800,
  "updated_at": 1701388800,
  "verify_jwt": true,
  "import_map": false,
  "entrypoint_path": "index.ts",
  "import_map_path": null,
  "ezbr_sha256": "def456..."
}
```

#### Example
```bash
curl -X POST "https://api.supabase.com/v1/projects/my-project/functions/deploy?slug=my-func" \
  -H "Authorization: Bearer sbp_..." \
  -F 'metadata={"entrypoint_path":"index.ts","name":"My Test"}' \
  -F 'file=@./function-code.zip'
```

#### Bulk Deployment Workflow

For deploying multiple functions atomically:

1. Deploy each function with `bundleOnly=1`
```bash
curl -X POST "https://api.supabase.com/v1/projects/my-project/functions/deploy?slug=func1&bundleOnly=1" \
  -H "Authorization: Bearer sbp_..." \
  -F 'metadata={...}' \
  -F 'file=@./func1.zip'
```

2. Collect all responses

3. Use bulk update endpoint to apply atomically

---

### Update Function

**PATCH** `/v1/projects/{ref}/functions/{function_slug}`

Updates function metadata or configuration.

#### Path Parameters
- `ref` (string, required) - Project reference
- `function_slug` (string, required) - Function slug

#### Request Body
```json
{
  "name": "Updated Function Name",
  "verify_jwt": false
}
```

#### Response (200)
```json
{
  "id": "func-123",
  "slug": "hello-world",
  "name": "Updated Function Name",
  "status": "ACTIVE",
  "version": 6,
  "verify_jwt": false,
  ...
}
```

#### Example
```bash
curl -X PATCH "https://api.supabase.com/v1/projects/my-project/functions/hello-world" \
  -H "Authorization: Bearer sbp_..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Function Name"
  }'
```

---

### Delete Function

**DELETE** `/v1/projects/{ref}/functions/{function_slug}`

Removes a function from the project.

#### Path Parameters
- `ref` (string, required) - Project reference
- `function_slug` (string, required) - Function slug

#### Response (200)
```json
{}
```

#### Example
```bash
curl -X DELETE "https://api.supabase.com/v1/projects/my-project/functions/hello-world" \
  -H "Authorization: Bearer sbp_..."
```

---

### Bulk Update Functions

**PUT** `/v1/projects/{ref}/functions`

Bulk creates or replaces functions. Operation is idempotent.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Request Body
```json
[
  {
    "slug": "func1",
    "name": "Function 1",
    "entrypoint_path": "index.ts",
    "verify_jwt": true
  },
  {
    "slug": "func2",
    "name": "Function 2",
    "entrypoint_path": "index.ts",
    "verify_jwt": false
  }
]
```

#### Response (200)
```json
{
  "functions": [
    {
      "id": "func-001",
      "slug": "func1",
      "name": "Function 1",
      "status": "ACTIVE",
      ...
    },
    {
      "id": "func-002",
      "slug": "func2",
      "name": "Function 2",
      "status": "ACTIVE",
      ...
    }
  ]
}
```

#### Example
```bash
curl -X PUT "https://api.supabase.com/v1/projects/my-project/functions" \
  -H "Authorization: Bearer sbp_..." \
  -H "Content-Type: application/json" \
  -d '[
    {
      "slug": "func1",
      "name": "Function 1"
    }
  ]'
```

---

## Function Invocation

### Invoke Edge Function

**POST** `https://{project_ref}.supabase.co/functions/v1/{function_name}`

Invokes a deployed Edge Function.

#### Authentication
- **anon key**: For public functions
- **User JWT**: For authenticated requests

#### Headers
- `Authorization: Bearer <anon_key_or_jwt>` (required)
- `Content-Type: application/json` (recommended)

#### Request Body
Any JSON payload that your function expects.

#### Response
Depends on your function implementation.

#### Example (cURL)
```bash
# Using anon key
curl -X POST "https://my-project.supabase.co/functions/v1/hello-world" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"name":"Functions"}'

# Local development
curl -X POST "http://localhost:54321/functions/v1/hello-world" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"name":"Local"}'
```

#### Example (JavaScript)
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, anonKey)

const { data, error } = await supabase.functions.invoke('hello-world', {
  method: 'POST',
  body: { name: 'Functions' }
})
```

#### Supported HTTP Methods
- GET
- POST
- PUT
- PATCH
- DELETE
- OPTIONS

#### Security Notes
- Use `verify_jwt: true` to enforce JWT verification
- Be cautious with `--no-verify-jwt` flag (allows unauthenticated access)
- Authorization header sets Auth context for RLS policies

---

## Function Secrets

### List All Secrets

**GET** `/v1/projects/{ref}/secrets`

Lists all secrets for Edge Functions.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Response (200)
```json
{
  "secrets": [
    {
      "name": "API_KEY",
      "value": "***"
    },
    {
      "name": "DATABASE_URL",
      "value": "***"
    }
  ]
}
```

---

### Bulk Delete Secrets

**DELETE** `/v1/projects/{ref}/secrets`

Deletes multiple secrets at once.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Request Body
```json
{
  "names": ["API_KEY", "OLD_SECRET"]
}
```

#### Response (200)
```json
{}
```

---

# Storage API

## Configuration

### Get Storage Configuration

**GET** `/v1/projects/{ref}/config/storage`

Retrieves storage configuration settings.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Response (200)
```json
{
  "file_size_limit": 52428800,
  "features": {
    "image_transformation": true
  }
}
```

#### Example
```bash
curl "https://api.supabase.com/v1/projects/my-project/config/storage" \
  -H "Authorization: Bearer sbp_..."
```

---

### Update Storage Configuration

**PATCH** `/v1/projects/{ref}/config/storage`

Updates storage configuration.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Request Body
```json
{
  "file_size_limit": 104857600
}
```

#### Response (200)
```json
{}
```

#### Example
```bash
curl -X PATCH "https://api.supabase.com/v1/projects/my-project/config/storage" \
  -H "Authorization: Bearer sbp_..." \
  -H "Content-Type: application/json" \
  -d '{
    "file_size_limit": 104857600
  }'
```

---

## Storage Buckets

### List Buckets

**GET** `/v1/projects/{ref}/config/storage/buckets`

Lists all storage buckets in the project.

#### Path Parameters
- `ref` (string, required) - Project reference

#### Response (200)
```json
{
  "buckets": [
    {
      "id": "avatars",
      "name": "avatars",
      "public": true,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z",
      "file_size_limit": 52428800,
      "allowed_mime_types": ["image/png", "image/jpeg"]
    },
    {
      "id": "documents",
      "name": "documents",
      "public": false,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z",
      "file_size_limit": null,
      "allowed_mime_types": null
    }
  ]
}
```

#### Example
```bash
curl "https://api.supabase.com/v1/projects/my-project/config/storage/buckets" \
  -H "Authorization: Bearer sbp_..."
```

---

## Storage REST API

The Storage REST API is accessed via your project URL, not the Management API base URL.

**Base URL**: `https://{project_ref}.supabase.co/storage/v1`

### Create Bucket

**POST** `/storage/v1/bucket`

Creates a new storage bucket.

#### Headers
- `Authorization: Bearer <service_role_key>` (required)
- `Content-Type: application/json`

#### Request Body
```json
{
  "name": "avatars",
  "public": true,
  "file_size_limit": 52428800,
  "allowed_mime_types": ["image/png", "image/jpeg", "image/gif"]
}
```

- `name` (string, required) - Bucket name (alphanumeric, hyphens, underscores)
- `public` (boolean, optional) - Public access (default: false)
- `file_size_limit` (integer, optional) - Max file size in bytes
- `allowed_mime_types` (array, optional) - Allowed MIME types

#### Response (200)
```json
{
  "name": "avatars"
}
```

#### Example
```bash
curl -X POST "https://my-project.supabase.co/storage/v1/bucket" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "avatars",
    "public": true
  }'
```

---

### List Buckets (Storage API)

**GET** `/storage/v1/bucket`

Lists all buckets.

#### Headers
- `Authorization: Bearer <service_role_key>`

#### Response (200)
```json
[
  {
    "id": "avatars",
    "name": "avatars",
    "owner": "user-123",
    "public": true,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
]
```

#### Example
```bash
curl "https://my-project.supabase.co/storage/v1/bucket" \
  -H "Authorization: Bearer eyJhbGc..."
```

---

### Get Bucket

**GET** `/storage/v1/bucket/{bucket_id}`

Retrieves a specific bucket's details.

#### Path Parameters
- `bucket_id` (string, required) - Bucket name

#### Response (200)
```json
{
  "id": "avatars",
  "name": "avatars",
  "owner": "user-123",
  "public": true,
  "file_size_limit": 52428800,
  "allowed_mime_types": ["image/*"],
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

---

### Update Bucket

**PUT** `/storage/v1/bucket/{bucket_id}`

Updates bucket configuration.

#### Path Parameters
- `bucket_id` (string, required) - Bucket name

#### Request Body
```json
{
  "public": false,
  "file_size_limit": 104857600
}
```

#### Response (200)
```json
{
  "message": "Successfully updated"
}
```

---

### Empty Bucket

**POST** `/storage/v1/bucket/{bucket_id}/empty`

Removes all objects from a bucket.

#### Path Parameters
- `bucket_id` (string, required) - Bucket name

#### Response (200)
```json
{
  "message": "Successfully emptied"
}
```

#### Example
```bash
curl -X POST "https://my-project.supabase.co/storage/v1/bucket/avatars/empty" \
  -H "Authorization: Bearer eyJhbGc..."
```

---

### Delete Bucket

**DELETE** `/storage/v1/bucket/{bucket_id}`

Deletes a bucket. Bucket must be empty.

#### Path Parameters
- `bucket_id` (string, required) - Bucket name

#### Response (200)
```json
{
  "message": "Successfully deleted"
}
```

#### Example
```bash
# First empty the bucket
curl -X POST "https://my-project.supabase.co/storage/v1/bucket/avatars/empty" \
  -H "Authorization: Bearer eyJhbGc..."

# Then delete it
curl -X DELETE "https://my-project.supabase.co/storage/v1/bucket/avatars" \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## Object Operations

### Upload File

**POST** `/storage/v1/object/{bucket_name}/{file_path}`

Uploads a file to a bucket.

#### Path Parameters
- `bucket_name` (string, required) - Bucket name
- `file_path` (string, required) - Destination path in bucket

#### Headers
- `Authorization: Bearer <token>`
- `Content-Type: <file_mime_type>`
- `x-upsert: true` (optional) - Overwrite if exists

#### Request Body
Binary file data

#### Response (200)
```json
{
  "Key": "avatars/user1/profile.jpg"
}
```

#### Example
```bash
curl -X POST "https://my-project.supabase.co/storage/v1/object/avatars/user1/profile.jpg" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: image/jpeg" \
  --data-binary "@profile.jpg"
```

---

### Download File

**GET** `/storage/v1/object/{bucket_name}/{file_path}`

Downloads a file from a bucket.

#### Path Parameters
- `bucket_name` (string, required) - Bucket name
- `file_path` (string, required) - File path in bucket

#### Response (200)
Binary file data

#### Example
```bash
curl "https://my-project.supabase.co/storage/v1/object/avatars/user1/profile.jpg" \
  -H "Authorization: Bearer eyJhbGc..." \
  -o downloaded-profile.jpg
```

---

### Delete File

**DELETE** `/storage/v1/object/{bucket_name}/{file_path}`

Deletes a file from a bucket.

#### Path Parameters
- `bucket_name` (string, required) - Bucket name
- `file_path` (string, required) - File path in bucket

#### Response (200)
```json
{
  "message": "Successfully deleted"
}
```

---

### List Files

**POST** `/storage/v1/object/list/{bucket_name}`

Lists files in a bucket or folder.

#### Path Parameters
- `bucket_name` (string, required) - Bucket name

#### Request Body
```json
{
  "prefix": "user1/",
  "limit": 100,
  "offset": 0,
  "sortBy": {
    "column": "name",
    "order": "asc"
  },
  "search": "profile"
}
```

- `prefix` (string, optional) - Filter by folder prefix
- `limit` (integer, optional) - Max results (default: 100)
- `offset` (integer, optional) - Pagination offset
- `sortBy` (object, optional) - Sort configuration
- `search` (string, optional) - Search term

#### Response (200)
```json
[
  {
    "name": "profile.jpg",
    "id": "uuid-123",
    "updated_at": "2023-01-01T00:00:00Z",
    "created_at": "2023-01-01T00:00:00Z",
    "last_accessed_at": "2023-01-01T00:00:00Z",
    "metadata": {
      "size": 102400,
      "mimetype": "image/jpeg"
    }
  }
]
```

---

## Public URLs

### Get Public URL

For public buckets, files are accessible via:

```
https://{project_ref}.supabase.co/storage/v1/object/public/{bucket_name}/{file_path}
```

#### Example
```
https://my-project.supabase.co/storage/v1/object/public/avatars/user1/profile.jpg
```

No authentication required for public buckets.

---

### Create Signed URL

**POST** `/storage/v1/object/sign/{bucket_name}/{file_path}`

Creates a temporary signed URL for private bucket access.

#### Path Parameters
- `bucket_name` (string, required) - Bucket name
- `file_path` (string, required) - File path

#### Request Body
```json
{
  "expiresIn": 3600
}
```

- `expiresIn` (integer, required) - Expiration time in seconds

#### Response (200)
```json
{
  "signedURL": "https://my-project.supabase.co/storage/v1/object/sign/documents/report.pdf?token=abc123..."
}
```

#### Example
```bash
curl -X POST "https://my-project.supabase.co/storage/v1/object/sign/documents/report.pdf" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "expiresIn": 3600
  }'
```

---

## Image Transformation

For image buckets, Supabase supports on-the-fly transformations:

```
https://{project_ref}.supabase.co/storage/v1/render/image/public/{bucket_name}/{file_path}?width=300&height=300
```

### Transformation Parameters
- `width` - Resize width
- `height` - Resize height
- `quality` - JPEG quality (1-100)
- `format` - Output format (webp, jpg, png)

#### Example
```
https://my-project.supabase.co/storage/v1/render/image/public/avatars/user1/profile.jpg?width=200&height=200&quality=80
```

---

# Additional Resources

## Official Documentation
- **Management API Reference**: https://supabase.com/docs/reference/api
- **OpenAPI Specification**: https://api.supabase.com/api/v1-json
- **Interactive API Explorer**: https://api.supabase.com/api/v1

## Client Libraries
- **JavaScript/TypeScript**: `@supabase/supabase-js`
- **Python**: `supabase-py`
- **Dart/Flutter**: `supabase-flutter`
- **C#**: `supabase-csharp`
- **Swift**: `supabase-swift`
- **Kotlin**: `supabase-kt`

## Support
- **GitHub Discussions**: https://github.com/orgs/supabase/discussions
- **Discord**: https://discord.supabase.com
- **Documentation**: https://supabase.com/docs

---

## Notes

### Beta Features
Endpoints marked as "Beta" are subject to change. Use with caution in production.

### Experimental Features
Endpoints marked as "Experimental" may be removed without notice. Not recommended for production use.

### Rate Limiting
- **Global**: 60 requests/minute per access token
- **Cumulative**: Applies across all Management API endpoints
- **Response**: HTTP 429 when exceeded
- **Best Practice**: Implement exponential backoff

### Authentication Best Practices
1. Store tokens securely (environment variables, secrets manager)
2. Use OAuth2 for third-party integrations
3. Rotate personal access tokens regularly
4. Use scope-limited tokens when possible
5. Never commit tokens to version control

### Error Handling
Always check response status codes and implement proper error handling:

```javascript
try {
  const response = await fetch(url, options)

  if (!response.ok) {
    if (response.status === 429) {
      // Rate limited - implement backoff
    } else if (response.status === 401) {
      // Authentication failed
    } else if (response.status === 403) {
      // Insufficient permissions
    }
  }

  const data = await response.json()
  return data
} catch (error) {
  // Network error or JSON parsing error
  console.error('API request failed:', error)
}
```

---

**Last Updated**: October 29, 2025
**API Version**: v1
**Document Version**: 1.0.0
