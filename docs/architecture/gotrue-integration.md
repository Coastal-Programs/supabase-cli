# GoTrue API Integration Guide

**Last Updated**: October 30, 2025
**Phase**: 5B1
**Status**: Production Ready

## Overview

The Supabase CLI now integrates with the GoTrue authentication service API, enabling direct access to authentication settings, providers, and user management without relying solely on the Management API.

## What is GoTrue?

GoTrue is Supabase's authentication service, built on top of the Netlify GoTrue project. It provides:
- OAuth provider management
- User authentication
- Session management
- Email/SMS verification
- JWT token generation

## API Endpoints

### Base URLs

- **Management API**: `https://api.supabase.com/v1`
  - Requires: Personal access token
  - Purpose: Project-level operations

- **GoTrue API**: `https://{project-ref}.supabase.co/auth/v1`
  - Requires: Project anon key or service role key
  - Purpose: Auth-specific operations

## Client Implementation

### Location

```
src/apis/gotrue-api.ts
```

### Class: GoTrueAPI

```typescript
import { GoTrueAPI } from './apis/gotrue-api'

// Initialize with project ref and anon key
const goTrue = new GoTrueAPI(projectRef, anonKey)

// Available methods
await goTrue.checkHealth()          // Returns boolean
await goTrue.getSettings()          // Returns AuthSettings
await goTrue.listProviders()        // Returns AuthProvider[]
```

### Types

```typescript
interface AuthSettings {
  disable_signup: boolean
  external: Record<string, boolean>  // Provider statuses
  mailer_autoconfirm: boolean
  phone_autoconfirm: boolean
  saml_enabled: boolean
  sms_provider: string
}

interface AuthProvider {
  enabled: boolean
  name: string     // Formatted name (e.g., "Google")
  provider: string // Raw name (e.g., "google")
}
```

## Getting API Keys

To use GoTrue API, you need the project's anon key:

```typescript
import { getAPIKeys } from './supabase'

// Fetch keys from Management API
const keys = await getAPIKeys(projectRef)

// Keys available:
// - keys.anon: Public anon key
// - keys.service_role: Service role key (admin access)
```

**Security Note**: API keys are cached for 10 minutes. Never log or expose these keys.

## Usage in Commands

### Pattern 1: List Auth Providers

```typescript
import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command'
import { getAPIKeys } from '../../../supabase'
import { GoTrueAPI } from '../../../apis/gotrue-api'

export default class AuthProvidersList extends BaseCommand {
  static flags = {
    ...BaseCommand.baseFlags,
    project: Flags.string({
      char: 'p',
      required: true,
      description: 'Project reference',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthProvidersList)

    try {
      // Get API keys
      const keys = await getAPIKeys(flags.project)

      // Initialize GoTrue
      const goTrue = new GoTrueAPI(flags.project, keys.anon)

      // List providers
      const providers = await goTrue.listProviders()

      // Display
      this.output(providers)
      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
```

### Pattern 2: Get Auth Settings

```typescript
// Get comprehensive auth configuration
const keys = await getAPIKeys(projectRef)
const goTrue = new GoTrueAPI(projectRef, keys.anon)
const settings = await goTrue.getSettings()

console.log('Signup enabled:', !settings.disable_signup)
console.log('Email autoconfirm:', settings.mailer_autoconfirm)
console.log('SAML enabled:', settings.saml_enabled)

// List enabled OAuth providers
for (const [provider, enabled] of Object.entries(settings.external)) {
  if (enabled) {
    console.log(`Provider enabled: ${provider}`)
  }
}
```

### Pattern 3: Health Check

```typescript
const keys = await getAPIKeys(projectRef)
const goTrue = new GoTrueAPI(projectRef, keys.anon)

if (await goTrue.checkHealth()) {
  console.log('Auth service is healthy')
} else {
  console.log('Auth service is down')
}
```

## Error Handling

GoTrue API uses the standard SupabaseError system:

