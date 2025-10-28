# 🚀 AGENT BRIEF: RAPID-PROTOTYPER (YOU!)
## Phase 2A - Sprint Coordination & Integration Lead

**Role**: Quarterback, integration lead, blocker resolver
**Timeline**: 9 AM - 7 PM (1-2 hours spread throughout day)
**Success Criteria**: All agents coordinated, all deliverables integrated, final report ready

---

## YOUR MISSION

You are the **Coordination Lead** for Phase 2A. While Agents 1-3 implement, test, and benchmark the 27 commands, you:

1. Monitor all 3 agents
2. Run integration tests every 1-2 hours
3. Verify quality gates (82%+ coverage, 0 failures)
4. Alert on blockers immediately
5. Update documentation
6. Generate final report

---

## YOUR DAILY SCHEDULE

### 9:00 AM - KICK OFF (5 min)

**What you do**:
- [ ] Send Agent 1 brief: `AGENT_BRIEF_PHASE2A_BACKEND.md`
- [ ] Send Agent 2 brief: `AGENT_BRIEF_PHASE2A_TESTING.md`
- [ ] Send Agent 3 brief: `AGENT_BRIEF_PHASE2A_PERFORMANCE.md`
- [ ] Verify all agents acknowledge and start working
- [ ] Note the start time

**Message to send**:
```
Phase 2A Sprint starting NOW!

Agent 1 (backend-architect): Implement 27 commands
Agent 2 (test-writer-fixer): Write 80+ tests, maintain 82%+ coverage
Agent 3 (performance-benchmarker): Benchmark commands, generate report
Agent 4 (you): Monitor, integrate, deliver

Your briefs are attached. Let's go! 🚀
```

---

### 10:00 AM - CHECK-IN 1 (15 min)

**What you do**:
1. [ ] Ask Agent 1: "Status on storage commands?"
2. [ ] Ask Agent 2: "How many tests written so far?"
3. [ ] Ask Agent 3: "Performance test framework ready?"
4. [ ] Run `npm test` in terminal

**Verification**:
```bash
cd C:\Users\jakes\Developer\GitHub\superbase-cli
npm test 2>&1 | tail -20
```

**What you're checking**:
- All existing tests still passing
- No regressions from new code
- Agent 1's commands registering properly

**Quick Status Update**:
```
🔍 CHECK-IN 1 (10 AM)
Agent 1: Storage commands ~40% done
Agent 2: 10 tests written, 0 failures
Agent 3: Test framework ready
Coverage: 82.98% ✓
Status: ON TRACK ✅
```

---

### 11:00 AM - CHECK-IN 2 (15 min)

**What you do**:
1. [ ] Ask Agent 1: "Storage done? Starting auth?"
2. [ ] Ask Agent 2: "60 tests now?"
3. [ ] Ask Agent 3: "Benchmarks running?"
4. [ ] Run `npm test` again

**Verification**:
```bash
npm test 2>&1 | tail -20
npm run test:coverage 2>&1 | grep -E "Coverage|Statement"
```

**What you're checking**:
- New tests all passing
- Coverage still 82%+
- No compilation errors

**Quick Status Update**:
```
🔍 CHECK-IN 2 (11 AM)
Agent 1: Storage done, auth ~50% done
Agent 2: 40 tests written, all passing
Agent 3: Startup benchmarks complete
Coverage: 82.98% ✓
Status: ON TRACK ✅
```

---

### 12:00 PM - LUNCH BREAK (enjoy!)

You've done 30 min of coordination. Take a break!

---

### 2:00 PM - CHECK-IN 3 (15 min) - MID-SPRINT REVIEW

**What you do**:
1. [ ] Ask Agent 1: "Status? Commands ~70% done?"
2. [ ] Ask Agent 2: "Coverage still 82%+"
3. [ ] Ask Agent 3: "API perf tests complete?"
4. [ ] Run full test suite + coverage

**Verification**:
```bash
npm test 2>&1 | tail -50
npm run test:coverage 2>&1 | tail -30
```

**What you're checking**:
- All tests still passing (0 failures)
- Coverage maintained or improved
- No major blockers

**CRITICAL CHECK**:
If coverage drops below 82%, alert Agent 2 immediately:
```
⚠️ COVERAGE ALERT
Current: XX.XX% (target: 82%)
Action: Focus on gap coverage immediately
```

**Quick Status Update**:
```
🔍 CHECK-IN 3 (2 PM) - MID-SPRINT
Agent 1: Storage ✓, Auth ✓, Integrations ~60%
Agent 2: 60 tests written, coverage 82%+ ✓
Agent 3: API perf + memory tests done
CRITICAL: Coverage still maintained ✓
Status: ON TRACK ✅
```

---

### 4:00 PM - CHECK-IN 4 (15 min) - FINAL PUSH

