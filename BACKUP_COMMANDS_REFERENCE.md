# Backup Commands Reference

## Quick Status

| Command | Status | Notes |
|---------|--------|-------|
| `backup:list` | Working | Lists all backups for a project |
| `backup:get` | Working | Get details for a specific backup |
| `backup:create` | Missing | API exists, command wrapper needed |
| `backup:delete` | Working | Delete a backup (destructive) |
| `backup:restore` | Working | Restore from backup (destructive) |
| `backup:schedule:list` | Missing | API exists, command wrapper needed |
| `backup:schedule:create` | Working | Create a backup schedule |
| `backup:pitr:restore` | Working | Point-in-time restore (destructive) |

## Working Commands

### backup:list

List all backups for a project with optional date filtering.

**Usage:**
```bash
supabase-cli backup:list --project <project-ref>
supabase-cli backup:list --project my-project --since 2024-01-01
supabase-cli backup:list -p my-project --format table
```

**Flags:**
- `--project` / `-p`: Project ID or reference (required)
- `--project-ref`: Alternative way to specify project reference
- `--since`: Filter backups after date (ISO 8601)
- `--until`: Filter backups before date (ISO 8601)
- `--format` / `-f`: Output format: json|table|list|yaml (default: json)
- `--quiet` / `-q`: Suppress non-essential output
- `--verbose` / `-v`: Enable verbose output
- `--color` / `--no-color`: Enable/disable colors
- `--pretty` / `--no-pretty`: Pretty print output
- `--debug`: Enable debug output
- `--yes` / `-y`: Skip confirmation prompts

**Aliases:**
- `backup:ls`

**Example Output:**
```json
[
  {
    "id": "bak_1234567890",
    "status": "completed",
    "size_bytes": 1024000,
    "created_at": "2024-01-15T10:30:00Z",
    "completed_at": "2024-01-15T10:35:00Z"
  },
  {
    "id": "bak_0987654321",
    "status": "completed",
    "size_bytes": 1024000,
    "created_at": "2024-01-14T10:30:00Z",
    "completed_at": "2024-01-14T10:35:00Z"
  }
]
```

---

### backup:get

Get detailed information about a specific backup.

**Usage:**
```bash
supabase-cli backup:get <backup-id> --project <project-ref>
supabase-cli backup:get bak_1234567890 --project my-project
supabase-cli backup:get bak_1234567890 -p my-project --format table
```

**Arguments:**
- `<backup-id>`: The backup ID (required)

**Flags:**
- `--project` / `-p`: Project ID or reference (required)
- `--project-ref`: Alternative way to specify project reference
- `--format` / `-f`: Output format: json|table|list|yaml (default: json)
- `--quiet` / `-q`: Suppress non-essential output
- `--verbose` / `-v`: Enable verbose output
- Standard flags: --color, --debug, --pretty, --yes

**Example Output:**
```json
{
  "id": "bak_1234567890",
  "project_id": "proj_xyz",
  "status": "completed",
  "size_bytes": 1024000,
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:35:00Z",
  "expires_at": "2024-04-15T10:35:00Z"
}
```

---

### backup:delete

Delete a backup from a project (destructive operation).

**Usage:**
```bash
supabase-cli backup:delete <backup-id> --project <project-ref>
supabase-cli backup:delete bak_1234567890 --project my-project
supabase-cli backup:delete bak_1234567890 -p my-project --yes
```

**Arguments:**
- `<backup-id>`: The backup ID to delete (required)

**Flags:**
- `--project` / `-p`: Project ID or reference (required)
- `--yes` / `-y`: Skip confirmation prompt
- Standard flags: --format, --quiet, --debug, --color, etc.

**Note:** Requires confirmation unless `--yes` flag is provided

---

### backup:restore

Restore a project from a backup (destructive operation).

**Usage:**
```bash
supabase-cli backup:restore <backup-id> --project <project-ref>
supabase-cli backup:restore bak_1234567890 --project my-project
supabase-cli backup:restore bak_1234567890 -p my-project --yes
```

**Arguments:**
- `<backup-id>`: The backup ID to restore from (required)

**Flags:**
- `--project` / `-p`: Project ID or reference (required)
- `--yes` / `-y`: Skip confirmation prompt
- Standard flags: --format, --quiet, --debug, --color, etc.

**Warning:** This will overwrite current database with backup data

**Note:** Requires confirmation unless `--yes` flag is provided

---

### backup:schedule:create

Create a backup schedule for automated backups.

**Usage:**
```bash
supabase-cli backup:schedule:create --project <project-ref> \
  --frequency daily|weekly|monthly \
  --retention <days>

supabase-cli backup:schedule:create -p my-project \
  -f daily -r 7 -n "Daily backups"

supabase-cli backup:schedule:create --project my-project \
  --frequency weekly --retention 30
```

**Flags:**
- `--project` / `-p`: Project ID or reference (required)
- `--frequency` / `-f`: Backup frequency (required)
  - Options: `daily`, `weekly`, `monthly`
- `--retention` / `-r`: Retention period in days (required)
  - Example: `7` (for 7 days), `30` (for 30 days)
- `--name` / `-n`: Name for the backup schedule (optional)
- Standard flags: --format, --quiet, --debug, --color, etc.

**Example Output:**
```json
{
  "id": "sch_1234567890",
  "project_id": "proj_xyz",
  "name": "Daily backups",
  "frequency": "daily",
  "retention_days": 7,
  "enabled": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### backup:pitr:restore

Restore database to a specific point in time (PITR - destructive operation).

**Usage:**
```bash
supabase-cli backup:pitr:restore --project <project-ref> \
  --timestamp <ISO-8601-timestamp>

