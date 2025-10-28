# 🧪 AGENT BRIEF: TEST-WRITER-FIXER
## Phase 2B - Testing & Quality Assurance

**Target**: 60+ tests, 80%+ coverage maintained, all passing
**Timeline**: 3-4 hours (parallel with Agent 1)
**Success Criteria**: 100% passing tests, coverage maintained, comprehensive scenarios covered

---

## YOUR MISSION

Write comprehensive tests for all 17 Phase 2B commands while maintaining 80%+ coverage.

**Backup & Recovery (16 tests)**: list/get/create/delete/restore, schedule operations, PITR
**Advanced DB (8 tests)**: replicas CRUD, config operations
**Network & Security (10 tests)**: restrictions, policies, audit
**Error Handling (12 tests)**: network errors, validation, edge cases
**Integration (8 tests)**: end-to-end workflows
**Branch Coverage (4 tests)**: uncovered code paths

**Total: 60+ tests, all passing, 80%+ coverage**

---

## TEST STRUCTURE PATTERNS

### 1. Basic Command Test Pattern

```typescript
import { expect } from 'chai'
import BackupListCommand from '../src/commands/backup/list'
import { Envelope } from '../src/envelope'

describe('backup list', () => {
  let command: BackupListCommand

  beforeEach(() => {
    command = new BackupListCommand([])
  })

  it('should list all backups', async () => {
    const result = await command.run()
    expect(result).to.be.instanceof(Envelope)
    expect(result.success).to.be.true
    expect(result.data).to.be.an('array')
  })

  it('should format output correctly', async () => {
    // Test with different format flags
    command.argv = ['--format', 'json']
    const result = await command.run()
    expect(result.data).to.be.a('string')
  })

  it('should use cache', async () => {
    // First call - should hit API
    const result1 = await command.run()

    // Second call - should use cache
    const result2 = await command.run()

    expect(result1.metadata.cached).to.be.false
    expect(result2.metadata.cached).to.be.true
  })
})
```

### 2. Error Handling Test Pattern

```typescript
describe('backup delete - error handling', () => {
  it('should handle backup not found', async () => {
    const command = new BackupDeleteCommand(['missing-id'])

    try {
      await command.run()
      expect.fail('Should have thrown error')
    } catch (error) {
      expect(error.code).to.equal('BACKUP_NOT_FOUND')
      expect(error.statusCode).to.equal(404)
    }
  })

  it('should require confirmation for destructive operation', async () => {
    const command = new BackupDeleteCommand(['backup-id'])
    command.confirm = async () => false

    const result = await command.run()
    expect(result.success).to.be.false
  })

  it('should bypass confirmation with --yes flag', async () => {
    const command = new BackupDeleteCommand(['backup-id', '--yes'])
    const result = await command.run()
    expect(result.success).to.be.true
  })
})
```

### 3. Integration Test Pattern

```typescript
describe('backup workflow', () => {
  it('should create and restore backup', async () => {
    // Create backup
    const createCmd = new BackupCreateCommand(['--description', 'test'])
    const created = await createCmd.run()
    const backupId = created.data.id

    // Verify backup exists
    const listCmd = new BackupListCommand([])
    const list = await listCmd.run()
    expect(list.data).to.include((b: any) => b.id === backupId)

    // Restore backup
    const restoreCmd = new BackupRestoreCommand([backupId, '--yes'])
    const restored = await restoreCmd.run()
    expect(restored.success).to.be.true
  })
})
```

---

## TEST FILES TO CREATE

### Backup & Recovery Tests (16 tests)

#### test/commands/backup/list.test.ts (25 lines)
- List all backups (happy path)
- Filter by date range
- Output formatting (json/table)
- Cache behavior
- Empty results handling

#### test/commands/backup/get.test.ts (25 lines)
- Get specific backup
- Backup not found error
- Output formatting
- Metadata included

#### test/commands/backup/create.test.ts (35 lines)
- Create with optional description
- Invalidates list cache
- Returns backup ID
- Confirmation handling
- --yes flag bypass

#### test/commands/backup/delete.test.ts (35 lines)
- Delete backup with confirmation
- Backup not found error
- Backup in use error
- Cache invalidation
- --yes flag bypass

#### test/commands/backup/restore.test.ts (40 lines)
- Restore from backup (destructive)
- Strong confirmation required
- Progress/status display
- Error handling
- Cache invalidation on restore

#### test/commands/backup/schedule/list.test.ts (20 lines)
- List scheduled backups
- Show frequency and retention
- Cache behavior (10 min)
- Output formatting

#### test/commands/backup/schedule/create.test.ts (30 lines)
- Create backup schedule
- Validate frequency options
- Validate retention days
- Confirmation handling
- Cache invalidation

#### test/commands/backup/pitr/restore.test.ts (35 lines)
- Point-in-time restore (destructive)
- Parse ISO8601 timestamp
- Strong confirmation required
- Status display
- Cache invalidation

---

### Advanced Database Tests (8 tests)

#### test/commands/db/replicas/list.test.ts (20 lines)
- List read replicas
- Show status and location
- Cache behavior (5 min)
- Output formatting

#### test/commands/db/replicas/create.test.ts (30 lines)
- Create read replica
- Validate region parameter
- Confirmation handling
- Cache invalidation
- Return replica ID

#### test/commands/db/replicas/delete.test.ts (25 lines)
- Delete replica with confirmation
- Replica not found error
- Cache invalidation
- --yes flag bypass

#### test/commands/db/config/set.test.ts (25 lines)
- Set database configuration
- Validate setting keys
- Show applied config
- Cache invalidation
- --yes flag bypass

