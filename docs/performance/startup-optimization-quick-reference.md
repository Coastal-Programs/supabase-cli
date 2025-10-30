# Startup Optimization Quick Reference

## Performance Metrics

| Command | Before | After | Improvement |
|---------|--------|-------|-------------|
| `--version` | 1,613ms | **628ms** | **-61%** ✅ |
| `--help` | 1,445ms | **683ms** | **-53%** ✅ |

## What Changed?

### 1. Fast-Path Logic in bin/run
The CLI now checks for `--version` and `--help` **before** loading the oclif framework:

```javascript
// bin/run
const args = process.argv.slice(2)
const firstArg = args[0]

// Handle --version without loading oclif
if (firstArg === '--version' || firstArg === '-v') {
  const { version } = require('../package.json')
  console.log(`@coastal-programs/supabase-cli/${version} ...`)
  process.exit(0)
}

// Handle --help with minimal overhead
if (firstArg === '--help' || firstArg === '-h') {
  // Custom help screen
  process.exit(0)
}

// Everything else loads oclif normally
const oclif = require('@oclif/core')
oclif.run()...
```

### 2. Manifest Generation
Pre-computed command metadata:
```bash
npx oclif manifest
```

Creates `oclif.manifest.json` (committed to repo).

### 3. No Help Plugin
Removed from `package.json`:
```json
"oclif": {
  "plugins": []  // was: ["@oclif/plugin-help"]
}
```

## Impact

### User Experience
- ✅ Instant feedback for version/help queries
- ✅ No noticeable delay
- ✅ Better perceived performance

### Development Workflow
- Developer runs help/version 20x/day
- **Saves 19.7 seconds/day per developer**

### CI/CD
- 100 builds/day with version check
- **Saves 98.5 seconds/day**

## Maintenance

### Updating Help Text
Edit `bin/run` lines 22-55 to update the main help screen.

### Regenerating Manifest
After adding/modifying commands:
```bash
npm run build
npx oclif manifest
```

### Testing Performance
```bash
node scripts/benchmark-startup-detailed.js
```

## Trade-offs

### Pros ✅
- 60%+ faster startup
- Better UX
- Simple implementation
- No breaking changes

### Cons ⚠️
- Main help text manually maintained
- Two code paths (custom + oclif)
- ~50 lines more in bin/run

### Mitigation ✅
- Help text is static (topics from package.json)
- Clear documentation
- Comprehensive tests
- Topic/command help still uses oclif

## Verification

```bash
# Test version
node bin/run --version

# Test help
node bin/run --help

# Test topic help (uses oclif)
node bin/run projects --help

# Test command
node bin/run projects:list --help

# Benchmark
node scripts/benchmark-startup-detailed.js
```

## Rollback Procedure

If needed, rollback by:

1. **Revert bin/run**:
   ```bash
   git checkout HEAD~1 bin/run
   ```

2. **Restore help plugin**:
   ```json
   "oclif": {
     "plugins": ["@oclif/plugin-help"]
   }
   ```

3. **Rebuild**:
   ```bash
   npm run build
   npx oclif manifest
   ```

## Future Optimizations

### Next 50-100ms (if needed):
1. Lazy-load Helper module (50-80ms)
2. Cache package.json parsing (10-20ms)

### Long-term:
1. Binary compilation with pkg/nexe
2. Target: <100ms startup

## References

- Detailed Report: `docs/performance/phase5-startup-optimization.md`
- Summary: `PERFORMANCE_IMPROVEMENT_SUMMARY.md`
- Benchmark: `scripts/benchmark-startup-detailed.js`
- Modified Files:
  - `bin/run` (fast-path logic)
  - `package.json` (removed help plugin)
  - `oclif.manifest.json` (generated)

---

**Last Updated**: 2025-10-30
**Status**: ✅ Production Ready
**Target**: <700ms ✅ Achieved (628ms)
