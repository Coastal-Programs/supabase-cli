# ⚡ AGENT BRIEF: PERFORMANCE-BENCHMARKER
## Phase 2A - Performance Validation & Optimization

**Target**: Benchmark 27 commands, verify performance targets
**Timeline**: 9 AM - 12 PM (2-3 hours, parallel work)
**Success Criteria**: All commands meeting performance targets, report generated

---

## YOUR MISSION

Validate that all 27 new commands meet performance standards and generate optimization recommendations.

---

## PERFORMANCE TARGETS

| Metric | Target | Note |
|--------|--------|------|
| Startup time | < 700ms | Normal for Node.js CLI |
| API response (cached) | < 500ms | With cache hit |
| API response (uncached) | < 2s | First call or cache miss |
| Memory baseline | < 100MB | Starting memory |
| Memory peak | < 200MB | During operation |
| Cache hit rate | 75%+ | Caching effectiveness |
| Throughput | 100+ ops/sec | With caching enabled |

---

## PERFORMANCE TEST STRUCTURE

### 1. Startup Time Benchmark

**Test**: Measure time to execute each command (help output)

```bash
#!/bin/bash
# Measure startup time for each command
time supabase storage buckets list --help
time supabase auth sso list --help
time supabase logs functions list --help
# etc...
```

**Expected Results**:
- All commands < 700ms startup time
- No significant variation between commands
- Consistent across multiple runs

**Report**:
- Startup times for each command
- Slowest command identified
- Optimization opportunities (lazy loading, etc.)

---

### 2. API Performance Benchmark

**Test**: Measure API call performance with and without cache

```typescript
// cached/api-performance.ts
describe('API Performance', () => {
  it('should be fast with cache hit', async () => {
    const startTime = Date.now()

    // First call (cache miss)
    await supabase.getStorageBuckets()

    // Second call (cache hit)
    const start = Date.now()
    await supabase.getStorageBuckets()
    const duration = Date.now() - start

    expect(duration).to.be.lessThan(50) // Should be very fast
  })

  it('should handle uncached calls', async () => {
    const start = Date.now()

    // Call without cache
    const result = await retry.execute(async () => {
      return await api.fetchData()
    })

    const duration = Date.now() - start
    expect(duration).to.be.lessThan(2000) // < 2 seconds
  })
})
```

**Measurements**:
- Time with cache (should be instant)
- Time without cache (should be < 2s)
- Cache hit rate percentage

---

### 3. Memory Usage Profiling

**Test**: Measure memory consumption during operations

```typescript
// performance/memory-profiling.ts
describe('Memory Usage', () => {
  it('should not leak memory', async () => {
    const baseline = process.memoryUsage().heapUsed

    // Execute multiple operations
    for (let i = 0; i < 100; i++) {
      await command.run()
    }

    const final = process.memoryUsage().heapUsed
    const leaked = final - baseline

    expect(leaked).to.be.lessThan(50 * 1024 * 1024) // < 50MB increase
  })

  it('should use reasonable memory', async () => {
    const initial = process.memoryUsage().heapUsed

    // Load large dataset
    const largeResult = await supabase.getStorageBuckets()

    const peak = process.memoryUsage().heapUsed
    const usage = peak - initial

    expect(usage).to.be.lessThan(100 * 1024 * 1024) // < 100MB
  })
})
```

**Measurements**:
- Baseline memory on startup
- Peak memory during operation
- Memory after cleanup
- Memory leak detection

---

### 4. Load Testing

**Test**: Verify performance under load

```typescript
// performance/load-testing.ts
describe('Load Testing', () => {
  it('should handle 10 concurrent requests', async () => {
    const promises = []
    const start = Date.now()

    for (let i = 0; i < 10; i++) {
      promises.push(supabase.getStorageBuckets())
    }

    await Promise.all(promises)
    const duration = Date.now() - start

    // Should still be reasonably fast
    expect(duration).to.be.lessThan(5000) // < 5 seconds
  })

  it('should handle 100 sequential requests', async () => {
    const start = Date.now()

    for (let i = 0; i < 100; i++) {
      await supabase.getStorageBuckets()
    }

    const duration = Date.now() - start
    const avgTime = duration / 100

    // Average time per request should be < 100ms (with cache)
    expect(avgTime).to.be.lessThan(100)
  })

  it('should handle large result sets', async () => {
    // Create large result set
    const largeArray = new Array(10000).fill({
      id: 'test',
      name: 'bucket'
    })

    const start = Date.now()
    // Process large array
    const processed = largeArray.map(item => ({
      ...item,
      processed: true
    }))
    const duration = Date.now() - start

    expect(duration).to.be.lessThan(100) // < 100ms for 10k items
  })
})
```

**Measurements**:
- Time for concurrent requests
- Time for sequential requests
- Time per request with caching
- Throughput (ops per second)

---

### 5. Cache Effectiveness Analysis

**Test**: Measure cache hit rates and effectiveness

