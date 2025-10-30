# Pre-Push Checklist for v0.1.0 Release

**Date**: October 30, 2025
**Version**: 0.1.0
**Branch**: main

## Code Quality
- [ ] `npm run build` - No TypeScript errors
- [ ] `npm test` - All tests passing (or documented failures)
- [ ] `npm run lint` - No linting errors
- [ ] `npm run format:check` - Code formatted properly

## Documentation
- [ ] README.md updated with all commands
- [ ] CHANGELOG.md complete for v0.1.0
- [ ] CONTRIBUTING.md accurate
- [ ] SECURITY.md reviewed
- [ ] CODE_OF_CONDUCT.md in place
- [ ] All docs/ organized and indexed
- [ ] CLAUDE.md updated for AI agents

## Package Configuration
- [ ] package.json version correct (0.1.0)
- [ ] package.json metadata accurate (description, keywords, author)
- [ ] .npmignore reviewed - only shipping necessary files
- [ ] .gitignore reviewed - no sensitive files tracked
- [ ] bin/ entry points working
- [ ] oclif manifest generated (`npm run prepack`)

## Repository Cleanup
- [ ] No temporary files (*.tmp, *.log, nul)
- [ ] No test output files (test-results.*)
- [ ] No package tarballs (*.tgz)
- [ ] All phase reports moved to docs/releases/v0.1.0/
- [ ] Root directory clean - only essential files

## Git Status
- [ ] All changes committed
- [ ] No sensitive data in commits (API keys, tokens)
- [ ] Git tags created: `git tag v0.1.0`
- [ ] Commit messages clear and descriptive
- [ ] No merge conflicts

## GitHub Configuration
- [ ] Issue templates created (.github/ISSUE_TEMPLATE/)
- [ ] PR template created (.github/PULL_REQUEST_TEMPLATE.md)
- [ ] Repository description updated
- [ ] Topics/tags added (cli, supabase, typescript, oclif)
- [ ] License file present
- [ ] Funding file configured (optional)

## Testing Verification
- [ ] Commands tested against live Supabase project
- [ ] Startup time verified (<700ms)
- [ ] Error handling verified
- [ ] Help text reviewed for all commands
- [ ] --json output format works
- [ ] --format table works
- [ ] Cache invalidation works

## Performance Checks
- [ ] Lazy loading implemented for all modules
- [ ] Import time optimized
- [ ] Memory usage acceptable (<200MB peak)
- [ ] No performance regressions

## Security Review
- [ ] No hardcoded credentials
- [ ] Environment variables documented in .env.example
- [ ] No sensitive data in repository
- [ ] Dependencies up to date (`npm audit`)
- [ ] SECURITY.md policy in place

## Final Verification
- [ ] Test package build: `npm pack`
- [ ] Verify package contents: `tar -tzf *.tgz`
- [ ] Test installation: `npm install -g coastal-programs-supabase-cli-0.1.0.tgz`
- [ ] Run smoke tests with installed package
- [ ] Clean up test tarball: `rm *.tgz`

## Release Commands

### Push to GitHub
```bash
# Ensure on main branch
git checkout main

# Push with tags
git push origin main --tags

# Verify on GitHub
# - Check all files uploaded
# - Verify tag visible
# - Test clone in fresh directory
```

### Publish to npm (when ready)
```bash
# Login to npm
npm login

# Dry run
npm publish --dry-run

# Actual publish
npm publish --access public

# Verify
npm view @coastal-programs/supabase-cli
```

## Post-Release
- [ ] Verify package on npm registry
- [ ] Test installation from npm: `npm install -g @coastal-programs/supabase-cli`
- [ ] Create GitHub release with notes
- [ ] Update project README with installation instructions
- [ ] Announce release (if applicable)

## Notes
- This is the initial v0.1.0 production release
- 40+ commands implemented across 8 categories
- Comprehensive test suite with 90+ test files
- Performance optimized with lazy loading
- Complete documentation for users and AI agents

## Rollback Plan
If issues are discovered:
1. Unpublish from npm (within 72 hours): `npm unpublish @coastal-programs/supabase-cli@0.1.0`
2. Delete Git tag: `git tag -d v0.1.0 && git push origin :refs/tags/v0.1.0`
3. Fix issues
4. Re-release as 0.1.1

---

**Ready for Release**: _____ (Date/Initials)