**What you do**:
1. [ ] Ask Agent 1: "All 27 commands done?"
2. [ ] Ask Agent 2: "80+ tests done?"
3. [ ] Ask Agent 3: "Report ready?"
4. [ ] Run complete test suite

**Verification**:
```bash
npm test 2>&1 | tail -100
npm run test:coverage 2>&1 | tail -50
npm run build 2>&1 | tail -20
```

**What you're checking**:
- All 27 commands implemented
- All 80+ tests written and passing
- Build succeeds (0 errors)
- Coverage 82%+

**Quality Gate Check**:
```
✅ CODE QUALITY
  TypeScript: Compiling with 0 errors
  ESLint: Clean (0 violations)
  Coverage: 82%+ maintained

✅ TESTING
  Test count: 340+ (263 + 80+)
  Failures: 0
  All passing: ✓

✅ FEATURES
  Commands: 42 total (15 + 27)
  All working: ✓
```

**Status Update**:
```
🔍 CHECK-IN 4 (4 PM) - FINAL PUSH
Agent 1: All 27 commands COMPLETE ✓
Agent 2: 80+ tests COMPLETE, all passing ✓
Agent 3: Report READY ✓
Coverage: 82%+ maintained ✓
Build: Clean (0 errors) ✓
Status: READY FOR DELIVERY ✅
```

---

### 5:00 PM - 7:00 PM - EVENING DELIVERY (2 hours)

**What you do**:

#### 5:00 - 5:30 PM: Update README.md

Add all 27 new commands to README with examples:

```markdown
## Storage Management
### storage buckets list
List all storage buckets for a project.
```
supabase storage buckets list
```

... (add all 27 commands)
```

#### 5:30 - 6:00 PM: Update CLAUDE.md

Add Phase 2A architecture details:

```markdown
## Phase 2A: Critical Features (Storage, Auth, Integrations, Monitoring)

### New Command Categories
- Storage Management (6 commands)
- Authentication (8 commands)
- Integrations (5 commands)
- Monitoring & Logging (8 commands)

### Implementation Details
... (copy from AGENT_BRIEF_PHASE2A_BACKEND.md)
```

#### 6:00 - 6:30 PM: Create Command Reference

Create `docs/COMMAND_REFERENCE_PHASE2A.md`:

```markdown
# Phase 2A Command Reference

## Storage Management Commands

### storage buckets list
List all storage buckets

**Usage**:
```
supabase storage buckets list [--format json|table]
```

**Flags**:
- `--format`: Output format (json, table, yaml, csv)

**Example**:
```
supabase storage buckets list --format table
```

... (document all 27 commands)
```

#### 6:30 - 7:00 PM: Generate PHASE_2A_COMPLETE.md

Create final delivery report:

```markdown
# 🎉 PHASE 2A COMPLETE - FINAL REPORT

**Status**: ✅ COMPLETE
**Timeline**: 9 AM - 7 PM (1 day)
**Result**: 42 Total Commands (15 MVP + 27 Phase 2A)

## Deliverables

### Commands (27)
- ✅ Storage Management (6)
- ✅ Authentication (8)
- ✅ Integrations (5)
- ✅ Monitoring & Logging (8)

### Testing (340+ tests)
- ✅ 263 existing tests
- ✅ 80+ new tests
- ✅ 0 failures
- ✅ All passing

### Quality
- ✅ 82%+ statement coverage
- ✅ 70%+ branch coverage
- ✅ 0 compilation errors
- ✅ GitHub CLI standards met

### Documentation
- ✅ README.md updated
- ✅ CLAUDE.md updated
- ✅ Command reference created
- ✅ This final report

## Success Metrics

| Metric | Target | Achieved |
|--------|--------|----------|
| Commands | 27 | 27 ✅ |
| Tests | 80+ | XX ✅ |
| Coverage | 82%+ | XX% ✅ |
| Failures | 0 | 0 ✅ |
| Errors | 0 | 0 ✅ |

## Production Readiness

**Status**: 🟢 READY TO SHIP

All success criteria met. Phase 2A is production-ready.

### Quality Verification
- ✅ TypeScript strict mode passes
- ✅ ESLint clean
- ✅ All tests passing
- ✅ Coverage exceeds targets
- ✅ All patterns followed
- ✅ GitHub standards met

## Next Steps

1. Merge to main
2. Tag as Phase 2A release
3. Update npm package version
4. Publish to npm registry
5. Update documentation website

---

**Completion Time**: [calculate hours/minutes]
**Team**: 4 agents (backend-architect, test-writer-fixer, performance-benchmarker, rapid-prototyper)
**Quality**: Production Grade
**Status**: 🟢 READY TO SHIP 🚀
```

---

## YOUR MONITORING CHECKLIST

### Daily Checklist (repeat 4 times)

- [ ] Run `npm test`
- [ ] Check output for failures
- [ ] Run `npm run test:coverage`
- [ ] Verify 82%+ coverage
- [ ] Ask each agent for status
- [ ] Document in status update
- [ ] Alert on blockers

