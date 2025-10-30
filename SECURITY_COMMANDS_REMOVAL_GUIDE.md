# Security Commands Removal Implementation Guide

## Overview

This guide provides step-by-step instructions for removing the non-functional security commands that rely on non-existent Management API endpoints.

---

## Commands to Remove

These commands will always return 404 because the API endpoints don't exist:

1. `security:audit` - POST `/projects/{ref}/security/audit` (doesn't exist)
2. `security:restrictions:list` - GET `/projects/{ref}/network/restrictions` (doesn't exist)
3. `security:restrictions:add` - POST `/projects/{ref}/network/restrictions` (doesn't exist)
4. `security:restrictions:remove` - DELETE `/projects/{ref}/network/restrictions/{id}` (doesn't exist)
5. `security:policies:list` - GET `/projects/{ref}/security/policies` (doesn't exist)

---

## Step 1: Remove Command Files

Delete these files:

```bash
# Commands
src/commands/security/audit.ts
src/commands/security/restrictions/list.ts
src/commands/security/restrictions/add.ts
src/commands/security/restrictions/remove.ts
src/commands/security/policies/list.ts

# The directories may be empty after deletion, can be removed if so
```

**PowerShell commands:**
```powershell
Remove-Item "C:\Users\jakes\Developer\GitHub\superbase-cli\src\commands\security\audit.ts"
Remove-Item "C:\Users\jakes\Developer\GitHub\superbase-cli\src\commands\security\restrictions\list.ts"
Remove-Item "C:\Users\jakes\Developer\GitHub\superbase-cli\src\commands\security\restrictions\add.ts"
Remove-Item "C:\Users\jakes\Developer\GitHub\superbase-cli\src\commands\security\restrictions\remove.ts"
Remove-Item "C:\Users\jakes\Developer\GitHub\superbase-cli\src\commands\security\policies\list.ts"
```

---

## Step 2: Remove API Functions from src/supabase.ts

### Remove Type Definitions

Find and remove these type definitions (around lines 160-200):

```typescript
export interface NetworkRestriction {
  id: string
  cidr: string
  description?: string
  created_at: string
}

export interface SecurityPolicy {
  id: string
  name: string
  policy_type: string
  enabled: boolean
  description?: string
  created_at: string
  updated_at: string
}

export interface SecurityAudit {
  run_at: string
  total_checks: number
  passed_checks: number
  findings: SecurityFinding[]
}

export interface SecurityFinding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  title: string
  description: string
  recommendation?: string
  affected_resource?: string
}
```

### Remove API Functions

Remove these functions (lines 2280-2383):

```typescript
/**
 * List network restrictions
 */
export async function listNetworkRestrictions(ref: string): Promise<NetworkRestriction[]> {
  // ... remove entire function
}

/**
 * Add network restriction
 */
export async function addNetworkRestriction(
  ref: string,
  cidr: string,
  description?: string,
): Promise<NetworkRestriction> {
  // ... remove entire function
}

/**
 * Remove network restriction
 */
export async function removeNetworkRestriction(ref: string, restrictionId: string): Promise<void> {
  // ... remove entire function
}

/**
 * List security policies
 */
export async function listSecurityPolicies(ref: string): Promise<SecurityPolicy[]> {
  // ... remove entire function
}

/**
 * Run security audit
 */
export async function runSecurityAudit(ref: string): Promise<SecurityAudit> {
  // ... remove entire function
}
```

---

## Step 3: Remove Test Files

Delete these test files if they exist:

```bash
test/commands/security-audit.test.ts
test/commands/security-restrictions-list.test.ts
test/commands/security-restrictions-add.test.ts
test/commands/security-restrictions-remove.test.ts
test/commands/security-policies-list.test.ts
```

**PowerShell commands:**
```powershell
# Check if files exist first
Get-ChildItem "C:\Users\jakes\Developer\GitHub\superbase-cli\test" -Filter "*security*" -Recurse

# Remove if found
Remove-Item "C:\Users\jakes\Developer\GitHub\superbase-cli\test\commands\security-audit.test.ts" -ErrorAction SilentlyContinue
Remove-Item "C:\Users\jakes\Developer\GitHub\superbase-cli\test\commands\security-restrictions-*.test.ts" -ErrorAction SilentlyContinue
Remove-Item "C:\Users\jakes\Developer\GitHub\superbase-cli\test\commands\security-policies-*.test.ts" -ErrorAction SilentlyContinue
```

---

## Step 4: Update Documentation

### Update README.md

Remove security command listings from the README. Find and remove:

```markdown
### Security Commands

- `security:audit` - Run security audit
- `security:restrictions:list` - List IP restrictions
- `security:restrictions:add` - Add IP restriction
- `security:restrictions:remove` - Remove IP restriction
- `security:policies:list` - List security policies
```

### Add Limitations Section

Add a new section to README.md:

```markdown
## Known Limitations

### Security Management Not Available

The following security features are NOT available via the Supabase Management API and therefore not supported in this CLI:

- **Network Restrictions / IP Whitelisting**: Not exposed via API
- **Security Policies**: Not exposed via API (except SSL enforcement)
- **Security Audits**: Not exposed via API

These features can only be managed through the [Supabase Dashboard](https://supabase.com/dashboard).

#### Available Security Features

The CLI does support:
- **SSL Enforcement**: Check and configure SSL requirements
  ```bash
  # Get SSL enforcement status (not yet implemented)
  supabase-cli ssl-enforcement --project my-project
  ```

For database-level security (Row Level Security policies), use the Supabase Dashboard or direct SQL queries.
```

---

## Step 5: Update CLAUDE.md

Remove security commands from the Phase 2B section:

Find this section:
```markdown
**Network & Security (5)**:
- `security:restrictions:list` - List IP restrictions
- `security:restrictions:add` - Add IP whitelist restriction
- `security:restrictions:remove` - Remove IP restriction
- `security:policies:list` - List security policies
- `security:audit` - Run security audit with color-coded severity
```

Replace with:
```markdown
**Network & Security**: Not available via Management API

Note: Security features (network restrictions, policies, audits) are not exposed by the Supabase Management API and must be managed through the Dashboard.
```

---

## Step 6: Update BACKUP_COMMANDS_REFERENCE.md

If this file mentions security commands, remove those references.

---

## Step 7: Clean Up Cache Keys

In `src/cache.ts`, the CACHE_TTL already has SECURITY defined. This can stay (it might be used for SSL enforcement in the future), but remove network-specific ones if present.

Check for and remove:
```typescript
NETWORK: 300_000, // Remove if only used by restrictions
```

---

## Step 8: Verify Build

After all deletions, verify the project still compiles:

```bash
npm run build
```

Fix any import errors or references to removed functions.

---

## Step 9: Update Tests

Run tests to ensure nothing broke:

```bash
npm test
```

Remove any test files that reference the deleted commands.

---

## Step 10: Git Commit

Create a commit explaining the removal:

```bash
git add .
git commit -m "refactor: remove non-functional security commands

Remove security commands that relied on non-existent Management API endpoints:
- security:audit
- security:restrictions:list
- security:restrictions:add
- security:restrictions:remove
- security:policies:list

These features are not exposed by the Supabase Management API and must be
managed through the Supabase Dashboard.

See SECURITY_COMMANDS_RESEARCH.md for detailed analysis.

Closes #[issue-number]"
```

---

## Alternative: Keep Commands with Clear Error Messages

If you prefer to keep the command structure but make them fail gracefully with helpful messages:

### Modify Commands to Show Helpful Error

Example for `security:restrictions:list`:

```typescript
import { BaseCommand } from '../../../base-command'
import { ProjectFlags } from '../../../base-flags'

export default class SecurityRestrictionsList extends BaseCommand {
  static description = 'List all IP restrictions for a project (Not Available)'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(SecurityRestrictionsList)

    this.error(
      'Network restrictions are not available via the Supabase Management API.\n\n' +
      'This feature can only be managed through the Supabase Dashboard:\n' +
      `https://supabase.com/dashboard/project/${flags.project || '[your-project-ref]'}/settings/network\n\n` +
      'The Management API does not expose network restriction endpoints.\n' +
      'See SECURITY_COMMANDS_RESEARCH.md for more details.',
      { exit: 1 }
    )
  }
}
```

This approach:
- ✅ Keeps command structure (users can discover the limitation)
- ✅ Provides helpful error message with dashboard link
- ✅ Clearly documents API limitation
- ❌ Still creates "broken" commands in the CLI

---

## Recommended Approach

**Remove the commands entirely** (Steps 1-10 above) because:

1. **Cleaner CLI**: No "dead" commands
2. **Less confusion**: Users won't try to use unavailable features
3. **Better maintenance**: Less code to maintain
4. **Honest interface**: CLI only exposes working features

If Supabase adds these API endpoints in the future, we can add the commands back.

---

## Files Summary

### Delete These Files:
- `src/commands/security/audit.ts`
- `src/commands/security/restrictions/list.ts`
- `src/commands/security/restrictions/add.ts`
- `src/commands/security/restrictions/remove.ts`
- `src/commands/security/policies/list.ts`
- Any related test files

### Modify These Files:
- `src/supabase.ts` - Remove type definitions and API functions
- `README.md` - Remove security commands, add limitations section
- `CLAUDE.md` - Update Phase 2B section
- `BACKUP_COMMANDS_REFERENCE.md` - Remove security command references (if any)

### Reference These Files:
- `SECURITY_COMMANDS_RESEARCH.md` - Detailed analysis of why commands don't work
- `docs/supabase_management_api_reference.md` - Official API documentation

---

## Testing After Removal

```bash
# Rebuild
npm run build

# Run tests
npm test

# Verify commands are gone
npm run build
./bin/run --help | grep security
# Should return no results

# Verify no broken imports
npm run lint
```

---

## Future: If API Endpoints Are Added

If Supabase adds these endpoints in the future:

1. Check official API documentation for endpoint specifications
2. Restore command files from git history
3. Update API functions in `src/supabase.ts`
4. Add comprehensive tests
5. Update documentation

Monitor these resources:
- Supabase Management API docs: https://supabase.com/docs/reference/api
- API changelog: https://github.com/supabase/supabase
- Community discussions: https://github.com/orgs/supabase/discussions

---

**Last Updated:** October 30, 2025
**Status:** Ready for implementation
