# 🏗️ AGENT BRIEF: BACKEND-ARCHITECT
## Phase 2B - Implementation of 17 Operations-Critical Commands

**Target**: Implement 17 commands (~800 lines) across backup, database, and security
**Timeline**: 4-6 hours (intensive focus)
**Success Criteria**: All 17 commands working, all tests passing, 0 compilation errors

---

## YOUR MISSION

Implement 17 operations-critical commands following established patterns.

**Backup & Recovery (8)**: backup list/get/create/delete/restore, backup schedule list/create, pitr restore
**Advanced DB (4)**: db replicas list/create/delete, db config set
**Network & Security (5)**: network restrictions list/add/remove, security policies list, security audit

---

## KEY PATTERNS TO FOLLOW

### 1. Command Structure
```typescript
import { Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command'
import { OutputFormatFlags, AutomationFlags } from '../../base-flags'

export default class MyCommand extends BaseCommand {
  static description = 'Clear description'
  static examples = ['<%= config.bin %> <%= command.id %>']
  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    myFlag: Flags.string({ description: '...' }),
  }
  static args = [{ name: 'id', required: true }]

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MyCommand)
    try {
      this.header('Title')
      const result = await this.supabase.method()
      this.output(result, flags)
      this.success('Done!')
      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
```

### 2. Cache Management
- Read operations: Cache with 5-10 min TTL
- Write operations: Invalidate related caches
- Destructive operations: Require confirmation or --yes flag

### 3. Error Handling
- Use SupabaseError for all errors
- Proper error codes and messages
- Handle timeouts, network errors, validation errors

### 4. Confirmation Prompts
- Destructive operations (delete, restore): Require confirmation
- Support --yes flag to bypass confirmation
- Use this.confirm() for interactive prompts

---

## BACKUP & RECOVERY (8 commands)

### backup/list.ts (95 lines)
`supabase backup list [--since DATE] [--until DATE] [--format json|table]`

- List all backups with timestamps
- Filter by date range (optional)
- Show backup size, status, retention
- Cache for 5 minutes

### backup/get.ts (80 lines)
`supabase backup get <backupId> [--format json|table]`

- Get specific backup details
- Show metadata, size, created date, expires
- Handle backup not found error

### backup/create.ts (120 lines)
`supabase backup create [--description text] [--yes]`

- Create on-demand backup
- Optional description
- Show backup ID and status
- Invalidate backup list cache

### backup/delete.ts (90 lines)
`supabase backup delete <backupId> [--yes]`

- Delete backup (destructive)
- Require confirmation (unless --yes)
- Handle backup in use error
- Invalidate cache

### backup/restore.ts (140 lines)
`supabase backup restore <backupId> [--yes]`

- Restore from backup (DESTRUCTIVE)
- STRONG confirmation required
- Show restore progress/status
- Handle restore errors gracefully
- Invalidate all data caches

### backup/schedule/list.ts (85 lines)
`supabase backup schedule list [--format json|table]`

- List automated backup schedules
- Show frequency, retention, status
- Cache for 10 minutes

### backup/schedule/create.ts (130 lines)
`supabase backup schedule create --frequency [daily|weekly|monthly] --retention [days] [--yes]`

- Create automated backup schedule
- Validate frequency and retention
- Show schedule ID and status
- Invalidate schedule cache

### backup/pitr/restore.ts (110 lines)
`supabase backup pitr restore --timestamp ISO8601 [--yes]`

- Point-in-time restore (DESTRUCTIVE)
- Parse timestamp
- STRONG confirmation required
- Show restore status
- Invalidate all caches

---

## ADVANCED DATABASE (4 commands)

### db/replicas/list.ts (90 lines)
`supabase db replicas list [--format json|table]`

- List read replicas for database
- Show status, location, size
- Cache for 5 minutes

### db/replicas/create.ts (115 lines)
`supabase db replicas create --location [region] [--yes]`

- Create read replica
- Validate region
- Show replica ID and status
- Invalidate replica cache

### db/replicas/delete.ts (85 lines)
`supabase db replicas delete <replicaId> [--yes]`

- Delete replica (careful operation)
- Confirm before deletion
- Show status
- Invalidate cache

### db/config/set.ts (105 lines)
`supabase db config set --setting KEY=VALUE [--yes]`

- Set database configuration
- Validate setting keys
- Show applied config
- Cache invalidation

---

## NETWORK & SECURITY (5 commands)

### network/restrictions/list.ts (90 lines)
`supabase network restrictions list [--format json|table]`

- List IP restrictions
- Show CIDR, description, created
- Cache for 5 minutes

### network/restrictions/add.ts (105 lines)
`supabase network restrictions add --cidr CIDR [--description text] [--yes]`

- Add IP to whitelist
- Validate CIDR notation
- Show added restriction
- Invalidate cache

### network/restrictions/remove.ts (95 lines)
`supabase network restrictions remove <restrictionId> [--yes]`

- Remove IP restriction
- Confirm before deletion
- Show status
- Invalidate cache

### security/policies/list.ts (90 lines)
`supabase security policies list [--format json|table]`

- List security policies
- Show policy name, status, created
- Cache for 10 minutes

### security/audit.ts (120 lines)
`supabase security audit [--format json|table]`

- Run security audit
- Check RLS policies, network restrictions, encryption
- Show findings and recommendations
- Color-coded severity levels

---

## QUALITY STANDARDS

✅ TypeScript strict mode (no `any` types)
✅ Proper error handling with SupabaseError
✅ Cache invalidation on write operations
✅ All flags documented with examples
✅ Help text for every command
✅ Input validation with clear error messages
✅ Confirmation prompts for destructive operations
✅ Proper exit codes (0 success, 1 error)

---

## FILE ORGANIZATION

```
src/commands/
├── backup/
│   ├── list.ts
│   ├── get.ts
│   ├── create.ts
│   ├── delete.ts
│   ├── restore.ts
│   └── schedule/
│       ├── list.ts
│       └── create.ts
├── db/
│   ├── replicas/
│   │   ├── list.ts
│   │   ├── create.ts
│   │   └── delete.ts
│   └── config/
│       └── set.ts
└── security/
    ├── restrictions/
    │   ├── list.ts
    │   ├── add.ts
    │   └── remove.ts
    ├── policies/
    │   └── list.ts
    └── audit.ts
```

---

## VERIFICATION

Before finishing:
- [ ] All 17 command files created
- [ ] All follow BaseCommand pattern
- [ ] All have proper error handling
- [ ] All use cache correctly
- [ ] All have comprehensive help text
- [ ] All tests pass (Agent 2)
- [ ] TypeScript compiles (0 errors)
- [ ] ESLint clean (0 violations)

---

*Created by: Chen (Claude Code)*
*For: Phase 2B Backend Implementation*
*Target: 17 Commands, Production Grade*
