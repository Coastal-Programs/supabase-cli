# AI Agent Quick Reference

Quick lookup guide for AI agents working on this codebase.

## Project Info

- **Package**: `@coastal-programs/supabase-cli`
- **Framework**: oclif v2/v3
- **Language**: TypeScript (strict)
- **Node**: >=22.0.0
- **Test**: Mocha + Chai + NYC

## Common Commands

```bash
npm install          # Install dependencies
npm run build        # Build TypeScript
npm test            # Run tests
npm run lint        # Lint code
./bin/dev <cmd>     # Run CLI in dev mode
./bin/run <cmd>     # Run CLI (compiled)
```

## File Locations

| What | Where |
|------|-------|
| Commands | `src/commands/[topic]/[name].ts` |
| Tests | `test/[name].test.ts` |
| Infrastructure | `src/cache.ts`, `src/retry.ts`, etc. |
| Base Command | `src/base-command.ts` |
| Flags | `src/base-flags.ts` |
| Errors | `src/errors.ts` |

## New Command Template

```typescript
import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags } from '../../base-flags'

export default class MyCommand extends BaseCommand {
  static description = 'Description here'
  static flags = { ...BaseCommand.baseFlags, ...OutputFormatFlags }

  async run(): Promise<void> {
    try {
      this.header('Title')
      // Do work
      this.output(data)
      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
```

## Test Template

```typescript
import { expect } from 'chai'
import { MyClass } from '../src/my-class'

describe('MyClass', () => {
  it('should work', () => {
    expect(true).to.be.true
  })
})
```

## Common Imports

```typescript
// Commands
import { BaseCommand } from '../../base-command'
import { Flags } from '@oclif/core'
import { AutomationFlags, OutputFormatFlags } from '../../base-flags'

// Infrastructure
import { cache } from './cache'
import { retry } from './retry'
import { Envelope } from './envelope'
import { Helper } from './helper'
import { SupabaseError, SupabaseErrorCode } from './errors'
```

## BaseCommand Methods

```typescript
this.output(data)              // Format and output
this.success('msg')            // Green checkmark
this.error('msg')              // Red X
this.warning('msg')            // Yellow warning
this.info('msg')               // Blue info
this.debug('msg')              // Debug (if DEBUG=true)
this.header('title')           // Bold header
this.divider()                 // Horizontal line
await this.confirm('msg?')     // Interactive confirm
await this.spinner('msg', fn)  // Show spinner
this.handleError(error)        // Handle error
```

## Available Flags

```typescript
AutomationFlags        // quiet, verbose, debug, no-interactive
OutputFormatFlags      // format, pretty, color
PaginationFlags        // limit, offset, page, page-size
FilterFlags            // filter, search, sort-by, sort-order
ProjectFlags           // project, project-ref
AuthFlags              // token
ConfigFlags            // config, profile
ConfirmationFlags      // yes, force
TimeRangeFlags         // from, to, since
FileFlags              // input, output, overwrite
CacheFlags             // no-cache, cache-ttl, clear-cache
RetryFlags             // no-retry, max-retries
```

## Error Types

```typescript
SupabaseError              // Base error
AuthenticationError        // 401
ValidationError            // 422
NotFoundError              // 404
RateLimitError             // 429
ConfigurationError         // Config issues
```

## Cache Pattern

```typescript
const key = 'my:cache:key'
const cached = cache.get<MyType>(key)
if (cached) return cached

const data = await fetchData()
cache.set(key, data, 300000) // 5 min TTL
return data
```

## Retry Pattern

```typescript
const result = await retry.execute(async () => {
  return await api.call()
})
```

## Envelope Pattern

```typescript
const envelope = Envelope.success(data, { cached: true })
if (Envelope.isSuccess(envelope)) {
  return envelope.data
}
```

## Environment Variables

```bash
SUPABASE_ACCESS_TOKEN       # Required
CACHE_ENABLED=true          # Optional
CACHE_TTL=300000           # Optional
RETRY_ENABLED=true         # Optional
RETRY_MAX_ATTEMPTS=3       # Optional
DEBUG=true                 # Optional
```

## Directory Structure

```
src/
├── commands/          # All CLI commands
│   ├── projects/     # Project commands
│   └── config/       # Config commands
├── utils/            # Utilities
│   ├── validation.ts
│   ├── parsing.ts
│   ├── transform.ts
│   └── platform.ts
├── cache.ts          # LRU cache
├── retry.ts          # Retry + circuit breaker
├── errors.ts         # Error definitions
├── envelope.ts       # Response envelopes
├── helper.ts         # Output formatting
├── base-command.ts   # Base for all commands
├── base-flags.ts     # Reusable flags
├── supabase.ts       # API wrapper
├── auth.ts           # Auth manager
└── index.ts          # Main exports

test/
├── cache-retry.test.ts
├── auth.test.ts
├── envelope.test.ts
├── errors.test.ts
└── commands/
```

## Workflow

1. Create branch: `git checkout -b feature/my-feature`
2. Make changes
3. Add tests
4. Run `npm test`
5. Run `npm run lint`
6. Commit with conventional message
7. Push and create PR

## Tips

- Always extend `BaseCommand`
- Use existing flags from `base-flags.ts`
- Follow envelope pattern for responses
- Add tests for new features
- Use cache + retry for API calls
- Handle errors with `SupabaseError`
- Format output with `Helper`
- Keep TODO comments for future work
- Update README for new commands
- Run tests before committing

## Links

- Full dev guide: [CLAUDE.md](CLAUDE.md)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)
- Security: [SECURITY.md](SECURITY.md)
- Changelog: [CHANGELOG.md](CHANGELOG.md)