```typescript
// performance/cache-analysis.ts
describe('Cache Effectiveness', () => {
  it('should have high cache hit rate', () => {
    const stats = cache.getStats()

    // Expect 75%+ hit rate
    expect(stats.hitRate).to.be.greaterThan(0.75)
  })

  it('should reduce API calls', async () => {
    let callCount = 0
    sandbox.stub(api, 'get').callsFake(async () => {
      callCount++
      return { data: [] }
    })

    // First call
    await command.run()
    expect(callCount).to.equal(1)

    // Second call (should be cached)
    await command.run()
    expect(callCount).to.equal(1) // Still 1, cache hit!
  })

  it('should invalidate cache on write', async () => {
    // Set cache
    cache.set('buckets:list', [{id: 'b1'}], 60000)

    // Write operation
    await createBucket()

    // Cache should be invalidated
    expect(cache.has('buckets:list')).to.be.false
  })
})
```

**Metrics**:
- Cache hit rate percentage
- Cache miss rate percentage
- API calls saved by caching
- Cache size and efficiency

---

## PERFORMANCE REPORT TEMPLATE

Create `docs/PERFORMANCE_REPORT_PHASE2A.md`:

```markdown
# Phase 2A Performance Report

## Executive Summary
- 27 commands tested
- All performance targets met ✅
- Average startup time: XXXms
- Cache hit rate: XX%

## Startup Time Analysis
- Fastest command: XXXms
- Slowest command: XXXms
- Average: XXXms
- All under 700ms target: ✅

### By Command
| Command | Startup Time | Status |
|---------|--------------|--------|
| storage buckets list | XXXms | ✅ |
| auth sso list | XXXms | ✅ |
| ... | ... | ✅ |

## API Performance Analysis
- Cached response time: XXms
- Uncached response time: XXXms
- Cache hit rate: XX%
- All under 2s target: ✅

## Memory Usage
- Baseline: XXMb
- Peak: XXMb
- Leak detection: None ✅
- Under 200MB target: ✅

## Load Testing Results
- 10 concurrent: XXms ✅
- 100 sequential: XXms ✅
- Average per-request: XXms ✅
- Throughput: XX+ ops/sec ✅

## Cache Effectiveness
- Hit rate: XX% (target: 75%) ✅
- API calls reduced: XX%
- Cache invalidation: Working ✅

## Optimization Recommendations
1. Consider lazy loading for non-critical imports
2. Enable compression for large responses
3. Implement progressive rendering for large datasets
4. Monitor memory in production

## Conclusion
All 27 commands meet performance targets. CLI is production-ready.
```

---

## BENCHMARKING PROCEDURE

### Phase 1: Baseline (9 AM - 10 AM)
- [ ] Set up performance test framework
- [ ] Create test utility functions
- [ ] Establish baseline measurements

### Phase 2: Measurements (10 AM - 11 AM)
- [ ] Run startup time benchmarks
- [ ] Run API performance tests
- [ ] Run memory profiling
- [ ] Run load tests
- [ ] Analyze cache effectiveness

### Phase 3: Analysis (11 AM - 12 PM)
- [ ] Compile results
- [ ] Generate performance report
- [ ] Identify optimizations
- [ ] Document findings

---

## PERFORMANCE TEST FILES

Create tests in `test/performance/`:

```
test/performance/
├── startup-time.test.ts      (startup benchmarks)
├── api-performance.test.ts   (API call timing)
├── memory-profiling.test.ts  (memory usage)
├── load-testing.test.ts      (concurrent/sequential)
├── cache-analysis.test.ts    (cache effectiveness)
└── integration-perf.test.ts  (end-to-end)
```

---

## TOOLS & UTILITIES

### Timing

```typescript
const start = Date.now()
// code to measure
const duration = Date.now() - start
console.log(`Took ${duration}ms`)
```

### Memory

```typescript
const before = process.memoryUsage().heapUsed
// code to measure
const after = process.memoryUsage().heapUsed
const used = (after - before) / 1024 / 1024 // MB
```

### Statistics

```typescript
function calculateStats(timings: number[]) {
  const sorted = timings.sort((a, b) => a - b)
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sorted.reduce((a, b) => a + b) / sorted.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
  }
}
```

---

## SUCCESS CRITERIA

✅ All startup times < 700ms
✅ All API calls < 2s (uncached)
✅ Memory usage < 200MB peak
✅ Cache hit rate 75%+
✅ Throughput 100+ ops/sec
✅ No memory leaks detected
✅ Performance report generated

---

## IF PERFORMANCE IS POOR

**Common issues & solutions**:

| Issue | Solution |
|-------|----------|
| Slow startup | Check for heavy imports, lazy load non-critical code |
| High memory | Check for leaks, implement streaming for large datasets |
| Low cache hit rate | Verify cache invalidation logic, increase TTL |
| API slowness | Check network latency, implement parallel requests |
| Load failures | Reduce concurrent requests, implement rate limiting |

---

## DELIVERABLES

1. Performance test files (`test/performance/`)
2. Performance metrics (in test output)
3. Performance report (`docs/PERFORMANCE_REPORT_PHASE2A.md`)
4. Optimization recommendations (in report)

---

## SUCCESS CHECKLIST

- [ ] Startup time benchmarks complete
- [ ] API performance tests written
- [ ] Memory profiling complete
- [ ] Load testing passed
- [ ] Cache analysis done
- [ ] All targets met
- [ ] Report generated
- [ ] Recommendations documented

---

*Created by: Chen (Claude Code)*
*For: Phase 2A Performance Testing*
*Target: All Commands < 700ms Startup*
