# Development Documentation

Developer guides and references for contributing to the Supabase CLI.

## Developer Guides

### [Standardization Complete](standardization-complete.md)
Command standardization documentation:
- Standardization process and results
- Command naming conventions
- Flag standardization
- Pattern consistency

### [Command Changes Mapping](command-changes-mapping.md)
Mapping of command changes across versions:
- Command renames
- Flag changes
- Breaking changes
- Migration guide

## Getting Started

### Prerequisites
- Node.js >= 22.0.0
- npm >= 9.0.0
- Git
- A Supabase account and access token

### Setup
```bash
# Clone repository
git clone https://github.com/coastal-programs/supabase-cli.git
cd supabase-cli

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

## Development Workflow

### 1. Adding a New Command

See [CLAUDE.md](../../CLAUDE.md) for detailed instructions.

Quick template:
```typescript
import { Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command'

export default class MyCommand extends BaseCommand {
  static description = 'Command description'

  static flags = {
    ...BaseCommand.baseFlags,
    myFlag: Flags.string({ description: 'My flag' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(MyCommand)
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

### 2. Testing Your Changes

```bash
# Run all tests
npm test

# Run specific test file
npm test -- test/commands/my-command.test.ts

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### 3. Code Style

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Project Structure

```
src/
├── commands/          # CLI commands
│   ├── projects/     # Project management
│   ├── config/       # Configuration
│   ├── backup/       # Backup & Recovery
│   ├── db/           # Database management
│   └── security/     # Security & Network
├── utils/            # Utility functions
├── cache.ts          # Cache layer
├── retry.ts          # Retry logic + circuit breaker
├── errors.ts         # Error definitions
├── envelope.ts       # Response envelopes
├── helper.ts         # Output formatting
├── base-command.ts   # Base command class
├── base-flags.ts     # Reusable flags
├── supabase.ts       # API wrapper
└── auth.ts           # Authentication
```

## Coding Standards

### TypeScript
- ✅ Strict mode enabled
- ✅ No implicit any
- ✅ Explicit return types preferred
- ✅ Use interfaces for objects

### Naming Conventions
- ✅ Commands: `noun:verb` (e.g., `projects:list`)
- ✅ Files: kebab-case (e.g., `my-command.ts`)
- ✅ Classes: PascalCase (e.g., `MyCommand`)
- ✅ Functions: camelCase (e.g., `myFunction`)
- ✅ Constants: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)

### Formatting
- 2-space indentation
- Single quotes
- No semicolons
- Trailing commas

## Common Patterns

### API Call with Cache and Retry
```typescript
async fetchData(): Promise<Data> {
  const cacheKey = 'my-cache-key'

  // Check cache
  const cached = cache.get<Data>(cacheKey)
  if (cached) return cached

  // Make API call with retry
  const data = await retry.execute(async () => {
    const response = await api.getData()
    return response.data
  })

  // Cache result
  cache.set(cacheKey, data, 300000) // 5 min

  return data
}
```

### Error Handling
```typescript
try {
  // Your code
} catch (error) {
  if (error instanceof SupabaseError) {
    this.handleError(error)
  } else {
    this.handleError(new SupabaseError(
      'Operation failed',
      SupabaseErrorCode.UNKNOWN_ERROR
    ))
  }
}
```

### Output Formatting
```typescript
// JSON output (default)
this.output(data)

// Success message
this.success('Operation completed')

// Error message
this.error('Operation failed')

// Warning
this.warning('Deprecated command')
```

## Environment Variables

See `.env.example` for all available environment variables:

```bash
# Required
SUPABASE_ACCESS_TOKEN=your-token-here

# Optional
CACHE_ENABLED=true
CACHE_TTL=300000
RETRY_ENABLED=true
RETRY_MAX_ATTEMPTS=3
DEBUG=false
```

## Debugging

```bash
# Enable debug mode
DEBUG=true npm run dev

# Or use --debug flag
npm run dev -- command --debug

# Debug tests
DEBUG=true npm test
```

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run full test suite: `npm test`
4. Build: `npm run build`
5. Commit changes
6. Tag release: `git tag v0.1.0`
7. Push: `git push && git push --tags`
8. Publish: `npm publish`

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for:
- How to contribute
- Pull request process
- Code review guidelines
- Community standards

## Related Documentation

- [Architecture](../architecture/) - System architecture
- [API Reference](../api/) - API documentation
- [Testing](../testing/) - Testing guides
- [User Guides](../guides/) - User documentation

---

**Last Updated**: October 30, 2025
**Node Version**: >=22.0.0
