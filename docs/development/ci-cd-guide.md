# CI/CD Pipeline Guide

This document describes the complete CI/CD pipeline for the Supabase CLI package.

## Overview

The CI/CD pipeline is designed to ensure code quality, security, and reliable releases through automated testing, security scanning, and deployment workflows.

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Triggers**: Push to `main`/`develop`, Pull requests

**Jobs**:
- **Test**: Cross-platform testing on Node 22.x and 23.x
  - Ubuntu, Windows, macOS
  - TypeScript compilation
  - Linting (ESLint)
  - Code formatting check (Prettier)
  - Unit tests

- **Coverage**: Code coverage analysis
  - Runs after tests pass
  - Uploads to Codecov
  - Reports coverage metrics

- **Performance**: Performance benchmarks (PR only)
  - Startup time benchmarks
  - Command execution benchmarks
  - Memory usage analysis
  - Comments results on PR

- **Package Validation**: Package integrity checks
  - Validates package contents
  - Tests package installation
  - Verifies CLI commands work

**Performance Targets**:
- Startup time: < 700ms
- Command execution: < 5s
- Memory usage: < 200MB

---

### 2. Security Pipeline (`.github/workflows/security.yml`)

**Triggers**: Push to `main`, Pull requests, Weekly schedule (Monday 00:00), Manual dispatch

**Jobs**:
- **npm audit**: Dependency vulnerability scanning
  - Checks dev dependencies (moderate level)
  - Checks production dependencies (high level)

- **CodeQL Analysis**: Static code analysis
  - JavaScript/TypeScript analysis
  - Security-extended queries
  - Quality checks

- **Dependency Review**: PR dependency analysis
  - Reviews new dependencies
  - Checks for vulnerabilities
  - Comments on PRs with findings

- **Secret Scanning**: Detects leaked credentials
  - Uses TruffleHog
  - Scans commit history
  - Validates only verified secrets

---

### 3. Publish Pipeline (`.github/workflows/publish.yml`)

**Triggers**: GitHub release created

**Jobs**:
- **Publish**: Automated npm publishing
  - Runs full test suite
  - Executes linter
  - Builds distribution
  - Validates package contents
  - **Publishes with provenance** (supply chain security)
  - Creates GitHub release asset (tarball)

**Requirements**:
- `NPM_TOKEN` secret configured
- `id-token: write` permission for provenance

**Provenance**: Provides cryptographic proof of package origin and build process.

---

### 4. Release Workflow (`.github/workflows/release.yml`)

**Triggers**: Manual workflow dispatch

**Inputs**:
- `version`: patch | minor | major
- `changelog`: Optional changelog summary (auto-generated if empty)

**Process**:
1. Runs tests and linter
2. Bumps package version
3. Generates/uses changelog entry
4. Updates CHANGELOG.md
5. Commits changes
6. Creates and pushes git tag
7. Creates GitHub release

**Automation**:
- Auto-generates changelog from commits if not provided
- Updates README.md via oclif
- Tags release with `v` prefix

---

### 5. PR Labeler (`.github/workflows/labeler.yml`)

**Triggers**: Pull request opened, synchronized, reopened

**Features**:
- Auto-labels by file path (area: commands, area: core, etc.)
- Labels by PR size (size/xs, size/s, size/m, size/l, size/xl)
- Configuration in `.github/labeler.yml`

**Areas**:
- `area: commands`, `area: database`, `area: projects`
- `area: backup`, `area: security`, `area: functions`
- `area: ci/cd`, `area: build`, `area: core`
- `area: tests`, `area: docs`, `area: config`

---

### 6. Stale Issue Management (`.github/workflows/stale.yml`)

**Triggers**: Daily schedule (00:00), Manual dispatch

**Configuration**:
- Marks issues/PRs stale after 60 days
- Closes stale items after 7 additional days
- Exempts labels: `pinned`, `security`, `roadmap`, `good first issue`

---

### 7. Dependabot (`.github/dependabot.yml`)

**Configuration**:
- **npm dependencies**: Weekly updates (Monday 09:00)
  - Groups dev dependencies (patch/minor)
  - Groups production dependencies (patch)
  - Max 10 open PRs

- **GitHub Actions**: Monthly updates
  - Max 5 open PRs
  - Keeps workflows up-to-date

**Commit Message Format**:
- npm: `chore(deps): <description>`
- GitHub Actions: `ci: <description>`

---

