# Supabase CLI - Developer Guide for AI Agents

This document provides comprehensive guidance for AI agents (Claude, GPT-4, etc.) working on the Supabase CLI codebase.

## Project Overview

**Name**: @coastal-programs/supabase-cli
**Type**: Command-line interface for Supabase
**Framework**: oclif v2/v3
**Language**: TypeScript (strict mode)
**Node**: >=22.0.0
**Architecture**: Based on Notion CLI v5.7.0 patterns

## Core Architecture Patterns

### 1. Cache Layer (`src/cache.ts`)

LRU cache with TTL support for API responses.

```typescript
import { cache } from './cache'

// Store data
cache.set('key', data, 60000) // 60 second TTL

// Retrieve data
const data = cache.get('key')

// Check existence
if (cache.has('key')) { /* ... */ }
```

**Key Features**:
- Configurable TTL per entry
- Maximum size limit
- Automatic expiration
- Enable/disable via environment

### 2. Retry Logic (`src/retry.ts`)

Exponential backoff with circuit breaker pattern.

```typescript
import { retry } from './retry'

const result = await retry.execute(async () => {
  // Your API call here
  return await api.fetchData()
})
```

**Key Features**:
- Exponential backoff (configurable multiplier)
- Circuit breaker (prevents cascading failures)
- Retryable error detection
- Configurable max attempts

### 3. Response Envelopes (`src/envelope.ts`)

Consistent response format for all operations.

```typescript
import { Envelope } from './envelope'

// Success response
const success = Envelope.success(data, { cached: true })

// Error response
const error = Envelope.error('Message', 'ERROR_CODE', 400)

// Check type
if (Envelope.isSuccess(response)) {
  console.log(response.data)
}
```

**Structure**:
```typescript
{
  success: true | false,
  data?: T,
  error?: { message, code, statusCode, details },
  metadata: { timestamp, duration, cached, ... }
}
```

### 4. Error Handling (`src/errors.ts`)

Hierarchical error system with retryability detection.

```typescript
import { SupabaseError, SupabaseErrorCode } from './errors'

throw new SupabaseError(
  'Project not found',
  SupabaseErrorCode.PROJECT_NOT_FOUND,
  404
)
```

**Error Types**:
- `SupabaseError` - Base error
- `AuthenticationError` - Auth failures
- `ValidationError` - Input validation
- `NotFoundError` - Resource not found
- `RateLimitError` - Rate limiting

### 5. Base Command (`src/base-command.ts`)

All commands extend `BaseCommand` for shared functionality.

```typescript
import { BaseCommand } from '../../base-command'

export default class MyCommand extends BaseCommand {
  static description = 'Description'
  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    try {
      this.header('My Command')

      // Do work
      const data = await this.fetchData()

      // Output
      this.output(data)
      this.success('Done!')

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
```

**Methods Available**:
- `output(data)` - Format and output data
- `success(msg)` - Green success message
- `error(msg)` - Red error message
- `warning(msg)` - Yellow warning message
- `info(msg)` - Blue info message
- `debug(msg)` - Debug message (if DEBUG=true)
- `header(title)` - Bold underlined header
- `divider()` - Horizontal line
- `confirm(msg)` - Interactive confirmation
- `spinner(msg, fn)` - Show spinner during async work

## File Structure

```
src/
├── commands/          # CLI commands
│   ├── projects/     # Project management
│   ├── config/       # Configuration
│   ├── backup/       # Backup & Recovery
│   ├── db/           # Database management
│   └── security/     # Security & Network
├── utils/            # Utility functions
│   ├── validation.ts
│   ├── parsing.ts
│   ├── transform.ts
│   └── platform.ts
├── cache.ts          # Cache layer
├── retry.ts          # Retry logic + circuit breaker
├── errors.ts         # Error definitions
├── envelope.ts       # Response envelopes
├── helper.ts         # Output formatting
├── base-command.ts   # Base command class
├── base-flags.ts     # Reusable flags
├── supabase.ts       # API wrapper
├── auth.ts           # Authentication
└── index.ts          # Main exports
```

## Adding a New Command

1. Create file in `src/commands/[topic]/[name].ts`
2. Extend `BaseCommand`
3. Define static properties
4. Implement `run()` method

Example:

```typescript
import { Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags } from '../../base-flags'

export default class MyCommand extends BaseCommand {
  static description = 'Command description'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --option value',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    myFlag: Flags.string({
      description: 'My custom flag',
    }),
  }

  static args = [
    {
      name: 'myArg',
      description: 'My argument',
      required: true,
    },
  ]

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MyCommand)

    try {
      // Your logic here
      this.output(result)
      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
```

