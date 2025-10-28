# Phase 3: Strategic Evolution Sprint Strategy

**Architect**: Dr. James "Jim" Hartwell
**Executor**: Marcus Chen (with specialized sub-agents)
**Status**: PLANNING → EXECUTION
**Timeline**: 4 sprints, 8 weeks target

---

## Executive Summary

Four-phase approach to transform supabase-cli from solid foundation to industry-leading developer tool:

1. **Sprint 1 (3-4 days)**: Fix blocking issues, ship v0.1.0
2. **Sprint 2 (2-3 weeks)**: Resource mapping + configuration profiles
3. **Sprint 3 (3-4 weeks)**: Performance optimization + request deduplication
4. **Sprint 4 (ongoing)**: Enterprise features + plugin architecture

---

## SPRINT 1: BLOCKING ISSUES & v0.1.0 RELEASE

**Duration**: 3-4 days
**Goal**: Ship clean, publishable v0.1.0
**Success Criteria**: All vulns fixed, tests pass, npm ready

### Phase 1.1: Security Vulnerability Remediation

**Assigned To**: backend-architect agent
**Task**: Fix all 18 npm vulnerabilities

**Work Items**:
```typescript
// Priority 1 - HIGH SEVERITY (MUST FIX)
1. Update @oclif/plugin-warn-if-update-available@^3.1.51
   - Fixes lodash.template command injection
   - BREAKING: May require code changes to plugin interface
   - Estimated: 1 hour

2. Update @oclif/plugin-plugins@^5.4.51
   - Fixes npm/tar DoS vulnerability
   - BREAKING: May affect plugin system
   - Estimated: 1 hour

3. Update oclif@^4.22.38
   - Fixes @octokit ReDoS vulnerabilities
   - BREAKING: Major version bump
   - Estimated: 2 hours (includes testing)

// Priority 2 - MODERATE (FIX AFTER)
4. Run npm audit fix for remaining 12 vulnerabilities
   - Estimated: 1 hour + testing

// Priority 3 - VERIFICATION
5. Full test suite execution
   - npm test (full coverage)
   - npm run build
   - Manual smoke tests on key commands
   - Estimated: 1 hour
```

**Agent Briefing**:
- You're the backend expert. Your job is dependency hygiene.
- Test each update individually before moving to next
- If any tests fail after update, investigate and fix
- Run full test suite after each major dependency bump
- Report back with: changed files, test results, breaking changes identified
- Don't skip testing - this is blocking v0.1.0 release

**Success Metrics**:
- ✅ `npm audit` returns clean (0 vulnerabilities)
- ✅ All 843 tests passing
- ✅ Build completes with 0 errors
- ✅ 90%+ test coverage maintained

---

### Phase 1.2: Code Cleanup & Dependency Removal

**Assigned To**: frontend-developer agent
**Task**: Remove unused dependencies, move SECURITY.md, add CODE_OF_CONDUCT

**Work Items**:
```bash
# 1. Remove unused dependencies (350KB savings)
npm uninstall @supabase/supabase-js axios
npm run build
npm test

# 2. File organization
mv docs/SECURITY.md SECURITY.md
cat > CODE_OF_CONDUCT.md << 'EOF'
# Contributor Covenant Code of Conduct

[Standard CoC content - be welcoming, inclusive, professional]

Reporting: Contact maintainers at [email]
EOF

# 3. Update package.json
- Verify "files" array is correct
- Check "repository" field
- Verify "keywords"

# 4. Verify .npmignore
- Ensure LICENSE is included
- Ensure src/ and test/ excluded
- Ensure dist/ and bin/ included

# 5. Update documentation
- Update CONTRIBUTING.md to reference CODE_OF_CONDUCT.md
- Update README.md with CODE_OF_CONDUCT badge
```

