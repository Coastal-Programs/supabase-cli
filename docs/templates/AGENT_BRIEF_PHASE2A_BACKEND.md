# 🏗️ AGENT BRIEF: BACKEND-ARCHITECT
## Phase 2A - Implementation of 27 Commands

**Target**: Implement 27 commands (~1,200 lines) following established patterns
**Timeline**: 9 AM - 4 PM (5-6 hours, intensive focus)
**Success Criteria**: All 27 commands working, all tests passing, 0 compilation errors

---

## YOUR MISSION

Implement 27 new Supabase CLI commands across 4 feature areas:
1. **Storage Management** (6 commands)
2. **Authentication** (8 commands)
3. **Integrations** (5 commands)
4. **Monitoring & Logging** (8 commands)

All commands must follow the established oclif + envelope pattern from Sprint 4.

---

## KEY PATTERNS TO FOLLOW

### 1. Command Structure (from src/commands/projects/list.ts)

```typescript
import { Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command'
import { OutputFormatFlags, AutomationFlags } from '../../base-flags'

export default class MyCommand extends BaseCommand {
  static description = 'Clear, concise description'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --option value',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    myFlag: Flags.string({
      description: 'Description of flag',
      required: false,
    }),
  }

  static args = [
    {
      name: 'projectId',
      description: 'Project ID',
      required: true,
    },
  ]

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MyCommand)

    try {
      this.header('Command Title')

      // Implement logic here
      const result = await this.supabase.someMethod()

      // Always use output() for data
      this.output(result, flags)

      // Success message
      this.success('Operation completed successfully!')
      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
```

### 2. Error Handling (from src/errors.ts)

```typescript
import { SupabaseError, SupabaseErrorCode } from '../../errors'

throw new SupabaseError(
  'Bucket not found',
  SupabaseErrorCode.NOT_FOUND,
  404
)
```

### 3. Cache Management (from src/cache.ts)

```typescript
import { cache } from '../../cache'

// Set with TTL
cache.set('buckets:list', buckets, 300000) // 5 min

// Get from cache
const cached = cache.get('buckets:list')
if (cached) return cached

// Invalidate on write
cache.delete('buckets:list')
```

### 4. API Calls (from src/supabase.ts)

```typescript
// All API methods exist in supabase.ts
const result = await this.supabase.getStorageBuckets()
const bucket = await this.supabase.getStorageBucket(id)
```

### 5. Response Formatting (from src/helper.ts)

```typescript
// The output() method handles all formatting
this.output(data, flags)
// Respects --format flag: json, table, yaml, csv

// The Envelope pattern is handled by output()
// No need to manually create envelopes
```

---

## STORAGE MANAGEMENT (6 commands)

### storage/buckets/list.ts (100 lines)
```
supabase storage buckets list [--format json|table]
```

**What it does**:
- List all storage buckets for authenticated project
- Show bucket name, ID, created date, is_public

**Implementation checklist**:
- [ ] Extend BaseCommand
- [ ] Call `this.supabase.getStorageBuckets()`
- [ ] Cache result for 5 minutes
- [ ] Format with output()
- [ ] Handle error: PROJECT_NOT_FOUND

**Test cases** (3):
- List buckets successfully
- Handle no buckets found
- Handle API error

---

### storage/buckets/get.ts (80 lines)
```
supabase storage buckets get <bucketId> [--format json|table]
```

**What it does**:
- Get specific bucket details
- Show configuration, policies, file count

**Implementation checklist**:
- [ ] Get bucketId from args
- [ ] Call `this.supabase.getStorageBucket(bucketId)`
- [ ] Cache result for 5 minutes
- [ ] Handle error: BUCKET_NOT_FOUND

**Test cases** (2):
- Get bucket successfully
- Handle bucket not found

---

### storage/buckets/create.ts (120 lines)
```
supabase storage buckets create <name> [--public] [--yes]
```

**What it does**:
- Create new storage bucket
- Confirm before creation (unless --yes)

**Implementation checklist**:
- [ ] Get name from args
- [ ] Confirm: "Create bucket '{name}'?"
- [ ] Call `this.supabase.createStorageBucket(name, public)`
- [ ] Invalidate cache: delete('buckets:list')
- [ ] Show success with bucket ID

**Test cases** (3):
- Create bucket successfully
- Require confirmation (unless --yes)
- Handle bucket already exists error

---

### storage/buckets/delete.ts (90 lines)
```
supabase storage buckets delete <bucketId> [--yes]
```

**What it does**:
- Delete storage bucket
- Require confirmation

**Implementation checklist**:
- [ ] Require --yes flag or confirmation prompt
- [ ] Call `this.supabase.deleteStorageBucket(bucketId)`
- [ ] Invalidate cache
- [ ] Show success message

