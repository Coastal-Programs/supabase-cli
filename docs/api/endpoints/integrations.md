# Integrations & Webhooks API

Endpoints for managing integrations, webhooks, and third-party services.

**Note:** Most integration endpoints were not tested. This documentation is based on OpenAPI specifications.

---

## Database Webhooks

### Enable Database Webhooks

**Endpoint:** `POST /v1/projects/{ref}/database/webhooks/enable`
**Status:** ❌ Not Found (404) (Beta)
**CLI Command:** Not available

**Finding:** Endpoint doesn't exist despite documentation.

**Alternative:** Configure webhooks via dashboard or database triggers with HTTP extensions.

---

## Database Triggers with HTTP

Since webhook endpoints aren't available, use PostgreSQL HTTP extension:

### Setup HTTP Extension

```sql
-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Create Webhook Trigger

```sql
-- Create function to call webhook
CREATE OR REPLACE FUNCTION notify_webhook()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://your-webhook-url.com/webhook',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer your-token"}'::jsonb,
    body := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'data', row_to_json(NEW),
      'old_data', row_to_json(OLD),
      'timestamp', NOW()
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to table
CREATE TRIGGER users_webhook
AFTER INSERT OR UPDATE OR DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION notify_webhook();
```

---

## Realtime Webhooks

Supabase Realtime can trigger webhooks for database changes:

### Configure via Dashboard

1. Navigate to Database > Webhooks
2. Click "Create a new hook"
3. Configure:
   - Table: `public.users`
   - Events: INSERT, UPDATE, DELETE
   - Webhook URL: `https://your-api.com/webhook`
   - Headers: Custom headers (optional)

---

## Storage Webhooks

### Configure Storage Events

Storage events can trigger webhooks via Supabase Edge Functions:

```typescript
// Edge Function: storage-webhook-handler
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Listen to storage events
  const { event, payload } = await req.json()

  // Forward to webhook
  await fetch('https://your-webhook-url.com/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event,
      bucket: payload.bucket_id,
      path: payload.name,
      timestamp: new Date().toISOString()
    })
  })

  return new Response('OK')
})
```

---

## Auth Webhooks

### Auth Events via Hooks

Auth events can trigger webhooks via Auth hooks:

**Available Hooks:**
- `send_sms` - Customize SMS sending
- `send_email` - Customize email sending
- `custom_access_token` - Modify JWT claims

**Configure via SQL:**
```sql
-- Add custom claims to JWT
CREATE OR REPLACE FUNCTION custom_access_token(event jsonb)
RETURNS jsonb AS $$
DECLARE
  claims jsonb;
BEGIN
  claims := event->'claims';

  -- Add custom claim
  claims := jsonb_set(claims, '{role}', '"admin"');

  -- Call webhook (optional)
  PERFORM net.http_post(
    url := 'https://your-api.com/auth-webhook',
    body := event
  );

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$ LANGUAGE plpgsql;
```

---

## Third-Party Integrations (No API)

### Available Integrations (Dashboard Only)

**Authentication:**
- Google OAuth
- GitHub OAuth
- GitLab OAuth
- Azure AD
- Facebook
- Twitter
- Discord
- Twitch
- Spotify
- Slack
- LinkedIn
- Custom SAML SSO

**Storage:**
- S3-compatible storage
- Cloudflare R2
- Backblaze B2

**Analytics:**
- Google Analytics
- Segment
- Mixpanel

**Monitoring:**
- Datadog
- LogDNA
- Sentry

**Configuration:** All integrations configured via dashboard, not API.

---

## Secrets Management

### List Secrets

**Endpoint:** `GET /v1/projects/{ref}/secrets`
**Status:** ✅ Works (200 OK)
**CLI Command:** `config:secrets:list`

List all project secrets (environment variables).

**Request:**
```bash
curl -X GET 'https://api.supabase.com/v1/projects/ygzhmowennlaehudyyey/secrets' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Response:**
```json
[
  {
    "name": "API_KEY",
    "value": "sk_test_123...",
    "created_at": "2025-10-20T10:00:00Z",
    "updated_at": "2025-10-29T15:30:00Z"
  }
]
```

**Note:** Secret values are visible in the response.

---

### Create Secrets (Bulk)

**Endpoint:** `POST /v1/projects/{ref}/secrets`
**Status:** 🔍 Not Tested
**CLI Command:** `config:secrets:set`

Create or update multiple secrets.

**Expected Request:**
```json
[
  {
    "name": "API_KEY",
    "value": "sk_prod_456..."
  },
  {
    "name": "WEBHOOK_URL",
    "value": "https://api.example.com/webhook"
  }
]
```

---

### Delete Secrets (Bulk)

**Endpoint:** `DELETE /v1/projects/{ref}/secrets`
**Status:** 🔍 Not Tested
**CLI Command:** `config:secrets:delete`

Delete multiple secrets.

**Expected Request:**
```json
{
  "names": ["API_KEY", "WEBHOOK_URL"]
}
```

---

### Reveal Secrets (NOT AVAILABLE)

**Endpoint:** ❌ `GET /v1/projects/{ref}/secrets/reveal` (404)
**CLI Command:** Not available

**Finding:** Secrets are already revealed in the list response.

---

## API Keys

### Get API Keys

**Endpoint:** `GET /v1/projects/{ref}/api-keys`
**Status:** ✅ Works (200 OK)
**CLI Command:** `config:api-keys`

Get project API keys (anon, service_role).

**Request:**
```bash
curl -X GET 'https://api.supabase.com/v1/projects/ygzhmowennlaehudyyey/api-keys' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Response:**
```json
[
  {
    "name": "anon",
    "api_key": "eyJhbGci...",
    "id": "anon",
    "type": "legacy",
    "hash": "U8ZGDmAW37yq...",
    "prefix": "S6jRs",
    "description": "Legacy anon API key"
  },
  {
    "name": "service_role",
    "api_key": "eyJhbGci...",
    "id": "service_role",
    "type": "legacy",
    "hash": "Bz4Pjfq4T4im...",
    "prefix": "7LHpE",
    "description": "Legacy service_role API key"
  }
]
```

