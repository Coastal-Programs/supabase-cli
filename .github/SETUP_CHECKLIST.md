# CI/CD Setup Checklist

Complete these steps to enable all CI/CD features.

## Prerequisites

- [ ] GitHub repository with admin access
- [ ] npm account with publish permissions
- [ ] Repository is public or has GitHub Teams/Enterprise

---

## One-Time Setup

### 1. Configure GitHub Secrets

Navigate to: **Settings** > **Secrets and variables** > **Actions**

#### Required Secrets

- [ ] **NPM_TOKEN**
  - Go to: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
  - Click: **Generate New Token** > **Automation**
  - Copy token and add to GitHub secrets
  - Name: `NPM_TOKEN`

#### Optional Secrets

- [ ] **CODECOV_TOKEN** (recommended for coverage tracking)
  - Go to: https://codecov.io
  - Sign in with GitHub
  - Add this repository
  - Copy token and add to GitHub secrets
  - Name: `CODECOV_TOKEN`

---

### 2. Enable GitHub Security Features

Navigate to: **Settings** > **Code security and analysis**

- [ ] **Dependency graph**: Enable
- [ ] **Dependabot alerts**: Enable
- [ ] **Dependabot security updates**: Enable
- [ ] **Secret scanning**: Enable (if available)
- [ ] **Code scanning** (CodeQL): Enable

---

### 3. Configure Branch Protection

Navigate to: **Settings** > **Branches** > **Branch protection rules**

#### For `main` branch:

- [ ] **Require pull request before merging**
  - [ ] Require approvals: 1 (recommended)
  - [ ] Dismiss stale approvals
- [ ] **Require status checks to pass**
  - [ ] Require branches to be up to date
  - [ ] Select: `Test`, `Coverage`, `Package Validation`
- [ ] **Require conversation resolution before merging**
- [ ] **Do not allow bypassing the above settings**

---

### 4. Configure Repository Settings

Navigate to: **Settings** > **General**

#### Pull Requests

- [ ] **Allow squash merging**: Checked
- [ ] **Default commit message**: Pull request title and description
- [ ] **Allow auto-merge**: Checked (optional, for Dependabot)
- [ ] **Automatically delete head branches**: Checked

#### Issues

- [ ] **Issues**: Enabled
- [ ] Templates configured (already done via `.github/ISSUE_TEMPLATE/`)

---

### 5. Test Workflows

#### Test CI Workflow

1. [ ] Create a test branch: `git checkout -b test-ci`
2. [ ] Make a small change: `echo "test" >> README.md`
3. [ ] Push and create PR
4. [ ] Verify all CI jobs run and pass
5. [ ] Check performance benchmark comment appears
6. [ ] Close PR and delete branch

#### Test Security Workflow

1. [ ] Go to: **Actions** > **Security**
2. [ ] Click: **Run workflow**
3. [ ] Verify all jobs complete
4. [ ] Check for any vulnerabilities found

#### Test Release Workflow (on develop branch)

1. [ ] Switch to develop: `git checkout develop`
2. [ ] Go to: **Actions** > **Release**
3. [ ] Click: **Run workflow**
4. [ ] Select: `patch`
5. [ ] Enter test changelog: "Test release workflow"
6. [ ] **Important**: This will create a real tag - only do this on develop
7. [ ] Verify: Version bumped, CHANGELOG updated, tag created
8. [ ] Delete test tag: `git tag -d v0.1.1 && git push origin :refs/tags/v0.1.1`

---

## Ongoing Maintenance

### Weekly Tasks

- [ ] Review and merge Dependabot PRs
  - Check: **Pull requests** with label `dependencies`
  - Review changes
  - Ensure CI passes
  - Merge safe updates

- [ ] Check security alerts
  - Navigate to: **Security** tab
  - Review: Dependabot alerts
  - Review: CodeQL findings
  - Address high/critical issues within 7 days

### Monthly Tasks

- [ ] Review stale issues
  - Check issues with `stale` label
  - Close or update as needed

- [ ] Review open PRs
  - Close abandoned PRs
  - Follow up on in-progress work

- [ ] Update documentation
  - Check for outdated docs
  - Update examples
  - Refresh screenshots

### Per-Release Tasks

- [ ] Use Release workflow (not manual process)
- [ ] Review generated changelog
- [ ] Verify package contents: `npm run verify:package`
- [ ] Monitor publish workflow
- [ ] Verify package on npm: https://www.npmjs.com/package/@coastal-programs/supabase-cli
- [ ] Test installation: `npm install -g @coastal-programs/supabase-cli@latest`

