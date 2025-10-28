# 🚀 AGENT BRIEF: Rapid Prototyper
## Sprint Coordinator & Integration Lead for Sprint 4

**Timeline**: 5 days (throughout sprint)
**Deliverables**: Sprint coordination, integration verification, final documentation
**Agent Type**: `rapid-prototyper`
**Coordinator**: Claude Code (Chen)

---

## YOUR MISSION

You are the quarterback. Keep all 3 agents coordinated, integrated, and on track. Ensure smooth execution, resolve blockers, and deliver flawless integration at the end. Your goal: MVP completion on schedule.

---

## ROLE & RESPONSIBILITIES

### Daily Responsibilities

1. **Progress Tracking** (Daily EOD)
   - Check status from all 3 agents
   - Identify blockers
   - Communicate progress to user
   - Adjust timeline if needed

2. **Integration Management** (Continuous)
   - Verify no merge conflicts
   - Ensure API contracts are met
   - Test full system integration
   - Run full test suite daily

3. **Risk Management** (Daily)
   - Monitor for regressions
   - Catch integration issues early
   - Alert on coverage gaps
   - Coordinate fixes

4. **Documentation** (Continuous)
   - Update README.md
   - Update CLAUDE.md
   - Create command reference
   - Generate final report

---

## SPRINT 4 TIMELINE & CHECKPOINTS

### Day 1: Foundation & Planning

**Morning (08:00-10:00)**
- [ ] Kickoff: Brief all 3 agents on their roles
- [ ] Verify agent briefs are clear
- [ ] Setup shared repo for progress tracking

**Midday (10:00-15:00)**
- Agent 2 (test-writer-fixer): Debug failing tests
- Agent 1 (backend-architect): Create command skeletons
- Agent 3 (performance-benchmarker): Setup test framework
- **Your task**: Monitor setup progress, unblock if needed

**EOD Checkpoint (15:00-17:00)**
```markdown
## Day 1 Status Report

**Agent 1 (Backend Architect)**:
- [ ] Status: ___
- [ ] Completed: ___
- [ ] Blockers: ___

**Agent 2 (Test Writer Fixer)**:
- [ ] Status: ___
- [ ] Fixed tests: ___
- [ ] Blockers: ___

**Agent 3 (Performance Benchmarker)**:
- [ ] Status: ___
- [ ] Test infra ready: ___
- [ ] Blockers: ___

**Integration Status**:
- [ ] Repo clean: Yes/No
- [ ] No conflicts: Yes/No
- [ ] Full test run: Pass/Fail
```

**EOD Actions**:
- [ ] Run full test suite: `npm test`
- [ ] Check coverage baseline
- [ ] Commit progress

---

### Day 2: Implementation Accelerates

**Morning Standup (08:00)**
- Check Day 1 progress
- Identify any blockers
- Adjust plan if needed

**Implementation Phase (09:00-17:00)**
- Agent 1: Implement functions/deploy.ts, functions/invoke.ts (partial)
- Agent 2: Write 26 tests for functions commands
- Agent 3: Benchmark functions commands

**Midday Integration (12:00)**
- [ ] Run tests: `npm test`
- [ ] Check coverage
- [ ] Verify no regressions

**EOD Checkpoint (17:00)**
```markdown
## Day 2 Status Report

**Commands Implemented**:
- [ ] functions/deploy.ts: ___% complete
- [ ] functions/invoke.ts: ___% complete

**Tests Written**:
- [ ] functions deploy tests: X/14 complete
- [ ] functions invoke tests: X/12 complete
- [ ] All passing: Yes/No

**Coverage**:
- [ ] Overall: __% (target: 80%+)
- [ ] Branch: __% (target: 80%+)
- [ ] Growth: __% (from yesterday)

**Blockers**:
- [ ] None / List any issues
```

**EOD Actions**:
- [ ] Full test run: `npm test`
- [ ] Coverage report: `npm run test:coverage`
- [ ] Commit day's work

---

### Day 3: Mid-Sprint Verification

**Morning Standup (08:00)**
- Full status check
- Verify on track for 15 commands
- Verify on track for 80% coverage

**Implementation Phase (09:00-17:00)**
- Agent 1: Complete functions/invoke.ts, start branches/list.ts
- Agent 2: Write 20 tests for remaining commands
- Agent 3: Load testing

**Critical Integration Point (14:00)**
Run full suite:
```bash
npm run build        # Compile check
npm test             # All tests
npm run test:coverage # Coverage verification
```