## Testing Guidelines

### Test Structure

```typescript
import { expect } from 'chai'
import { MyClass } from '../src/my-class'

describe('MyClass', () => {
  let instance: MyClass

  beforeEach(() => {
    instance = new MyClass()
  })

  it('should do something', () => {
    const result = instance.doSomething()
    expect(result).to.equal('expected')
  })
})
```

### Running Tests

```bash
npm test                  # Run all tests
npm run test:coverage     # With coverage
npm run test:watch        # Watch mode
```

## Common Patterns

### API Call with Cache and Retry

```typescript
async fetchProjects(): Promise<Project[]> {
  const cacheKey = 'projects:list'

  // Check cache
  const cached = cache.get<Project[]>(cacheKey)
  if (cached) return cached

  // Make API call with retry
  const projects = await retry.execute(async () => {
    const response = await api.get('/projects')
    return response.data
  })

  // Cache result
  cache.set(cacheKey, projects, 300000) // 5 min

  return projects
}
```

### Output Formatting

```typescript
// JSON output (default)
this.output(data)

// Table output
// Use --format table flag

// Custom formatting
const formatted = Helper.formatOutput(data, {
  format: 'table',
  pretty: true,
  color: true,
})
this.log(formatted)
```

### Interactive Prompts

```typescript
const confirmed = await this.confirm('Are you sure?', false)
if (!confirmed) {
  this.warning('Cancelled')
  return
}
```

### Spinner for Long Operations

```typescript
const result = await this.spinner(
  'Fetching projects...',
  async () => {
    return await api.fetchProjects()
  },
  'Projects fetched successfully',
)
```

## Environment Variables

All environment variables should be documented in `.env.example`:

- `SUPABASE_ACCESS_TOKEN` - Access token
- `CACHE_ENABLED` - Enable caching
- `CACHE_TTL` - Cache TTL (ms)
- `RETRY_ENABLED` - Enable retry
- `RETRY_MAX_ATTEMPTS` - Max retries
- `DEBUG` - Enable debug logging

## Code Style

### TypeScript
- Strict mode enabled
- No implicit any
- Explicit return types preferred
- Use interfaces for objects

### Formatting
- 2-space indentation
- Single quotes
- No semicolons
- Trailing commas

### Linting
```bash
npm run lint        # Check
npm run lint:fix    # Fix
```

## Build and Release

```bash
# Build
npm run build

# Version bump
npm version patch|minor|major

# Publish (after build)
npm publish
```

## Debugging

```bash
# Enable debug mode
DEBUG=true supabase-cli command

# Or use --debug flag
supabase-cli command --debug
```

## Sprint Progress

- [x] Sprint 0: Project scaffolding
- [x] Sprint 1: Core infrastructure (cache, retry, errors)
- [x] Sprint 2: Authentication & configuration
- [x] Sprint 3: Project management commands
- [x] Sprint 4: Database management commands
- [x] Phase 2B: Operations & Enterprise Features
- [ ] Phase 2C: Advanced Features (TBD)

## Phase 2B: Operations Features (Latest)

### Commands Implemented (17 total)

**Backup & Recovery (8)**:
- `backup:list` - List all backups
- `backup:get` - Get backup details
- `backup:create` - Create on-demand backup
- `backup:delete` - Delete backup (destructive)
- `backup:restore` - Restore from backup (destructive)
- `backup:schedule:list` - List backup schedules
- `backup:schedule:create` - Create backup schedule
- `backup:pitr:restore` - Point-in-time restore (destructive)

**Advanced Database (4)**:
- `db:replicas:list` - List read replicas
- `db:replicas:create` - Create read replica
- `db:replicas:delete` - Delete replica (destructive)
- `db:config:set` - Set database configuration

**Network & Security (5)**:
- `security:restrictions:list` - List IP restrictions
- `security:restrictions:add` - Add IP whitelist restriction
- `security:restrictions:remove` - Remove IP restriction
- `security:policies:list` - List security policies
- `security:audit` - Run security audit with color-coded severity

### Implementation Details

**Cache Management**:
- List operations: 5-10 min TTL
- Automatic cache invalidation on writes (create/delete/update)
- Cache keys: `backups:list:{projectRef}`, `replicas:list:{projectRef}`, etc.

