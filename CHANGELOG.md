# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-10-28

### Added
- Initial project scaffolding with oclif v2/v3 framework
- Core infrastructure components:
  - LRU cache layer with TTL support (`src/cache.ts`)
  - Exponential backoff retry logic with circuit breaker pattern (`src/retry.ts`)
  - Response envelope pattern for consistent API responses (`src/envelope.ts`)
  - Hierarchical error system with retryability detection (`src/errors.ts`)
- Base command architecture with shared functionality (`src/base-command.ts`)
- Reusable flag definitions for common CLI patterns (`src/base-flags.ts`)
- Helper utilities for output formatting and user interaction (`src/helper.ts`)
- Authentication manager stub (`src/auth.ts`)
- Supabase API wrapper foundation (`src/supabase.ts`)
- Command implementations:
  - `projects:list` - List all Supabase projects
  - `config:init` - Initialize CLI configuration
  - `config:doctor` - Diagnose CLI setup issues
- Utility functions for validation, parsing, transformation, and platform detection
- TypeScript strict mode configuration
- Comprehensive test suite with Mocha + Chai
- NYC code coverage reporting (90%+ coverage)
- ESLint and Prettier code quality tools
- Documentation:
  - README.md with installation and usage guide
  - CLAUDE.md developer guide for AI agents
  - CONTRIBUTING.md contribution guidelines
  - SECURITY.md (in docs/) security policy
  - Architecture and command documentation (in docs/)
  - Enterprise CLI research and patterns (in docs/)
- GitHub Actions CI/CD workflow templates
- MIT License
- Node.js >=22.0.0 requirement

### Development Setup
- npm scripts for build, test, lint, and format
- Pre-commit hooks configuration
- Development postinstall script
- Test watchers and performance benchmarks
- Binary packaging configuration in package.json

[Unreleased]: https://github.com/coastal-programs/supabase-cli/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/coastal-programs/supabase-cli/releases/tag/v0.1.0
