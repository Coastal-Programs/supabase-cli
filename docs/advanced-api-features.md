# Supabase Management API - Advanced Features Documentation

**Last Updated:** January 2025
**API Version:** v1
**Base URL:** `https://api.supabase.com/v1`

## Table of Contents

1. [Authentication & Rate Limits](#authentication--rate-limits)
2. [Branches API (Preview Environments)](#branches-api-preview-environments)
3. [Migrations API](#migrations-api)
4. [Integrations API](#integrations-api)
5. [Edge Functions API](#edge-functions-api)
6. [Database Webhooks](#database-webhooks)
7. [OAuth Scopes](#oauth-scopes)
8. [Pricing Tier Availability](#pricing-tier-availability)

---

## Authentication & Rate Limits

### Authentication Methods

All API requests require authentication via the `Authorization` header:

```
Authorization: Bearer <access_token>
```

**Two authentication methods are supported:**

1. **Personal Access Tokens (PAT)**: Long-lived tokens manually generated for API access. Ideal for automation workflows.
2. **OAuth2**: Generate tokens on behalf of users for third-party applications managing Supabase projects.

### Rate Limits

- **60 requests per minute per user**
- Applied cumulatively across all requests with your tokens
- Exceeding the limit results in **HTTP 429** responses for the next minute
- All requests must be made over **HTTPS**

---

## Branches API (Preview Environments)

Database branching allows you to create isolated preview environments for testing without affecting production data.

### Key Features

- Each branch is a **separate Supabase instance** with its own API credentials
- Branches do **not inherit production data** for security
- Two types: **Preview Branches** (temporary) and **Persistent Branches** (long-lived)
- GitHub integration for automatic branch creation or manual via Dashboard (Beta)

### Endpoints

#### 1. List Branches

```http
GET /v1/projects/{ref}/branches
```

**Parameters:**
- `ref` (path, required): Project reference ID

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "project_ref": "string",
    "status": "ACTIVE",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z",
    "git_branch": "feature/new-feature",
    "persistent": true
  }
]
```

**Response Codes:** 200, 401, 403, 429, 500

---

#### 2. Create Branch

```http
POST /v1/projects/{ref}/branches
```

**Parameters:**
- `ref` (path, required): Project reference ID

**Request Body:**
```json
{
  "branch_name": "feature-branch",
  "git_branch": "feature/new-feature",
  "is_default": false,
  "persistent": true,
  "region": "us-east-1",
  "desired_instance_size": "t4g.small",
  "release_channel": "stable",
  "postgres_engine": "postgres-15",
  "secrets": {
    "API_KEY": "value"
  },
  "with_data": false,
  "notify_url": "https://example.com/webhook"
}
```

**Response:** Branch object with ID, name, status, timestamps

**Response Codes:** 201, 401, 403, 429, 500

---

#### 3. Get Branch Details

```http
GET /v1/projects/{ref}/branches/{name}
```

**Parameters:**
- `ref` (path, required): Project reference ID
- `name` (path, required): Branch name

**Response:** Single branch object with full details

**Response Codes:** 200, 401, 403, 404, 429, 500

---

#### 4. Delete Branch

```http
DELETE /v1/branches/{branch_id_or_ref}
```

**Parameters:**
- `branch_id_or_ref` (path, required): Branch ID or reference

**Response:**
```json
{
  "message": "Branch deleted successfully"
}
```

**Response Codes:** 200, 401, 403, 404, 429, 500

---

#### 5. Push a Branch

```http
POST /v1/projects/{ref}/branches/{name}/push
```

**Description:** Pushes changes to the specified branch

**Parameters:**
- `ref` (path, required): Project reference ID
- `name` (path, required): Branch name

**Request Body:**
```json
{
  "commit_message": "Add new feature"
}
```

**Response:** Updated branch object with new status

**Response Codes:** 201, 401, 403, 429, 500

---

#### 6. Merge a Branch

```http
POST /v1/projects/{ref}/branches/{name}/merge
```

**Description:** Merges branch changes into production. Triggers automatic deployment workflow with these steps:
1. Clone (checkout git branch)
2. Pull (retrieve migrations)
3. Health (verify services)
4. Configure (update configs)
5. Migrate (apply migrations)
6. Seed (populate data)
7. Deploy (push Edge Functions)

**Parameters:**
- `ref` (path, required): Project reference ID
- `name` (path, required): Branch name

**Request Body:**
```json
{
  "notify_url": "https://example.com/webhook",
  "auto_commit": true
}
```

**Response:** Merged branch object

**Response Codes:** 201, 401, 403, 429, 500

---

#### 7. Reset a Branch

```http
POST /v1/projects/{ref}/branches/{name}/reset
```

**Description:** Resets branch to a previous state

**Parameters:**
- `ref` (path, required): Project reference ID
- `name` (path, required): Branch name

**Request Body:**
```json
{
  "recovery_time_target_unix": 1705320000
}
```

**Response:** Reset branch object

**Response Codes:** 201, 401, 403, 429, 500

---

#### 8. Get Branch Diff (Beta)

```http
GET /v1/branches/{branch_id_or_ref}/diff
```

**Description:** Compare branch differences

**Parameters:**
- `branch_id_or_ref` (path, required): Branch ID or reference

**Response:** Diff object showing changes

**Response Codes:** 200, 401, 403, 429, 500

---

#### 9. Update Branch Configuration

```http
PATCH /v1/projects/{ref}/branches/{name}/config
```

**Description:** Update branch settings

**Parameters:**
- `ref` (path, required): Project reference ID
- `name` (path, required): Branch name

**Request Body:**
```json
{
  "branch_name": "new-name",
  "git_branch": "feature/updated",
  "persistent": true
}
```

**Response:** Updated branch object

**Response Codes:** 200, 401, 403, 429, 500

---

#### 10. Disable Preview Branching

```http
DELETE /v1/projects/{ref}/branches
```

**Description:** Disables preview branching for the entire project

**Parameters:**
- `ref` (path, required): Project reference ID

**Response Codes:** 200, 401, 403, 429, 500

---

## Migrations API

Database migrations track and apply schema changes across environments.

### Endpoints

#### 1. List Migrations

```http
GET /v1/projects/{ref}/database/migrations
```

**Status:** Beta (OAuth partners only)

**Parameters:**
- `ref` (path, required): Project reference ID

**Response:**
```json
[
  {
    "version": "20250115103000",
    "name": "add_users_table"
  },
  {
    "version": "20250115104500",
    "name": "add_posts_table"
  }
]
```

**Response Codes:** 200, 401, 403, 429, 500

**Example Request:**
```bash
curl -X GET "https://api.supabase.com/v1/projects/abc123/database/migrations" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### 2. Apply Migration

```http
POST /v1/projects/{ref}/database/migrations
```

**Status:** Beta (OAuth partners only)

**Description:** Applies a migration immediately to the database

**Parameters:**
- `ref` (path, required): Project reference ID

**Request Body:**
```json
{
  "query": "CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT);",
  "name": "add_users_table"
}
```

**Response:**
```json
{}
```

**Response Codes:** 200, 401, 403, 429, 500

**Example Request:**
```bash
curl -X POST "https://api.supabase.com/v1/projects/abc123/database/migrations" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT);",
    "name": "add_users_table"
  }'
```

---

#### 3. Upsert Migration

```http
PUT /v1/projects/{ref}/database/migrations
```

**Status:** Beta (OAuth partners only)

**Description:** Creates or updates a migration **without applying it**. Useful for preparing migrations to be applied later.

**Parameters:**
- `ref` (path, required): Project reference ID

**Request Body:**
```json
{
  "query": "ALTER TABLE users ADD COLUMN created_at TIMESTAMP;",
  "name": "add_created_at_column"
}
```

**Response:**
```json
{}
```

**Response Codes:** 200, 401, 403, 429, 500

**Example Request:**
```bash
curl -X PUT "https://api.supabase.com/v1/projects/abc123/database/migrations" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ALTER TABLE users ADD COLUMN created_at TIMESTAMP;",
    "name": "add_created_at_column"
  }'
```

---

#### 4. Run Query (Beta)

```http
POST /v1/projects/{ref}/database/query
```

**Status:** Beta (OAuth partners only)

**Description:** Execute raw SQL queries

**Parameters:**
- `ref` (path, required): Project reference ID

**Request Body:**
```json
{
  "query": "SELECT * FROM users WHERE email = 'test@example.com';",
  "read_only": true
}
```

**Response:** Query results

**Response Codes:** 200, 401, 403, 429, 500

---

## Integrations API

Manage third-party authentication providers and OAuth integrations.

### Third-Party Auth Integrations

#### 1. Create Integration

```http
POST /v1/projects/{ref}/config/auth/third-party-auth
```

**Description:** Add third-party authentication provider (GitHub, Google, etc.)

**Parameters:**
- `ref` (path, required): Project reference ID

**Request Body:**
```json
{
  "provider": "github",
  "client_id": "your-client-id",
  "client_secret": "your-client-secret",
  "redirect_uri": "https://yourapp.com/callback",
  "enabled": true
}
```

**Response:** Integration object with ID and configuration

**Response Codes:** 201, 401, 403, 429, 500

---

#### 2. List Integrations

```http
GET /v1/projects/{ref}/config/auth/third-party-auth
```

**Parameters:**
- `ref` (path, required): Project reference ID

**Response:**
```json
[
  {
    "id": "tpa_123",
    "provider": "github",
    "enabled": true,
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

**Response Codes:** 200, 401, 403, 429, 500

---

#### 3. Get Integration Details

```http
GET /v1/projects/{ref}/config/auth/third-party-auth/{tpa_id}
```

**Parameters:**
- `ref` (path, required): Project reference ID
- `tpa_id` (path, required): Third-party auth integration ID

**Response:** Single integration object with full configuration

**Response Codes:** 200, 401, 403, 404, 429, 500

---

#### 4. Delete Integration

```http
DELETE /v1/projects/{ref}/config/auth/third-party-auth/{tpa_id}
```

**Parameters:**
- `ref` (path, required): Project reference ID
- `tpa_id` (path, required): Third-party auth integration ID

**Response:**
```json
{
  "message": "Integration removed successfully"
}
```

**Response Codes:** 200, 401, 403, 404, 429, 500

---

### Building OAuth Integrations

To build a Supabase integration with OAuth2:

1. **Create OAuth App** in organization settings
2. **Configure scopes** (read/write permissions for specific resources)
3. **Implement OAuth flow** to get authorization from users
4. **Use access tokens** to call Management API on behalf of users

**Resources:**
- Guide: https://supabase.com/docs/guides/integrations/build-a-supabase-integration
- OAuth Scopes: https://supabase.com/docs/guides/integrations/build-a-supabase-integration/oauth-scopes
- Partners Marketplace: https://supabase.com/docs/guides/integrations/supabase-marketplace

---

## Edge Functions API

Deploy and manage serverless Edge Functions globally.

### Endpoints

#### 1. List Functions

```http
GET /v1/projects/{ref}/functions
```

**Parameters:**
- `ref` (path, required): Project reference ID

**Response:**
```json
[
  {
    "id": "func_123",
    "slug": "hello-world",
    "name": "Hello World",
    "status": "ACTIVE",
    "version": 5,
    "verify_jwt": false,
    "import_map": false,
    "entrypoint_path": "index.ts",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:35:00Z"
  }
]
```

**Response Codes:** 200, 401, 403, 429, 500

---

#### 2. Deploy Function

```http
POST /v1/projects/{ref}/functions/deploy
```

**Description:** Creates or updates a function. Use `bundleOnly=1` to bundle without deploying (for bulk updates).

**Parameters:**
- `ref` (path, required): Project reference ID
- `slug` (query, optional): Function identifier
- `bundleOnly` (query, optional): Boolean to bundle without deployment

**Request Body (multipart/form-data):**
```
file[]: [file contents]
metadata: {
  "name": "Hello World",
  "verify_jwt": false,
  "import_map": false,
  "entrypoint_path": "index.ts"
}
```

**Response:**
```json
{
  "id": "func_123",
  "slug": "hello-world",
  "name": "Hello World",
  "status": "ACTIVE",
  "version": 1,
  "verify_jwt": false,
  "import_map": false,
  "entrypoint_path": "index.ts",
  "ezbr_sha256": "abc123..."
}
```

**Response Codes:** 201, 401, 403, 429, 500

**Example (with bundleOnly):**
```bash
curl -X POST "https://api.supabase.com/v1/projects/abc123/functions/deploy?bundleOnly=1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file[]=@./index.ts" \
  -F 'metadata={"name":"Hello World"}'
```

---

#### 3. Bulk Update Functions

```http
PUT /v1/projects/{ref}/functions
```

**Description:** Atomically create or replace multiple functions. **Recommended workflow:**
1. Deploy each function with `bundleOnly=1`
2. Collect responses
3. Call bulk update to deploy all at once

**Parameters:**
- `ref` (path, required): Project reference ID

**Request Body:**
```json
[
  {
    "slug": "hello-world",
    "name": "Hello World",
    "verify_jwt": false,
    "import_map": false,
    "entrypoint_path": "index.ts",
    "ezbr_sha256": "abc123..."
  },
  {
    "slug": "goodbye-world",
    "name": "Goodbye World",
    "verify_jwt": true,
    "import_map": false,
    "entrypoint_path": "index.ts",
    "ezbr_sha256": "def456..."
  }
]
```

**Response:** Array of updated function objects

**Response Codes:** 200, 401, 403, 429, 500

---

#### 4. Get Function Details

```http
GET /v1/projects/{ref}/functions/{function_slug}
```

**Parameters:**
- `ref` (path, required): Project reference ID
- `function_slug` (path, required): Function slug/identifier

**Response:** Single function object with metadata

**Response Codes:** 200, 401, 403, 404, 429, 500

---

#### 5. Get Function Body

```http
GET /v1/projects/{ref}/functions/{function_slug}/body
```

**Description:** Retrieve the source code of a function

**Parameters:**
- `ref` (path, required): Project reference ID
- `function_slug` (path, required): Function slug/identifier

**Response:** Function source code

**Response Codes:** 200, 401, 403, 404, 429, 500

---

#### 6. Delete Function

```http
DELETE /v1/projects/{ref}/functions/{function_slug}
```

**Parameters:**
- `ref` (path, required): Project reference ID
- `function_slug` (path, required): Function slug/identifier

**Response:**
```json
{
  "message": "Function deleted successfully"
}
```

**Response Codes:** 200, 401, 403, 404, 429, 500

---

## Database Webhooks

Send real-time data to external systems when table events occur.

### Features

- **Event Types:** INSERT, UPDATE, DELETE
- **Built on pg_net:** Asynchronous, won't block database operations
- **Payload Formats:** Automatic JSON generation with old/new record data
- **HTTP Methods:** POST or GET requests
- **Monitoring:** Logs stored in `net` schema

### Payload Structures

**INSERT:**
```json
{
  "type": "INSERT",
  "table": "users",
  "schema": "public",
  "record": {
    "id": 1,
    "email": "user@example.com"
  },
  "old_record": null
}
```

**UPDATE:**
```json
{
  "type": "UPDATE",
  "table": "users",
  "schema": "public",
  "record": {
    "id": 1,
    "email": "newemail@example.com"
  },
  "old_record": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**DELETE:**
```json
{
  "type": "DELETE",
  "table": "users",
  "schema": "public",
  "record": null,
  "old_record": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### Management API Endpoint

#### Enable Database Webhooks

```http
POST /v1/projects/{ref}/database/webhooks/enable
```

**Status:** Beta

**Description:** Enables Database Webhooks feature on the project

**Parameters:**
- `ref` (path, required): Project reference ID

**Response:**
```json
{}
```

**Response Codes:** 201, 401, 403, 429, 500

**Example Request:**
```bash
curl -X POST "https://api.supabase.com/v1/projects/abc123/database/webhooks/enable" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Creating Webhooks

After enabling, webhooks are created via:

1. **Dashboard:** Navigate to Database Webhooks section
   - Name your webhook
   - Select target table
   - Choose events (INSERT, UPDATE, DELETE)

2. **SQL:** Create triggers using `supabase_functions.http_request()`

**SQL Example:**
```sql
CREATE OR REPLACE FUNCTION notify_webhook()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM supabase_functions.http_request(
    'https://your-endpoint.com/webhook',
    'POST',
    '{"Content-Type": "application/json"}',
    row_to_json(NEW)::text,
    5000
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_insert_webhook
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION notify_webhook();
```

### Local Development

For Docker-based local development, use `host.docker.internal` instead of `localhost`:

```
http://host.docker.internal:54321/functions/v1/function-name
```

---

## OAuth Scopes

When building OAuth integrations, specify scopes for granular access control.

### Scope Format

All scopes have **read** and/or **write** permissions:
- `scope:read` - View-only access
- `scope:write` - Create/modify/delete access
- `scope:all` - Both read and write

### Available Scopes

#### Environment (Branches)
- **environment:read** - Retrieve branches in a project
- **environment:write** - Create, update, or delete branches

#### Database
- **database:read** - Access database config, pooler settings, SSL enforcement
- **database:write** - Enable webhooks, create SQL queries, create PITR backups

#### Projects
- **projects:read** - View project details
- **projects:write** - Manage projects, including database upgrades

#### Secrets
- **secrets:read** - View API keys and secrets
- **secrets:write** - Create/update/delete secrets

#### Functions
- **functions:read** - List and view Edge Functions
- **functions:write** - Deploy and manage Edge Functions

#### Migrations
- **migrations:read** - List migration history (via database:read)
- **migrations:write** - Apply migrations (via database:write)

#### Analytics
- **analytics:read** - Access logs and usage metrics
- **analytics:write** - Modify analytics configurations

### Example OAuth App Configuration

```json
{
  "name": "My Integration",
  "scopes": [
    "environment:read",
    "environment:write",
    "database:read",
    "migrations:write",
    "functions:all"
  ],
  "redirect_uris": [
    "https://myapp.com/oauth/callback"
  ]
}
```

---

## Pricing Tier Availability

### Feature Availability by Plan

**Branches (Preview Environments):**
- Availability: Documentation does not specify tier restrictions
- Note: Currently in Beta for dashboard management
- GitHub integration and CLI available

**Migrations API:**
- **Status:** Beta - OAuth partners only
- Requires partnership approval to access
- Apply for Partners program to list integration in marketplace

**Database Webhooks:**
- **Status:** Beta
- Availability: Not specified by tier in current docs
- Enabled per-project via API

**Edge Functions:**
- Free tier: Limited invocations
- Pro tier: Higher limits
- Enterprise: Custom limits
- Deployment via API available on all tiers

**Third-Party Auth:**
- Available on all tiers
- OAuth integration development requires OAuth app creation

### Beta Feature Access

Several advanced features are marked as **Beta** and may have restricted access:

- ✅ **Generally Available Beta:** Database Webhooks, Branch Diff
- 🔒 **OAuth Partners Only:** Migrations API (List, Apply, Upsert), Database Query API

To access partner-only features:
1. Build an integration using OAuth2
2. Apply to Partners program
3. Get approved for marketplace listing
4. Gain access to restricted beta endpoints

---

## Additional Resources

### Documentation
- **Management API Reference:** https://supabase.com/docs/reference/api/introduction
- **OpenAPI Spec:** https://api.supabase.com/api/v1
- **Branching Guide:** https://supabase.com/docs/guides/deployment/branching
- **Migrations Guide:** https://supabase.com/docs/guides/deployment/database-migrations
- **Edge Functions Guide:** https://supabase.com/docs/guides/functions
- **Database Webhooks:** https://supabase.com/docs/guides/database/webhooks

### Integration Development
- **Build Integration Guide:** https://supabase.com/docs/guides/integrations/build-a-supabase-integration
- **OAuth Scopes:** https://supabase.com/docs/guides/integrations/build-a-supabase-integration/oauth-scopes
- **Marketplace:** https://supabase.com/docs/guides/integrations/supabase-marketplace

### CLI Reference
- **Branches CLI:** https://supabase.com/docs/reference/cli/supabase-branches
- **Migrations CLI:** https://supabase.com/docs/reference/cli/supabase-migration
- **Functions CLI:** https://supabase.com/docs/reference/cli/supabase-functions

---

## Notes for Implementation

### Best Practices

1. **Branches:**
   - Always use persistent branches for long-lived feature development
   - Branches don't include production data by default (security feature)
   - Test merge operations in preview environments first

2. **Migrations:**
   - Use versioned migration naming (timestamp-based)
   - Test migrations on branches before applying to production
   - Use upsert for preparing migrations without immediate application

3. **Edge Functions:**
   - Use bulk update for deploying multiple functions atomically
   - Bundle first with `bundleOnly=1` for validation
   - Monitor deployment status via function object `status` field

4. **Webhooks:**
   - Use async pg_net to prevent blocking database operations
   - Monitor webhook logs in `net` schema
   - Implement retry logic in receiving endpoints

5. **OAuth:**
   - Request minimum scopes required for your integration
   - Use refresh tokens to maintain long-term access
   - Handle rate limits (60 req/min) with exponential backoff

### Error Handling

All endpoints return standard HTTP status codes:
- **200/201:** Success
- **401:** Unauthorized (invalid/missing token)
- **403:** Forbidden (insufficient permissions/scopes)
- **404:** Not found
- **429:** Rate limit exceeded
- **500:** Server error

Implement retry logic with exponential backoff for 429 and 500 errors.

---

**End of Documentation**
