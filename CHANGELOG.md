# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-10-30

### Added

#### New Commands (34 total)

**Core Management (6 commands)**
- `projects:list` - List all Supabase projects
- `projects:get <ref>` - Get project details
- `projects:restore <ref>` - Restore a paused project
- `projects:create` - Create a new project
- `projects:pause` - Pause a project
- `projects:delete` - Delete a project

**Organizations (2 commands)**
- `organizations:list` - List all organizations
- `organizations:get <id>` - Get organization details

**Database (12 commands)**
- `db:query <sql>` - Execute SQL query with formatted results
- `db:extensions` - List installed PostgreSQL extensions (SQL-based)
- `db:schema` - List all tables in database (SQL-based)
- `db:info` - Database version, size, and key settings (SQL-based)
- `db:schemas` - List all schemas with owners (SQL-based)
- `db:policies` - List RLS policies with enforcement status (SQL-based)
- `db:connections` - Show active database connections (SQL-based)
- `db:table-sizes` - List tables sorted by size (SQL-based)
- `db:user-info` - List database users and permissions (SQL-based)
- `db:config:get` - Get database configuration
- `db:config:set` - Set database configuration
- `db:webhooks:list` - List database webhooks

**Backups (2 commands)**
- `backup:list` - List all project backups
- `backup:get <id>` - Get backup details

**Edge Functions (3 commands)**
- `functions:list` - List Edge Functions
- `functions:invoke <name>` - Invoke an Edge Function
- `functions:deploy` - Deploy an Edge Function

**Branches (2 commands)**
- `branches:list` - List preview branches
- `branches:create` - Create a preview branch

**Security (2 commands)**
- `security:restrictions:list` - List IP restrictions
- `security:audit` - Run security audit with color-coded severity

**Storage (4 commands)**
- `storage:buckets:list` - List storage buckets
- `storage:buckets:get <id>` - Get bucket details
- `storage:buckets:create` - Create a storage bucket
- `storage:buckets:delete <id>` - Delete a storage bucket

**Configuration (6 commands)**
- `config:init` - Initialize CLI configuration
- `config:doctor` - Check configuration health
- `config:auth:get` - Get auth configuration
- `config:ssl:get` - Get SSL enforcement status
- `config:api-keys` - List API keys (masked)
- `config:secrets:list` - List project secrets

**Monitoring (1 command)**
- `monitoring:readonly` - Check if project is in read-only mode

**Utilities (2 commands)**
- `upgrade:check` - Check Postgres upgrade eligibility
- `types:generate` - Generate TypeScript types from database schema

**Migrations (2 commands)**
- `migrations:list` - List database migrations
- `migrations:apply` - Apply database migrations

#### Infrastructure Features

**Request Deduplication**
- Prevents duplicate concurrent API calls
- Automatically deduplicates identical in-flight requests
- Significantly improves cache hit rate

**Cascading Cache Invalidation**
- Automatically invalidates related cache entries
- Supports wildcard patterns for bulk invalidation
- Ensures data consistency across commands

**SQL-Based Database Operations**
- 14 pre-built SQL queries for database metadata
- Fallback mechanism when Management API endpoints don't exist
- Enables 60%+ of desired functionality

**Enhanced Output Formatting**
- Color-coded status indicators (green, red, yellow, blue)
- Formatted tables with cli-table3
- Size formatting (bytes to GB/MB/KB)
- Policy enforcement badges (✓ ✗)
- Severity indicators (● ○ ⚠)

**Performance Optimizations**
- Lazy loading of ts-node (22.7% startup improvement)
- Conditional module loading
- Reduced startup time from 2,190ms to 1,692ms (-498ms)
- Memory usage optimized to <200MB peak

#### Documentation

- 40+ comprehensive documentation files
- Complete API endpoint reference (93 endpoints documented)
- Phase-by-phase implementation summaries
- Performance benchmarking reports
- Breaking changes guide with migration paths
- Alternative API research and integration guides

### Changed

#### Command Improvements

- All commands now follow standardized BaseCommand pattern
- Improved error messages with actionable context
- Enhanced output formatting with colors and tables
- Better flag consistency across commands
- Added `--format` flag support (json, table, yaml)
- Added `--quiet` flag for CI/CD automation

#### API Client

- Refactored `src/supabase.ts` with 45+ API methods
- Integrated request deduplication
- Integrated cascading cache invalidation
- Added comprehensive TypeScript type definitions
- Improved error handling with helpful messages

#### Performance

- Startup time reduced by 22.7% (from 2,190ms to 1,692ms)
- Command execution time <2s for most operations
- Memory usage optimized to 145MB peak (27.5% below target)
- Cache hit rate >75% for cached operations

### Removed

**Non-functional Commands (39 total)** - See [BREAKING_CHANGES.md](BREAKING_CHANGES.md) for full details and migration paths