**Agent Briefing**:
- You're the UX/frontend expert. Your job is polish and presentation.
- Remove the dependencies - they're bloat, not used anywhere
- Verify build still works perfectly after removals
- Run full test suite twice - before and after
- Check that nothing breaks when dependencies removed
- Report: files moved, dependencies removed, tests passing, binary size reduction

**Success Metrics**:
- ✅ @supabase/supabase-js removed, no import errors
- ✅ axios removed, no import errors
- ✅ SECURITY.md in root directory
- ✅ CODE_OF_CONDUCT.md in root directory
- ✅ Build size reduced by ~350KB
- ✅ All tests still passing

---

### Phase 1.3: Version Bump & Release Preparation

**Assigned To**: devops-automator agent
**Task**: Version bump, changelog update, GitHub release prep

**Work Items**:
```bash
# 1. Version bumping
npm version patch  # 0.1.0 → 0.1.1 (if just fixes)
# OR
npm version minor  # 0.1.0 → 0.2.0 (if new features from cleanup)

# 2. Update CHANGELOG.md
- Add entry for v0.1.0 or v0.2.0
- Document security fixes
- Document dependency removals
- Document new files (CODE_OF_CONDUCT, SECURITY)

# 3. Update package.json version field manually if needed
# 4. Commit: "chore: Security updates and dependency cleanup"
# 5. Create git tag: v0.1.0 or v0.2.0
# 6. Prepare for npm publish (don't publish yet)

# 7. Verify npm package contents
npm pack
tar -tzf supabase-cli-[version].tgz | head -20
```

**Agent Briefing**:
- You're the DevOps person. Your job is releases and automation.
- Follow semantic versioning strictly
- Document changelog clearly - future users read this
- Don't publish to npm yet - we'll do that in a separate, intentional step
- Prepare everything so publishing is just one command
- Report: version number, changelog, git tags, package contents verified

**Success Metrics**:
- ✅ Version bumped correctly
- ✅ CHANGELOG.md updated with all changes
- ✅ Git tag created
- ✅ Package contents verified (40 files, no src/, no test/)
- ✅ Ready for npm publish

---

## SPRINT 2: RESOURCE MAPPING & CONFIGURATION

**Duration**: 2-3 weeks
**Goal**: Port Notion CLI mapping pattern, add config profiles
**Success Criteria**: Mapping system working, config profiles functional, tests >85%

### Phase 2.1: Resource Mapping System

**Assigned To**: backend-architect agent
**Task**: Implement hierarchical resource mapping from Notion CLI pattern

**Work Items**:
```typescript
// 1. Create ResourceRegistry system
// Location: src/resource-registry.ts
//
// Defines all resource types with standard operations:
// - create, get, list, update, delete, describe
// - Caching strategy per resource type
// - Dependency relationships (project → branch → function)

interface ResourceDefinition {
  name: string
  type: 'project' | 'branch' | 'function' | 'table' | 'api_endpoint'
  cacheKey: (id: string) => string
  cacheTTL: number
  dependencies: string[] // What invalidates with this resource
  defaultSort: string
}

// 2. Implement fine-grained cache invalidation
// Location: src/cache.ts (extend existing)
//
// Instead of: invalidateCache('functions')
// Use: invalidateCache('function', { projectRef, branchRef })
//
// Cascading: When project deleted, auto-invalidate all child resources

// 3. Create MapperService
// Location: src/mapper.ts
//
// Handles resource navigation:
// projects → branches → functions
// Auto-load dependent data on request
// Track relationships for cascade operations

// 4. Update supabase.ts
// - Use resource registry for all API methods
// - Implement cascading invalidation
// - Add resource.get(), resource.list() helpers

// 5. Test coverage
// - Unit tests for ResourceRegistry
// - Integration tests for cascade invalidation
// - Performance tests for mapping overhead
// Target: 90%+ coverage for mapping system
```