## Scripts

### Pre-Publish Verification (`scripts/verify-package.js`)

**Purpose**: Validates package before publishing

**Checks**:
- Required files exist (package.json, README, LICENSE, etc.)
- package.json fields are valid
- Sensitive files excluded from package
- dist/ directory exists and contains files
- CHANGELOG has entry for current version
- bin scripts exist and have proper shebang

**Runs**: Automatically via `prepublishOnly` npm script

**Exit Codes**:
- `0`: All checks passed or warnings only
- `1`: Errors found, cannot publish

---

## Required Secrets

Configure these in GitHub Settings > Secrets and Variables > Actions:

1. **NPM_TOKEN**: npm access token for publishing
   - Get from: https://www.npmjs.com/settings/tokens
   - Required for: `.github/workflows/publish.yml`

2. **CODECOV_TOKEN**: Codecov upload token (optional)
   - Get from: https://codecov.io
   - Required for: `.github/workflows/ci.yml` (coverage job)

---

## Release Process

### Automated Release (Recommended)

1. Go to **Actions** > **Release** workflow
2. Click **Run workflow**
3. Select version bump type (patch/minor/major)
4. Optionally add changelog summary
5. Click **Run workflow**

**Result**:
- Version bumped
- Changelog updated
- Commit and tag created
- GitHub release created
- Publish workflow triggered automatically

### Manual Release

1. Update CHANGELOG.md
2. Bump version: `npm version patch|minor|major`
3. Push changes: `git push && git push --tags`
4. Create GitHub release from tag
5. Publish workflow runs automatically

---

## Best Practices

### Pull Requests

1. All PRs must pass CI before merging
2. Review security scan results
3. Check performance benchmarks (commented on PR)
4. Ensure code coverage doesn't decrease

### Versioning

Follow [Semantic Versioning](https://semver.org/):
- **Patch** (0.1.x): Bug fixes, documentation
- **Minor** (0.x.0): New features (backward compatible)
- **Major** (x.0.0): Breaking changes

### Changelog

Follow [Keep a Changelog](https://keepachangelog.com/):
- Add entries under "Unreleased" during development
- Move to version section on release
- Use categories: Added, Changed, Deprecated, Removed, Fixed, Security

### Security

1. Review Dependabot PRs weekly
2. Address security vulnerabilities promptly
3. Check npm audit results
4. Review CodeQL findings

### Performance

Monitor these metrics in CI:
- Startup time should stay < 700ms
- Command execution < 5s
- Memory usage < 200MB

If metrics degrade, investigate before merging.

---

## Troubleshooting

### Publish Fails

**Check**:
1. NPM_TOKEN secret is valid
2. Version not already published
3. All tests passing
4. Package validation passes

### Security Scan Fails

**Actions**:
1. Review vulnerability details
2. Update dependencies if available
3. Check for patches or workarounds
4. Document exceptions if unavoidable

### Performance Regression

**Steps**:
1. Run local benchmarks: `npm run test:performance`
2. Compare with main branch results
3. Profile slow operations
4. Optimize or document justified increase

### Coverage Decrease

**Resolution**:
1. Add tests for new code
2. Target > 80% coverage
3. Review uncovered branches
4. Update coverage thresholds if needed

---

## Monitoring

### Metrics to Watch

1. **CI Pipeline Duration**: Should complete in < 10 minutes
2. **Security Issues**: Address within 7 days
3. **Dependency Updates**: Review weekly
4. **Stale Issues**: Clean up monthly

### Badges

Add to README.md:

```markdown
[![CI](https://github.com/coastal-programs/supabase-cli/workflows/CI/badge.svg)](https://github.com/coastal-programs/supabase-cli/actions/workflows/ci.yml)
[![Security](https://github.com/coastal-programs/supabase-cli/workflows/Security/badge.svg)](https://github.com/coastal-programs/supabase-cli/actions/workflows/security.yml)
[![codecov](https://codecov.io/gh/coastal-programs/supabase-cli/branch/main/graph/badge.svg)](https://codecov.io/gh/coastal-programs/supabase-cli)
[![npm version](https://badge.fury.io/js/%40coastal-programs%2Fsupabase-cli.svg)](https://www.npmjs.com/package/@coastal-programs/supabase-cli)
```

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Publishing Best Practices](https://docs.npmjs.com/packages-and-modules)
- [npm Provenance](https://docs.npmjs.com/generating-provenance-statements)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
