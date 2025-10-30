# GitHub Workflows Quick Reference

Quick reference for all automated workflows in this repository.

## Workflows Overview

| Workflow | Trigger | Purpose | Status Badge |
|----------|---------|---------|--------------|
| **CI** | Push, PR | Tests, linting, validation | `[![CI](https://github.com/coastal-programs/supabase-cli/workflows/CI/badge.svg)](...)` |
| **Security** | Push, PR, Weekly, Manual | Vulnerability scanning | `[![Security](https://github.com/coastal-programs/supabase-cli/workflows/Security/badge.svg)](...)` |
| **Publish** | Release created | npm publishing | Auto-triggered |
| **Release** | Manual | Create release + tag | Run manually |
| **PR Labeler** | PR opened/updated | Auto-label PRs | Auto-triggered |
| **Stale** | Daily | Manage stale issues | Auto-triggered |

---

## Common Tasks

### Release a New Version

**Automated (Recommended)**:
1. Go to **Actions** tab
2. Select **Release** workflow
3. Click **Run workflow**
4. Choose version bump: `patch` | `minor` | `major`
5. Optionally add changelog summary
6. Click **Run workflow**

**Result**: Version bumped, changelog updated, tag created, release published

**Manual**:
```bash
npm version patch|minor|major
git push && git push --tags
# Create GitHub release from tag
# Publish workflow runs automatically
```

---

### Review Security Issues

1. Go to **Security** tab
2. Check **Dependabot alerts**
3. Review **Code scanning alerts** (CodeQL)
4. Check **Security** workflow runs

**Weekly Schedule**: Runs every Monday at 00:00

---

### Review Dependabot PRs

1. Go to **Pull requests** tab
2. Filter by label: `dependencies`
3. Review changes in each PR
4. Merge if CI passes and changes are safe

**Schedule**: New PRs created weekly (Monday 09:00)

---

### Monitor CI Status

**On PR**:
- Check CI status at bottom of PR
- Review performance benchmark comment
- Check test coverage report

**Performance Targets**:
- Startup: < 700ms
- Execution: < 5s
- Memory: < 200MB

---

### Validate Package Before Publishing

**Manual Check**:
```bash
npm run verify:package
```

**Auto Check**: Runs automatically in `prepublishOnly`

---

### Manually Trigger Security Scan

1. Go to **Actions** tab
2. Select **Security** workflow
3. Click **Run workflow**
4. Select branch
5. Click **Run workflow**

---

## Workflow Details

### CI Pipeline

**File**: `.github/workflows/ci.yml`

**Jobs**:
- Test (6 combinations: Node 22/23 × Ubuntu/Windows/macOS)
- Coverage (Ubuntu only, uploads to Codecov)
- Performance (PR only, comments results)
- Package Validation (tests installation)

**Duration**: ~8-10 minutes

---

### Security Pipeline

**File**: `.github/workflows/security.yml`

**Jobs**:
- npm audit (dev + production)
- CodeQL Analysis (static analysis)
- Dependency Review (PR only)
- Secret Scanning (TruffleHog)

**Duration**: ~5-7 minutes

---

### Publish Pipeline

**File**: `.github/workflows/publish.yml`

**Process**:
1. Run tests
2. Run linter
3. Build distribution
4. Verify package contents
5. Publish to npm **with provenance**
6. Create GitHub release asset

**Trigger**: Automatically when GitHub release is created

**Required Secret**: `NPM_TOKEN`

---

### Release Workflow

**File**: `.github/workflows/release.yml`

**Process**:
1. Bump version in package.json
2. Generate/use changelog entry
3. Update CHANGELOG.md
4. Commit changes
5. Create and push git tag
6. Create GitHub release
7. Trigger publish workflow

**Inputs**:
- `version`: patch | minor | major
- `changelog`: Optional summary (auto-generated if empty)

---

### PR Labeler

**File**: `.github/workflows/labeler.yml`

**Labels Applied**:
- **Area**: commands, database, projects, backup, security, functions, ci/cd, build, core, tests, docs, config
- **Size**: xs (<10), s (<100), m (<500), l (<1000), xl (>1000 lines)

**Configuration**: `.github/labeler.yml`

---

### Stale Management

**File**: `.github/workflows/stale.yml`

**Behavior**:
- Mark stale after 60 days of inactivity
- Close after 7 additional days
- Exempt labels: `pinned`, `security`, `roadmap`, `good first issue`

**Schedule**: Daily at 00:00

---

### Dependabot

**File**: `.github/dependabot.yml`

**npm Dependencies**:
- Weekly updates (Monday 09:00)
- Groups dev deps (patch/minor)
- Groups prod deps (patch)
- Max 10 open PRs

**GitHub Actions**:
- Monthly updates
- Max 5 open PRs

---

## Required Secrets

Configure in **Settings** > **Secrets and variables** > **Actions**:

| Secret | Required | Purpose | Get From |
|--------|----------|---------|----------|
| `NPM_TOKEN` | **YES** | Publish to npm | https://www.npmjs.com/settings/tokens |
| `CODECOV_TOKEN` | No | Upload coverage | https://codecov.io |

---

## Badges for README

```markdown
[![CI](https://github.com/coastal-programs/supabase-cli/workflows/CI/badge.svg)](https://github.com/coastal-programs/supabase-cli/actions/workflows/ci.yml)
[![Security](https://github.com/coastal-programs/supabase-cli/workflows/Security/badge.svg)](https://github.com/coastal-programs/supabase-cli/actions/workflows/security.yml)
[![npm version](https://badge.fury.io/js/%40coastal-programs%2Fsupabase-cli.svg)](https://www.npmjs.com/package/@coastal-programs/supabase-cli)
[![codecov](https://codecov.io/gh/coastal-programs/supabase-cli/branch/main/graph/badge.svg)](https://codecov.io/gh/coastal-programs/supabase-cli)
```

---

## Troubleshooting

### Publish Fails

**Check**:
1. NPM_TOKEN secret configured and valid
2. Version not already published to npm
3. All CI checks passing
4. Package validation passed

**Logs**: Actions > Publish workflow > Failed run

---

### CI Fails on One Platform

**Action**: Check if it's a known platform issue
- Windows: Path separators, line endings
- macOS: Case-sensitive filesystem
- Node version: API differences

**Fix**: Update code or skip platform if necessary

---

### Dependabot PR Conflicts

**Resolution**:
1. Close conflicting PRs
2. Let Dependabot recreate
3. Or manually merge and resolve

---

### Performance Regression

**Steps**:
1. Check PR performance comment
2. Run locally: `npm run test:performance:quick`
3. Profile with: `npm run test:performance`
4. Optimize or document why increase is justified

---

## Best Practices

1. **Always use Release workflow** for new versions
2. **Review Dependabot PRs weekly** to stay secure
3. **Monitor performance benchmarks** on PRs
4. **Address security issues within 7 days**
5. **Keep changelog up-to-date** for each release
6. **Run `npm run verify:package`** before manual publishes
7. **Check CI status** before merging PRs

---

## Resources

- [Full CI/CD Guide](../docs/development/ci-cd-guide.md)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [npm Publishing Docs](https://docs.npmjs.com/packages-and-modules)
- [Dependabot Docs](https://docs.github.com/en/code-security/dependabot)