**Test cases** (3):
- Delete successfully with --yes
- Require confirmation (UI test)
- Handle bucket not found error

---

### storage/policies/list.ts (80 lines)
```
supabase storage policies list <bucketId> [--format json|table]
```

**What it does**:
- List storage bucket policies
- Show policy name, action, effect

**Implementation checklist**:
- [ ] Get bucketId from args
- [ ] Call `this.supabase.getStoragePolicies(bucketId)`
- [ ] Cache for 5 minutes
- [ ] Format with output()

**Test cases** (2):
- List policies successfully
- Handle bucket not found

---

### storage/policies/set.ts (110 lines)
```
supabase storage policies set <bucketId> --policy <json> [--yes]
```

**What it does**:
- Configure storage bucket policies
- Set RLS policies for the bucket

**Implementation checklist**:
- [ ] Parse --policy JSON flag
- [ ] Validate policy JSON
- [ ] Confirm before applying
- [ ] Call `this.supabase.setStoragePolicies(bucketId, policy)`
- [ ] Invalidate cache
- [ ] Show applied policy

**Test cases** (3):
- Set policy successfully
- Validate JSON format
- Handle invalid policy error

---

## AUTHENTICATION (8 commands)

### auth/sso/list.ts (85 lines)
```
supabase auth sso list [--format json|table]
```

**What it does**:
- List configured SSO providers (Okta, Azure, etc)
- Show provider name, status, configured date

**Implementation checklist**:
- [ ] Call `this.supabase.getSSOProviders()`
- [ ] Cache for 10 minutes
- [ ] Format with output()
- [ ] Show status indicator (✓ enabled, ✗ disabled)

**Test cases** (2):
- List providers successfully
- Handle no providers

---

### auth/sso/enable.ts (110 lines)
```
supabase auth sso enable <providerId> --config <json> [--yes]
```

**What it does**:
- Enable SSO provider
- Configure provider settings (client ID, secret, etc)

**Implementation checklist**:
- [ ] Get providerId from args
- [ ] Parse --config JSON
- [ ] Validate config fields
- [ ] Confirm before enabling
- [ ] Call `this.supabase.enableSSOProvider(providerId, config)`
- [ ] Invalidate cache
- [ ] Show success

**Test cases** (3):
- Enable provider successfully
- Validate config format
- Handle provider already enabled

---

### auth/sso/disable.ts (90 lines)
```
supabase auth sso disable <providerId> [--yes]
```

**What it does**:
- Disable SSO provider
- Require confirmation

**Implementation checklist**:
- [ ] Require --yes or confirmation
- [ ] Call `this.supabase.disableSSOProvider(providerId)`
- [ ] Invalidate cache
- [ ] Show success

**Test cases** (2):
- Disable successfully with --yes
- Handle provider not found

---

### auth/jwt/get.ts (75 lines)
```
supabase auth jwt get [--format json|table]
```

**What it does**:
- Get current JWT signing key
- Show key ID, algorithm, created date

**Implementation checklist**:
- [ ] Call `this.supabase.getJWTKey()`
- [ ] Cache for 10 minutes
- [ ] Show key (masked for security)
- [ ] Format with output()

**Test cases** (2):
- Get JWT key successfully
- Handle not configured error

---

### auth/jwt/rotate.ts (95 lines)
```
supabase auth jwt rotate [--yes]
```

**What it does**:
- Rotate JWT signing key
- Generate new signing key

**Implementation checklist**:
- [ ] Require --yes or confirmation
- [ ] Call `this.supabase.rotateJWTKey()`
- [ ] Invalidate cache
- [ ] Show new key ID

**Test cases** (2):
- Rotate successfully with --yes
- Show confirmation needed

---

### auth/providers/list.ts (80 lines)
```
supabase auth providers list [--format json|table]
```

**What it does**:
- List available auth providers (Google, GitHub, Discord, etc)
- Show provider name, status

**Implementation checklist**:
- [ ] Call `this.supabase.getAuthProviders()`
- [ ] Cache for 10 minutes
- [ ] Format with output()

**Test cases** (2):
- List providers successfully
- Handle no providers

---

### auth/providers/config.ts (115 lines)
```
supabase auth providers config <provider> --key <key> --value <value> [--yes]
```

**What it does**:
- Configure auth provider (set client ID, client secret, etc)

**Implementation checklist**:
- [ ] Parse provider, key, value from args
- [ ] Validate key name
- [ ] Confirm before setting secret
- [ ] Call `this.supabase.setAuthProviderConfig(provider, key, value)`
- [ ] Invalidate cache
- [ ] Show success

**Test cases** (3):
- Configure provider successfully
- Handle invalid provider
- Mask secret values in output

---

### auth/service/config.ts (120 lines)
```
supabase auth service config --setting <key>=<value> [--yes]
```

**What it does**:
- Configure auth service settings (email domain, rate limits, etc)