---

## Verification

### Check All Workflows Are Active

Navigate to: **Actions**

You should see:
- [ ] CI
- [ ] Security
- [ ] Publish
- [ ] Release
- [ ] Pull Request Labeler
- [ ] Stale Issue Management

### Check Dependabot Is Running

Navigate to: **Insights** > **Dependency graph** > **Dependabot**

You should see:
- [ ] npm dependencies: Active
- [ ] GitHub Actions: Active

### Verify First Dependabot PRs Appear

Within 24 hours, you should see:
- [ ] PRs from `dependabot[bot]`
- [ ] PRs labeled with `dependencies`

---

## Troubleshooting

### NPM_TOKEN Not Working

**Symptoms**: Publish workflow fails with authentication error

**Fix**:
1. Verify token is "Automation" type (not "Publish")
2. Check token hasn't expired
3. Ensure token has publish permissions
4. Regenerate token if needed
5. Update GitHub secret

### Dependabot Not Creating PRs

**Symptoms**: No PRs from Dependabot after 24 hours

**Fix**:
1. Check: Settings > Code security > Dependabot alerts (must be ON)
2. Check: Settings > Code security > Dependency graph (must be ON)
3. Manually trigger: Insights > Dependency graph > Dependabot > "Check for updates"

### CI Failing on One Platform

**Symptoms**: Tests pass on Ubuntu but fail on Windows/macOS

**Fix**:
1. Review error logs in failed job
2. Common issues:
   - Path separators (use `path.join()`)
   - Line endings (use `.gitattributes`)
   - Case-sensitive filenames (macOS)
3. Fix and push changes
4. Re-run CI

### CodeQL Not Running

**Symptoms**: Security workflow succeeds but no CodeQL results

**Fix**:
1. Ensure repository is public OR has GitHub Advanced Security
2. Check: Settings > Code security > Code scanning
3. Enable if disabled

---

## Optional Enhancements

### Add CI Badges to README

Add at top of README.md:

```markdown
[![CI](https://github.com/coastal-programs/supabase-cli/workflows/CI/badge.svg)](https://github.com/coastal-programs/supabase-cli/actions/workflows/ci.yml)
[![Security](https://github.com/coastal-programs/supabase-cli/workflows/Security/badge.svg)](https://github.com/coastal-programs/supabase-cli/actions/workflows/security.yml)
[![npm version](https://badge.fury.io/js/%40coastal-programs%2Fsupabase-cli.svg)](https://www.npmjs.com/package/@coastal-programs/supabase-cli)
[![codecov](https://codecov.io/gh/coastal-programs/supabase-cli/branch/main/graph/badge.svg)](https://codecov.io/gh/coastal-programs/supabase-cli)
```

### Enable Auto-Merge for Dependabot

1. [ ] Create `.github/workflows/dependabot-automerge.yml`:

```yaml
name: Dependabot Auto-Merge
on: pull_request

permissions:
  pull-requests: write
  contents: write

jobs:
  dependabot:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    steps:
      - name: Enable auto-merge for Dependabot PRs
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{github.event.pull_request.html_url}}
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
```

2. [ ] Only enable for patch updates (review minor/major manually)

### Set Up Codecov (if not using)

1. [ ] Go to: https://codecov.io
2. [ ] Sign in with GitHub
3. [ ] Add this repository
4. [ ] Copy token
5. [ ] Add as `CODECOV_TOKEN` secret
6. [ ] Re-run CI workflow

---

## Success Criteria

Your setup is complete when:

- [ ] All workflows show green checkmarks in Actions tab
- [ ] Dependabot PRs appear within 24 hours
- [ ] Security scans run weekly without errors
- [ ] Release workflow creates proper tags and releases
- [ ] Publish workflow successfully publishes to npm
- [ ] PRs are auto-labeled correctly
- [ ] Performance benchmarks comment on PRs
- [ ] Package validation passes

---

## Resources

- [Full CI/CD Guide](../docs/development/ci-cd-guide.md)
- [Workflows Quick Reference](./WORKFLOWS_QUICK_REFERENCE.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules)
- [Dependabot Configuration](https://docs.github.com/en/code-security/dependabot)

---

## Getting Help

If you encounter issues:

1. Check this checklist again
2. Review workflow logs in Actions tab
3. Consult the troubleshooting sections
4. Check GitHub Actions status: https://www.githubstatus.com
5. Review npm status: https://status.npmjs.org

---

**Last Updated**: 2025-10-30
