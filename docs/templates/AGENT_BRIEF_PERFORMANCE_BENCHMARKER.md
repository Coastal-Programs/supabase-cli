# ⚡ AGENT BRIEF: Performance Benchmarker
## Performance Testing & Optimization Lead for Sprint 4

**Timeline**: 5 days (Days 2-5, parallel to implementation)
**Deliverables**: Performance benchmarks, load tests, optimization report
**Agent Type**: `performance-benchmarker`
**Coordinator**: Claude Code (Chen)

---

## YOUR MISSION

Ensure the 5 new Sprint 4 commands perform at enterprise-grade standards. Benchmark each command, identify bottlenecks, stress-test the system, and recommend optimizations.

---

## PHASE 1: SETUP & BASELINE (Day 1-2)

### 1.1 Performance Test Infrastructure

Create `test/performance/` directory with test suite:

```typescript
// test/performance/benchmarks.test.ts

import { performance } from 'perf_hooks'
import { expect } from 'chai'
import { spawnSync } from 'child_process'

describe('Performance Benchmarks', () => {
  // Use perf_hooks to measure execution time with microsecond precision
  // Run each command N times, capture min/max/avg/p95/p99
  // Compare against targets
})
```

### 1.2 Benchmark Targets

**Command Startup Time** (excluding API calls):
- Target: < 500ms
- Threshold: < 1000ms

**API Response Time** (with cache hits):
- List operations: < 100ms (cached)
- Single operations: < 200ms (cached)
- Write operations: < 500ms (no cache)

**Memory Usage**:
- Baseline: < 100MB
- During load: < 200MB
- No leaks over 100 iterations

**Cache Hit Rate** (after warm-up):
- Target: >= 70%
- Healthy: >= 80%
- Excellent: >= 90%

---

## PHASE 2: COMMAND BENCHMARKS (Days 2-4)

### 2.1 `functions deploy` Benchmarks

**Benchmark Scenarios**:

1. **Cold Start** (no caching)
   ```bash
   supabase functions deploy my-func --project proj_xxx
   ```
   - Measure: Time from start to "Function deployed"
   - Target: < 2000ms (includes API call)
   - Breakdown:
     - Parse args: < 100ms
     - Read file: < 100ms
     - API call: 1000-1500ms
     - Formatting: < 100ms

2. **With Dry-Run**
   ```bash
   supabase functions deploy my-func --dry-run
   ```
   - Measure: Show plan without deploying
   - Target: < 500ms
   - Should be faster (no upload)

3. **Upload Performance** (file size scaling)
   - 1KB function: < 1500ms
   - 10KB function: < 2000ms
   - 100KB function: < 5000ms
   - Relationship should be linear

4. **Progress Indicator Response**
   - Progress updates: >= 10Hz (every 100ms)
   - No blocking UI

**Test Code**:
```typescript
describe('functions deploy performance', () => {
  it('should deploy in < 2000ms', async () => {
    const start = performance.now()
    const { status } = spawnSync('supabase', [
      'functions', 'deploy', 'test-func', 'dist/function.zip',
      '--project', 'proj_xxx'
    ])
    const duration = performance.now() - start
    expect(duration).to.be.lessThan(2000)
  })

  it('should scale linearly with file size', async () => {
    const times = []
    for (let size of [1, 10, 100]) {
      const start = performance.now()
      // Run deploy with size KB file
      const duration = performance.now() - start
      times.push(duration)
    }
    // Verify: 10KB is ~10x 1KB, 100KB is ~10x 10KB
    expect(times[1] / times[0]).to.be.closeTo(10, 2)
    expect(times[2] / times[1]).to.be.closeTo(10, 2)
  })

  it('should show progress updates regularly', async () => {
    // Monitor stdout for progress updates
    // Verify: updates at least every 100ms
  })
})
```

---

### 2.2 `functions invoke` Benchmarks

**Benchmark Scenarios**:

1. **Simple Invocation** (no args)
   ```bash
   supabase functions invoke my-func --project proj_xxx
   ```
   - Measure: Time to response
   - Target: < 1000ms
   - Breakdown: 500ms+ is function execution, not CLI

2. **With Arguments**
   ```bash
   supabase functions invoke my-func --arguments '{"key":"value"}'
   ```
   - Measure: Time including arg parsing & JSON validation
   - Target: < 1100ms
   - Should be ~100ms slower due to JSON parsing

3. **Timeout Handling**
   - Set timeout to 500ms
   - Invoke slow function
   - Measure: Timeout occurs at expected time
   - Tolerance: ±50ms

4. **Different HTTP Methods**
   - GET: < 800ms
   - POST: < 900ms
   - PUT: < 900ms
   - DELETE: < 800ms

