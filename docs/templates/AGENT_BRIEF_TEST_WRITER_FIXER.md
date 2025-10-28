# 🧪 AGENT BRIEF: Test Writer Fixer
## Quality Assurance & Testing Lead for Sprint 4

**Timeline**: 5 days (parallel execution)
**Deliverables**: 50-60 new tests, 5 bug fixes, 80%+ coverage
**Agent Type**: `test-writer-fixer`
**Coordinator**: Claude Code (Chen)

---

## YOUR MISSION

Fix the 5 failing tests, improve branch coverage from 68.77% → 80%+, and write comprehensive test suites for the 5 new commands. This is a quality sprint - you set the bar for production-grade code.

---

## PART 1: REMEDIATE FAILING TESTS (Day 1)

### Issue #1: "should aggregate project statistics"
**Location**: `test/supabase.test.ts:1064`
**Error**: `AssertionError: expected 2 to equal 1`

**Investigation Steps**:
1. Find the test that's failing
2. Understand what it's testing (getProjectStats or similar)
3. Identify why count is 2 instead of 1
4. Possible causes:
   - Double-counting in aggregation logic
   - Test data setup creating duplicates
   - Cache returning stale + fresh copy
   - Mock stub being called multiple times

**Fix Strategy**:
- Add console.log to see actual behavior
- Check test setup (beforeEach hooks)
- Verify mock/stub configuration
- May require small fix in `src/supabase.ts` aggregation logic

**Expected Outcome**: Test passes, error message gone

---

### Issue #2-5: Branch Coverage Gaps (68.77% → 80%+)

**Current Coverage Breakdown**:
```
src/retry.ts:        68.75% branch coverage
src/errors.ts:       57.14% branch coverage
src/supabase.ts:     61.4% branch coverage
src/cache.ts:        75.86% branch coverage (OK)
src/envelope.ts:     90.9% branch coverage (OK)
```

**Branch Coverage Analysis**:

#### retry.ts (68.75% → 90%+)
**Uncovered Branches**:
- Line 51: Circuit breaker condition branch
- Line 119: Retry timeout condition
- Line 129: Max attempts exceeded condition
- Line 141: Jitter calculation branch
- Line 158: Backoff cap condition
- Line 198: Error classification branch

**Test Strategy**:
```typescript
// Test 1: Circuit breaker activation
it('should trip circuit breaker after threshold', async () => {
  // Simulate 5 consecutive failures
  // Verify circuit breaker returns immediately
})

// Test 2: Circuit breaker reset
it('should reset circuit breaker after recovery period', async () => {
  // Trip breaker, wait recovery time
  // Verify next call attempts again
})

// Test 3: Max retries exceeded
it('should stop retrying at max attempts', async () => {
  // Setup: max retries = 3
  // Mock: always fails
  // Expect: 3 attempts, then throw
})

// Test 4: Timeout handling
it('should timeout after max delay', async () => {
  // Setup: slow network
  // Verify: doesn't retry beyond max delay cap
})

// Test 5: Jitter application
it('should add jitter to backoff', async () => {
  // Capture actual delays
  // Verify: within jitter range
})
```

#### errors.ts (57.14% → 85%+)
**Uncovered Branches**:
- Line 82-83: Status code classification
- Line 91-92: Error code mapping
- Line 100-101: Custom error construction
- Line 114: HTTP error parsing
- Line 121: Network error detection
- Lines 184-185: Error message formatting

**Test Strategy**:
```typescript
// Test 1: All HTTP status codes
it('should map status 400 to INVALID_REQUEST', () => { ... })
it('should map status 401 to UNAUTHORIZED', () => { ... })
it('should map status 403 to FORBIDDEN', () => { ... })
it('should map status 404 to NOT_FOUND', () => { ... })
it('should map status 429 to RATE_LIMITED', () => { ... })
it('should map status 500 to INTERNAL_ERROR', () => { ... })
it('should map status 503 to SERVICE_UNAVAILABLE', () => { ... })

// Test 2: Network error detection
it('should detect ECONNRESET as network error', () => { ... })
it('should detect ETIMEDOUT as network error', () => { ... })

// Test 3: Error message formatting
it('should format error with details', () => { ... })
it('should handle missing details gracefully', () => { ... })
```