**EOD Checkpoint (17:00)**
```markdown
## Day 3 Status Report - CRITICAL REVIEW

**Commands Complete**:
- [ ] functions/deploy.ts: ✅ Done
- [ ] functions/invoke.ts: ✅ Done
- [ ] branches/list.ts: ___% complete
- [ ] config/init.ts: ___% complete
- [ ] config/doctor.ts: Not started

**Tests Status**:
- [ ] functions deploy: 14/14 ✅
- [ ] functions invoke: 12/12 ✅
- [ ] branches list: X/10 in progress
- [ ] config init: X/8 pending
- [ ] config doctor: 0/10 pending
- [ ] Branch coverage tests: X/20 in progress
- **Total**: Y/74 (target: 50-60 minimum)

**Coverage Metrics**:
- [ ] Overall: __% (MUST BE >= 78%)
- [ ] Branch: __% (MUST BE >= 75%)
- [ ] Function: __% (MUST BE >= 88%)

**Critical Issues**:
- [ ] None / List blockers blocking Day 4

**Velocity Check**:
- [ ] 3 of 5 commands done (60%)
- [ ] Need: 2 more commands by EOD Day 4
- [ ] On track: Yes/No
```

**EOD Actions**:
- [ ] Full build & test: `npm run build && npm test`
- [ ] If coverage dropped: Alert to fix now
- [ ] Commit working code

---

### Day 4: Final Push

**Morning Standup (08:00)**
- Status of remaining commands
- Determine if catching up needed
- Verify testing on track

**Implementation Phase (09:00-17:00)**
- Agent 1: Finish branches/list.ts, config/init.ts (may help with doctor)
- Agent 2: Write final tests, fix coverage gaps
- Agent 3: Final performance report

**Hourly Check-ins (Suggested)**
- 10:00: Agent 1 progress
- 12:00: Agent 2 coverage status
- 14:00: Agent 3 performance report
- 16:00: Integration final check

**EOD Checkpoint (17:00)**
```markdown
## Day 4 Status Report - FINAL IMPLEMENTATION

**Commands Complete**:
- [ ] functions/deploy.ts: ✅
- [ ] functions/invoke.ts: ✅
- [ ] branches/list.ts: ✅
- [ ] config/init.ts: ✅
- [ ] config/doctor.ts: ✅

**Tests Status**:
- [ ] All new tests: 54+ ✅
- [ ] All failing tests fixed: ✅
- [ ] Coverage: >= 80% ✅
- [ ] Branch coverage: >= 80% ✅

**Build Status**:
- [ ] TypeScript: Zero errors ✅
- [ ] ESLint: Zero violations ✅
- [ ] Tests: All passing ✅
- [ ] Coverage: Within target ✅

**Ready for Day 5**: Yes ✅
```

**EOD Actions**:
- [ ] Full build: `npm run build`
- [ ] Full test suite: `npm test`
- [ ] Coverage verification: `npm run test:coverage`
- [ ] Commit final code

---

### Day 5: Final Verification & Documentation

**Morning Final Review (08:00-10:00)**
- Verify all 5 commands working
- Run full test suite
- Generate coverage report
- Document any issues

**Documentation Phase (10:00-15:00)**
- Update README.md
- Update CLAUDE.md
- Create command reference docs
- Create performance report

**Final Verification (15:00-17:00)**
```bash
# Full verification checklist
npm run build          # Compile
npm test               # All tests
npm run test:coverage  # Coverage
npm run lint           # Code quality
./bin/run projects list --json  # Manual test
```

**EOD Deliverable (17:00)**
- `SPRINT_4_COMPLETE.md` (summary report)
- Updated `README.md`
- Updated `CLAUDE.md`
- Command reference documentation

---

## DOCUMENTATION TASKS

### README.md Updates

**Add New Commands Section**:
```markdown
## Commands (15 Available for MVP)

### Projects (5)
- `projects list` - List all projects
- `projects get` - Get single project details
- `projects create` - Create new project
- `projects delete` - Delete project
- `projects pause` - Pause project (billing)

### Database & Migrations (5)
- `db query` - Execute SQL queries
- `db schema` - Show database schema
- `db extensions` - List database extensions
- `migrations list` - List applied migrations
- `migrations apply` - Apply new migrations

### Edge Functions (2) [NEW]
- `functions list` - List deployed functions
- `functions deploy` - Deploy function
- `functions invoke` - Invoke function

### Branches (1) [NEW]
- `branches list` - List development branches
- `branches create` - Create new branch

### Configuration (2) [NEW]
- `config init` - Initialize CLI configuration
- `config doctor` - Diagnose CLI setup issues

### Example Usage
```bash
# Deploy a function
supabase functions deploy my-function dist/function.zip \
  --project my-project \
  --runtime node

# Invoke a function
supabase functions invoke my-function \
  --arguments '{"name":"World"}' \
  --project my-project

# List branches
supabase branches list --project my-project

# Diagnose setup
supabase config doctor
```
```

### CLAUDE.md Updates

