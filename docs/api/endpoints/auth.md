# Authentication API

Endpoints for authentication configuration, JWT signing keys, SSO providers, and third-party auth.

---

## Auth Configuration

### Get Auth Config

**Endpoint:** `GET /v1/projects/{ref}/config/auth`
**Status:** ✅ Works (200 OK)
**CLI Command:** `config:auth:get`

Get authentication configuration for a project.

**Request:**
```bash
curl -X GET 'https://api.supabase.com/v1/projects/ygzhmowennlaehudyyey/config/auth' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Response:**
```json
{
  "uri_allow_list": "",
  "jwt_exp": 3600,
  "disable_signup": false,
  "security_manual_linking_enabled": false,
  "refresh_token_rotation_enabled": true,
  "site_url": "http://localhost:3000",
  "mfa_max_enrolled_factors": 10,
  "rate_limit_anonymous_users": 30,
  "rate_limit_sms_sent": 30,
  "rate_limit_verify": 30,
  "rate_limit_token_refresh": 150,
  "rate_limit_otp": 30,
  "sessions_timebox": 0,
  "sessions_inactivity_timeout": 0
}
```

**Response Fields:**
- `uri_allow_list` - Allowed redirect URIs (comma-separated)
- `jwt_exp` - JWT expiration in seconds (default: 3600)
- `disable_signup` - Whether signups are disabled
- `security_manual_linking_enabled` - Manual account linking
- `refresh_token_rotation_enabled` - Token rotation enabled
- `site_url` - Default site URL for redirects
- `mfa_max_enrolled_factors` - Max MFA factors per user
- `rate_limit_*` - Various rate limits per hour
- `sessions_timebox` - Session duration limit (0 = unlimited)
- `sessions_inactivity_timeout` - Inactivity timeout (0 = disabled)

---

### Update Auth Config

**Endpoint:** `PATCH /v1/projects/{ref}/config/auth`
**Status:** 🔍 Not Tested
**CLI Command:** `config:auth:set`

Update authentication configuration.

**Expected Request:**
```json
{
  "site_url": "https://example.com",
  "uri_allow_list": "https://example.com/callback,https://app.example.com",
  "jwt_exp": 7200,
  "disable_signup": false,
  "refresh_token_rotation_enabled": true
}
```

---

## JWT Signing Keys

### Create Signing Key

**Endpoint:** `POST /v1/projects/{ref}/config/auth/signing-keys`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Create a new JWT signing key.

---

### List Signing Keys

**Endpoint:** `GET /v1/projects/{ref}/config/auth/signing-keys`
**Status:** 🔍 Not Tested
**CLI Command:** `auth:jwt:list`

List all JWT signing keys for the project.

---

### Get Signing Key

**Endpoint:** `GET /v1/projects/{ref}/config/auth/signing-keys/{id}`
**Status:** 🔍 Not Tested
**CLI Command:** `auth:jwt:get`

Get details of a specific signing key.

---

### Update Signing Key

**Endpoint:** `PATCH /v1/projects/{ref}/config/auth/signing-keys/{id}`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Update signing key metadata (name, description).

---

### Delete Signing Key

**Endpoint:** `DELETE /v1/projects/{ref}/config/auth/signing-keys/{id}`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Delete a signing key. Cannot delete the active key.

---

### Setup Legacy JWT Secret

**Endpoint:** `POST /v1/projects/{ref}/config/auth/signing-keys/legacy`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Setup legacy JWT secret for backwards compatibility.

---

### Get Legacy Signing Key

**Endpoint:** `GET /v1/projects/{ref}/config/auth/signing-keys/legacy`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Get the legacy signing key.

---

## SSO Providers

### Create SSO Provider

**Endpoint:** `POST /v1/projects/{ref}/config/auth/sso/providers`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Configure a new SSO provider (SAML 2.0).

**Expected Request:**
```json
{
  "type": "saml",
  "metadata_url": "https://idp.example.com/metadata.xml",
  "metadata_xml": "<xml>...</xml>",
  "attribute_mapping": {
    "keys": {
      "email": "email",
      "name": "name"
    }
  },
  "domains": ["example.com"]
}
```

---

### List SSO Providers

**Endpoint:** `GET /v1/projects/{ref}/config/auth/sso/providers`
**Status:** 🔍 Not Tested
**CLI Command:** `auth:sso:list`

List all configured SSO providers.

---

### Get SSO Provider

**Endpoint:** `GET /v1/projects/{ref}/config/auth/sso/providers/{provider_id}`
**Status:** 🔍 Not Tested
**CLI Command:** `auth:sso:get`

Get details of a specific SSO provider.

---

### Update SSO Provider

**Endpoint:** `PUT /v1/projects/{ref}/config/auth/sso/providers/{provider_id}`
**Status:** 🔍 Not Tested
**CLI Command:** `auth:sso:update`

Update SSO provider configuration.

---

### Delete SSO Provider

**Endpoint:** `DELETE /v1/projects/{ref}/config/auth/sso/providers/{provider_id}`
**Status:** 🔍 Not Tested
**CLI Command:** `auth:sso:delete`

Remove an SSO provider.

---

## Third-Party Authentication

### Create Third-Party Auth Integration

**Endpoint:** `POST /v1/projects/{ref}/config/auth/third-party-auth`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Configure third-party authentication provider (Google, GitHub, etc.).

**Expected Request:**
```json
{
  "provider": "google",
  "enabled": true,
  "client_id": "your-client-id",
  "client_secret": "your-client-secret",
  "redirect_uri": "https://your-project.supabase.co/auth/v1/callback",
  "skip_nonce_check": false
}
```

**Supported Providers:**
- google
- github
- gitlab
- bitbucket
- azure
- facebook
- twitter
- discord
- twitch
- spotify
- slack
- linkedin

---

### List Third-Party Auth Integrations

**Endpoint:** `GET /v1/projects/{ref}/config/auth/third-party-auth`
**Status:** 🔍 Not Tested
**CLI Command:** `auth:providers:list`

List all configured third-party auth providers.

---

### Get Third-Party Auth Integration

**Endpoint:** `GET /v1/projects/{ref}/config/auth/third-party-auth/{tpa_id}`
**Status:** 🔍 Not Tested
**CLI Command:** `auth:providers:get`

Get details of a specific third-party auth provider.

---

### Delete Third-Party Auth Integration

**Endpoint:** `DELETE /v1/projects/{ref}/config/auth/third-party-auth/{tpa_id}`
**Status:** 🔍 Not Tested
**CLI Command:** `auth:providers:delete`

Remove a third-party auth provider.

---

## Auth Users (Not Available via Management API)

### List Users

**Endpoint:** `GET /v1/projects/{ref}/auth/users`
**Status:** ❌ Not Found (404)
**CLI Command:** Not available

**Finding:** Auth user management is NOT available in Management API.

**Alternative:** Use the Auth Admin API directly:
- Base URL: `https://{project-ref}.supabase.co/auth/v1/admin/users`
- Auth: `Authorization: Bearer {service_role_key}` (not PAT)