```typescript
import { SupabaseError } from '../errors'

try {
  const settings = await goTrue.getSettings()
} catch (error) {
  if (error instanceof SupabaseError) {
    console.error('Error code:', error.code)
    console.error('Status:', error.statusCode)
    console.error('Message:', error.message)
  }
}
```

**Common Errors**:
- `401`: Invalid API key
- `403`: Insufficient permissions
- `404`: Project not found
- `500`: GoTrue service error

## Best Practices

### 1. Cache API Keys

```typescript
// Cache keys in command context
let cachedKeys: APIKeysResponse | null = null

async function getKeys(projectRef: string) {
  if (!cachedKeys) {
    cachedKeys = await getAPIKeys(projectRef)
  }
  return cachedKeys
}
```

### 2. Use Helper Functions

```typescript
// Create reusable helper
async function createGoTrueClient(projectRef: string): Promise<GoTrueAPI> {
  const keys = await getAPIKeys(projectRef)
  return new GoTrueAPI(projectRef, keys.anon)
}

// Use in commands
const goTrue = await createGoTrueClient(flags.project)
```

### 3. Handle Errors Gracefully

```typescript
try {
  const providers = await goTrue.listProviders()
  if (providers.length === 0) {
    this.warning('No providers configured')
    return
  }
  this.output(providers)
} catch (error) {
  this.handleError(error)
}
```

### 4. Use Spinners for Better UX

```typescript
const providers = await this.spinner(
  'Fetching auth providers...',
  async () => {
    const keys = await getAPIKeys(flags.project)
    const goTrue = new GoTrueAPI(flags.project, keys.anon)
    return goTrue.listProviders()
  },
  'Providers fetched successfully'
)
```

## Provider Name Formatting

The GoTrue client automatically formats provider names:

```typescript
// Raw provider → Formatted name
"email"         → "Email"
"google"        → "Google"
"github"        → "Github"
"linkedin_oidc" → "LinkedIn OIDC"
"azure"         → "Azure"
"apple"         → "Apple"
```

This is handled by the `formatProviderName()` private method.

## Combining with Management API

Many auth operations benefit from combining both APIs:

```typescript
// Get project details (Management API)
const project = await getProject(projectRef)

// Get auth settings (GoTrue API)
const keys = await getAPIKeys(projectRef)
const goTrue = new GoTrueAPI(projectRef, keys.anon)
const settings = await goTrue.getSettings()

// Combine data
const fullAuthConfig = {
  project: {
    name: project.name,
    region: project.region,
  },
  auth: {
    providers: await goTrue.listProviders(),
    signup_enabled: !settings.disable_signup,
    email_autoconfirm: settings.mailer_autoconfirm,
  },
}
```

## Testing GoTrue Integration

### Unit Tests

```typescript
import { expect } from 'chai'
import { GoTrueAPI } from '../src/apis/gotrue-api'
import nock from 'nock'

describe('GoTrueAPI', () => {
  const projectRef = 'test-project'
  const anonKey = 'test-anon-key'
  let goTrue: GoTrueAPI

  beforeEach(() => {
    goTrue = new GoTrueAPI(projectRef, anonKey)
  })

  it('should fetch settings', async () => {
    nock(`https://${projectRef}.supabase.co`)
      .get('/auth/v1/settings')
      .reply(200, {
        disable_signup: false,
        external: { google: true, github: false },
        mailer_autoconfirm: true,
        phone_autoconfirm: false,
        saml_enabled: false,
        sms_provider: 'twilio',
      })

    const settings = await goTrue.getSettings()
    expect(settings.disable_signup).to.be.false
    expect(settings.external.google).to.be.true
  })
})
```

### Integration Tests

```typescript
describe('GoTrue Integration', () => {
  it('should fetch real project providers', async () => {
    const projectRef = process.env.TEST_PROJECT_REF!
    const anonKey = process.env.TEST_ANON_KEY!

    const goTrue = new GoTrueAPI(projectRef, anonKey)
    const providers = await goTrue.listProviders()

    expect(providers).to.be.an('array')
    providers.forEach(provider => {
      expect(provider).to.have.property('name')
      expect(provider).to.have.property('provider')
      expect(provider).to.have.property('enabled')
    })
  })
})
```

## Troubleshooting

### Issue: 401 Unauthorized

**Cause**: Invalid or expired anon key

**Solution**:
```typescript
// Verify API keys are correct
const keys = await getAPIKeys(projectRef)
console.log('Anon key starts with:', keys.anon.substring(0, 20))

