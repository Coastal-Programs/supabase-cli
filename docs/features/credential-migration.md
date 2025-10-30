# Credential Migration Guide

## Overview

The Supabase CLI credential migration utility safely migrates legacy plaintext credentials to secure storage using OS keychain or encrypted files.

## Why Migrate?

Legacy credential storage methods stored access tokens in plaintext JSON files, which pose security risks:

- **Plaintext Storage**: Credentials visible in filesystem
- **No Encryption**: No protection if files accessed by unauthorized users
- **Version Control Risk**: Easy to accidentally commit credentials

The new secure storage system provides:

- **OS Keychain**: Uses native OS credential managers (macOS Keychain, Windows Credential Manager, Linux libsecret)
- **Encrypted Fallback**: AES-256-GCM encryption if keychain unavailable
- **Secure by Default**: OWASP and NIST compliant security

## Detected Legacy Locations

The migration utility checks these locations:

1. `~/.supabase/config.json` - Legacy Supabase CLI config
2. `~/.supabase-cli/credentials.json` - Current CLI credentials (plaintext)
3. `~/.supabase/credentials.json` - Alternative credentials location

## Migration Process

### Automatic Migration Flow

1. **Detection**: Scans for legacy credential files
2. **User Consent**: Prompts for migration approval
3. **Backup**: Creates timestamped backups (`.backup-YYYY-MM-DDTHH-MM-SS`)
4. **Migration**: Stores credentials in secure storage
5. **Cleanup**: Deletes plaintext files (optional)
6. **Rollback**: Automatically restores from backup on failure

### Safety Features

- **Non-destructive by default**: Creates backups before any changes
- **Atomic operations**: All-or-nothing migration
- **Rollback on failure**: Automatically restores from backup
- **Dry run mode**: Preview changes without executing
- **Backup-only mode**: Preserve legacy files while migrating

## Usage

### Command Line

```bash
# Check if migration is needed
supabase-cli auth migrate --dry-run

# Interactive migration (recommended)
supabase-cli auth migrate

# Automated migration (CI/CD)
supabase-cli auth migrate --yes

# Backup without deleting legacy files
supabase-cli auth migrate --backup-only
```

### Programmatic Usage

```typescript
import {
  detectLegacyCredentials,
  getMigrationSummary,
  isMigrationNeeded,
  migrateLegacyCredentials,
} from './utils/migrate-credentials'

// Check if migration is needed
if (isMigrationNeeded()) {
  // Get human-readable summary
  const summary = await getMigrationSummary()
  console.log(summary)

  // Perform migration
  const result = await migrateLegacyCredentials({
    skipConsent: false,
    dryRun: false,
    backupOnly: false,
  })

  if (result.success) {
    console.log(`Migrated ${result.migratedCount} credentials`)
  } else {
    console.error('Migration failed:', result.errors)
  }
}
```

## Migration Options

### `skipConsent`

Skip user consent prompts. Useful for automated environments.

```typescript
await migrateLegacyCredentials({ skipConsent: true })
```

### `dryRun`

Preview what would be migrated without making changes.

```typescript
const result = await migrateLegacyCredentials({ dryRun: true })
console.log(`Would migrate ${result.migratedCount} credentials`)
```

### `backupOnly`

Create backups without deleting legacy files.

```typescript
await migrateLegacyCredentials({ backupOnly: true })
```

### `forceFallback`

Force use of encrypted file storage (for testing).

```typescript
await migrateLegacyCredentials({ forceFallback: true })
```

## Migration Result

The migration function returns detailed results:

```typescript
interface MigrationResult {
  success: boolean           // Overall success status
  migratedCount: number      // Number of credentials migrated
  errors: string[]           // Any errors encountered
  backupPath?: string        // Path to backup file
  processedFiles: string[]   // Files processed
  rolledBack?: boolean       // Whether rollback was performed
}
```

## Supported Credential Formats

### Profile-based Format

```json
{
  "profiles": {
    "default": {
      "credentials": {
        "accessToken": "sbp_..."
      }
    },
    "prod": {
      "credentials": {
        "accessToken": "sbp_..."
      }
    }
  }
}
```