---

## OAuth Endpoints

These OAuth endpoints are for authorizing the CLI itself, not for managing project OAuth:

### Authorize via OAuth

**Endpoint:** `GET /v1/oauth/authorize`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** Internal use only

Authorize the Supabase CLI or integration.

---

### Exchange Auth Code

**Endpoint:** `POST /v1/oauth/token`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** Internal use only

Exchange authorization code for access token.

---

### Revoke Authorization

**Endpoint:** `POST /v1/oauth/revoke`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** Internal use only

Revoke OAuth authorization.

---

## Summary

### Working Endpoints (1)
- ✅ `GET /v1/projects/{ref}/config/auth` - Get auth config

### Not Tested (17)
- 🔍 Update auth config
- 🔍 All signing key operations (8 endpoints)
- 🔍 All SSO provider operations (5 endpoints)
- 🔍 All third-party auth operations (4 endpoints)
- 🔍 OAuth endpoints (3 endpoints)

### Not Available (1)
- ❌ `GET /v1/projects/{ref}/auth/users` - Use Auth Admin API instead

### Recommended Implementation

1. ✅ **Implement `config:auth:get`** (already working in CLI)
2. 🔍 **Test `config:auth:set`** (update auth config)
3. 🔍 **Implement JWT signing key commands:**
   - `auth:jwt:list`
   - `auth:jwt:get`
   - `auth:jwt:rotate` (already implemented)
4. 🔍 **Implement SSO provider commands:**
   - `auth:sso:list`
   - `auth:sso:get`
   - `auth:sso:create`
   - `auth:sso:update`
   - `auth:sso:delete`
5. 🔍 **Implement third-party auth commands:**
   - `auth:providers:list`
   - `auth:providers:get`
   - `auth:providers:create`
   - `auth:providers:delete`
6. 📚 **Document Auth Admin API separately** for user management

### Notes

- Auth configuration works via Management API
- User management requires Auth Admin API (different auth)
- SSO and third-party auth endpoints untested but likely work
- JWT signing key rotation already implemented in CLI
- OAuth endpoints are for CLI authorization, not project OAuth