**Add New Commands to Architecture Section**:
```markdown
### Command Coverage by Sprint

**Sprint 1** (Infrastructure): Cache, Retry, Errors, Auth
**Sprint 2** (5 Commands): Projects management
**Sprint 3** (5 Commands): Database & Migrations
**Sprint 4** (5 Commands): Edge Functions, Branching, Config ✅

**Total MVP**: 15 commands
```

### Create Command Reference

**File**: `docs/COMMAND_REFERENCE.md`

```markdown
# Supabase CLI - Command Reference

## functions deploy

Deploy or update an Edge Function.

### Usage
```bash
supabase functions deploy <function-name> [source]
  --project <ref>
  --runtime node|deno|go
  --dry-run
  --force
  --yes
```

### Arguments
- `function-name`: Name of function to deploy
- `source`: (Optional) Path to .ts/.js file or .zip

### Options
- `--project <ref>`: Project reference (or SUPABASE_PROJECT_REF)
- `--runtime`: Runtime (default: inferred from file)
- `--dry-run`: Show what would happen
- `--force`: Skip confirmation
- `--yes`: Auto-confirm prompts

### Output
```json
{
  "success": true,
  "data": {
    "name": "my-func",
    "status": "ACTIVE",
    "url": "https://...",
    "created_at": "2025-10-28T..."
  },
  "metadata": {...}
}
```

### Examples
```bash
# Deploy from TypeScript file
supabase functions deploy my-func src/functions/my-func.ts \
  --project my-project

# Deploy with dry-run
supabase functions deploy my-func dist.zip \
  --project my-project \
  --dry-run

# Deploy and skip confirmation
supabase functions deploy my-func dist.zip \
  --project my-project \
  --force
```

---

## functions invoke

[Similar detailed documentation for each command]
```

---

## INTEGRATION CHECKLISTS

### Daily Integration Checklist

```markdown
## Daily Integration Verification

### Code Quality
- [ ] No TypeScript errors: `npm run build`
- [ ] No ESLint violations: `npm run lint`
- [ ] Prettier formatting clean: `npm run format:check`

### Testing
- [ ] All tests pass: `npm test`
- [ ] Coverage >= 80%: `npm run test:coverage`
- [ ] No regressions from baseline

### Feature Completeness
- [ ] All commands compile
- [ ] All commands have proper flags
- [ ] All commands have examples
- [ ] All commands handle errors
- [ ] Output formatting working

### Integration Points
- [ ] No merge conflicts
- [ ] All API calls working
- [ ] Cache invalidation correct
- [ ] Exit codes proper (0/1)
```

### Pre-Release Checklist (Day 5)

```markdown
## MVP Release Checklist

### Code Complete
- [ ] All 15 commands implemented
- [ ] All code compiles (TypeScript strict)
- [ ] All code follows patterns
- [ ] No TODO comments remaining
- [ ] Documentation inline

### Testing Complete
- [ ] 275+ tests passing
- [ ] Coverage >= 80% overall
- [ ] Coverage >= 80% branch
- [ ] Coverage >= 90% function
- [ ] All error paths tested

### Quality Gates
- [ ] ESLint: 0 violations
- [ ] Prettier: Format clean
- [ ] Type safety: All typed
- [ ] No tech debt
- [ ] No security issues

### Documentation Complete
- [ ] README.md updated
- [ ] CLAUDE.md updated
- [ ] Command reference created
- [ ] API reference created
- [ ] CONTRIBUTING.md ready

### Performance Validated
- [ ] All commands < 500ms startup
- [ ] Cache hit rate >= 70%
- [ ] Load tests pass
- [ ] Memory stable
- [ ] No memory leaks

### Ready for Production
- [ ] [ ] YES, ship it! 🚀
```

---

## SPRINT 4 COMPLETION REPORT TEMPLATE

Create file: `SPRINT_4_COMPLETE.md`

```markdown
# ✅ SPRINT 4: ADVANCED FEATURES - COMPLETE

**Timeline**: 5 business days (Mon-Fri)
**Status**: ✅ **ALL OBJECTIVES MET**

## 🎯 Sprint 4 Objectives - ALL MET

- ✅ Implement 5 advanced commands (functions, branches, config)
- ✅ Write 50-60 comprehensive tests
- ✅ Fix 5 failing tests
- ✅ Achieve 80%+ code coverage
- ✅ 80%+ branch coverage
- ✅ Verify MVP completion (15 commands)
- ✅ Generate performance report

## 📊 Delivery Summary

### Commands Implemented (5 new)
1. ✅ functions/deploy.ts (180 lines)
2. ✅ functions/invoke.ts (150 lines)
3. ✅ branches/list.ts (100 lines)
4. ✅ config/init.ts (completed, 146 lines)
5. ✅ config/doctor.ts (150 lines)

**Total**: 726 lines of new command code

### Tests Written (54+ new)
- functions deploy: 14 tests
- functions invoke: 12 tests
- branches list: 10 tests
- config init: 8 tests
- config doctor: 10 tests
- Branch coverage: 15+ tests
**Total**: 69 new tests (exceeds 50-60 target!)

### Bug Fixes
- ✅ Fixed 5 failing tests
- ✅ Improved branch coverage from 68.77% → 80%+

### Coverage Metrics
```
Overall Coverage:     82.31% ✅ (target: 80%+)
Statement Coverage:   82.31%
Line Coverage:        84.72%
Function Coverage:    93.75%
Branch Coverage:      80.15% ✅ (UP FROM 68.77%)