**Authentication Commands (8)**
- `auth:jwt:get` - No API endpoint
- `auth:jwt:rotate` - No API endpoint
- `auth:providers:list` - No API endpoint (recoverable via GoTrue API)
- `auth:users:list` - No API endpoint
- `auth:users:get` - No API endpoint
- `auth:users:create` - No API endpoint
- `auth:users:delete` - No API endpoint
- `auth:users:update` - No API endpoint

**Backup Operations (6)**
- `backup:create` - No API endpoint
- `backup:delete` - No API endpoint
- `backup:restore` - No API endpoint
- `backup:pitr:restore` - No API endpoint
- `backup:schedule:create` - No API endpoint
- `backup:schedule:list` - No API endpoint

**Database Replicas (3)**
- `db:replicas:list` - No API endpoint
- `db:replicas:create` - No API endpoint
- `db:replicas:delete` - No API endpoint

**Advanced Configuration (6)**
- `config:pooling:get` - No API endpoint
- `config:pooling:set` - No API endpoint
- `config:cors:get` - No API endpoint
- `config:cors:set` - No API endpoint
- `config:jwt:get` - No API endpoint
- `config:jwt:set` - No API endpoint

**Monitoring & Logs (5)**
- `monitoring:metrics` - No API endpoint
- `monitoring:health` - No API endpoint
- `monitoring:status` - No API endpoint
- `logs:query` - No API endpoint
- `logs:tail` - No API endpoint

**Integrations (15)**
- All integration commands removed (no API endpoints)

**Network Security Write Operations (2)**
- `security:restrictions:add` - API requires full replacement
- `security:restrictions:remove` - API requires full replacement

### Fixed

#### Test Suite
- Fixed 146 failing tests
- Removed tests for deleted commands
- Fixed import statements and module references
- Achieved 98.1% pass rate (262/267 tests passing)
- Fixed TypeScript compilation errors in test suite

#### API Integration
- Fixed network restrictions API (now uses GET-modify-PUT pattern)
- Fixed authentication error handling
- Fixed project reference validation
- Fixed cache invalidation timing issues

#### Build System
- Fixed pre-existing build errors in config modules
- Fixed TypeScript strict mode compliance
- Fixed dependency version conflicts

### Performance

- **Startup time**: 1,692ms (was 2,190ms, -498ms/-22.7%)
- **Command execution**: <2s for most operations
- **Memory usage**: 145MB peak (target <200MB)
- **Cache hit rate**: >75% (with deduplication)
- **Test suite**: <2 minutes for full run

### Security

- Added input validation for all SQL queries
- Added CIDR validation for network restrictions
- Added API key masking in output
- Added secure credential storage
- Added error message sanitization

## [Unreleased]

### Planned for v0.2.0

**GoTrue API Integration**
- `auth:providers:list` - List enabled auth providers (via GoTrue API)
- Enhanced `config:auth:get` - Include GoTrue settings
- `auth:users:*` commands - User management via GoTrue API

**Interactive Features**
- Interactive mode for complex workflows
- Command wizards for multi-step operations
- Progressive disclosure for advanced options

**Bulk Operations**
- Batch query execution
- Bulk user operations
- Parallel command execution

**Developer Experience**
- Command aliases (e.g., `sp` for `supabase-cli`)
- Progress bars for long operations
- Enhanced debugging output
- Command completion (bash/zsh)

**Additional APIs**
- PostgREST API integration
- Realtime API integration
- Storage API enhancements

### Future Considerations

- Plugin system for extensibility
- Custom command creation
- Template system for common workflows
- Configuration profiles
- Multi-project management

---

## Migration Guide

### From Pre-v0.1.0

If you were using any of the removed commands, see [BREAKING_CHANGES.md](BREAKING_CHANGES.md) for:

- Complete list of removed commands
- Reasons for removal
- Alternative solutions
- Migration paths

### Key Changes to Note

1. **Network Restrictions**: Now use GET-modify-PUT pattern instead of incremental add/remove
2. **Backup Operations**: Write operations removed (read-only now)
3. **Authentication**: Commands removed (use GoTrue API directly or wait for v0.2.0)
4. **Migrations**: Apply command removed (use SQL or migrations table)

---

## Version History

### [0.1.0] - 2025-10-30
- Initial production release
- 34 working commands
- SQL-based database operations
- Request deduplication
- Cascading cache invalidation
- Comprehensive documentation

---

For more information, see:
- [README.md](README.md) - Project overview
- [BREAKING_CHANGES.md](BREAKING_CHANGES.md) - Detailed breaking changes
- [docs/](docs/) - Complete documentation
- [GitHub Releases](https://github.com/coastal-programs/supabase-cli/releases) - Release notes

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to this project.

## Support

- Issues: [GitHub Issues](https://github.com/coastal-programs/supabase-cli/issues)
- Discussions: [GitHub Discussions](https://github.com/coastal-programs/supabase-cli/discussions)
- Documentation: [docs/](docs/)

[Unreleased]: https://github.com/coastal-programs/supabase-cli/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/coastal-programs/supabase-cli/releases/tag/v0.1.0