**Implementation checklist**:
- [ ] Parse --setting flags
- [ ] Validate all settings
- [ ] Confirm before applying
- [ ] Call `this.supabase.setAuthServiceConfig(settings)`
- [ ] Invalidate cache
- [ ] Show applied settings

**Test cases** (3):
- Set config successfully
- Validate setting keys
- Handle invalid setting error

---

## INTEGRATIONS (5 commands)

### integrations/webhooks/list.ts (90 lines)
```
supabase integrations webhooks list [--format json|table]
```

**What it does**:
- List all webhooks configured
- Show webhook URL, events, status

**Implementation checklist**:
- [ ] Call `this.supabase.getWebhooks()`
- [ ] Cache for 5 minutes
- [ ] Show status indicators (✓ active, ✗ failed)
- [ ] Format with output()

**Test cases** (2):
- List webhooks successfully
- Handle no webhooks

---

### integrations/webhooks/create.ts (125 lines)
```
supabase integrations webhooks create --url <url> --events <events> [--yes]
```

**What it does**:
- Create new webhook
- Configure which events trigger the webhook

**Implementation checklist**:
- [ ] Parse URL and events
- [ ] Validate URL format
- [ ] Validate event names
- [ ] Confirm before creating
- [ ] Call `this.supabase.createWebhook(url, events)`
- [ ] Invalidate cache
- [ ] Show webhook ID

**Test cases** (4):
- Create webhook successfully
- Validate URL format
- Validate event names
- Handle webhook limit error

---

### integrations/webhooks/delete.ts (85 lines)
```
supabase integrations webhooks delete <webhookId> [--yes]
```

**What it does**:
- Delete webhook
- Require confirmation

**Implementation checklist**:
- [ ] Require --yes or confirmation
- [ ] Call `this.supabase.deleteWebhook(webhookId)`
- [ ] Invalidate cache
- [ ] Show success

**Test cases** (2):
- Delete successfully with --yes
- Handle webhook not found

---

### integrations/list.ts (90 lines)
```
supabase integrations list [--format json|table]
```

**What it does**:
- List available integrations (Slack, Zapier, etc)
- Show integration name, status

**Implementation checklist**:
- [ ] Call `this.supabase.getAvailableIntegrations()`
- [ ] Cache for 10 minutes
- [ ] Format with output()

**Test cases** (2):
- List integrations successfully
- Handle no integrations available

---

### integrations/setup.ts (115 lines)
```
supabase integrations setup <integrationName> --config <json> [--yes]
```

**What it does**:
- Setup third-party integration
- Configure integration settings (API keys, etc)

**Implementation checklist**:
- [ ] Parse integration name and config
- [ ] Validate config JSON
- [ ] Confirm before setting up
- [ ] Call `this.supabase.setupIntegration(integrationName, config)`
- [ ] Invalidate cache
- [ ] Show success and status URL

**Test cases** (3):
- Setup successfully
- Validate config format
- Handle integration not available

---

## MONITORING & LOGGING (8 commands)

### logs/functions/list.ts (100 lines)
```
supabase logs functions list [--since <timestamp>] [--until <timestamp>] [--format json|table]
```

**What it does**:
- List edge function execution logs
- Show function name, timestamp, execution time, status

**Implementation checklist**:
- [ ] Parse optional --since and --until flags
- [ ] Call `this.supabase.getFunctionLogs(options)`
- [ ] Cache for 2 minutes (logs are recent)
- [ ] Format with output()
- [ ] Show status indicator (✓ success, ✗ error)

**Test cases** (3):
- List logs successfully
- Filter by timestamp range
- Handle no logs found

---

### logs/functions/get.ts (85 lines)
```
supabase logs functions get <logId> [--format json|table]
```

**What it does**:
- Get specific function execution log
- Show full output, errors, execution details

**Implementation checklist**:
- [ ] Get logId from args
- [ ] Call `this.supabase.getFunctionLog(logId)`
- [ ] Format with output()

**Test cases** (2):
- Get log successfully
- Handle log not found

---

### logs/errors/list.ts (100 lines)
```
supabase logs errors list [--since <timestamp>] [--format json|table]
```

**What it does**:
- List error logs
- Show error message, timestamp, function/service

**Implementation checklist**:
- [ ] Parse optional --since flag
- [ ] Call `this.supabase.getErrorLogs(options)`
- [ ] Cache for 2 minutes
- [ ] Format with output()
- [ ] Show error severity (🔴 critical, 🟡 warning)

**Test cases** (2):
- List error logs successfully
- Filter by timestamp

---

### logs/errors/get.ts (85 lines)
```
supabase logs errors get <errorId> [--format json|table]
```

**What it does**:
- Get specific error log with full stack trace
- Show error details and context

