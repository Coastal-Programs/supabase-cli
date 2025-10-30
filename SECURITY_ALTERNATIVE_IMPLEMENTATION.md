# Alternative Security Command Implementation Options

## Overview

While the originally planned security commands (`security:audit`, `security:restrictions:list`, `security:policies:list`) cannot be implemented due to missing API endpoints, there ARE some security-related features we CAN implement using available endpoints.

---

## Option A: SSL Enforcement Commands (RECOMMENDED)

### Available Endpoints

The Management API provides SSL enforcement configuration:

```bash
GET  /v1/projects/{ref}/ssl-enforcement
PUT  /v1/projects/{ref}/ssl-enforcement
```

**Source:** `docs/supabase_management_api_reference.md` lines 342, 369

### Proposed Commands

#### 1. `ssl:get` - Get SSL Enforcement Status

```bash
supabase-cli ssl:get --project my-project
```

**Implementation:**
```typescript
// src/commands/ssl/get.ts
import { BaseCommand } from '../../base-command'
import { OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { getSSLEnforcement } from '../../supabase'

export default class SSLGet extends BaseCommand {
  static description = 'Get SSL enforcement configuration for a project'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project',
    '<%= config.bin %> <%= command.id %> --project my-project --format json',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...ProjectFlags,
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(SSLGet)

    try {
      const projectRef = flags.project || flags['project-ref']
      if (!projectRef) {
        this.error('Project reference is required. Use --project flag or set SUPABASE_PROJECT_ID.', {
          exit: 1,
        })
      }

      const config = await this.spinner(
        'Fetching SSL enforcement configuration...',
        async () => getSSLEnforcement(projectRef),
        'SSL configuration fetched'
      )

      if (!flags.quiet) {
        this.header('SSL Enforcement Configuration')
        this.divider()
      }

      if (config.currentConfig.database) {
        this.success('SSL enforcement is ENABLED for database connections')
      } else {
        this.warning('SSL enforcement is DISABLED for database connections')
      }

      if (!flags.quiet) {
        this.info(`Applied successfully: ${config.appliedSuccessfully}`)
        this.divider()
      }

      this.output(config)
      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
```

#### 2. `ssl:enable` - Enable SSL Enforcement

```bash
supabase-cli ssl:enable --project my-project
```

**Implementation:**
```typescript
// src/commands/ssl/enable.ts
import { Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command'
import { AutomationFlags, ProjectFlags } from '../../base-flags'
import { updateSSLEnforcement } from '../../supabase'

export default class SSLEnable extends BaseCommand {
  static description = 'Enable SSL enforcement for database connections'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project',
    '<%= config.bin %> <%= command.id %> --project my-project --yes',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...AutomationFlags,
    ...ProjectFlags,
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(SSLEnable)

    try {
      const projectRef = flags.project || flags['project-ref']
      if (!projectRef) {
        this.error('Project reference is required. Use --project flag or set SUPABASE_PROJECT_ID.', {
          exit: 1,
        })
      }

      if (!flags.yes && !flags.quiet) {
        const confirmed = await this.confirm(
          'This will require SSL for all database connections. Continue?',
          false
        )
        if (!confirmed) {
          this.warning('Cancelled')
          return
        }
      }

      const config = await this.spinner(
        'Enabling SSL enforcement...',
        async () => updateSSLEnforcement(projectRef, true),
        'SSL enforcement enabled'
      )

      if (!flags.quiet) {
        this.success('SSL enforcement is now ENABLED')
        this.info('All database connections must now use SSL')
        this.warning('Ensure your connection strings include sslmode=require')
      }

      this.output(config)
      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
```

#### 3. `ssl:disable` - Disable SSL Enforcement

```bash
supabase-cli ssl:disable --project my-project
```

**Similar implementation to enable, but:**
- Sets SSL to false
- Shows warning about security implications
- Requires confirmation

### API Functions to Add (src/supabase.ts)

```typescript
export interface SSLEnforcementConfig {
  currentConfig: {
    database: boolean
  }
  appliedSuccessfully: boolean
}

/**
 * Get SSL enforcement configuration
 */
export async function getSSLEnforcement(ref: string): Promise<SSLEnforcementConfig> {
  return cachedFetch(
    'ssl-enforcement',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<SSLEnforcementConfig>(
        `${API_BASE_URL}/projects/${ref}/ssl-enforcement`,
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          method: 'GET',
        }
      )
    },
    CACHE_TTL.SECURITY
  )
}

/**
 * Update SSL enforcement configuration
 */
export async function updateSSLEnforcement(
  ref: string,
  enabled: boolean
): Promise<SSLEnforcementConfig> {
  // Invalidate cache
  cache.delete(`ssl-enforcement:${ref}`)

  const headers = await getAuthHeader()
  return enhancedFetch<SSLEnforcementConfig>(
    `${API_BASE_URL}/projects/${ref}/ssl-enforcement`,
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'PUT',
      body: JSON.stringify({
        requestedConfig: {
          database: enabled,
        },
      }),
    }
  )
}
```