**Agent Briefing**:
- You're implementing the core pattern that makes this CLI powerful
- Study how your Notion CLI does resource mapping - that's your model
- Make it hierarchical and testable
- Cascading invalidation is critical - when parent changes, kids are invalid
- You'll write ~800 lines of code in this phase
- Each function needs unit tests (TDD approach)
- Report: resource registry complete, all tests passing, no regressions

**Success Metrics**:
- ✅ ResourceRegistry defined for all 15+ resource types
- ✅ Fine-grained cache invalidation working
- ✅ MapperService navigating relationships
- ✅ 90%+ coverage on new code
- ✅ No regressions in existing tests

---

### Phase 2.2: Configuration Profiles System

**Assigned To**: backend-architect agent (parallel with 2.1)
**Task**: Implement multi-environment config profiles

**Work Items**:
```typescript
// 1. Create ConfigProfileManager
// Location: src/config-manager.ts
//
// Structure: ~/.supabase-cli/config.json
// {
//   "currentProfile": "dev",
//   "profiles": {
//     "dev": {
//       "apiUrl": "http://localhost:54321",
//       "token": "sbp_...",
//       "projectRef": "local",
//       "cache": { "enabled": true, "ttl": 600000 }
//     },
//     "staging": {
//       "apiUrl": "https://staging.supabase.co",
//       "token": "sbp_...",
//       "projectRef": "staging-xyz",
//       "cache": { "enabled": true, "ttl": 300000 }
//     },
//     "prod": {
//       "apiUrl": "https://api.supabase.io",
//       "token": "sbp_...",
//       "projectRef": "prod-xyz",
//       "cache": { "enabled": true, "ttl": 600000 }
//     }
//   }
// }

// 2. Priority cascade (highest to lowest)
// 1. CLI flags: --profile prod, --token xyz
// 2. Environment variables: SUPABASE_CLI_PROFILE, SUPABASE_ACCESS_TOKEN
// 3. Config file profile setting
// 4. Default profile in config
// 5. Hardcoded defaults

// 3. Add --profile flag to all commands
// Usage: supabase projects list --profile prod

// 4. Add profile management commands
// - supabase config set-profile <name>
// - supabase config list-profiles
// - supabase config create-profile <name>
// - supabase config delete-profile <name>
// - supabase config show-current

// 5. Test coverage
// - Unit tests for ConfigProfileManager
// - Integration tests for priority cascade
// - Tests for each profile command
// Target: 85%+ coverage

// 6. Documentation
// - Update README with profile usage
// - Add examples for dev/staging/prod setup
// - Document env var overrides
```

**Agent Briefing**:
- You're implementing enterprise-grade config management
- This is standard across all major CLIs (aws, gcloud, heroku)
- The priority cascade is critical - flags override env vars override config
- Profile switching must be seamless and fast
- You'll add ~400 lines of code
- Every public method needs tests
- Report: ConfigProfileManager complete, all commands updated, tests passing

**Success Metrics**:
- ✅ Config file parsing working correctly
- ✅ Profile switching functional for all commands
- ✅ Priority cascade working as designed
- ✅ Profile management commands operational
- ✅ 85%+ coverage on config system
- ✅ No regressions in existing functionality

---

### Phase 2.3: Integration & Testing

**Assigned To**: test-writer-fixer agent
**Task**: Write comprehensive tests for mapping + config systems

**Work Items**:
```
// Test files to create:
- test/coverage/resource-mapping.test.ts (400 lines)
  - ResourceRegistry tests
  - Cascade invalidation tests
  - Relationship navigation tests

- test/coverage/config-profiles.test.ts (350 lines)
  - Profile loading tests
  - Priority cascade tests
  - Profile switching tests
  - env var override tests

- test/integration/mapping-config-integration.test.ts (300 lines)
  - Full workflow with mapping + config
  - Multi-profile commands
  - Cache behavior across profiles

// Target: 1,050+ new test lines
// Coverage target: 90%+ overall
```