---

### Network & Security Tests (10 tests)

#### test/commands/network/restrictions/list.test.ts (20 lines)
- List IP restrictions
- Show CIDR and metadata
- Cache behavior (5 min)
- Output formatting

#### test/commands/network/restrictions/add.test.ts (30 lines)
- Add IP to whitelist
- Validate CIDR notation
- Optional description
- Cache invalidation
- Return added restriction

#### test/commands/network/restrictions/remove.test.ts (25 lines)
- Remove IP restriction
- Restriction not found error
- Confirmation handling
- Cache invalidation
- --yes flag bypass

#### test/commands/security/policies/list.test.ts (20 lines)
- List security policies
- Show policy status
- Cache behavior (10 min)
- Output formatting

#### test/commands/security/audit.test.ts (30 lines)
- Run security audit
- Check RLS policies
- Check network restrictions
- Check encryption
- Color-coded severity levels

---

### Error Handling Tests (12 tests)

#### test/error-handling/network-errors-phase2b.test.ts (40 lines)
- Network timeout during backup
- Connection refused on restore
- Retry logic verification
- Circuit breaker activation
- Error codes and messages

#### test/error-handling/validation-errors-phase2b.test.ts (35 lines)
- Invalid CIDR notation
- Invalid timestamp format
- Invalid region for replica
- Invalid frequency value
- Clear error messages

#### test/error-handling/destructive-operations.test.ts (40 lines)
- Missing --yes flag for destructive operation
- Confirmation prompt behavior
- Cancellation handling
- Warning messages

#### test/error-handling/edge-cases-phase2b.test.ts (30 lines)
- Empty backup list handling
- Deleted resource handling
- Concurrent operations
- Resource quota exceeded

---

### Integration Tests (8 tests)

#### test/integration/backup-workflow.test.ts (50 lines)
- Create backup → List backups → Restore
- Schedule creation → List schedules
- End-to-end with cache invalidation

#### test/integration/replica-workflow.test.ts (40 lines)
- Create replica → List replicas → Delete replica
- Config changes propagation
- Cache behavior

#### test/integration/security-workflow.test.ts (40 lines)
- Add restrictions → List restrictions → Remove restrictions
- Run audit after changes
- Verify policies are checked

#### test/integration/cache-invalidation.test.ts (50 lines)
- Write operation invalidates list cache
- Multiple command sequence
- Cache revalidation after write

#### test/integration/error-recovery.test.ts (40 lines)
- Retry after transient failure
- Recovery from rate limiting
- Graceful degradation

---

### Branch Coverage Tests (4 tests)

#### test/coverage/backup-branch-coverage.test.ts (50 lines)
- All conditional branches in backup commands
- Error path coverage
- Edge case execution

#### test/coverage/replica-branch-coverage.test.ts (35 lines)
- Region validation branches
- Confirmation logic branches

#### test/coverage/security-branch-coverage.test.ts (40 lines)
- CIDR validation branches
- Severity level classification
- Policy check branches

---

## TEST QUALITY STANDARDS

✅ **Coverage Requirements**
- Statement coverage: 80%+
- Branch coverage: 70%+
- Function coverage: 90%+
- Line coverage: 80%+

✅ **Test Quality**
- All tests passing (0 failures)
- Clear test names describing behavior
- Proper setup/teardown
- No duplicate tests
- No flaky tests

✅ **Error Scenarios**
- Network errors properly caught
- Validation errors with clear messages
- Destructive operations require confirmation
- Cache invalidation verified

✅ **Integration**
- Commands work together
- Cache behavior correct
- Error handling consistent
- Exit codes correct (0=success, 1=error)

---

## TESTING WORKFLOW

### Phase 1: Command Tests (1 hour)
- Create happy path tests for all 17 commands
- Verify basic functionality
- Test flag handling

### Phase 2: Error Tests (1 hour)
- Test error conditions
- Test confirmation prompts
- Test destructive operation safety
- Test validation

### Phase 3: Integration Tests (45 minutes)
- Test command workflows
- Test cache invalidation
- Test error recovery
- End-to-end scenarios

### Phase 4: Coverage Gap Testing (45 minutes)
- Run coverage report
- Identify uncovered branches
- Write targeted tests for gaps
- Verify 80%+ coverage

---

## RUNNING TESTS

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test test/commands/backup/list.test.ts

# Run in watch mode
npm run test:watch

# Check coverage thresholds
npm run test:coverage -- --threshold 80
```

---

## INTEGRATION WITH AGENT 1

- Agent 1 will create the 17 command files
- As commands are created, create corresponding tests
- If you need clarification on expected behavior, reference AGENT_BRIEF_PHASE2B_BACKEND.md
- Ensure tests pass as commands are completed
- Track coverage to maintain 80%+ throughout

---

## SUCCESS CRITERIA

Before marking complete:
- [ ] 60+ tests written
- [ ] All tests passing (0 failures)
- [ ] 80%+ statement coverage
- [ ] 70%+ branch coverage
- [ ] 90%+ function coverage
- [ ] All error scenarios tested
- [ ] Integration tests passing
- [ ] Cache behavior verified
- [ ] Confirmation handling tested
- [ ] Exit codes correct

---

## QUALITY GATES

1. **No Test Failures**: 0 failures allowed
2. **Coverage Maintained**: 80%+ statement coverage required
3. **Error Handling**: All error paths tested
4. **Integration**: Commands work together properly
5. **Consistency**: All tests follow same patterns

---

*Created by: Chen (Claude Code)*
*For: Phase 2B Testing*
*Target: 60+ Tests, 80%+ Coverage, All Passing*