**Error Handling**:
- All commands use SupabaseError hierarchy
- Comprehensive error messages
- Automatic retry for transient failures
- Circuit breaker prevents cascading failures

**Confirmation Prompts**:
- Destructive operations require confirmation
- `--yes` flag bypasses prompts (for CI/CD)
- Clear warnings for data loss operations

**Output Formatting**:
- All commands support --format flag (json, table, yaml)
- Color-coded output (green=success, red=error, yellow=warning)
- Security audit uses color-coded severity (red=critical, yellow=high, blue=medium, gray=low)

### Test Coverage

**Command Tests**: 17 test files (one per command)
- Happy path testing
- Error scenarios
- Flag validation
- Output formatting

**Integration Tests**: 3 workflow tests
- Backup lifecycle (create -> list -> restore -> delete)
- Replica workflow (create -> list -> delete)
- Security workflow (add restriction -> list -> remove)

**Error Handling Tests**: 3 test files
- Network errors (timeouts, connection failures)
- Validation errors (invalid CIDR, missing args)
- Edge cases (empty results, API limits)

**Branch Coverage Tests**: 3 test files
- Backup edge cases (PITR, schedule frequency validation)
- Replica edge cases (region validation, quota limits)
- Security edge cases (CIDR validation, audit findings)

**Performance Tests**: 8 test files
- Startup time (< 700ms)
- Backup operations (< 5s)
- Replica operations (< 10s)
- Network operations (< 1s)
- Memory usage (< 200MB peak)
- Cache effectiveness (> 75% hit rate)
- Load testing (concurrent operations)
- API response times

**Total**: 34+ test files covering all Phase 2B commands

### Quality Metrics

- All commands extend BaseCommand pattern
- Full error handling with SupabaseError
- Cache invalidation on destructive operations
- Confirmation prompts with --yes flag bypass
- Performance targets met (see docs/PERFORMANCE_REPORT_PHASE2B.md)
- TypeScript compiles with 0 errors
- Code follows established patterns

### Performance

See `docs/PERFORMANCE_REPORT_PHASE2B.md` for detailed analysis:
- Backup operations: < 5 seconds
- Replica operations: < 10 seconds
- Network operations: < 1 second
- Memory usage: < 200MB peak
- Cache hit rate: > 75%
- No regressions vs Phase 2A

### API Methods Added to `src/supabase.ts`

**Backup APIs**:
- `listBackups(projectRef)` - List backups
- `getBackup(projectRef, backupId)` - Get backup details
- `createBackup(projectRef, description?)` - Create backup
- `deleteBackup(projectRef, backupId)` - Delete backup
- `restoreFromBackup(projectRef, backupId)` - Restore backup
- `listBackupSchedules(projectRef)` - List schedules
- `createBackupSchedule(projectRef, frequency, retention)` - Create schedule
- `restoreFromPITR(projectRef, timestamp)` - Point-in-time restore

**Replica APIs**:
- `listDatabaseReplicas(projectRef)` - List replicas
- `createDatabaseReplica(projectRef, location)` - Create replica
- `deleteDatabaseReplica(projectRef, replicaId)` - Delete replica

**Database Config APIs**:
- `setDatabaseConfig(projectRef, settings)` - Set config

**Security APIs**:
- `listNetworkRestrictions(projectRef)` - List restrictions
- `addNetworkRestriction(projectRef, cidr, description?)` - Add restriction
- `removeNetworkRestriction(projectRef, restrictionId)` - Remove restriction
- `listSecurityPolicies(projectRef)` - List policies
- `runSecurityAudit(projectRef)` - Run audit

## AI Agent Quick Tips

1. **Always extend BaseCommand** for new commands
2. **Use existing flags** from `base-flags.ts`
3. **Follow the envelope pattern** for responses
4. **Add tests** for new functionality
5. **Update README** with new commands
6. **Use cache + retry** for all API calls
7. **Handle errors** with SupabaseError
8. **Format output** with Helper utilities
9. **Keep TODO comments** for future work
10. **Run tests** before committing
11. **Add confirmation prompts** for destructive operations
12. **Invalidate cache** after write operations
13. **Document all flags** in command descriptions
14. **Use color-coding** for severity/status indicators

## Need Help?

- Check existing commands in `src/commands/`
- Review test files in `test/`
- Read architecture docs in `docs/`
- See Phase 2B commands for latest patterns
- Check `docs/PERFORMANCE_REPORT_PHASE2B.md` for performance benchmarks