**Agent Briefing**:
- You're the quality guardian
- Write tests first, then help fix any failures
- Use the same patterns from Phase 2C (sinon stubs, chai assertions)
- Make tests comprehensive but readable
- If you find issues in the implementation, report them
- You write ~1,000 lines of rigorous tests
- Report: all tests passing, coverage >90%, no issues found

**Success Metrics**:
- ✅ 1,000+ lines of new tests
- ✅ 90%+ coverage achieved
- ✅ All tests passing
- ✅ No regressions

---

## SPRINT 3: PERFORMANCE OPTIMIZATION

**Duration**: 3-4 weeks
**Goal**: 2x performance improvement, implement deduplication
**Success Criteria**: Startup <200ms, request deduplication working, all tests pass

### Phase 3.1: Remove Unused Dependencies & Optimize Build

**Assigned To**: performance-benchmarker agent
**Task**: Binary optimization, startup time improvement

**Work Items**:
```bash
# Already done in Sprint 1:
# - Removed @supabase/supabase-js (350KB)
# - Removed axios (50KB)

# Phase 3.1 additional optimization:
# 1. Tree-shake lodash
#    - Audit which lodash functions actually used
#    - Replace with native JS or smaller library
#    - Estimated savings: 100KB

# 2. Strip source maps from production build
#    - Remove *.js.map, *.d.ts.map files
#    - Estimated savings: 50-100KB

# 3. Lazy-load heavy dependencies
#    - inquirer (interactive prompts)
#    - Currently loaded on demand (good)
#    - Verify in code

# 4. Measure startup time baseline
#    - Create benchmark test
#    - Measure before optimization
#    - Measure after optimization
#    - Target: <200ms (from current ~300ms)

# 5. Measure binary size
#    - Current: ~1.4MB
#    - Target: <1.0MB
#    - npm pack && du -h
```

**Agent Briefing**:
- You're the performance specialist
- Every millisecond matters at CLI scale
- Measure before and after each optimization
- Create benchmarks that prove the improvements
- You're looking for 2x startup improvement total
- Report: startup time before/after, binary size before/after, optimizations applied

**Success Metrics**:
- ✅ Startup time <200ms (from ~300ms)
- ✅ Binary size <1.0MB (from ~1.4MB)
- ✅ All tests still passing
- ✅ No feature regression

---

### Phase 3.2: Request Deduplication & Smart Caching

**Assigned To**: backend-architect agent
**Task**: Implement in-flight request deduplication

**Work Items**:
```typescript
// 1. Create RequestDeduplicator
// Location: src/request-deduplicator.ts
//
// Problem: Two concurrent listProjects() calls = 2 API hits
// Solution: Share the promise, not the result
//
// Implementation:
interface PendingRequest {
  promise: Promise<any>
  timestamp: number
}

const pendingRequests = new Map<string, PendingRequest>()

function deduplicateRequest<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // If request already in-flight, return same promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!.promise
  }

  // Start new request
  const promise = fetcher()
    .finally(() => pendingRequests.delete(key))

  pendingRequests.set(key, { promise, timestamp: Date.now() })
  return promise
}

// 2. Integrate with supabase.ts
// - Wrap all list/get operations with deduplication
// - Add tests for concurrent calls
// - Measure performance improvement

// 3. Sliding window TTL
// Location: src/cache.ts (extend existing)
//
// Problem: Cache expires, next access re-fetches
// Solution: Extend TTL on access if still "fresh"
//
// Implementation:
const REFRESH_THRESHOLD = 120_000 // 2 minutes
get<T>(key: string): T | undefined {
  const entry = this.cache.get(key)
  if (!entry) return undefined

  // Extend TTL if accessed frequently
  const age = Date.now() - entry.timestamp
  if (age < REFRESH_THRESHOLD) {
    entry.timestamp = Date.now() // Reset TTL
  }

  return entry.value
}

// 4. Tests
// - Concurrent request deduplication tests
// - Sliding window TTL tests
// - Performance benchmarks
```