---

## Option B: RLS Policy Listing (ADVANCED)

### Available Endpoint

```bash
POST /v1/projects/{ref}/database/query
```

**Status:** Beta (Partner OAuth apps only)
**Limitation:** May not work with standard Personal Access Tokens

### Proposed Command

#### `rls:policies:list` - List Row Level Security Policies

```bash
supabase-cli rls:policies:list --project my-project
supabase-cli rls:policies:list --project my-project --schema public
```

**Implementation:**
```typescript
// src/commands/rls/policies/list.ts
import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command'
import { OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { listRLSPolicies } from '../../../supabase'

export default class RLSPoliciesList extends BaseCommand {
  static description = 'List Row Level Security (RLS) policies in your database'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project',
    '<%= config.bin %> <%= command.id %> --project my-project --schema public',
    '<%= config.bin %> <%= command.id %> --project my-project --format table',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...ProjectFlags,
    schema: Flags.string({
      description: 'Filter by schema name',
      default: 'public',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(RLSPoliciesList)

    try {
      const projectRef = flags.project || flags['project-ref']
      if (!projectRef) {
        this.error('Project reference is required. Use --project flag or set SUPABASE_PROJECT_ID.', {
          exit: 1,
        })
      }

      const policies = await this.spinner(
        'Fetching RLS policies...',
        async () => listRLSPolicies(projectRef, flags.schema),
        'RLS policies fetched'
      )

      if (!flags.quiet) {
        this.header('Row Level Security Policies')
        if (flags.schema) {
          this.info(`Schema: ${flags.schema}`)
        }
        this.divider()
      }

      if (policies.length === 0) {
        if (flags.quiet) {
          this.output([])
        } else {
          this.warning(`No RLS policies found${flags.schema ? ` in schema '${flags.schema}'` : ''}`)
        }
      } else {
        if (!flags.quiet) {
          this.success(`Found ${policies.length} RLS polic${policies.length === 1 ? 'y' : 'ies'}`)
          this.divider()

          // Group by table
          const byTable = policies.reduce((acc, policy) => {
            const key = `${policy.schema}.${policy.table}`
            if (!acc[key]) acc[key] = []
            acc[key].push(policy)
            return acc
          }, {} as Record<string, typeof policies>)

          for (const [table, tablePolicies] of Object.entries(byTable)) {
            this.info(`\n${table} (${tablePolicies.length} policies):`)
            for (const policy of tablePolicies) {
              this.log(`  - ${policy.name}`)
              this.log(`    Command: ${policy.command}`)
              this.log(`    Type: ${policy.type}`)
              this.log(`    Roles: ${policy.roles.join(', ')}`)
            }
          }
        }

        this.output(policies)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
```

### API Function to Add (src/supabase.ts)

```typescript
export interface RLSPolicy {
  schema: string
  table: string
  name: string
  type: 'PERMISSIVE' | 'RESTRICTIVE'
  roles: string[]
  command: 'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  using_expression?: string
  check_expression?: string
}

/**
 * List RLS policies using database query endpoint
 * NOTE: Requires Beta API access (Partner OAuth apps only)
 */
export async function listRLSPolicies(
  ref: string,
  schema: string = 'public'
): Promise<RLSPolicy[]> {
  const query = `
    SELECT
      schemaname as schema,
      tablename as table,
      policyname as name,
      CASE WHEN permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as type,
      roles,
      cmd as command,
      qual as using_expression,
      with_check as check_expression
    FROM pg_policies
    WHERE schemaname = $1
    ORDER BY schemaname, tablename, policyname;
  `

  const headers = await getAuthHeader()

  try {
    const response = await enhancedFetch<{ result: RLSPolicy[] }>(
      `${API_BASE_URL}/projects/${ref}/database/query`,
      {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          query,
          params: [schema],
          read_only: true,
        }),
      }
    )

    return response.result || []
  } catch (error) {
    // If Beta API is not available, provide helpful error
    if (error instanceof SupabaseError && error.statusCode === 403) {
      throw new SupabaseError(
        'Database query endpoint requires Partner OAuth access. ' +
        'This feature is in Beta and may not be available with Personal Access Tokens. ' +
        'Please use the Supabase Dashboard to view RLS policies.',
        SupabaseErrorCode.FORBIDDEN,
        403
      )
    }
    throw error
  }
}
```

