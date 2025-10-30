# Supabase Management API - Core Endpoints Documentation

**Research Date**: October 28, 2025
**API Base URL**: `https://api.supabase.com/v1`
**API Version**: v1

## Table of Contents

1. [Authentication](#authentication)
2. [Rate Limits](#rate-limits)
3. [Projects API](#projects-api)
4. [Organizations API](#organizations-api)
5. [Authentication Configuration API](#authentication-configuration-api)
6. [Available Regions](#available-regions)
7. [Error Responses](#error-responses)

---

## Authentication

All Management API requests require authentication using a Bearer token.

### Authentication Methods

1. **Personal Access Tokens (PAT)**
   - Long-lived tokens manually generated
   - Useful for automating workflows
   - Generate at: `https://supabase.com/dashboard/account/tokens`

2. **OAuth2**
   - For third-party applications
   - Generates tokens on behalf of Supabase users
   - Allows applications to create/manage projects

### Request Headers

```http
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
Content-Type: application/json
```

### Example Request

```bash
curl -X GET "https://api.supabase.com/v1/projects" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Rate Limits

- **Rate Limit**: 60 requests per minute per user
- **Scope**: Applies cumulatively across all requests with your personal access tokens
- **Exceeded**: Returns HTTP 429 (Too Many Requests)

---

## Projects API

### 1. List All Projects

Get all projects accessible to the authenticated user.

**Endpoint**: `GET /v1/projects`

**Authentication**: Required

**Parameters**: None

**Response**: `200 OK`

```json
[
  {
    "id": "project-uuid",
    "organization_id": "org-uuid",
    "name": "My Project",
    "region": "us-east-1",
    "created_at": "2023-03-29T16:32:59Z",
    "inserted_at": "2023-03-29T16:32:59Z",
    "status": "ACTIVE_HEALTHY",
    "database": {
      "host": "db.project-ref.supabase.co",
      "port": 5432,
      "version": "15.1.0"
    },
    "ref": "project-ref"
  }
]
```

**Project Status Values**:
- `ACTIVE_HEALTHY` - Project is running normally
- `ACTIVE_UNHEALTHY` - Project is running but has issues
- `COMING_UP` - Project is starting
- `GOING_DOWN` - Project is shutting down
- `PAUSED` - Project is paused
- `RESTORING` - Project is being restored from backup
- `UPGRADING` - Project is being upgraded

**Example**:

```bash
curl -X GET "https://api.supabase.com/v1/projects" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**TypeScript Interface** (already implemented in `src/supabase.ts`):

```typescript
export interface Project {
  created_at: string
  database: {
    host: string
    port: number
    version: string
  }
  id: string
  inserted_at: string
  name: string
  organization_id: string
  ref: string
  region: string
  status: ProjectStatus
}

export type ProjectStatus =
  | 'ACTIVE_HEALTHY'
  | 'ACTIVE_UNHEALTHY'
  | 'COMING_UP'
  | 'GOING_DOWN'
  | 'PAUSED'
  | 'RESTORING'
  | 'UPGRADING'
```

---

### 2. Get Project Details

Get details for a specific project.

**Endpoint**: `GET /v1/projects/{ref}`

**Authentication**: Required

**Parameters**:
- `ref` (path, required) - Project reference identifier

**Response**: `200 OK`

```json
{
  "id": "project-uuid",
  "organization_id": "org-uuid",
  "name": "My Project",
  "region": "us-east-1",
  "created_at": "2023-03-29T16:32:59Z",
  "inserted_at": "2023-03-29T16:32:59Z",
  "status": "ACTIVE_HEALTHY",
  "database": {
    "host": "db.project-ref.supabase.co",
    "port": 5432,
    "version": "15.1.0"
  },
  "ref": "project-ref"
}
```

**Example**:

```bash
curl -X GET "https://api.supabase.com/v1/projects/abcdefghijklmno" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

---

### 3. Create Project

Create a new Supabase project.

**Endpoint**: `POST /v1/projects`

**Authentication**: Required

**Request Body**:

```json
{
  "organization_id": "org-uuid",
  "name": "My New Project",
  "region": "us-east-1",
  "db_pass": "secure-password-here",
  "plan": "free",
  "db_pricing_tier_id": "tier_free",
  "db_region": "us-east-1"
}
```

**Required Parameters**:
- `organization_id` (string) - Organization ID where project will be created
- `name` (string) - Project name
- `region` (string) - AWS region (see [Available Regions](#available-regions))
- `db_pass` (string) - Database password (must be secure)

**Optional Parameters**:
- `plan` (enum, deprecated) - Subscription plan: `free`, `pro`, `team`, `enterprise`
- `db_pricing_tier_id` (string) - Database pricing tier
- `db_region` (string) - Database region (usually same as `region`)
- `template_url` (string) - URL to a project template
- `kps_enabled` (boolean, deprecated) - Enable Key Performance Indicators
- `desired_instance_size` (enum) - Compute instance size

**Response**: `201 Created`

```json
{
  "id": "new-project-uuid",
  "organization_id": "org-uuid",
  "name": "My New Project",
  "region": "us-east-1",
  "created_at": "2025-10-28T12:00:00Z",
  "status": "COMING_UP",
  "database": {
    "host": "db.new-project-ref.supabase.co",
    "port": 5432,
    "version": "15.1.0"
  },
  "ref": "new-project-ref"
}
```

**Example**:

```bash
curl -X POST "https://api.supabase.com/v1/projects" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-uuid",
    "name": "My New Project",
    "region": "us-east-1",
    "db_pass": "YourSecurePassword123!"
  }'
```

**Important Notes**:
- Database password must be stored securely
- Project creation is asynchronous (status starts as `COMING_UP`)
- Can take several minutes to fully initialize
- All resources created via API are subject to pricing
- Fair-use policy applies

**TypeScript Interface** (already implemented in `src/supabase.ts`):

```typescript
export interface CreateProjectConfig {
  db_pass: string
  db_pricing_tier_id?: string
  db_region?: string
  name: string
  organization_id: string
  plan?: 'enterprise' | 'free' | 'pro' | 'team'
  region: string
}
```

---

### 4. Delete Project

Delete a Supabase project (destructive operation).

**Endpoint**: `DELETE /v1/projects/{ref}`

**Authentication**: Required

**Parameters**:
- `ref` (path, required) - Project reference identifier

**Response**: `204 No Content`

**Example**:

```bash
curl -X DELETE "https://api.supabase.com/v1/projects/abcdefghijklmno" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Important Notes**:
- This is a destructive operation
- All project data will be permanently deleted
- Cannot be undone
- Billing stops after deletion

---

### 5. Pause Project

Pause a Supabase project (paid plans only).

**Endpoint**: `POST /v1/projects/{ref}/pause`

**Authentication**: Required

**Parameters**:
- `ref` (path, required) - Project reference identifier

**Response**: `204 No Content`

**Example**:

```bash
curl -X POST "https://api.supabase.com/v1/projects/abcdefghijklmno/pause" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**Important Notes**:
- Available on paid plans only
- Project becomes inaccessible while paused
- Reduces costs
- Can be restored later

---

### 6. Restore Paused Project

Restore a previously paused project.

**Endpoint**: `POST /v1/projects/{ref}/restore`

**Authentication**: Required

**Parameters**:
- `ref` (path, required) - Project reference identifier

**Response**: `204 No Content`

**Example**:

```bash
curl -X POST "https://api.supabase.com/v1/projects/abcdefghijklmno/restore" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**Important Notes**:
- Restores a paused project
- May take several minutes
- Billing resumes

---

### 7. Get Project API Keys

Retrieve API keys (anon and service_role) for a project.

**Endpoint**: `GET /v1/projects/{ref}/api-keys`

**Authentication**: Required

**Parameters**:
- `ref` (path, required) - Project reference identifier
- `reveal` (query, optional) - Set to `true` to reveal actual key values

**Response**: `200 OK`

```json
[
  {
    "name": "anon",
    "api_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  {
    "name": "service_role",
    "api_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
]
```

**Example**:

```bash
# Without revealing keys (masked)
curl -X GET "https://api.supabase.com/v1/projects/abcdefghijklmno/api-keys" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"

# With revealed keys
curl -X GET "https://api.supabase.com/v1/projects/abcdefghijklmno/api-keys?reveal=true" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Important Notes**:
- Use `?reveal=true` to see actual key values
- `anon` key is safe for client-side use
- `service_role` key has admin privileges - keep secure
- Never expose service_role key in frontend code

---

## Organizations API

### 1. List Organizations

Get all organizations accessible to the authenticated user.

**Endpoint**: `GET /v1/organizations`

**Authentication**: Required

**Parameters**: None

**Response**: `200 OK`

```json
[
  {
    "id": "org-uuid",
    "name": "My Organization",
    "billing_email": "billing@example.com",
    "created_at": "2023-01-15T10:00:00Z",
    "subscription": {
      "plan": "pro",
      "interval": "month"
    }
  }
]
```

**Organization Plans**:
- `free` - Free tier
- `pro` - Pro plan
- `team` - Team plan
- `enterprise` - Enterprise plan

**Subscription Intervals**:
- `month` - Monthly billing
- `year` - Annual billing

**Example**:

```bash
curl -X GET "https://api.supabase.com/v1/organizations" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**TypeScript Interface** (already implemented in `src/supabase.ts`):

```typescript
export interface Organization {
  billing_email: string
  created_at: string
  id: string
  name: string
  subscription?: {
    interval: 'month' | 'year'
    plan: 'enterprise' | 'free' | 'pro' | 'team'
  }
}
```

---

### 2. Get Organization Details

Get details for a specific organization.

**Endpoint**: `GET /v1/organizations/{id}`

**Authentication**: Required

**Parameters**:
- `id` (path, required) - Organization ID

**Response**: `200 OK`

```json
{
  "id": "org-uuid",
  "name": "My Organization",
  "billing_email": "billing@example.com",
  "created_at": "2023-01-15T10:00:00Z",
  "subscription": {
    "plan": "pro",
    "interval": "month"
  }
}
```

**Example**:

```bash
curl -X GET "https://api.supabase.com/v1/organizations/org-uuid" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Authentication Configuration API

### 1. Get JWT Signing Key

Retrieve the current JWT signing key for a project.

**Endpoint**: `GET /v1/projects/{ref}/auth/jwt`

**Authentication**: Required

**Parameters**:
- `ref` (path, required) - Project reference identifier

**Response**: `200 OK`

```json
{
  "id": "jwt-key-uuid",
  "algorithm": "HS256",
  "key": "your-jwt-secret",
  "key_id": "key-identifier",
  "created_at": "2023-03-29T16:32:59Z"
}
```

**Example**:

```bash
curl -X GET "https://api.supabase.com/v1/projects/abcdefghijklmno/auth/jwt" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**TypeScript Interface** (already implemented in `src/supabase.ts`):

```typescript
export interface JWTKey {
  algorithm: string
  created_at: string
  id: string
  key: string
  key_id: string
}
```

---

### 2. Rotate JWT Signing Key

Rotate the JWT signing key (invalidates all existing tokens).

**Endpoint**: `POST /v1/projects/{ref}/auth/jwt/rotate`

**Authentication**: Required

**Parameters**:
- `ref` (path, required) - Project reference identifier

**Request Body** (optional):

```json
{
  "new_secret": "optional-custom-secret"
}
```

**Response**: `200 OK`

```json
{
  "id": "new-jwt-key-uuid",
  "algorithm": "HS256",
  "key": "new-jwt-secret",
  "key_id": "new-key-identifier",
  "created_at": "2025-10-28T12:00:00Z"
}
```

**Example**:

```bash
# Random secret
curl -X POST "https://api.supabase.com/v1/projects/abcdefghijklmno/auth/jwt/rotate" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json"

# Custom secret
curl -X POST "https://api.supabase.com/v1/projects/abcdefghijklmno/auth/jwt/rotate" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"new_secret": "my-custom-secret"}'
```

**Important Notes**:
- **DESTRUCTIVE OPERATION**
- All current API secrets are immediately invalidated
- All active connections using old keys will be severed
- Must deploy new secrets to restore functionality
- `anon` and `service_role` keys are regenerated
- Cannot be undone

---

### 3. Get Auth Service Configuration

Retrieve authentication service configuration.

**Endpoint**: `GET /v1/projects/{ref}/auth/config`

**Authentication**: Required

**Parameters**:
- `ref` (path, required) - Project reference identifier

**Response**: `200 OK`

```json
{
  "site_url": "https://myapp.com",
  "disable_signup": false,
  "enable_signup": true,
  "enable_confirmations": true,
  "enable_anonymous_sign_ins": false,
  "auto_confirm": false,
  "mailer_autoconfirm": false,
  "mailer_secure_email_change_enabled": true,
  "external_email_enabled": true,
  "external_phone_enabled": false,
  "jwt_exp": 3600,
  "refresh_token_rotation_enabled": true,
  "security_refresh_token_reuse_interval": 10,
  "password_min_length": 8,
  "password_required_characters": "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
}
```

**Example**:

```bash
curl -X GET "https://api.supabase.com/v1/projects/abcdefghijklmno/auth/config" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**TypeScript Interface** (already implemented in `src/supabase.ts`):

```typescript
export interface AuthServiceConfig {
  [key: string]: unknown
  auto_confirm: boolean
  disable_signup: boolean
  enable_anonymous_sign_ins: boolean
  enable_confirmations: boolean
  enable_signup: boolean
  external_email_enabled: boolean
  external_phone_enabled: boolean
  jwt_exp: number
  mailer_autoconfirm: boolean
  mailer_secure_email_change_enabled: boolean
  password_min_length: number
  password_required_characters: string
  refresh_token_rotation_enabled: boolean
  security_refresh_token_reuse_interval: number
  site_url: string
}
```

---

### 4. Update Auth Service Configuration

Update authentication service configuration.

**Endpoint**: `PATCH /v1/projects/{ref}/auth/config`

**Authentication**: Required

**Parameters**:
- `ref` (path, required) - Project reference identifier

**Request Body**:

```json
{
  "disable_signup": false,
  "enable_signup": true,
  "site_url": "https://myapp.com",
  "jwt_exp": 3600,
  "password_min_length": 12,
  "external_apple_enabled": true,
  "external_apple_client_id": "com.myapp.apple",
  "external_apple_secret": "apple-secret-key",
  "external_google_enabled": true,
  "external_google_client_id": "google-client-id",
  "external_google_secret": "google-client-secret",
  "external_github_enabled": true,
  "external_github_client_id": "github-client-id",
  "external_github_secret": "github-client-secret"
}
```

**Available Parameters**:

**General Auth Settings**:
- `api_max_request_duration` (number) - Max request duration
- `db_max_pool_size` (number) - Database pool size
- `disable_signup` (boolean) - Disable new user signups
- `enable_signup` (boolean) - Enable new user signups
- `enable_confirmations` (boolean) - Require email confirmation
- `enable_anonymous_sign_ins` (boolean) - Allow anonymous users
- `auto_confirm` (boolean) - Auto-confirm new users
- `mailer_autoconfirm` (boolean) - Auto-confirm via email
- `mailer_secure_email_change_enabled` (boolean) - Secure email changes
- `site_url` (string) - Primary site URL
- `jwt_exp` (number) - JWT expiration in seconds
- `refresh_token_rotation_enabled` (boolean) - Enable token rotation
- `security_refresh_token_reuse_interval` (number) - Reuse interval
- `password_min_length` (number) - Minimum password length
- `password_required_characters` (string) - Required character set

**External Auth Providers**:

Each provider has three standard parameters:
- `external_{provider}_enabled` (boolean) - Enable the provider
- `external_{provider}_client_id` (string) - OAuth client ID
- `external_{provider}_secret` (string) - OAuth client secret

**Supported Providers**:
- `apple` - Apple Sign In
- `azure` - Microsoft Azure AD
- `bitbucket` - Bitbucket
- `discord` - Discord
- `facebook` - Facebook
- `figma` - Figma
- `github` - GitHub
- `gitlab` - GitLab
- `google` - Google
- `keycloak` - Keycloak
- `linkedin` - LinkedIn
- `notion` - Notion
- `slack` - Slack
- `spotify` - Spotify
- `twitch` - Twitch
- `twitter` - Twitter
- `workos` - WorkOS

**Provider-Specific Parameters**:
- `external_apple_additional_client_ids` (string) - Additional Apple client IDs
- `external_azure_url` (string) - Azure tenant URL
- `external_email_enabled` (boolean) - Email/password auth
- `external_phone_enabled` (boolean) - Phone/SMS auth

**Response**: `200 OK`

```json
{
  "disable_signup": false,
  "enable_signup": true,
  "site_url": "https://myapp.com",
  "jwt_exp": 3600,
  "password_min_length": 12,
  "external_apple_enabled": true,
  "external_google_enabled": true,
  "external_github_enabled": true
}
```

**Example**:

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/abcdefghijklmno/auth/config" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "disable_signup": false,
    "password_min_length": 12,
    "external_google_enabled": true,
    "external_google_client_id": "your-google-client-id",
    "external_google_secret": "your-google-client-secret"
  }'
```

---

### 5. List Auth Providers

List all authentication providers and their status.

**Endpoint**: `GET /v1/projects/{ref}/auth/providers`

**Authentication**: Required

**Parameters**:
- `ref` (path, required) - Project reference identifier

**Response**: `200 OK`

```json
[
  {
    "name": "google",
    "provider": "google",
    "enabled": true
  },
  {
    "name": "github",
    "provider": "github",
    "enabled": true
  },
  {
    "name": "email",
    "provider": "email",
    "enabled": true
  }
]
```

**Example**:

```bash
curl -X GET "https://api.supabase.com/v1/projects/abcdefghijklmno/auth/providers" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**TypeScript Interface** (already implemented in `src/supabase.ts`):

```typescript
export interface AuthProvider {
  enabled: boolean
  name: string
  provider: string
}
```

---

### 6. Set Auth Provider Configuration

Update configuration for a specific auth provider.

**Endpoint**: `PATCH /v1/projects/{ref}/auth/providers/{provider}/config`

**Authentication**: Required

**Parameters**:
- `ref` (path, required) - Project reference identifier
- `provider` (path, required) - Provider name (e.g., 'google', 'github')

**Request Body**:

```json
{
  "enabled": true,
  "client_id": "your-client-id",
  "client_secret": "your-client-secret",
  "redirect_uri": "https://yourproject.supabase.co/auth/v1/callback"
}
```

**Response**: `200 OK`

```json
{
  "enabled": true,
  "client_id": "your-client-id",
  "client_secret": "your-client-secret",
  "redirect_uri": "https://yourproject.supabase.co/auth/v1/callback"
}
```

**Example**:

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/abcdefghijklmno/auth/providers/google/config" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "client_id": "your-google-client-id",
    "client_secret": "your-google-client-secret"
  }'
```

**TypeScript Interface** (already implemented in `src/supabase.ts`):

```typescript
export interface AuthProviderConfig {
  [key: string]: unknown
  client_id?: string
  client_secret?: string
  enabled: boolean
  redirect_uri?: string
}
```

---

### 7. SSO Providers (SAML 2.0)

#### List SSO Providers

**Endpoint**: `GET /v1/projects/{ref}/config/auth/sso/providers`

**Authentication**: Required

**Response**: `200 OK`

```json
[
  {
    "id": "provider-uuid",
    "provider": "saml",
    "name": "Corporate SSO",
    "enabled": true,
    "config": {
      "metadata_url": "https://idp.example.com/metadata.xml"
    },
    "created_at": "2023-03-29T16:32:59Z",
    "updated_at": "2023-03-29T16:32:59Z"
  }
]
```

#### Get SSO Provider

**Endpoint**: `GET /v1/projects/{ref}/config/auth/sso/providers/{provider_id}`

#### Create SSO Provider

**Endpoint**: `POST /v1/projects/{ref}/config/auth/sso/providers`

**Request Body**:

```json
{
  "provider": "saml",
  "name": "Corporate SSO",
  "config": {
    "metadata_url": "https://idp.example.com/metadata.xml"
  }
}
```

#### Update SSO Provider

**Endpoint**: `PUT /v1/projects/{ref}/config/auth/sso/providers/{provider_id}`

#### Delete SSO Provider

**Endpoint**: `DELETE /v1/projects/{ref}/config/auth/sso/providers/{provider_id}`

**TypeScript Interface** (already implemented in `src/supabase.ts`):

```typescript
export interface SSOProvider {
  config?: Record<string, unknown>
  created_at: string
  enabled: boolean
  id: string
  name: string
  provider: string
  updated_at: string
}
```

---

## Available Regions

Supabase projects can be deployed in the following AWS regions:

### North America
- `us-west-1` - West US (North California)
- `us-east-1` - East US (North Virginia)
- `ca-central-1` - Canada (Central)

### Europe
- `eu-west-1` - West EU (Ireland)
- `eu-west-2` - West EU (London)
- `eu-central-1` - Central EU (Frankfurt)

### Asia Pacific
- `ap-south-1` - South Asia (Mumbai)
- `ap-southeast-1` - Southeast Asia (Singapore)
- `ap-northeast-1` - Northeast Asia (Tokyo)
- `ap-northeast-2` - Northeast Asia (Seoul)
- `ap-southeast-2` - Oceania (Sydney)

### South America
- `sa-east-1` - South America (Sao Paulo)

**Notes**:
- All infrastructure runs on AWS
- Region selection affects latency and compliance
- Cannot change region after project creation
- Smart region selection not available for Management API
- For latest regions, check Supabase Dashboard

---

## Error Responses

### Error Response Format

```json
{
  "message": "Error description",
  "error": {
    "message": "Detailed error message",
    "code": "ERROR_CODE",
    "details": {}
  },
  "statusCode": 400
}
```

### Common HTTP Status Codes

**2xx Success**
- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `204 No Content` - Request succeeded with no response body

**4xx Client Errors**
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate name)
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded

**5xx Server Errors**
- `500 Internal Server Error` - Server error
- `502 Bad Gateway` - Gateway error
- `503 Service Unavailable` - Service temporarily unavailable
- `504 Gateway Timeout` - Gateway timeout

### Error Handling Best Practices

1. **Check HTTP status code** before parsing response
2. **Implement retry logic** for 5xx errors and 429
3. **Use exponential backoff** for retries
4. **Log error details** for debugging
5. **Handle rate limits** gracefully

**Example Error Handling** (TypeScript):

```typescript
try {
  const response = await fetch(url, options)

  if (!response.ok) {
    const error = await response.json()

    // Handle rate limiting
    if (response.status === 429) {
      // Wait and retry
      await delay(60000)
      return retry()
    }

    // Handle other errors
    throw new Error(error.message || 'API request failed')
  }

  return await response.json()
} catch (error) {
  console.error('API Error:', error)
  throw error
}
```

---

## Implementation Status

### Already Implemented in `src/supabase.ts`

The following endpoints are already implemented with caching, retry logic, and proper error handling:

**Projects**:
- ✅ `listProjects()` - GET /v1/projects
- ✅ `getProject(ref)` - GET /v1/projects/{ref}
- ✅ `createProject(config)` - POST /v1/projects
- ✅ `deleteProject(ref)` - DELETE /v1/projects/{ref}
- ✅ `pauseProject(ref)` - POST /v1/projects/{ref}/pause
- ✅ `restoreProject(ref)` - POST /v1/projects/{ref}/restore

**Organizations**:
- ✅ `listOrganizations()` - GET /v1/organizations

**Authentication**:
- ✅ `getJWTKey(ref)` - GET /v1/projects/{ref}/auth/jwt
- ✅ `rotateJWTKey(ref)` - POST /v1/projects/{ref}/auth/jwt/rotate
- ✅ `getAuthProviders(ref)` - GET /v1/projects/{ref}/auth/providers
- ✅ `setAuthProviderConfig(ref, provider, key, value)` - PATCH /v1/projects/{ref}/auth/providers/{provider}/config
- ✅ `getAuthServiceConfig(ref)` - GET /v1/projects/{ref}/auth/config
- ✅ `setAuthServiceConfig(ref, settings)` - PATCH /v1/projects/{ref}/auth/config
- ✅ `getSSOProviders(ref)` - GET /v1/projects/{ref}/auth/sso/providers
- ✅ `enableSSOProvider(ref, providerId, config)` - POST /v1/projects/{ref}/auth/sso/providers/{providerId}/enable
- ✅ `disableSSOProvider(ref, providerId)` - POST /v1/projects/{ref}/auth/sso/providers/{providerId}/disable

### Not Yet Implemented

**Projects**:
- ❌ Get Organization Details - GET /v1/organizations/{id}
- ❌ Get Project API Keys - GET /v1/projects/{ref}/api-keys

These endpoints should be added in a future sprint if needed.

---

## References

- **Official Documentation**: https://supabase.com/docs/reference/api/introduction
- **API Explorer**: https://api.supabase.com/api/v1
- **GitHub Management JS Library**: https://github.com/supabase-community/supabase-management-js
- **Available Regions**: https://supabase.com/docs/platform/regions
- **JWT Documentation**: https://supabase.com/docs/guides/auth/jwts
- **SSO Documentation**: https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml

---

## Notes for Developers

1. **Always use HTTPS** - The API only accepts HTTPS requests
2. **Store credentials securely** - Never commit tokens or passwords
3. **Implement caching** - Use caching to reduce API calls (already implemented in `src/supabase.ts`)
4. **Implement retry logic** - Handle transient failures (already implemented in `src/retry.ts`)
5. **Monitor rate limits** - Track your API usage to avoid 429 errors
6. **Use TypeScript types** - All types are defined in `src/supabase.ts`
7. **Test in development** - Always test changes in a development project first
8. **Document breaking changes** - JWT rotation and project deletion are destructive

---

**Document Version**: 1.0
**Last Updated**: October 28, 2025
**Research Completed By**: Claude Code Agent