#### supabase.ts (61.4% → 80%+)
**Uncovered Branches**:
- Line 212: Project validation branch
- Line 233: API URL construction branch
- Line 240: Header building branch
- Lines 488-493: Response parsing branches
- Lines 665-691: Cache invalidation branches
- Line 733: Batch operation handling
- Lines 964-966: Error recovery branches

**Test Strategy**:
```typescript
// Test 1: API URL construction
it('should build correct URL for projects endpoint', () => { ... })
it('should build correct URL with path parameters', () => { ... })

// Test 2: Cache invalidation
it('should invalidate single resource cache', () => { ... })
it('should invalidate list cache on write', () => { ... })
it('should invalidate multiple related caches', () => { ... })

// Test 3: Batch operations
it('should handle batch create', () => { ... })
it('should handle batch update', () => { ... })
it('should handle batch delete', () => { ... })

// Test 4: Error recovery
it('should retry on 500', () => { ... })
it('should not retry on 400', () => { ... })
```

---

## PART 2: NEW COMMAND TEST SUITES (Days 2-4)

### 2a. `functions/deploy.ts` Tests (12-15 tests)

**Test File**: `test/commands-functions-deploy.test.ts`

```typescript
describe('functions deploy', () => {
  describe('Happy Path', () => {
    it('should deploy function from .ts file', async () => {
      // Setup: create temp .ts file
      // Action: run deploy command
      // Assert: function deployed, exit code 0
    })

    it('should deploy function from .zip file', async () => {
      // Setup: create temp .zip file
      // Action: run deploy command with --runtime node
      // Assert: function deployed with correct runtime
    })

    it('should display deployment URL', async () => {
      // Setup: mock successful deployment
      // Assert: output contains function URL
    })
  })

  describe('Dry-Run Mode', () => {
    it('should show deployment plan without deploying', async () => {
      // Action: run with --dry-run
      // Assert: shows plan, doesn't call actual API
    })
  })

  describe('Error Handling', () => {
    it('should fail on missing function name', async () => {
      // Action: run without function-name arg
      // Assert: exit code 2 (argument error)
    })

    it('should fail on invalid runtime', async () => {
      // Action: run with --runtime invalid
      // Assert: exit code 1, INVALID_REQUEST error
    })

    it('should fail if source file not found', async () => {
      // Action: run with non-existent file
      // Assert: exit code 1, FILE_NOT_FOUND error
    })

    it('should handle deployment errors', async () => {
      // Setup: mock API returns 500
      // Assert: proper error message, exit code 1
    })

    it('should handle timeout', async () => {
      // Setup: deployment hangs
      // Assert: timeout error after --timeout duration
    })
  })

  describe('Progress Indicators', () => {
    it('should show upload progress', async () => {
      // Assert: progress bar appears in output
    })
  })

  describe('Cache Invalidation', () => {
    it('should invalidate functions cache after deploy', async () => {
      // Setup: prime cache with old function list
      // Action: deploy new function
      // Assert: cache invalidated
    })
  })

  describe('Output Formats', () => {
    it('should output JSON with --json', async () => {
      // Assert: valid envelope format
    })

    it('should output table with default', async () => {
      // Assert: formatted table output
    })
  })
})
```

**Total Tests**: 14

---

### 2b. `functions/invoke.ts` Tests (10-12 tests)

**Test File**: `test/commands-functions-invoke.test.ts`