**Important Limitations:**
1. Requires Beta API access (may not work for all users)
2. Only shows database-level RLS policies
3. Doesn't show platform security settings
4. Response format may change (Beta API)

---

## Option C: Database Security Check Command

### Proposed Command

#### `db:security:check` - Check Database Security Settings

```bash
supabase-cli db:security:check --project my-project
```

Performs basic database security checks using available SQL queries:

1. **Tables without RLS enabled**
2. **Public tables** (accessible to anon role)
3. **Functions with SECURITY DEFINER**
4. **Roles without password expiry**
5. **SSL connection status**

**Implementation approach:**
- Use database query endpoint (Beta)
- Run multiple security-focused SQL queries
- Aggregate results into security report
- Color-code findings by severity

**Pros:**
- Provides actual security value
- Uses available API endpoints
- Focuses on database security (CLI's domain)

**Cons:**
- Requires Beta API access
- Limited to database security (not platform)
- May expose sensitive information

---

## Recommendation

**Implement Option A (SSL Enforcement Commands)**

**Reasons:**
1. ✅ **Working API endpoints** - Documented and stable
2. ✅ **Real security value** - SSL is important for production
3. ✅ **No Beta limitations** - Works with Personal Access Tokens
4. ✅ **Clear scope** - Simple, focused functionality
5. ✅ **Low maintenance** - Stable API, unlikely to change

**Commands to add:**
```bash
ssl:get      # Get SSL enforcement status
ssl:enable   # Enable SSL enforcement
ssl:disable  # Disable SSL enforcement
```

**Do NOT implement:**
- Option B (RLS policies) - Beta API limitation makes it unreliable
- Option C (Database security check) - Too complex, Beta API issues

---

## Implementation Checklist for SSL Commands

### Phase 1: Core Implementation

- [ ] Create `src/commands/ssl/get.ts`
- [ ] Create `src/commands/ssl/enable.ts`
- [ ] Create `src/commands/ssl/disable.ts`
- [ ] Add SSL types to `src/supabase.ts`
- [ ] Implement `getSSLEnforcement()` in `src/supabase.ts`
- [ ] Implement `updateSSLEnforcement()` in `src/supabase.ts`
- [ ] Add SSL commands to cache configuration

### Phase 2: Testing

- [ ] Create `test/commands/ssl-get.test.ts`
- [ ] Create `test/commands/ssl-enable.test.ts`
- [ ] Create `test/commands/ssl-disable.test.ts`
- [ ] Test with real API (if possible)
- [ ] Test error handling (404, 401, etc.)

### Phase 3: Documentation

- [ ] Add SSL commands to README.md
- [ ] Update CLAUDE.md with SSL commands
- [ ] Add examples to command help text
- [ ] Document SSL best practices

### Phase 4: Quality

- [ ] Run `npm run build` - verify compilation
- [ ] Run `npm test` - verify all tests pass
- [ ] Run `npm run lint` - verify code style
- [ ] Manual testing with Supabase project
- [ ] Update changelog

---

## Future Possibilities

If Supabase adds more security endpoints in the future:

### Network Restrictions (if API is added)
```bash
network:restrictions:list
network:restrictions:add --cidr 203.0.113.0/24
network:restrictions:remove --id abc123
```

### API Key Management (if API is added)
```bash
keys:list
keys:rotate --type anon
keys:rotate --type service_role
```

### Authentication Settings (if API is added)
```bash
auth:settings:get
auth:settings:update --enable-email --disable-phone
auth:providers:list
```

Monitor Supabase's API changelog for new endpoints:
- GitHub: https://github.com/supabase/supabase
- API docs: https://supabase.com/docs/reference/api
- Community: https://github.com/orgs/supabase/discussions

---

## Summary

**Current Status:**
- ❌ Cannot implement: Network restrictions, general security policies, security audits
- ✅ CAN implement: SSL enforcement (fully documented, stable API)
- ⚠️ MIGHT implement: RLS policies (Beta API, limited availability)

**Recommended Action:**
1. Remove non-functional security commands (see SECURITY_COMMANDS_REMOVAL_GUIDE.md)
2. Implement SSL enforcement commands (Option A above)
3. Document limitations clearly
4. Monitor API for future security endpoints

**Benefits:**
- CLI remains honest about capabilities
- Provides real security value (SSL enforcement)
- Uses stable, documented APIs
- Sets foundation for future security features

---

**Document Version:** 1.0
**Date:** October 30, 2025
**Status:** Implementation Ready