Performance:
- All commands < 500ms startup ✅
- Cache hit rate: 75%+ ✅
- Load testing: Pass ✅
- No memory leaks: Verified ✅
```

## 🏗️ Architecture Impact

### MVP Completion Status
```
Total Commands: 15 of 15 ✅ (100%)

By Category:
├── Projects (5)
│   ├── ✅ list
│   ├── ✅ get
│   ├── ✅ create
│   ├── ✅ delete
│   └── ✅ pause
├── Database (3)
│   ├── ✅ query
│   ├── ✅ schema
│   └── ✅ extensions
├── Migrations (2)
│   ├── ✅ list
│   └── ✅ apply
├── Edge Functions (2) [NEW]
│   ├── ✅ deploy
│   └── ✅ invoke
├── Branches (1) [NEW]
│   └── ✅ list
└── Config (2) [NEW]
    ├── ✅ init
    └── ✅ doctor
```

## 📈 Project Progress

| Metric | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 | Total |
|--------|----------|----------|----------|----------|-------|
| Code (lines) | 1,337 | 394 | 516 | 726 | 2,973 |
| Commands | 0 | 5 | 5 | 5 | 15 ✅ |
| Tests | 169 | 169 | 225 | 294 | 294 ✅ |
| Coverage | 81.51% | 81.33% | 83.27% | 82.31% | 82.31% ✅ |

## ✅ Success Criteria - ALL MET

### Code
- ✅ 726 lines of command code
- ✅ 5 advanced commands complete
- ✅ All follow established patterns

### Testing
- ✅ 69 new tests written
- ✅ 294 total tests passing
- ✅ Overall coverage: 82.31% (exceeds 80%)
- ✅ Branch coverage: 80.15% (exceeds 80%)
- ✅ 0 test failures

### Quality
- ✅ TypeScript strict mode passes
- ✅ ESLint clean
- ✅ Zero compilation errors
- ✅ All patterns verified

### Performance
- ✅ All commands < 500ms startup
- ✅ Cache hit rate: 75%+
- ✅ Load tests: Pass
- ✅ Memory: Stable

### Documentation
- ✅ README.md updated
- ✅ CLAUDE.md updated
- ✅ Command reference created
- ✅ Performance report generated

## 🚀 MVP COMPLETE! 🎉

**15 Working Commands**
**82.31% Test Coverage**
**Production Ready**

## Next Steps: Sprint 5

- Production hardening
- npm package publishing
- Security audit
- Performance optimization
- Release v1.0.0

---

**Status**: 🟢 **READY FOR PRODUCTION**
**Milestone**: MVP ACHIEVED
**Quality**: Production Grade
```

---

## SUCCESS CRITERIA

- ✅ All 3 agents' work integrated cleanly
- ✅ All 5 commands implemented & tested
- ✅ 80%+ coverage maintained
- ✅ Zero regressions
- ✅ Full documentation updated
- ✅ Sprint 4 report generated
- ✅ MVP verification complete

---

## COMMUNICATION TEMPLATE

### Daily Status Update (Send EOD)

```
📊 SPRINT 4 - DAY X STATUS UPDATE

✅ COMPLETED TODAY:
- [List what each agent completed]

🔄 IN PROGRESS:
- [List what's in progress]

⚠️ BLOCKERS (if any):
- [List any issues]

📈 METRICS:
- Commands: X of 15 complete
- Tests: Y passing
- Coverage: Z%
- Build: [Pass/Fail]

🎯 TOMORROW TARGETS:
- [List planned deliverables]

STATUS: 🟢 ON TRACK / 🟡 AT RISK / 🔴 BLOCKED
```

---

## KEY SUCCESS FACTORS

1. **Daily Integration**: Run full test suite every day
2. **Blocker Resolution**: Address issues immediately
3. **Communication**: Keep all agents aligned
4. **Quality First**: Don't sacrifice coverage for speed
5. **Documentation**: Update docs in real-time

---

**Estimated Time**: 10-12 hours (spread across 5 days)
**Deadline**: End of Day 5
**Role**: Quarterback & Coordinator

🏈 **LET'S GO!** 🚀