**Implementation checklist**:
- [ ] Get errorId from args
- [ ] Call `this.supabase.getErrorLog(errorId)`
- [ ] Format with output()

**Test cases** (2):
- Get error log successfully
- Handle error not found

---

### logs/api/list.ts (100 lines)
```
supabase logs api list [--since <timestamp>] [--endpoint <pattern>] [--format json|table]
```

**What it does**:
- List API request logs
- Show endpoint, method, status code, response time

**Implementation checklist**:
- [ ] Parse optional filters
- [ ] Call `this.supabase.getAPILogs(options)`
- [ ] Cache for 2 minutes
- [ ] Format with output()
- [ ] Show status code color (🟢 success, 🟡 warning, 🔴 error)

**Test cases** (3):
- List API logs successfully
- Filter by endpoint pattern
- Filter by status code

---

### logs/api/get.ts (85 lines)
```
supabase logs api get <logId> [--format json|table]
```

**What it does**:
- Get specific API request log with full details
- Show request/response body, headers

**Implementation checklist**:
- [ ] Get logId from args
- [ ] Call `this.supabase.getAPILog(logId)`
- [ ] Format with output()

**Test cases** (2):
- Get API log successfully
- Handle log not found

---

### monitor/metrics.ts (110 lines)
```
supabase monitor metrics [--period <period>] [--format json|table]
```

**What it does**:
- View performance metrics
- Show: API response time, database query time, function execution time, storage usage

**Implementation checklist**:
- [ ] Parse optional --period flag (1h, 24h, 7d)
- [ ] Call `this.supabase.getMetrics(period)`
- [ ] Cache for 5 minutes
- [ ] Calculate averages and trends
- [ ] Format with output()
- [ ] Show charts/graphs if terminal supports

**Test cases** (3):
- Get metrics successfully
- Filter by period
- Handle no data available

---

### monitor/health.ts (120 lines)
```
supabase monitor health [--format json|table]
```

**What it does**:
- System health check
- Show: API health, database status, storage status, auth status, function status

**Implementation checklist**:
- [ ] Call multiple health check endpoints
- [ ] Use retry logic for resilience
- [ ] Cache for 1 minute
- [ ] Show status indicators (✓ healthy, ⚠ degraded, ✗ down)
- [ ] Format with output()
- [ ] Show response times for each service

**Test cases** (4):
- Get health successfully
- Handle one service unhealthy
- Handle multiple services down
- Timeout handling

---

## QUALITY STANDARDS

### Code Quality
✅ TypeScript strict mode (no `any` types)
✅ Proper error handling with SupabaseError
✅ Cache invalidation on write operations
✅ All flags documented with examples
✅ Help text for every command
✅ Input validation with clear error messages

### Testing
✅ Unit tests for each command
✅ Happy path testing
✅ Error handling testing
✅ Integration testing
✅ No `any` types in tests

### Documentation
✅ Clear command descriptions
✅ Example usage for each command
✅ Flag descriptions complete
✅ Error message explanations

---

## FILE ORGANIZATION

Create commands in this structure:
```
src/commands/
├── storage/
│   ├── buckets/
│   │   ├── list.ts
│   │   ├── get.ts
│   │   ├── create.ts
│   │   └── delete.ts
│   └── policies/
│       ├── list.ts
│       └── set.ts
├── auth/
│   ├── sso/
│   │   ├── list.ts
│   │   ├── enable.ts
│   │   └── disable.ts
│   ├── jwt/
│   │   ├── get.ts
│   │   └── rotate.ts
│   ├── providers/
│   │   ├── list.ts
│   │   └── config.ts
│   └── service/
│       └── config.ts
├── integrations/
│   ├── webhooks/
│   │   ├── list.ts
│   │   ├── create.ts
│   │   └── delete.ts
│   ├── list.ts
│   └── setup.ts
└── logs/
    ├── functions/
    │   ├── list.ts
    │   └── get.ts
    ├── errors/
    │   ├── list.ts
    │   └── get.ts
    ├── api/
    │   ├── list.ts
    │   └── get.ts
    └── monitor/
        ├── metrics.ts
        └── health.ts
```

---

## VERIFICATION

Before finishing, verify:
- [ ] All 27 command files created
- [ ] All follow BaseCommand pattern
- [ ] All have proper error handling
- [ ] All use cache correctly
- [ ] All have comprehensive help text
- [ ] All tests written by Agent 2 pass
- [ ] TypeScript compiles (0 errors)
- [ ] ESLint clean (0 violations)

---

## SUCCESS

You're done when:
✅ All 27 commands implemented
✅ All pass Agent 2's tests
✅ `npm run build` succeeds with 0 errors
✅ `npm test` shows all new tests passing

---

*Created by: Chen (Claude Code)*
*For: Phase 2A Backend Implementation*
*Target: 27 Commands, Production Grade*