**Test Code**:
```typescript
describe('functions invoke performance', () => {
  it('should invoke in < 1000ms', async () => {
    const start = performance.now()
    const { status } = spawnSync('supabase', [
      'functions', 'invoke', 'my-func',
      '--project', 'proj_xxx'
    ])
    const duration = performance.now() - start
    expect(duration).to.be.lessThan(1000)
  })

  it('should timeout after specified duration', async () => {
    const start = performance.now()
    spawnSync('supabase', [
      'functions', 'invoke', 'slow-func',
      '--timeout', '500',
      '--project', 'proj_xxx'
    ])
    const duration = performance.now() - start
    expect(duration).to.be.within(450, 550)  // ±50ms tolerance
  })

  it('should measure execution time accurately', async () => {
    // Parse output JSON
    // Verify: executionTime field is reasonable
    // Should be 100-900ms depending on function
  })
})
```

---

### 2.3 `branches list` Benchmarks

**Benchmark Scenarios**:

1. **Empty Project** (0 branches)
   - Target: < 200ms (cached)

2. **Small Project** (5 branches)
   - Target: < 300ms (cached)

3. **Medium Project** (50 branches)
   - Target: < 400ms (cached)

4. **Large Project** (1000+ branches)
   - Target: < 500ms (cached)
   - Verify linear scaling

5. **Pagination**
   - --limit 10: < 300ms
   - --limit 100: < 350ms
   - Should be same cache hit

6. **First Call vs Second Call**
   - First: ~500ms (API call)
   - Second: ~50ms (cache hit)
   - Cache effectiveness: >= 90%

**Test Code**:
```typescript
describe('branches list performance', () => {
  it('should list branches in < 300ms (cached)', async () => {
    // Prime cache
    spawnSync('supabase', ['branches', 'list', '--project', 'proj_xxx'])

    // Second call should be fast
    const start = performance.now()
    spawnSync('supabase', ['branches', 'list', '--project', 'proj_xxx'])
    const duration = performance.now() - start
    expect(duration).to.be.lessThan(300)
  })

  it('should scale linearly with branch count', async () => {
    const times = []
    const counts = [5, 50, 500]

    for (let count of counts) {
      // Setup: create N branches
      const start = performance.now()
      spawnSync('supabase', ['branches', 'list', '--project', 'proj_xxx'])
      times.push(performance.now() - start)
    }

    // Verify: linear relationship (time ~ count)
    // 500 branches ≈ 10x 50 branches
    expect(times[2] / times[1]).to.be.closeTo(10, 2)
  })

  it('should cache effectively', async () => {
    // First call
    const start1 = performance.now()
    spawnSync('supabase', ['branches', 'list', '--project', 'proj_xxx'])
    const duration1 = performance.now() - start1

    // Second call (should hit cache)
    const start2 = performance.now()
    spawnSync('supabase', ['branches', 'list', '--project', 'proj_xxx'])
    const duration2 = performance.now() - start2

    // Cache hit should be > 80% faster
    expect(duration2).to.be.lessThan(duration1 * 0.2)
  })
})
```

---

### 2.4 `config init` & `config doctor` Benchmarks

**Scenarios**:

1. **Token Validation** (config init)
   - Target: < 800ms (includes API call)
   - Breakdown: ~500ms API + ~300ms file I/O

2. **Doctor Diagnostics** (config doctor)
   - Target: < 2000ms (runs multiple checks)
   - Breakdown per check: ~400ms each

3. **Cache Effectiveness**
   - After first init, second call should use cached profile
   - Target: < 200ms on second call

---

## PHASE 3: LOAD TESTING (Days 3-4)

### 3.1 Concurrent Command Execution

Test CLI stability under concurrent load:

```typescript
describe('Load Testing', () => {
  it('should handle 10 concurrent list commands', async () => {
    const promises = []
    for (let i = 0; i < 10; i++) {
      promises.push(
        execAsync('supabase branches list --project proj_xxx')
      )
    }

    const results = await Promise.all(promises)

    // All should succeed
    expect(results).to.have.lengthOf(10)
    expect(results.every(r => r.status === 0)).to.be.true

    // Cache should reduce latency on concurrent calls
    // Average time should be reasonable
  })

  it('should handle stress test (100 sequential commands)', async () => {
    const startTime = performance.now()

    for (let i = 0; i < 100; i++) {
      spawnSync('supabase', ['projects', 'list', '--limit', '1'])
    }

    const totalTime = performance.now() - startTime
    const avgTime = totalTime / 100

    // Average should be < 200ms per command
    expect(avgTime).to.be.lessThan(200)

    // No memory leaks over 100 iterations
    const memUsage = process.memoryUsage()
    expect(memUsage.heapUsed).to.be.lessThan(200_000_000) // 200MB
  })
})
```

### 3.2 Cache Stress Test

Verify cache behavior under sustained load:

