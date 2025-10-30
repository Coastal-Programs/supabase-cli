# Quick Release Guide - v0.1.0

**For**: Coastal Programs Supabase CLI
**Version**: 0.1.0
**Date**: October 30, 2025

---

## Pre-Flight Checklist (5 minutes)

### 1. Code Quality
```bash
npm run build    # Should complete without errors
npm test         # All tests should pass
npm run lint     # No linting errors
```

### 2. Package Test
```bash
npm pack                                            # Create tarball
tar -tzf coastal-programs-supabase-cli-0.1.0.tgz   # Verify contents
rm *.tgz                                           # Clean up
```

### 3. Verify Package Contents
Package should include:
- ✅ dist/ (compiled code)
- ✅ bin/ (CLI entry point)
- ✅ README.md
- ✅ CHANGELOG.md
- ✅ LICENSE
- ✅ package.json

Package should NOT include:
- ❌ src/ (source files)
- ❌ test/ (test files)
- ❌ docs/ (documentation)
- ❌ .github/ (GitHub files)
- ❌ CLAUDE.md (AI instructions)

---

## Release Steps (3 minutes)

### 1. Create Git Tag
```bash
git tag v0.1.0
git tag -l  # Verify tag created
```

### 2. Push to GitHub
```bash
# Ensure on main branch
git checkout main

# Push with tags
git push origin main --tags
```

### 3. Verify on GitHub
- [ ] Repository updated
- [ ] Tag visible under "Releases"
- [ ] All files present
- [ ] Issue templates visible
- [ ] PR template working

---

## NPM Publication (2 minutes)

### 1. Login to npm
```bash
npm login
# Enter credentials
```

### 2. Dry Run (optional but recommended)
```bash
npm publish --dry-run
# Review what would be published
```

### 3. Publish
```bash
npm publish --access public
```

### 4. Verify Publication
```bash
npm view @coastal-programs/supabase-cli
# Should show version 0.1.0
```

---

## Post-Release Verification (5 minutes)

### 1. Test Installation from npm
```bash
# In a different directory
npm install -g @coastal-programs/supabase-cli

# Test CLI
supabase-cli --version
supabase-cli --help

# Test a command
supabase-cli projects list --help
```

### 2. Create GitHub Release
1. Go to repository on GitHub
2. Click "Releases" → "Draft a new release"
3. Select tag: v0.1.0
4. Title: "v0.1.0 - Initial Production Release"
5. Add release notes from CHANGELOG.md
6. Publish release

### 3. Update Repository
- [ ] Update repository description on GitHub
- [ ] Add topics: cli, supabase, typescript, oclif, management-api
- [ ] Verify README displays correctly
- [ ] Check that license is detected

---

## Smoke Tests (2 minutes)

Test the installed CLI with basic commands:

```bash
# Version check
supabase-cli --version

# Help text
supabase-cli --help

# Command listing
supabase-cli projects --help

# JSON output format
supabase-cli projects list --format json

# Error handling
supabase-cli invalid-command
# Should show helpful error
```

---

## Rollback Plan (if needed)

### Within 72 hours of publishing:
```bash
# Unpublish from npm
npm unpublish @coastal-programs/supabase-cli@0.1.0

# Delete Git tag
git tag -d v0.1.0
git push origin :refs/tags/v0.1.0

# Fix issues and re-release as 0.1.1
```

### After 72 hours:
- Cannot unpublish from npm
- Must release 0.1.1 with fixes
- Document issues in CHANGELOG.md

---

## Success Criteria

All of the following should be true:

- ✅ npm package published and installable
- ✅ GitHub repository updated with v0.1.0 tag
- ✅ GitHub release created with notes
- ✅ CLI installs globally without errors
- ✅ Basic commands work correctly
- ✅ Help text displays properly
- ✅ Error handling works
- ✅ Version number correct (0.1.0)

---

## Troubleshooting

### Build Fails
- Check TypeScript errors: `npm run build`
- Fix errors and try again
- Ensure all dependencies installed: `npm install`

### Tests Fail
- Run tests: `npm test`
- Check which tests are failing
- Fix tests or code as needed
- Re-run full test suite

### npm Publish Fails
- Check npm login: `npm whoami`
- Verify package name not taken: `npm view @coastal-programs/supabase-cli`
- Check access: `npm access ls-packages`
- Ensure version is unique

### Package Contents Wrong
- Review .npmignore
- Test with: `npm pack`
- Verify contents: `tar -tzf *.tgz`
- Fix .npmignore and retry

---

## Post-Release Tasks

### Immediate
- [ ] Announce release (if applicable)
- [ ] Monitor npm download stats
- [ ] Watch for GitHub issues
- [ ] Test on different platforms (Windows/Mac/Linux)

### Within 1 Week
- [ ] Gather initial feedback
- [ ] Document any issues
- [ ] Plan 0.1.1 if needed
- [ ] Update project roadmap

### Ongoing
- [ ] Monitor issue tracker
- [ ] Respond to questions
- [ ] Plan v0.2.0 features
- [ ] Update documentation as needed

---

## Contact

**Package**: @coastal-programs/supabase-cli
**GitHub**: https://github.com/coastal-programs/supabase-cli
**npm**: https://www.npmjs.com/package/@coastal-programs/supabase-cli
**Issues**: https://github.com/coastal-programs/supabase-cli/issues

---

**Total Time**: ~15-20 minutes
**Difficulty**: Easy (following this guide)
**Frequency**: Once per release

**Good luck with the release!** 🚀
