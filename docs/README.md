# Supabase CLI Documentation

Complete documentation for the Supabase CLI v0.1.0.

## Documentation Sections

### 📚 [User Guides](guides/)
Step-by-step guides for using the CLI:
- **[Getting Started](guides/getting-started.md)** - Installation, setup, and first commands
- **[Database Operations](guides/database-operations.md)** - Working with databases, schemas, and migrations
- **[Automation & CI/CD](guides/automation.md)** - Scripting and continuous integration
- **[Troubleshooting](guides/troubleshooting.md)** - Common issues and solutions

### 🔌 [API Reference](api/)
Complete Supabase Management API documentation:
- **[Endpoint Status](api/endpoint-status.md)** - Test results for all API endpoints
- **[Consolidated Reference](api/consolidated-reference.md)** - Complete API reference
- **[Testing Index](api/testing-index.md)** - API testing documentation
- **[Quick Reference](api/quick-reference.md)** - Quick lookup for common API calls
- **[Endpoints Directory](api/endpoints/)** - Detailed documentation for each endpoint category

### 🏗️ [Architecture](architecture/)
Technical architecture and patterns:
- **[Overview](architecture/overview.md)** - System architecture overview
- **[GoTrue Integration](architecture/gotrue-integration.md)** - GoTrue API integration details

### ⚡ [Performance](performance/)
Performance reports and optimization:
- **[Phase 2 Report](performance/phase2-report.md)** - Initial performance benchmarks
- **[Phase 2A Report](performance/phase2a-report.md)** - Organizations API performance
- **[Phase 2B Report](performance/phase2b-report.md)** - Operations features performance
- **[Phase 3 Report](performance/phase3-report.md)** - Testing phase performance
- **[Phase 5 Startup Optimization](performance/phase5-startup-optimization.md)** - Startup time improvements
- **[Optimization Recommendations](performance/optimization-recommendations.md)** - Future optimization suggestions

### 🧪 [Testing](testing/)
Test reports and strategies:
- **[API Test Report](testing/api-test-report.md)** - Comprehensive API testing results
- **[Suite Status](testing/suite-status.md)** - Test suite status and coverage
- **[Phase 5 Test Fixes](testing/phase5-test-fixes.md)** - Test fixes and improvements
- **[Phase 5 Suite Completion](testing/phase5-suite-completion.md)** - Final test suite status

### 👨‍💻 [Development](development/)
Developer guides and references:
- **[Standardization Complete](development/standardization-complete.md)** - Command standardization documentation
- **[Command Changes Mapping](development/command-changes-mapping.md)** - Mapping of command changes

### 📦 [Releases](releases/)
Release notes and migration guides:
- **[v0.1.0 Release](releases/v0.1.0/)** - Version 0.1.0 documentation
  - **[Phase Summaries](releases/v0.1.0/phase-summaries/)** - Detailed implementation summaries for each phase

## Quick Links

- [Getting Started](guides/getting-started.md)
- [Command Reference](../README.md#commands)
- [API Endpoint Status](api/endpoint-status.md)
- [Architecture Overview](architecture/overview.md)
- [Contributing](../CONTRIBUTING.md)

## Key Features

- **67 Commands** across 11 topic areas (projects, auth, backup, db, security, etc.)
- **Enterprise Patterns**: LRU cache, retry with circuit breaker, request deduplication
- **99% Request Reduction**: Advanced request deduplication (implemented in Phase 3)
- **87% Test Coverage**: Comprehensive test suite with 24K+ lines of tests
- **< 700ms Startup**: Optimized for performance
- **Production Ready**: v0.1.0 with full operational features

## Architecture Highlights

- **Base Command Pattern**: All commands extend BaseCommand for consistency
- **Response Envelopes**: Standardized success/error responses
- **Cache Layer**: LRU cache with TTL support
- **Retry Logic**: Exponential backoff with circuit breaker
- **Error Hierarchy**: Comprehensive error system with 32+ error codes
- **Resource Registry**: Centralized resource management
- **Project Context**: Smart project reference resolution

## External Resources

- [Supabase Management API Docs](https://supabase.com/docs/reference/api)
- [oclif Framework Docs](https://oclif.io/)
- [GitHub Repository](https://github.com/coastal-programs/supabase-cli)

## Support

- **Issues**: [GitHub Issues](https://github.com/coastal-programs/supabase-cli/issues)
- **Documentation Issues**: Please open an issue if you find documentation gaps or errors
- **Contributing**: See [CONTRIBUTING.md](../CONTRIBUTING.md)

---

**Last Updated**: October 30, 2025
**Version**: 0.1.0
**Documentation Organization**: Phase 5C2
