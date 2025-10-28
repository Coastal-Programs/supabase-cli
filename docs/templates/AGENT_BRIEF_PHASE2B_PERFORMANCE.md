# ⚡ AGENT BRIEF: PERFORMANCE-BENCHMARKER
## Phase 2B - Performance Testing & Optimization

**Target**: Benchmark all 17 commands, maintain performance targets
**Timeline**: 1-2 hours (parallel with Agent 1 & 2)
**Success Criteria**: All benchmarks completed, performance report generated, targets met or exceeded

---

## YOUR MISSION

Measure performance of all Phase 2B commands and generate optimization report.

**Focus Areas**:
- Backup operation performance (list, create, restore)
- Replica creation and deletion speed
- Network restriction list performance
- Memory usage during operations
- Cache effectiveness
- API response times

---

## PERFORMANCE TARGETS

### Command Response Times
```
Backup operations:     < 5 seconds
  ├─ backup list:      < 2 seconds (cached)
  ├─ backup get:       < 1 second (cached)
  ├─ backup create:    < 5 seconds
  ├─ backup restore:   < 10 seconds (destructive)
  └─ backup schedule:  < 3 seconds

Replica operations:    < 10 seconds
  ├─ replicas list:    < 2 seconds (cached)
  ├─ replicas create:  < 10 seconds
  └─ replicas delete:  < 8 seconds

Network operations:    < 1 second
  ├─ restrictions list: < 500ms (cached)
  ├─ restrictions add:  < 1 second
  └─ security audit:    < 3 seconds

Startup time:          < 700ms (entire CLI)
```

### Memory Usage
```
Baseline (idle):       < 80MB
Peak during:
  ├─ Backup list:      < 150MB
  ├─ Restore:          < 200MB
  ├─ Replica create:   < 180MB
  └─ Security audit:   < 160MB
```

### Cache Effectiveness
```
Overall cache hit rate: > 75%
Backup list hit rate:   > 85%
Replica list hit rate:  > 80%
Cache misses:           < 25%
```

---

## PERFORMANCE TEST FILES TO CREATE

### 1. Startup Performance (40 lines)
**File**: `test/performance/phase2b-startup.test.ts`

Measure CLI startup time for all new Phase 2B commands:

```typescript
describe('Phase 2B startup performance', () => {
  it('backup list startup time < 700ms', async () => {
    const start = performance.now()
    const cmd = new BackupListCommand([])
    const end = performance.now()
    expect(end - start).to.be.below(700)
  })

  it('db replicas list startup < 700ms', async () => {
    // Similar test for replicas
  })

  // Test 15 more commands
})
```

**Measurements**:
- Each Phase 2B command startup time
- Compare with Phase 2A baseline
- Identify any performance regressions
- Document slowest commands

---

### 2. Backup Operation Performance (60 lines)
**File**: `test/performance/phase2b-backup-perf.test.ts`

Benchmark backup-specific operations:

```typescript
describe('Backup operation performance', () => {
  it('backup list (cached) < 500ms', async () => {
    const start = performance.now()
    await new BackupListCommand([]).run()
    const cached = performance.now()
    await new BackupListCommand([]).run()
    const end = performance.now()
    expect(end - cached).to.be.below(500)
  })

  it('backup create < 5 seconds', async () => {
    const start = performance.now()
    await new BackupCreateCommand(['--description', 'perf test']).run()
    const end = performance.now()
    expect(end - start).to.be.below(5000)
  })

  it('backup restore < 10 seconds', async () => {
    // Measure restore performance
  })

  it('pitr restore < 10 seconds', async () => {
    // Measure point-in-time restore
  })
})
```

**Measurements**:
- List performance (cached vs uncached)
- Create performance
- Restore performance (destructive)
- Schedule creation performance
- PITR restore performance

---

### 3. Replica Operation Performance (50 lines)
**File**: `test/performance/phase2b-replica-perf.test.ts`

Benchmark database replica operations:

```typescript
describe('Replica operation performance', () => {
  it('replicas list (cached) < 500ms', async () => {
    const start = performance.now()
    await new ReplicasListCommand([]).run()
    const cached = performance.now()
    await new ReplicasListCommand([]).run()
    const end = performance.now()
    expect(end - cached).to.be.below(500)
  })

  it('replicas create < 10 seconds', async () => {
    const start = performance.now()
    await new ReplicasCreateCommand(['--location', 'eu-west-1']).run()
    const end = performance.now()
    expect(end - start).to.be.below(10000)
  })

  it('replicas delete < 8 seconds', async () => {
    // Measure delete performance
  })
})
```