**Agent Briefing**:
- You're implementing the deduplication pattern
- This alone will give 20-30% performance boost for batch operations
- The sliding window TTL keeps hot data alive longer
- Both are proven patterns from production systems
- ~300 lines of code, comprehensive tests required
- Report: deduplication working, TTL logic solid, tests passing, performance metrics

**Success Metrics**:
- ✅ In-flight deduplication implemented
- ✅ Concurrent identical calls return same result
- ✅ Sliding window TTL working
- ✅ 20-30% performance improvement on batch ops
- ✅ 85%+ coverage for new code
- ✅ All tests passing

---

### Phase 3.3: HTTP/2 & Connection Optimization

**Assigned To**: backend-architect agent (parallel with 3.2)
**Task**: Enable HTTP/2 multiplexing for concurrent requests

**Work Items**:
```typescript
// 1. Create HTTP/2 client configuration
// Location: src/http-client.ts
//
// Current: HTTP/1.1 with default pooling
// Target: HTTP/2 with multiplexing

import * as https from 'https'
import * as http2 from 'http2'

const http2Session = http2.connect('https://api.supabase.io', {
  maxConcurrentStreams: 100,
  enablePush: false,
})

// 2. Update fetch wrapper
// - Use http2Session for requests
// - Fallback to http/1.1 if unavailable
// - Transparent to calling code

// 3. Connection pooling
// - Configure agent with optimal pool size
// - maxSockets: 256
// - maxFreeSockets: 256
// - timeout: 60000

// 4. Measurement & verification
// - Benchmark 10+ concurrent requests
// - Compare HTTP/1.1 vs HTTP/2
// - Measure latency improvement
// - Target: 30-40% improvement on concurrent ops

// 5. Tests
// - Verify HTTP/2 session created
// - Test fallback mechanism
// - Concurrent request performance tests
```

**Agent Briefing**:
- You're optimizing the network layer
- HTTP/2 multiplexing makes concurrent requests much faster
- This is the last major performance lever
- If multiple requests in parallel, 30-40% improvement expected
- ~200 lines of code
- Report: HTTP/2 enabled, fallback working, benchmarks showing improvement

**Success Metrics**:
- ✅ HTTP/2 multiplexing enabled
- ✅ Connection pooling optimized
- ✅ 30-40% improvement on 10+ concurrent requests
- ✅ Fallback to HTTP/1.1 working
- ✅ All tests passing
- ✅ No regressions

---

### Phase 3.4: Performance Integration & Verification

**Assigned To**: performance-benchmarker agent
**Task**: Comprehensive performance testing and verification

**Work Items**:
```
// 1. Create performance regression test suite
// Location: test/performance/phase3-optimization.test.ts
//
// Tests:
// - Startup time (target: <200ms)
// - Single API call (target: <500ms)
// - 10 concurrent calls (target: <1s with HTTP/2)
// - Batch operations (target: 20-30% improvement)
// - Memory usage (target: <200MB peak)
// - Cache hit rate (target: >80%)

// 2. Benchmark before/after for each optimization
// - Deduplication: measure concurrent calls
// - Sliding TTL: measure hot data retention
// - HTTP/2: measure concurrent throughput

// 3. Compare against Phase 2C baseline
// - Quantify improvements per optimization
// - Identify any regressions
// - Document findings

// 4. Final verification
// - All commands still work
// - No functional regressions
// - Performance across all metrics improved
```

**Agent Briefing**:
- You're proving the performance improvements work
- Create hard benchmarks showing the gains
- Compare before/after for each optimization
- If anything regresses, flag it immediately
- Report: comprehensive performance metrics, improvements quantified

**Success Metrics**:
- ✅ Startup time <200ms
- ✅ Batch operations 20-30% faster
- ✅ Concurrent operations 30-40% faster
- ✅ Memory usage optimal
- ✅ Cache hit rate >80%
- ✅ No regressions from Phase 2C