```typescript
describe('functions invoke', () => {
  describe('Happy Path', () => {
    it('should invoke function with no arguments', async () => {
      // Setup: mock function response "OK"
      // Assert: response returned, execution time shown
    })

    it('should invoke function with JSON arguments', async () => {
      // Setup: mock function accepts params
      // Action: invoke with --arguments '{"key":"value"}'
      // Assert: arguments passed correctly
    })

    it('should display execution time', async () => {
      // Assert: output includes "Execution time: X ms"
    })

    it('should handle different HTTP methods', async () => {
      // Test: GET, POST, PUT, DELETE
    })
  })

  describe('Response Handling', () => {
    it('should parse JSON responses', async () => {
      // Setup: function returns JSON
      // Assert: parsed and displayed
    })

    it('should handle text responses', async () => {
      // Setup: function returns plain text
      // Assert: displayed as-is
    })

    it('should show response status code', async () => {
      // Assert: status code displayed (200, 201, etc.)
    })
  })

  describe('Error Handling', () => {
    it('should fail on missing function name', async () => {
      // Assert: exit code 2
    })

    it('should fail on invalid JSON arguments', async () => {
      // Action: --arguments '{"invalid json'
      // Assert: INVALID_REQUEST error
    })

    it('should handle function not found', async () => {
      // Setup: mock 404
      // Assert: NOT_FOUND error
    })

    it('should handle timeout', async () => {
      // Setup: slow function
      // Action: invoke with --timeout 100
      // Assert: timeout error after 100ms
    })

    it('should handle function execution error', async () => {
      // Setup: mock 500 from function
      // Assert: shows function error
    })
  })

  describe('Timeout Behavior', () => {
    it('should respect --timeout flag', async () => {
      // Various timeout values
    })

    it('should suggest timeout increase on timeout', async () => {
      // Assert: helpful error message
    })
  })
})
```

**Total Tests**: 12

---

### 2c. `branches/list.ts` Tests (8-10 tests)

**Test File**: `test/commands-branches-list.test.ts`

```typescript
describe('branches list', () => {
  describe('Happy Path', () => {
    it('should list all branches', async () => {
      // Setup: mock 5 branches
      // Assert: all branches displayed
    })

    it('should show branch status indicators', async () => {
      // Assert: ACTIVE shown as ✅, CREATING as ⏳, ERROR as ❌
    })

    it('should show parent branch', async () => {
      // Assert: parent column visible
    })
  })

  describe('Filtering', () => {
    it('should filter by status ACTIVE', async () => {
      // Setup: 3 ACTIVE, 2 CREATING
      // Action: --status ACTIVE
      // Assert: only 3 shown
    })

    it('should filter by parent branch', async () => {
      // Action: --parent main
      // Assert: only branches from main shown
    })
  })

  describe('Error Handling', () => {
    it('should fail without project ref', async () => {
      // Assert: clear error message, exit code 1
    })

    it('should handle API errors', async () => {
      // Setup: mock 500
      // Assert: error displayed
    })
  })

  describe('Output Formats', () => {
    it('should output JSON', async () => {
      // Assert: valid envelope
    })

    it('should output table (default)', async () => {
      // Assert: formatted columns
    })

    it('should output CSV', async () => {
      // Assert: comma-separated
    })
  })

  describe('Pagination', () => {
    it('should apply limit flag', async () => {
      // Setup: 100 branches
      // Action: --limit 10
      // Assert: 10 returned
    })

    it('should apply offset flag', async () => {
      // Action: --limit 10 --offset 20
      // Assert: items 20-30 returned
    })
  })

  describe('Caching', () => {
    it('should cache branches list', async () => {
      // Action: list twice
      // Assert: second call uses cache
    })
  })
})
```

**Total Tests**: 10

---

### 2d. `config/init.ts` Tests (6-8 tests)

**Test File**: `test/commands-config-init.test.ts`