---

### Create API Key

**Endpoint:** `POST /v1/projects/{ref}/api-keys`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Create a new API key.

---

### Get API Key

**Endpoint:** `GET /v1/projects/{ref}/api-keys/{id}`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Get details of a specific API key.

---

### Update API Key

**Endpoint:** `PATCH /v1/projects/{ref}/api-keys/{id}`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Update API key metadata.

---

### Delete API Key

**Endpoint:** `DELETE /v1/projects/{ref}/api-keys/{id}`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Delete an API key. Cannot delete legacy keys (anon, service_role).

---

### Check Legacy Keys Status

**Endpoint:** `GET /v1/projects/{ref}/api-keys/legacy`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Check if legacy keys are enabled.

---

### Toggle Legacy Keys

**Endpoint:** `PUT /v1/projects/{ref}/api-keys/legacy`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Enable or disable legacy API keys.

---

## Custom Domains

### Get Custom Hostname

**Endpoint:** `GET /v1/projects/{ref}/custom-hostname`
**Status:** ⚠️ Bad Request (400) (Beta)
**CLI Command:** Not implemented

Get custom hostname configuration.

**Note:** Returns 400, may require specific conditions or parameters.

---

### Delete Custom Hostname

**Endpoint:** `DELETE /v1/projects/{ref}/custom-hostname`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** Not implemented

Remove custom hostname.

---

### Initialize Custom Hostname

**Endpoint:** `POST /v1/projects/{ref}/custom-hostname/initialize`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** Not implemented

Setup custom hostname.

---

### Activate Custom Hostname

**Endpoint:** `POST /v1/projects/{ref}/custom-hostname/activate`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** Not implemented

Activate custom hostname after DNS verification.

---

### Reverify DNS

**Endpoint:** `POST /v1/projects/{ref}/custom-hostname/reverify`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** Not implemented

Reverify DNS configuration.

---

## Vanity Subdomains

### Get Vanity Subdomain

**Endpoint:** `GET /v1/projects/{ref}/vanity-subdomain`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** Not implemented

Get vanity subdomain configuration.

---

### Delete Vanity Subdomain

**Endpoint:** `DELETE /v1/projects/{ref}/vanity-subdomain`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** Not implemented

Remove vanity subdomain.

---

### Activate Vanity Subdomain

**Endpoint:** `POST /v1/projects/{ref}/vanity-subdomain/activate`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** Not implemented

Activate vanity subdomain.

---

### Check Availability

**Endpoint:** `POST /v1/projects/{ref}/vanity-subdomain/check-availability`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** Not implemented

Check if vanity subdomain is available.

---

## Summary

### Working Endpoints (2)
- ✅ `GET /v1/projects/{ref}/secrets` - List secrets
- ✅ `GET /v1/projects/{ref}/api-keys` - Get API keys

### Needs Investigation (1)
- ⚠️ `GET /v1/projects/{ref}/custom-hostname` - Returns 400

### Not Tested (15+)
- 🔍 All secret management operations (create, delete)
- 🔍 All API key operations (create, update, delete)
- 🔍 All custom domain operations
- 🔍 All vanity subdomain operations

### Not Available (2)
- ❌ `POST /v1/projects/{ref}/database/webhooks/enable` - Use database triggers
- ❌ `GET /v1/projects/{ref}/secrets/reveal` - Already revealed in list

### Recommended Implementation

1. ✅ **Keep existing:**
   - `config:secrets:list` (working)
   - `config:api-keys` (working)

2. 🔍 **Test and implement:**
   - `config:secrets:set` - Create/update secrets
   - `config:secrets:delete` - Delete secrets
   - `config:api-keys:create` - Create API key
   - `config:api-keys:rotate` - Rotate API key

3. 🔍 **Implement custom domains (Beta):**
   - `domains:custom:setup` - Setup custom hostname
   - `domains:custom:activate` - Activate custom hostname
   - `domains:vanity:setup` - Setup vanity subdomain
   - `domains:vanity:check` - Check availability

4. 📚 **Document webhook alternatives:**
   - Database triggers with HTTP extension
   - Realtime webhooks via dashboard
   - Edge Functions for custom webhooks
   - Auth hooks for auth events

### Example Usage

**List Secrets:**
```bash
$ supabase-cli config:secrets:list
API_KEY=sk_test_123...
WEBHOOK_URL=https://api.example.com/webhook
```

**Set Secrets:**
```bash
$ supabase-cli config:secrets:set \
  API_KEY=sk_prod_456... \
  WEBHOOK_URL=https://api.example.com/prod-webhook
```

**Get API Keys:**
```bash
$ supabase-cli config:api-keys
anon: eyJhbGci...
service_role: eyJhbGci...
```

**Setup Webhook (SQL):**
```bash
$ supabase-cli db:query < setup-webhook.sql
Webhook trigger created successfully
```

### Notes

- Webhooks require database triggers with HTTP extension
- Secrets are visible in API responses (handle securely)
- API keys cannot be regenerated (create new ones instead)
- Custom domains and vanity subdomains in Beta
- Most integrations configured via dashboard only
- Auth hooks provide webhook-like functionality
- Edge Functions can trigger webhooks for events