### Build Verification

```bash
# Full build verification
npm run build && npm test && npm run test:coverage
```

This should output:
```
✓ Build successful (0 errors)
✓ Tests passing (340+ total, 0 failures)
✓ Coverage: 82%+ maintained
```

### Blocker Resolution Protocol

If something blocks an agent:

**Identify**:
1. Ask agent: "What's blocking you?"
2. Understand the issue
3. Check if it's in your control

**If you can help**:
- Provide guidance from CLAUDE.md
- Reference existing patterns
- Share similar command examples

**If agent needs to pivot**:
- Suggest alternative approach
- Ensure it aligns with quality standards
- Move to next task

**If technical issue**:
- Check TypeScript compilation
- Verify supabase.ts has required methods
- Check test setup/teardown

---

## STATUS UPDATE TEMPLATE

Send these updates at each check-in:

```
🔍 CHECK-IN [N] ([TIME])

AGENT 1 (backend-architect): [Status]
  Commands: [X/27] done
  Status: [On track / Blocked / Ahead]

AGENT 2 (test-writer-fixer): [Status]
  Tests: [X/80+] written
  Coverage: XX% (target: 82%+)
  Status: [On track / Blocked / Ahead]

AGENT 3 (performance-benchmarker): [Status]
  Benchmarks: [X%] complete
  Findings: [Key observations]
  Status: [On track / Blocked / Ahead]

OVERALL STATUS: [ON TRACK / BLOCKED / AHEAD] ✅
QUALITY GATES: [All passing / Alert]

Next check-in: [TIME]
```

---

## QUALITY GATES (Non-Negotiable)

These are your red lines. If any fails, alert agents immediately:

1. **Code Coverage**: Must stay 82%+
2. **Test Failures**: Must stay 0
3. **Compilation Errors**: Must stay 0
4. **Pattern Compliance**: 100%
5. **Documentation**: Complete

---

## COMMON ISSUES & SOLUTIONS

| Issue | Solution | Your Action |
|-------|----------|-------------|
| Coverage drops | Agent 2 adds tests | Alert Agent 2, ask for ETA on recovery |
| Test fails | Agent 1 or 2 debugs | Ask which test, help debug pattern |
| Build error | Check TypeScript | Share error with relevant agent |
| Blocker | Work with agent | Help remove blocker or suggest pivot |
| Falling behind | Redistribute tasks | Discuss with agents, adjust goals if needed |

---

## END-OF-DAY VERIFICATION

Before declaring complete, verify:

```bash
# 1. All tests pass
npm test
# Expected: XXX tests passing, 0 failures

# 2. Coverage maintained
npm run test:coverage
# Expected: 82%+ statement coverage

# 3. Build clean
npm run build
# Expected: 0 errors

# 4. Commands work
npm link
supabase storage buckets list
supabase auth sso list
supabase logs functions list
# Expected: All commands respond correctly

# 5. Documentation updated
ls -la docs/
# Expected: COMMAND_REFERENCE.md exists
```

---

## SUCCESS CHECKLIST

### Before Delivery
- [ ] All 27 commands implemented
- [ ] All 80+ tests written
- [ ] All tests passing (0 failures)
- [ ] Coverage 82%+
- [ ] Build clean (0 errors)
- [ ] No regressions (263 existing tests still passing)
- [ ] All commands working manually

### Documentation
- [ ] README.md updated with 27 new commands
- [ ] CLAUDE.md updated with Phase 2A details
- [ ] docs/COMMAND_REFERENCE_PHASE2A.md created
- [ ] PHASE_2A_COMPLETE.md generated

### Final Check
- [ ] `npm test` clean
- [ ] `npm run test:coverage` shows 82%+
- [ ] `npm run build` succeeds
- [ ] All commands responsive
- [ ] Ready to ship ✅

---

## TIME TRACKING

You're spending:
- 10 AM: 15 min (check-in 1)
- 11 AM: 15 min (check-in 2)
- 2 PM: 15 min (check-in 3)
- 4 PM: 15 min (check-in 4)
- 5 PM-7 PM: 2 hours (documentation + final report)

**Total: ~2.5 hours** of your day focused on coordination.

---

## COMMUNICATION STYLE

Be professional but efficient:
- ✅ "Status?" (fast)
- ✅ "Coverage good?" (quick check)
- ✅ "Blocker? How can I help?" (supportive)
- ❌ "Detailed architectural discussion" (not now)
- ❌ "Code review back-and-forth" (agents handle their code)

---

## READY?

Your job is to ensure smooth execution and coordinate delivery. You're the conductor of this orchestra.

**Let's get Phase 2A smashed out! 🎯**

---

*Created by: Chen (Claude Code)*
*For: Phase 2A Coordination*
*Your Role: Quarterback, Integration Lead, Blocker Resolver*
*Timeline: 1 Day (9 AM - 7 PM)*