```typescript
describe('config init', () => {
  describe('Happy Path', () => {
    it('should initialize with valid token', async () => {
      // Setup: SUPABASE_ACCESS_TOKEN set
      // Assert: config created, exit code 0
    })

    it('should validate token via API', async () => {
      // Setup: mock API validation
      // Assert: verification call made
    })

    it('should create default profile', async () => {
      // Assert: profile named "default" created
    })

    it('should create custom profile', async () => {
      // Action: --profile production
      // Assert: profile "production" created
    })
  })

  describe('Error Handling', () => {
    it('should fail without token', async () => {
      // Setup: no SUPABASE_ACCESS_TOKEN
      // Assert: clear error with setup instructions
    })

    it('should fail on invalid token', async () => {
      // Setup: SUPABASE_ACCESS_TOKEN=invalid
      // Setup: mock API returns 401
      // Assert: UNAUTHORIZED error
    })

    it('should handle API errors', async () => {
      // Setup: mock API 500
      // Assert: error displayed
    })
  })

  describe('Output', () => {
    it('should show profile info', async () => {
      // Assert: displays profile name, org, project count
    })

    it('should show config file location', async () => {
      // Assert: shows ~/.supabase/config.json path
    })
  })
})
```

**Total Tests**: 8

---

### 2e. `config/doctor.ts` Tests (8-10 tests) - NEW COMMAND

**Purpose**: Health check command to diagnose CLI setup issues

**Implementation Requirements**:
```typescript
// Check:
// 1. Token validity (can connect to API?)
// 2. Projects accessible (can list projects?)
// 3. Database accessible (can query schema?)
// 4. Cache working (is cache enabled and functioning?)
// 5. Retry system (is it active?)

// Return:
{
  checks: {
    token: { status: 'OK'|'ERROR', message: string },
    api: { status: 'OK'|'ERROR', message: string },
    projects: { status: 'OK'|'ERROR', count?: number },
    database: { status: 'OK'|'ERROR', message?: string },
    cache: { status: 'OK'|'ERROR', hitRate?: number },
    retry: { status: 'OK'|'ERROR', enabled: boolean }
  },
  summary: 'All checks passed' | 'X checks failed'
}
```

**Test File**: `test/commands-config-doctor.test.ts`

```typescript
describe('config doctor', () => {
  describe('Happy Path', () => {
    it('should pass all checks', async () => {
      // Setup: all systems OK
      // Assert: summary "All checks passed"
    })

    it('should show cache hit rate', async () => {
      // Assert: cache section shows hit rate %
    })
  })

  describe('Diagnostics', () => {
    it('should fail token check on bad token', async () => {
      // Setup: SUPABASE_ACCESS_TOKEN=bad
      // Assert: token check shows ERROR
    })

    it('should fail API check on connection error', async () => {
      // Setup: mock network error
      // Assert: api check shows ERROR with message
    })

    it('should warn if cache disabled', async () => {
      // Setup: SUPABASE_CLI_CACHE_ENABLED=false
      // Assert: cache check shows WARNING
    })

    it('should report project count', async () => {
      // Assert: "X projects accessible"
    })

    it('should check database connectivity', async () => {
      // Assert: database section populated
    })
  })

  describe('Output', () => {
    it('should show color-coded status', async () => {
      // Assert: ✅ for OK, ❌ for ERROR, ⚠️ for WARNING
    })

    it('should suggest fixes for errors', async () => {
      // Assert: actionable error messages
    })
  })
})
```

**Total Tests**: 10

---

## PART 3: SUMMARY OF ALL TESTS

**By Command**:
- functions deploy: 14 tests
- functions invoke: 12 tests
- branches list: 10 tests
- config init: 8 tests
- config doctor: 10 tests
- **Subtotal**: 54 tests for new commands

**By Category**:
- Happy path: ~20 tests
- Error handling: ~20 tests
- Output formatting: ~8 tests
- Cache behavior: ~6 tests
- **Total New Tests**: ~54 tests

**Plus Coverage Improvements**:
- Fix 5 failing tests
- Add 15-20 branch coverage tests (retry, errors, supabase)
- **Total Coverage Tests**: 15-20

**Grand Total**: 69-74 new tests (exceeds 50-60 target!)

