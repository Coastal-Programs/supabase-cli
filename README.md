# @coastal-programs/supabase-cli

[![npm version](https://badge.fury.io/js/@coastal-programs%2Fsupabase-cli.svg)](https://badge.fury.io/js/@coastal-programs%2Fsupabase-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/coastal-programs/supabase-cli/workflows/Node.js%20CI/badge.svg)](https://github.com/coastal-programs/supabase-cli/actions)

Production-ready Supabase CLI built with oclif + TypeScript, following enterprise patterns for reliability, performance, and maintainability.

## Features

- **Production-Ready Infrastructure**
  - LRU cache with configurable TTLs
  - Exponential backoff retry logic
  - Circuit breaker pattern for fault tolerance
  - Response envelope pattern for consistent API responses
  - Comprehensive error handling

- **Developer Experience**
  - TypeScript strict mode
  - Rich output formatting (JSON, Table, List, YAML)
  - Interactive prompts with fallback for CI/CD
  - Colorful, informative output
  - Extensive debugging capabilities

- **Performance**
  - Smart caching to reduce API calls
  - Retry logic with exponential backoff
  - Connection pooling and reuse
  - Minimal dependencies

## Installation

```bash
npm install -g @coastal-programs/supabase-cli
```

Or use with npx:

```bash
npx @coastal-programs/supabase-cli
```

## Quick Start

1. Set your Supabase access token:

```bash
export SUPABASE_ACCESS_TOKEN=your_token_here
```

2. Initialize configuration:

```bash
supabase-cli config:init
```

3. List your projects:

```bash
supabase-cli projects:list
```

## Usage

```bash
# List all commands
supabase-cli --help

# List projects
supabase-cli projects:list
supabase-cli projects:list --format table

# Check configuration
supabase-cli config:doctor

# Get command help
supabase-cli projects:list --help
```

## Configuration

### Environment Variables

See `.env.example` for all available configuration options:

- `SUPABASE_ACCESS_TOKEN` - Your Supabase access token
- `CACHE_ENABLED` - Enable/disable caching (default: true)
- `CACHE_TTL` - Cache TTL in milliseconds (default: 300000)
- `RETRY_ENABLED` - Enable/disable retry logic (default: true)
- `RETRY_MAX_ATTEMPTS` - Maximum retry attempts (default: 3)

### Configuration File

Configuration is stored in `~/.supabase-cli/credentials.json`

## Commands

<!-- commands -->
### Projects

- `supabase-cli projects:list` - List all Supabase projects

### Config

- `supabase-cli config:init` - Initialize CLI configuration
- `supabase-cli config:doctor` - Check CLI configuration and environment

### Phase 2B: Operations & Enterprise Features (17 commands)

#### Backup & Recovery (8 commands)

- `supabase-cli backup:list` - List all backups for a project
- `supabase-cli backup:get <id>` - Get backup details
- `supabase-cli backup:create` - Create on-demand backup
- `supabase-cli backup:delete <id>` - Delete backup (destructive, requires --yes confirmation)
- `supabase-cli backup:restore <id>` - Restore from backup (destructive, requires --yes confirmation)
- `supabase-cli backup:schedule:list` - List backup schedules
- `supabase-cli backup:schedule:create` - Create backup schedule
  - `--frequency [daily|weekly|monthly]` - Backup frequency
  - `--retention <days>` - Retention period in days
- `supabase-cli backup:pitr:restore` - Point-in-time restore (destructive, requires --yes confirmation)
  - `--timestamp <ISO8601>` - Restore point timestamp

#### Advanced Database (4 commands)

- `supabase-cli db:replicas:list` - List read replicas
- `supabase-cli db:replicas:create` - Create read replica
  - `--location <region>` - Region for the replica
- `supabase-cli db:replicas:delete <id>` - Delete replica (destructive, requires --yes confirmation)
- `supabase-cli db:config:set` - Set database configuration
  - `--setting <KEY=VALUE>` - Configuration setting (can be repeated)

#### Network & Security (5 commands)

- `supabase-cli security:restrictions:list` - List IP restrictions
- `supabase-cli security:restrictions:add` - Add IP whitelist restriction
  - `--cidr <CIDR>` - CIDR block (e.g., 192.168.1.0/24)
  - `--description <text>` - Optional description
- `supabase-cli security:restrictions:remove <id>` - Remove IP restriction
- `supabase-cli security:policies:list` - List security policies
- `supabase-cli security:audit` - Run security audit (color-coded severity levels)

<!-- commandsstop -->

## Development

See [CLAUDE.md](CLAUDE.md) for detailed development guide.

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Format
npm run format
```

## Architecture

This CLI follows the architecture patterns from Notion CLI v5.7.0:

- **Cache Layer**: LRU cache with TTL support
- **Retry Logic**: Exponential backoff with circuit breaker
- **Response Envelopes**: Consistent response format
- **Base Command**: Shared functionality for all commands
- **Helper Utilities**: Output formatting, validation, parsing

See [docs/architecture.md](docs/architecture.md) for detailed architecture documentation.

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Performance

Phase 2B commands have been thoroughly benchmarked and meet all performance targets:

- **Startup Time**: < 700ms
- **Backup Operations**: List < 2s, Create < 5s, Restore < 10s
- **Replica Operations**: All operations < 10s
- **Security Operations**: Restrictions < 1s, Audit < 3s
- **Memory Usage**: Peak < 200MB
- **Cache Hit Rate**: > 75%

See [docs/PERFORMANCE_REPORT_PHASE2B.md](docs/PERFORMANCE_REPORT_PHASE2B.md) for detailed performance analysis.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](SECURITY.md) for security policy and vulnerability reporting.

## License

MIT - see [LICENSE](LICENSE) file for details

## Support

- Documentation: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/coastal-programs/supabase-cli/issues)
- Discussions: [GitHub Discussions](https://github.com/coastal-programs/supabase-cli/discussions)

## Roadmap

- [x] Sprint 1: Core infrastructure (cache, retry, errors) - COMPLETE
- [x] Sprint 2: Authentication & configuration - COMPLETE
- [x] Sprint 3: Project management commands - COMPLETE
- [x] Sprint 4: Database management commands - COMPLETE
- [x] Phase 2B: Operations & Enterprise Features - COMPLETE
  - Backup & Recovery (8 commands)
  - Advanced Database (4 commands)
  - Network & Security (5 commands)
- [ ] Phase 2C: Advanced Features (TBD)

## Credits

Built by Coastal Programs

Architecture inspired by Notion CLI v5.7.0