### Direct Token Format

```json
{
  "accessToken": "sbp_..."
}
```

### Alternative Field Name

```json
{
  "token": "sbp_..."
}
```

## Error Handling

The migration utility handles various error scenarios:

### Invalid JSON

```
Failed to parse legacy credentials: Invalid JSON format
```

**Resolution**: File will be skipped, others will continue

### Permission Errors

```
Failed to create backup: Permission denied
```

**Resolution**: Check file permissions, run with appropriate privileges

### Storage Errors

```
Encrypted file storage requires user consent
```

**Resolution**:
- Run with `--yes` flag for automated consent
- Set `SUPABASE_CLI_ACCEPT_ENCRYPTED_FALLBACK=true` environment variable

### Network Issues

No network is required for migration - all operations are local.

## Security Considerations

### Token Validation

Only valid Supabase tokens are migrated:
- Format: `sbp_[32+ alphanumeric characters]`
- Invalid tokens are skipped with warning

### File Permissions

All files created during migration have restrictive permissions:
- Backups: `0600` (owner read/write only)
- Encrypted files: `0600` (owner read/write only)

### Backup Retention

Backups are kept indefinitely for safety:
- Manual cleanup required
- Timestamped for easy identification
- Same security level as originals

### Rollback Safety

Rollback is automatic on any migration failure:
- Restores from timestamped backups
- Preserves original file permissions
- Logs all rollback operations

## Integration Points

### Auth Commands

Migration can be triggered from:
- `supabase-cli auth migrate` - Dedicated migration command
- `supabase-cli init` - First-time setup (future)
- Automatic detection on first command execution (future)

### Environment Variables

The migration utility respects these environment variables:

```bash
# Skip encrypted fallback consent prompt
export SUPABASE_CLI_ACCEPT_ENCRYPTED_FALLBACK=true

# Use environment variable for token (bypasses migration)
export SUPABASE_ACCESS_TOKEN="sbp_..."
```

## Troubleshooting

### "No legacy credentials detected"

This is normal if:
- Already migrated
- Using environment variables
- Fresh installation

**Action**: No migration needed

### "Migration failed" with rollback

Check the error messages for specific issues:
- Permission errors: Run with appropriate privileges
- Disk space: Ensure sufficient space for backups
- Corrupted files: Manually backup and delete corrupted file

### "Would migrate 0 credentials" in dry run

Possible causes:
- Files exist but contain no valid tokens
- Token format is invalid
- Files are empty or corrupted

**Action**: Check file contents manually

### Multiple profiles not migrating

Each profile is migrated separately:
- Check error messages for specific profile issues
- Some profiles may succeed while others fail
- `migratedCount` shows successful migrations

## Best Practices

1. **Run Dry Run First**: Always preview with `--dry-run`
2. **Use Backup Mode**: Consider `--backup-only` for extra safety
3. **Verify Migration**: Check credentials work after migration
4. **Keep Backups**: Don't delete backups immediately
5. **Use Environment Variables**: For CI/CD, use `SUPABASE_ACCESS_TOKEN`

## CI/CD Integration

For automated environments:

```bash
# Skip interactive prompts
supabase-cli auth migrate --yes

# Or use environment variable
export SUPABASE_ACCESS_TOKEN="sbp_..."
# Migration not needed when using environment variable
```

## Migration Timeline

Recommended timeline for teams:

1. **Week 1**: Announce migration utility availability
2. **Week 2**: Encourage developers to run dry-run
3. **Week 3**: Perform migration with backup-only mode
4. **Week 4**: Complete migration and delete legacy files
5. **Ongoing**: Keep backups for 30+ days

## Future Enhancements

Planned improvements:

- Automatic migration on first command execution
- Migration status dashboard
- Batch migration for teams
- Cloud-based secure storage option
- Migration analytics

## Support

For issues or questions:

- GitHub Issues: [supabase-cli/issues](https://github.com/coastal-programs/supabase-cli/issues)
- Documentation: [CLAUDE.md](../CLAUDE.md)
- Security: See [SECURITY_COMMANDS_SUMMARY.md](../SECURITY_COMMANDS_SUMMARY.md)