---

## TEST EXECUTION CHECKLIST

### Per-Command
- [ ] Happy path tests (all pass)
- [ ] Error handling tests (all pass)
- [ ] Output format tests (all pass)
- [ ] Cache tests (if applicable)
- [ ] All edge cases covered

### Integration
- [ ] All tests run with `npm test`
- [ ] Coverage reports generated
- [ ] No test failures
- [ ] No console warnings

### Quality Gates
- [ ] Overall coverage: 80%+ ✅
- [ ] Branch coverage: 80%+ ✅ (UP FROM 68.77%)
- [ ] Function coverage: 90%+ ✅
- [ ] All new tests: 100% pass rate

---

## DAILY EXECUTION PLAN

**Day 1 (Monday)**: Fix failing tests & analyze coverage gaps
- [ ] Debug & fix "should aggregate project statistics"
- [ ] Identify specific uncovered branches in retry.ts, errors.ts, supabase.ts
- [ ] Write test plan for branch coverage (save as TODO file)

**Day 2 (Tuesday)**: Write functions deploy & invoke tests
- [ ] 14 tests for functions/deploy.ts
- [ ] 12 tests for functions/invoke.ts
- [ ] Run and verify all pass

**Day 3 (Wednesday)**: Write branches & config tests
- [ ] 10 tests for branches/list.ts
- [ ] 8 tests for config/init.ts
- [ ] Run and verify all pass

**Day 4 (Thursday)**: Add coverage tests & doctor command
- [ ] 15-20 branch coverage tests for retry/errors/supabase
- [ ] 10 tests for config/doctor.ts (new command)
- [ ] Run full suite, verify coverage >= 80%

**Day 5 (Friday)**: Final verification & reporting
- [ ] Run full test suite: `npm test`
- [ ] Generate coverage report: `npm run test:coverage`
- [ ] Verify: 80%+ overall, 80%+ branch, 90%+ function
- [ ] Generate test summary report

---

## SUCCESS CRITERIA

### Fixed Issues
- ✅ 5 failing tests fixed (0 failures remaining)
- ✅ Branch coverage: 68.77% → 80%+
- ✅ Overall coverage: maintained at 80%+

### New Tests
- ✅ 50-60 new tests written (actual: 54-64)
- ✅ 275+ total tests (225 existing + 54 new)
- ✅ 100% pass rate
- ✅ All error paths tested
- ✅ All happy paths tested

### Quality Gates
- ✅ Overall coverage >= 80%
- ✅ Branch coverage >= 80%
- ✅ Function coverage >= 90%
- ✅ No tech debt introduced

---

## HANDOFF CHECKLIST

Before handing off to `performance-benchmarker`:
- [ ] All 5 failing tests fixed
- [ ] 54+ new tests written
- [ ] All tests passing (no failures)
- [ ] Coverage report generated
- [ ] Coverage >= 80% overall
- [ ] Coverage >= 80% branch
- [ ] Test summary ready

---

## RESOURCES

**Test Pattern Reference**:
- `test/commands-projects.test.ts` (command testing pattern)
- `test/supabase.test.ts` (API testing pattern)
- `test/cache.test.ts` (infrastructure testing pattern)

**Test Tools**:
- Mocha (test framework)
- Chai (assertions)
- Sinon (mocks/stubs)
- NYC (coverage reporting)

**Commands**:
```bash
npm test                    # Run all tests
npm run test:coverage       # With coverage report
npm run test:watch         # Watch mode for development
npx mocha test/specific.test.ts  # Run specific test file
```

---

## QUESTIONS? BLOCKERS?

If you encounter issues:
1. Check existing test files for patterns
2. Review Mocha/Chai/Sinon documentation
3. Run coverage reports to see exactly what's uncovered
4. Ask Chen for clarification

**You've got this!** 🧪

---

**Estimated Time**: 15-18 hours
**Deadline**: End of Day 4
**Coordination**: Chen will monitor coverage daily