// Check project ref is correct
const project = await getProject(projectRef)
console.log('Project:', project.name)
```

### Issue: 404 Not Found

**Cause**: Incorrect project reference or GoTrue not deployed

**Solution**:
```typescript
// Verify project exists
try {
  const project = await getProject(projectRef)
  console.log('Project found:', project.name)
} catch (error) {
  console.error('Project not found')
}

// Check GoTrue health
const healthy = await goTrue.checkHealth()
if (!healthy) {
  console.error('GoTrue service is down')
}
```

### Issue: Empty Providers List

**Cause**: No providers configured for project

**Solution**:
```typescript
const providers = await goTrue.listProviders()
if (providers.length === 0) {
  console.log('No providers configured')
  console.log('Configure providers in Supabase Dashboard > Authentication > Providers')
}
```

## Future Enhancements

### Planned for Phase 6

1. **User Management**
   ```typescript
   await goTrue.listUsers()
   await goTrue.getUser(userId)
   await goTrue.deleteUser(userId)
   await goTrue.updateUser(userId, data)
   ```

2. **Session Management**
   ```typescript
   await goTrue.listSessions(userId)
   await goTrue.revokeSession(sessionId)
   await goTrue.revokeAllSessions(userId)
   ```

3. **Provider Configuration**
   ```typescript
   await goTrue.enableProvider('google', config)
   await goTrue.disableProvider('google')
   await goTrue.updateProvider('google', config)
   ```

4. **Audit Logs**
   ```typescript
   await goTrue.getAuditLogs({ since, until })
   await goTrue.getAuthEvents(userId)
   ```

## Resources

- **GoTrue Documentation**: https://supabase.com/docs/reference/auth
- **GoTrue GitHub**: https://github.com/supabase/gotrue
- **Management API Docs**: https://supabase.com/docs/reference/api
- **CLI Architecture**: See CLAUDE.md

## API Reference

### GoTrueAPI Constructor

```typescript
new GoTrueAPI(projectRef: string, anonKey: string, serviceKey?: string)
```

**Parameters**:
- `projectRef`: Project reference ID (20 chars)
- `anonKey`: Public anon key from Management API
- `serviceKey`: Optional service role key for admin operations

### checkHealth()

```typescript
async checkHealth(): Promise<boolean>
```

**Returns**: `true` if GoTrue service is responding, `false` otherwise

**Example**:
```typescript
if (await goTrue.checkHealth()) {
  console.log('Service is healthy')
}
```

### getSettings()

```typescript
async getSettings(): Promise<AuthSettings>
```

**Returns**: Complete auth configuration

**Example**:
```typescript
const settings = await goTrue.getSettings()
console.log('Signup enabled:', !settings.disable_signup)
```

### listProviders()

```typescript
async listProviders(): Promise<AuthProvider[]>
```

**Returns**: Array of auth providers with enabled status

**Example**:
```typescript
const providers = await goTrue.listProviders()
providers.forEach(p => {
  console.log(`${p.name}: ${p.enabled ? 'enabled' : 'disabled'}`)
})
```

## Support

For issues or questions:
1. Check this documentation
2. Review PHASE5B1_COMPLETION_REPORT.md
3. See example commands in `src/commands/auth/`
4. Contact: Developer team

---

**Last Updated**: October 30, 2025 by Phase 5B1