supabase-cli backup:pitr:restore -p my-project \
  --timestamp 2024-01-15T10:30:00Z

supabase-cli backup:pitr:restore --project my-project \
  --timestamp 2024-01-15T10:30:00Z --yes
```

**Flags:**
- `--project` / `-p`: Project ID or reference (required)
- `--timestamp`: Target point in time (ISO 8601 format, required)
- `--yes` / `-y`: Skip confirmation prompt
- Standard flags: --format, --quiet, --debug, --color, etc.

**Warning:** This will restore database to specified point in time, losing all data after that point

**Note:** Requires confirmation unless `--yes` flag is provided

---

## Missing Commands (To Be Implemented)

### backup:create

Create an on-demand backup for a project.

**Status:** NOT YET IMPLEMENTED
**API Method Exists:** `createBackup()` in src/supabase.ts:2015

**Expected Usage (once implemented):**
```bash
supabase-cli backup:create --project <project-ref>
supabase-cli backup:create -p my-project --description "Pre-migration backup"
```

**Expected Flags:**
- `--project` / `-p`: Project ID or reference (required)
- `--description` / `-d`: Optional description for the backup
- Standard flags: --format, --quiet, --debug, --color, etc.

---

### backup:schedule:list

List all backup schedules for a project.

**Status:** NOT YET IMPLEMENTED
**API Method Exists:** `listBackupSchedules()` in src/supabase.ts:2088

**Expected Usage (once implemented):**
```bash
supabase-cli backup:schedule:list --project <project-ref>
supabase-cli backup:schedule:list -p my-project
supabase-cli backup:schedule:list -p my-project --format table
```

**Expected Flags:**
- `--project` / `-p`: Project ID or reference (required)
- `--format` / `-f`: Output format: json|table|list|yaml
- Standard flags: --quiet, --debug, --color, etc.

**Expected Output:**
```json
[
  {
    "id": "sch_1234567890",
    "name": "Daily backups",
    "frequency": "daily",
    "retention_days": 7,
    "enabled": true
  },
  {
    "id": "sch_0987654321",
    "name": "Weekly backups",
    "frequency": "weekly",
    "retention_days": 30,
    "enabled": true
  }
]
```

---

## Common Examples

### List backups from the last 7 days
```bash
supabase-cli backup:list -p my-project \
  --since "$(date -d '7 days ago' -I)" \
  --format table
```

### Get backup details
```bash
supabase-cli backup:get bak_abc123 -p my-project --format json
```

### Create a daily backup schedule (7-day retention)
```bash
supabase-cli backup:schedule:create \
  -p my-project \
  -f daily \
  -r 7 \
  -n "Daily backups"
```

### Restore from a backup
```bash
supabase-cli backup:restore bak_abc123 -p my-project --yes
```

### Restore to a point in time
```bash
supabase-cli backup:pitr:restore \
  -p my-project \
  --timestamp 2024-01-15T09:30:00Z \
  --yes
```

### Delete an old backup
```bash
supabase-cli backup:delete bak_old123 -p my-project --yes
```

---

## Authentication

All backup commands require authentication via SUPABASE_ACCESS_TOKEN.

### Setting the token

**Option 1: Environment variable**
```bash
# Linux/macOS
export SUPABASE_ACCESS_TOKEN="sbp_your_token_here"

# Windows PowerShell
$env:SUPABASE_ACCESS_TOKEN = "sbp_your_token_here"

# Windows CMD
set SUPABASE_ACCESS_TOKEN=sbp_your_token_here
```

**Option 2: Interactive setup**
```bash
supabase-cli init
```

### Getting a token

1. Visit: https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Copy the token (format: sbp_[32+ characters])
4. Store it securely

### Token requirements

- Format: `sbp_[32 or more alphanumeric characters]`
- Valid on Supabase API
- Has appropriate scopes for backup operations

---

## Error Codes

Common errors you might encounter:

| Error | Meaning | Solution |
|-------|---------|----------|
| No authentication token found | SUPABASE_ACCESS_TOKEN not set | Set token in env or run init |
| Invalid token format | Token doesn't match sbp_ pattern | Get new token from dashboard |
| Project not found | Project reference is invalid | Check project ID in dashboard |
| Backup not found | Backup ID doesn't exist | Use backup:list to find valid IDs |
| Unauthorized (401) | Token is invalid or expired | Generate new token |
| Rate limit exceeded | Too many requests | Wait and retry |

---

## Tips & Best Practices

1. **Always backup before major changes**
   ```bash
   supabase-cli backup:create -p my-project -d "Before migration"
   ```

2. **Set up automated backups**
   ```bash
   supabase-cli backup:schedule:create -p my-project -f daily -r 30
   ```

3. **Test restore procedures regularly**
   ```bash
   supabase-cli backup:get bak_xyz -p my-project
   ```

4. **Keep retention period adequate**
   - Daily: 7+ days
   - Weekly: 30+ days
   - Monthly: 90+ days

5. **Monitor backup storage**
   Check backup size and storage usage in dashboard

6. **Use descriptions for clarity**
   ```bash
   supabase-cli backup:create -p my-project -d "Pre-production-sync $(date)"
   ```

7. **Confirm destructive operations**
   - Don't use `--yes` in scripts unless necessary
   - Always review changes before confirming

---

Generated: 2025-10-30
Project: superbase-cli v0.1.0