**Measurements**:
- List performance (cached)
- Create performance
- Delete performance
- Compare with Phase 2A similar operations

---

### 4. Network & Security Performance (50 lines)
**File**: `test/performance/phase2b-network-perf.test.ts`

Benchmark network and security operations:

```typescript
describe('Network & security operation performance', () => {
  it('restrictions list (cached) < 500ms', async () => {
    const start = performance.now()
    await new RestrictionsListCommand([]).run()
    const cached = performance.now()
    await new RestrictionsListCommand([]).run()
    const end = performance.now()
    expect(end - cached).to.be.below(500)
  })

  it('restrictions add < 1 second', async () => {
    const start = performance.now()
    await new RestrictionsAddCommand(['--cidr', '192.168.1.0/24']).run()
    const end = performance.now()
    expect(end - start).to.be.below(1000)
  })

  it('security audit < 3 seconds', async () => {
    const start = performance.now()
    await new SecurityAuditCommand([]).run()
    const end = performance.now()
    expect(end - start).to.be.below(3000)
  })
})
```

**Measurements**:
- Restrictions list performance
- Restrictions add/remove performance
- Policies list performance
- Security audit performance

---

### 5. Memory Profiling (50 lines)
**File**: `test/performance/phase2b-memory.test.ts`

Measure memory usage during operations:

```typescript
describe('Memory usage', () => {
  it('backup list memory < 150MB', async () => {
    if (global.gc) global.gc() // Force garbage collection
    const before = process.memoryUsage().heapUsed / 1024 / 1024

    await new BackupListCommand([]).run()

    const after = process.memoryUsage().heapUsed / 1024 / 1024
    expect(after).to.be.below(before + 150)
  })

  it('restore operation memory < 200MB', async () => {
    // Similar pattern for restore
  })

  it('replica create memory < 180MB', async () => {
    // Memory during replica creation
  })

  it('security audit memory < 160MB', async () => {
    // Memory during audit
  })
})
```

**Measurements**:
- Baseline memory at startup
- Peak memory per command
- Memory leak detection (GC behavior)
- Heap growth over multiple operations

---

### 6. Cache Effectiveness (45 lines)
**File**: `test/performance/phase2b-cache-analysis.test.ts`

Analyze cache hit rates and effectiveness:

```typescript
describe('Cache effectiveness', () => {
  it('backup list cache hit rate > 85%', async () => {
    let hits = 0
    let total = 0

    for (let i = 0; i < 20; i++) {
      const cmd = new BackupListCommand([])
      const result = await cmd.run()
      if (result.metadata.cached) hits++
      total++
    }

    const hitRate = (hits / total) * 100
    expect(hitRate).to.be.above(85)
  })

  it('replicas list cache hit rate > 80%', async () => {
    // Similar for replicas
  })

  it('restrictions list cache hit rate > 80%', async () => {
    // Similar for restrictions
  })

  it('cache invalidation works on write', async () => {
    // Verify cache clears after create/delete/update
  })
})
```

**Measurements**:
- Cache hit rate per command
- Cache invalidation timing
- Cache memory overhead
- TTL effectiveness

---

### 7. API Response Times (40 lines)
**File**: `test/performance/phase2b-api-times.test.ts`

Measure actual API response times:

```typescript
describe('API response times', () => {
  it('list backup API < 2 seconds', async () => {
    const api = new SupabaseAPI()
    const start = performance.now()
    const backups = await api.listBackups()
    const end = performance.now()
    expect(end - start).to.be.below(2000)
  })

  it('create backup API < 5 seconds', async () => {
    const api = new SupabaseAPI()
    const start = performance.now()
    const backup = await api.createBackup({ description: 'test' })
    const end = performance.now()
    expect(end - start).to.be.below(5000)
  })

  // Similar tests for all API methods
})
```

**Measurements**:
- Raw API response times
- Network latency
- Identify slow endpoints
- Compare with SLA requirements

---

### 8. Load Testing (50 lines)
**File**: `test/performance/phase2b-load.test.ts`

Test performance under concurrent load:

```typescript
describe('Load testing', () => {
  it('backup list 10 concurrent requests < 5 seconds', async () => {
    const start = performance.now()
    const promises = []
    for (let i = 0; i < 10; i++) {
      promises.push(new BackupListCommand([]).run())
    }
    await Promise.all(promises)
    const end = performance.now()
    expect(end - start).to.be.below(5000)
  })

  it('restrictions add 5 concurrent < 10 seconds', async () => {
    // Similar for concurrent adds
  })

  it('mixed concurrent operations < 15 seconds', async () => {
    // Various commands running concurrently
  })
})
```

**Measurements**:
- Concurrent request handling
- Response time under load
- Rate limiting behavior
- Stability verification

---

## PERFORMANCE REPORT FORMAT

Generate `docs/PERFORMANCE_REPORT_PHASE2B.md` with sections:

### Executive Summary
- Overall performance assessment
- Targets met/exceeded
- Key findings and recommendations

### Command-by-Command Results
```
| Command | Target | Actual | Status |
|---------|--------|--------|--------|
| backup list | < 2s | 1.2s | ✅ PASS |
| backup create | < 5s | 4.8s | ✅ PASS |
| ...
```

### Memory Usage Summary
```
| Command | Baseline | Peak | Increase |
|---------|----------|------|----------|
| backup list | 80MB | 120MB | 40MB |
| restore | 80MB | 180MB | 100MB |
| ...
```

### Cache Analysis
```
Command Cache Performance:
- Backup list: 87% hit rate (target: 85%)
- Replicas list: 82% hit rate (target: 80%)
- Restrictions list: 84% hit rate (target: 80%)
```

### Findings & Recommendations
- Performance regressions (if any)
- Cache optimization opportunities
- Memory usage optimization
- API timeout considerations

---

## BENCHMARK EXECUTION WORKFLOW

### Hour 1: Setup & Basic Benchmarks
- Create all 8 test files
- Run startup performance tests
- Document baseline metrics

### Hour 1.5: Command-Specific Benchmarks
- Backup operation benchmarks
- Replica operation benchmarks
- Network operation benchmarks

### Hour 2: Advanced Metrics
- Memory profiling
- Cache analysis
- Load testing
- API timing

### Final 30 minutes: Report Generation
- Compile results
- Generate performance report
- Identify optimization opportunities
- Document recommendations

---

## PERFORMANCE PASS/FAIL CRITERIA

### Must Pass ✅
- Startup time < 700ms (consistent with Phase 2A)
- Backup list < 2s (cached)
- Replica operations < 10s
- Network operations < 1s
- Memory usage < limits
- Cache hit rate > 75%

### Nice to Have 🎯
- Cache hit rate > 85%
- Sub-second cached responses
- Memory usage optimized
- Load testing successful

### Alert on 🚨
- Command > 2x expected time
- Memory > 250MB peak
- Cache hit < 50%
- Crashes under load
- Regression vs Phase 2A

---

## INTEGRATION WITH AGENT 1

- Agent 1 creates commands
- Run benchmarks as commands are completed
- If performance issues found:
  - Document in performance report
  - Suggest optimization strategies
  - Verify fixes with follow-up benchmarks

---

## TOOLS & UTILITIES

### Timing Measurement
```typescript
const start = performance.now()
// operation
const end = performance.now()
const duration = end - start // milliseconds
```

### Memory Measurement
```typescript
if (global.gc) global.gc() // Force GC
const before = process.memoryUsage().heapUsed / 1024 / 1024 // MB
// operation
const after = process.memoryUsage().heapUsed / 1024 / 1024 // MB
```

### Cache Status Check
```typescript
const result = await command.run()
if (result.metadata.cached) {
  // came from cache
} else {
  // fresh from API
}
```

---

## SUCCESS CRITERIA

Before marking complete:
- [ ] 8 performance test files created
- [ ] All performance tests passing
- [ ] Startup times < 700ms
- [ ] Backup operations < 5s
- [ ] Replica operations < 10s
- [ ] Network operations < 1s
- [ ] Memory usage within limits
- [ ] Cache hit rate > 75%
- [ ] Performance report generated
- [ ] No regressions vs Phase 2A

---

## QUALITY GATES

1. **Performance Targets**: All targets met or exceeded
2. **No Regressions**: No slowdown vs Phase 2A
3. **Memory Stability**: No memory leaks detected
4. **Cache Working**: Hit rates > 75%
5. **Report Complete**: Findings documented

---

*Created by: Chen (Claude Code)*
*For: Phase 2B Performance Testing*
*Target: All Benchmarks Complete, Report Generated*