```typescript
describe('Cache Under Load', () => {
  it('should maintain hit rate > 70% over 1000 calls', async () => {
    let hits = 0
    let misses = 0

    // Warm cache
    spawnSync('supabase', ['projects', 'list', '--project', 'proj_xxx'])

    // Make 1000 calls
    for (let i = 0; i < 1000; i++) {
      const { stdout } = spawnSync('supabase', [
        'projects', 'list',
        '--project', 'proj_xxx',
        '--json'
      ])

      const parsed = JSON.parse(stdout)
      if (parsed.metadata.cacheHit) {
        hits++
      } else {
        misses++
      }
    }

    const hitRate = hits / (hits + misses)
    expect(hitRate).to.be.greaterThan(0.7)
    console.log(`Cache hit rate: ${(hitRate * 100).toFixed(2)}%`)
  })

  it('should not leak memory with cache enabled', async () => {
    const startMem = process.memoryUsage().heapUsed

    // Run 100 different queries (different cache keys)
    for (let i = 0; i < 100; i++) {
      spawnSync('supabase', [
        'db', 'query', `SELECT ${i}`,
        '--project', 'proj_xxx'
      ])
    }

    const endMem = process.memoryUsage().heapUsed
    const growth = endMem - startMem

    // Memory growth should be reasonable (< 50MB for 100 entries)
    expect(growth).to.be.lessThan(50_000_000)
  })
})
```

---

## PHASE 4: OPTIMIZATION RECOMMENDATIONS (Day 5)

### 4.1 Common Issues & Fixes

**Issue #1: Slow Startup**
- Cause: Heavy module imports
- Fix: Lazy-load non-critical modules
- Expected gain: 100-200ms faster

**Issue #2: Cache Misses**
- Cause: Cache keys not optimal
- Fix: Use more specific cache keys
- Expected gain: 10-20% more cache hits

**Issue #3: Memory Leaks**
- Cause: Unclosed streams or stale references
- Fix: Ensure proper cleanup in finally blocks
- Expected gain: 0 leaks, stable memory

**Issue #4: Retry Overhead**
- Cause: Too aggressive retry on fast endpoints
- Fix: Use adaptive retry (shorter backoff for fast endpoints)
- Expected gain: 50-100ms faster on retries

### 4.2 Optimization Priority Matrix

```
Impact vs Effort:

Quick Wins (high impact, low effort):
- [ ] Lazy load non-critical dependencies
- [ ] Optimize cache key generation
- [ ] Use streaming for large responses

Medium Effort:
- [ ] Implement adaptive retry
- [ ] Add request batching
- [ ] Optimize JSON parsing

High Effort (if time permits):
- [ ] Parallel API calls
- [ ] Connection pooling
- [ ] Worker threads for heavy compute
```

---

## DELIVERABLES

### 4.3 Performance Report Template

```markdown
# Sprint 4 Performance Report

## Executive Summary
- All commands meet startup time targets
- Cache effectiveness: 75%+ hit rate
- Load test: Stable under 10x concurrent load
- Memory: No leaks detected

## Command Performance

### functions deploy
- Startup: 450ms ✅
- File size scaling: Linear ✅
- Progress updates: 100Hz ✅

### functions invoke
- Startup: 380ms ✅
- Timeout handling: ±50ms ✅
- Method performance: All similar ✅

### branches list
- Startup: 320ms ✅ (cached)
- Cache hit rate: 92% ✅
- Pagination: < 350ms ✅

### config init & doctor
- Token validation: 750ms ✅
- Doctor diagnostics: 1800ms ✅
- Profile cache: 180ms ✅

## Load Test Results
- 10 concurrent commands: All pass ✅
- 100 sequential: Avg 180ms/cmd ✅
- 1000 calls: 75% cache hit rate ✅
- Memory growth: < 50MB for 100 ops ✅

## Cache Analysis
- Hit rate: 75% (target: 70%+) ✅
- TTL effectiveness: Optimal ✅
- Eviction: LRU working correctly ✅

## Bottlenecks Identified
1. API latency (not CLI - acceptable)
2. File I/O for large deployments (normal)
3. No critical bottlenecks found

## Recommendations
- Consider lazy loading for rarely-used modules (potential 100ms gain)
- Monitor memory usage in production
- Cache warming on startup could help cold starts

## Risk Assessment
- ✅ No memory leaks
- ✅ No performance regressions
- ✅ All targets met
- ✅ Ready for production
```

---

## SUCCESS CRITERIA

- ✅ All commands < 500ms startup time
- ✅ Cache hit rate >= 70%
- ✅ Load tests pass (10x concurrent, 100 sequential)
- ✅ No memory leaks detected
- ✅ Linear scaling with data size
- ✅ Performance report generated
- ✅ Optimization recommendations provided

---

## EXECUTION TIMELINE

**Day 2**: Setup benchmarks, start functions deploy
**Day 3**: Benchmark functions invoke & branches list
**Day 4**: Load testing, cache stress testing
**Day 5**: Optimization analysis, final report

---

## RESOURCES

**Tools**:
- Node.js `perf_hooks` module
- `ps` command for memory monitoring
- `time` command for system benchmarks

**Commands**:
```bash
# Create performance test files
mkdir -p test/performance

# Run specific benchmark
npx mocha test/performance/functions-deploy.test.ts

# Run with timing
time npx mocha test/performance/benchmarks.test.ts
```

---

**Estimated Time**: 10-12 hours
**Deadline**: End of Day 5
**Coordination**: Chen will review reports daily
