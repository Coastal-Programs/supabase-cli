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
- [x] Phase 4C: API validation & cleanup
- [ ] Phase 5: User documentation & guides - IN PROGRESS

## Current Implementation Status

### Commands Working (28 total)

**Backup & Recovery (2)**:
- `backup:list` - List all backups (API exists: GET /v1/projects/{ref}/database/backups)
- `backup:pitr:restore` - Point-in-time restore (API exists: POST /v1/projects/{ref}/database/backups/restore-pitr)

**Advanced Database (0)**:
- Note: Replica and database config commands are not yet exposed via the Management API

**Network & Security (2)**:
- `security:restrictions:list` - List IP restrictions
- `security:audit` - Run security audit with color-coded severity

### Deleted Commands (6)

These commands were removed because their corresponding API endpoints do not exist in the Supabase Management API:

1. ~~`backup:create`~~ - No API endpoint for manual backup creation
2. ~~`backup:delete`~~ - No API endpoint for backup deletion
3. ~~`backup:get`~~ - No dedicated endpoint (details are in list response)
4. ~~`backup:restore`~~ - No API endpoint for backup restoration (use PITR instead)
5. ~~`backup:schedule:list`~~ - No API endpoint (schedules are plan-based)
6. ~~`backup:schedule:create`~~ - No API endpoint (schedules are plan-based)

**Reason**: Supabase automatically manages backups based on plan tier. Daily backups cannot be manually created, deleted, or scheduled via API.

### API Validation Notes

**Management API Backup Endpoints**:
- ✅ Working: `GET /v1/projects/{ref}/database/backups`
- ✅ Untested: `POST /v1/projects/{ref}/database/backups/restore-pitr`
- ❌ Does not exist: Create, delete, get single, schedule management
- ❌ Rate limit: 60 requests/minute for list operations

**Backup Features by Plan**:
- Free: No backups
- Pro: 7 days of daily backups
- Team: 14 days of daily backups
- Enterprise: Up to 30 days of daily backups
- PITR: $100-$400/month depending on retention window

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
15. **Verify API endpoints exist** before implementing commands
16. **Check docs/api/endpoints/** for endpoint documentation

## Need Help?

- Check existing commands in `src/commands/`
- Review test files in `test/`
- Read architecture docs in `docs/`
- Check `docs/api/endpoints/` for API documentation
- See `docs/SECURITY_COMMANDS_STATUS.txt` for research on non-existent endpoints