---

## SPRINT 4: ENTERPRISE FEATURES (ONGOING)

**Duration**: 4+ weeks
**Goal**: Plugin architecture, rollback history, audit trail
**Success Criteria**: Plugin system functional, documentation complete

### Phase 4.1: Plugin Architecture Design

**Assigned To**: backend-architect agent
**Task**: Design extensible plugin system

**Work Items**:
```
// 1. Plugin manifest definition
// 2. Plugin loading mechanism
// 3. Hook system (pre/post execution)
// 4. Plugin security model
// 5. Community plugin registry design
// 6. Tests & documentation
```

### Phase 4.2: Lifecycle Hooks Implementation

**Assigned To**: backend-architect agent
**Task**: Pre/post execution hooks for extensibility

### Phase 4.3: Rollback History & Audit Trail

**Assigned To**: backend-architect agent
**Task**: Track changes, enable rollback capabilities

---

## PARALLEL EXECUTION STRATEGY

### Weekly Check-ins
- Monday: Agent standups (5 min each)
- Wednesday: Progress review + blockers
- Friday: Sprint completion assessment

### Agent Supervision Matrix

| Agent | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 |
|-------|----------|----------|----------|----------|
| backend-architect | Vulns fix | Mapping + Config | Dedup + HTTP/2 | Plugin arch |
| frontend-developer | Cleanup | UI enhancements | Output opt | CLI UX |
| test-writer-fixer | Test all fixes | Map + Config tests | Performance tests | Plugin tests |
| performance-benchmarker | Baseline | Measure | Optimize & bench | Monitoring |
| devops-automator | Release prep | Release v0.2 | Release v0.3 | Release mgmt |

### Parallel Work Possible

**Sprint 1**: All tasks sequential (blocking)
**Sprint 2**: 2.1 + 2.2 parallel, 2.3 follows
**Sprint 3**: 3.1 + 3.2 + 3.3 parallel, 3.4 follows
**Sprint 4**: Independent feature teams

---

## Success Criteria Summary

### Sprint 1 (v0.1.0 Release)
- ✅ 0 npm vulnerabilities
- ✅ All tests passing
- ✅ Ready for npm publish

### Sprint 2 (v0.2.0 - Mapping + Config)
- ✅ Resource mapping system complete
- ✅ Config profiles functional
- ✅ 90%+ test coverage
- ✅ 4-6 new commands added

### Sprint 3 (v0.3.0 - Performance)
- ✅ Startup time <200ms
- ✅ Batch operations 2x faster
- ✅ Binary size <1.0MB
- ✅ 85%+ test coverage maintained

### Sprint 4 (v0.4.0+ - Enterprise)
- ✅ Plugin system architecture complete
- ✅ 3+ example plugins
- ✅ Hook system operational
- ✅ Community-ready

---

## Risk Mitigation

**Risk**: Major version updates break functionality
**Mitigation**: Test after each dependency update individually

**Risk**: Performance optimizations introduce subtle bugs
**Mitigation**: Comprehensive benchmark suite, regression testing

**Risk**: Parallel agent work causes conflicts
**Mitigation**: Clear file ownership, daily sync-ups

**Risk**: Resource mapping complexity overwhelming
**Mitigation**: Port Notion CLI pattern (proven), extensive documentation

---

## Agent Leadership Notes

Each agent will receive their own detailed brief with:
- Specific code locations
- Line count estimates
- Test requirements
- Success criteria
- Expected timeline

You supervise, verify code quality, ensure alignment with architecture.

If agent gets stuck:
1. Ask clarifying questions
2. Break work into smaller pieces
3. Pair program on complex parts
4. Escalate architectural issues

---

**Created**: October 28, 2025
**Status**: READY FOR EXECUTION
**Next Step**: Launch Sprint 1 immediately
