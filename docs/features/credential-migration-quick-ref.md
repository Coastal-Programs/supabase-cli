# Credential Migration - Quick Reference

## One-Line Commands

```bash
# Check if migration needed
supabase-cli auth migrate --dry-run

# Interactive migration
supabase-cli auth migrate

# Automated migration (skip prompts)
supabase-cli auth migrate --yes

# Backup only (preserve legacy files)
supabase-cli auth migrate --backup-only
```

## Migration Decision Tree

```
Is migration needed?
├─ YES: Legacy credentials detected
│  ├─ Are you ready to migrate?
│  │  ├─ YES → Run: supabase-cli auth migrate
│  │  └─ NO → Run: supabase-cli auth migrate --dry-run (preview)
│  └─ Want to be extra safe?
│     └─ YES → Run: supabase-cli auth migrate --backup-only
└─ NO: No legacy credentials found
   └─ No action needed
```

## What Gets Migrated

| Source | Destination | Security |
|--------|-------------|----------|
| `~/.supabase/config.json` | OS Keychain | AES-256-GCM |
| `~/.supabase-cli/credentials.json` | OS Keychain | AES-256-GCM |
| `~/.supabase/credentials.json` | OS Keychain | AES-256-GCM |

## Storage Hierarchy

1. **OS Keychain** (preferred): macOS Keychain, Windows Credential Manager, Linux libsecret
2. **Encrypted File** (fallback): `~/.supabase/credentials.enc` (AES-256-GCM)
3. **Environment Variable** (CI/CD): `SUPABASE_ACCESS_TOKEN`

## Common Scenarios

### Scenario 1: First-time Migration

```bash
# Step 1: Preview what will be migrated
supabase-cli auth migrate --dry-run

# Step 2: Review the output
# Step 3: Run migration
supabase-cli auth migrate

# Step 4: Verify credentials work
supabase-cli projects list
```

### Scenario 2: CI/CD Environment

```bash
# Option A: Use environment variable (no migration needed)
export SUPABASE_ACCESS_TOKEN="sbp_..."

# Option B: Automated migration
supabase-cli auth migrate --yes
```

### Scenario 3: Extra Safe Migration

```bash
# Step 1: Backup without deleting
supabase-cli auth migrate --backup-only

# Step 2: Test with new storage
supabase-cli projects list

# Step 3: Manually delete legacy files (optional)
rm ~/.supabase-cli/credentials.json
```

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "No legacy credentials detected" | Already migrated or using env vars |
| "Permission denied" | Run with appropriate privileges |
| "Requires user consent" | Use `--yes` flag or set env var |
| Migration failed | Check errors, rollback is automatic |
| "Invalid token format" | Token doesn't match `sbp_...` format |

## API Quick Reference

```typescript
// Check if migration needed
import { isMigrationNeeded } from './utils/migrate-credentials'
if (isMigrationNeeded()) { /* ... */ }

// Get summary
import { getMigrationSummary } from './utils/migrate-credentials'
const summary = await getMigrationSummary()

// Perform migration
import { migrateLegacyCredentials } from './utils/migrate-credentials'
const result = await migrateLegacyCredentials({ dryRun: true })
```

## File Locations

| File | Purpose | Permissions |
|------|---------|-------------|
| `~/.supabase/config.json` | Legacy config | 0600 |
| `~/.supabase-cli/credentials.json` | Legacy credentials | 0600 |
| `~/.supabase/credentials.enc` | Encrypted storage | 0600 |
| `~/.supabase/.fallback-consent` | Consent marker | 0600 |
| `*.backup-YYYY-MM-DD...` | Backup files | 0600 |

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `SUPABASE_ACCESS_TOKEN` | Direct token (bypasses migration) | `sbp_...` |
| `SUPABASE_CLI_ACCEPT_ENCRYPTED_FALLBACK` | Skip consent prompt | `true` |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success or no migration needed |
| 1 | Migration failed (rollback performed) |

## Safety Checklist

- [ ] Run `--dry-run` first to preview
- [ ] Check available disk space for backups
- [ ] Note backup file location
- [ ] Verify credentials work after migration
- [ ] Keep backups for at least 7 days
- [ ] Consider `--backup-only` mode first

## Integration Examples

### Check Before Command Execution

```typescript
async function runCommand() {
  if (isMigrationNeeded()) {
    console.log('Legacy credentials detected. Run: supabase-cli auth migrate')
    return
  }
  // Continue with command
}
```

### Automatic Migration (with consent)

```typescript
async function autoMigrate() {
  if (isMigrationNeeded()) {
    const summary = await getMigrationSummary()
    console.log(summary)

    // Prompt user
    const consent = await promptUser('Migrate credentials?')

    if (consent) {
      const result = await migrateLegacyCredentials()
      return result.success
    }
  }
  return true
}
```

## Links

- Full Guide: [CREDENTIAL_MIGRATION_GUIDE.md](./CREDENTIAL_MIGRATION_GUIDE.md)
- Developer Docs: [CLAUDE.md](../CLAUDE.md)
- Security Storage: [secure-storage.ts](../src/utils/secure-storage.ts)
- Migration Source: [migrate-credentials.ts](../src/utils/migrate-credentials.ts)
