# Recent Projects Feature Guide

## Overview

The Recent Projects feature automatically tracks the last 10 projects you've accessed, allowing you to quickly reference them by index number instead of typing out full project references.

## How It Works

### Automatic Tracking

Every time you successfully execute a command that uses a project reference, that project is automatically added to your recent history:

```bash
# This will be tracked automatically
supabase-cli projects:get --project abc123xyz

# Also tracked when using context
cd my-project
supabase-cli db:info
```

### Storage Location

Recent projects are stored in: `~/.supabase-cli/recent.json`

This file is automatically created and maintained by the CLI.

## Usage

### View Recent Projects

```bash
# Default list format
supabase-cli recent

# Table format
supabase-cli recent --format table

# JSON format
supabase-cli recent --format json
```

**Example Output:**
```
Recent Projects:
  1. Production API (abc123xyz) - 5 minutes ago
     Last command: projects:get
  2. Staging DB (def456uvw) - 1 hour ago
     Last command: db:info
  3. Testing (ghi789rst) - yesterday
     Last command: projects:list
```

### Using Recent Projects

Instead of typing the full project reference, use the `--recent` flag (or `-r` for short):

```bash
# Use the most recent project (#1)
supabase-cli projects:get --recent 1
supabase-cli projects:get -r 1

# Use the 2nd most recent project
supabase-cli db:info --recent 2
supabase-cli db:info -r 2

# Use the 3rd most recent project
supabase-cli backup:list --recent 3
```

### Clear History

```bash
# Clear all recent projects (with confirmation)
supabase-cli recent --clear

# Skip confirmation
supabase-cli recent --clear --yes
```

## Priority Order

When determining which project to use, the CLI follows this priority:

1. `--project` or `--project-ref` flags (explicit)
2. `--recent` flag (recent history)
3. `.supabase/config.json` (project context)
4. `SUPABASE_PROJECT_REF` environment variable

**Note:** The `--recent` flag is mutually exclusive with `--project` and `--project-ref`.

## Examples

### Example 1: Quick Access to Recent Project

```bash
# First, access a project normally
supabase-cli projects:get --project abc123xyz

# Later, use it via recent index
supabase-cli db:info -r 1
# Output: Using recent project: Production API (abc123xyz)
```

### Example 2: Working with Multiple Projects

```bash
# Access three different projects
supabase-cli projects:get --project prod-project-ref
supabase-cli projects:get --project staging-project-ref
supabase-cli projects:get --project dev-project-ref

# View recent list
supabase-cli recent

# Quickly access staging (now #2)
supabase-cli backup:list -r 2
```

### Example 3: Quiet Mode (No Info Messages)

```bash
# Suppress informational output
supabase-cli projects:get -r 1 --quiet
```

### Example 4: CI/CD Usage

```bash
# Recent projects work great in scripts
#!/bin/bash

# List all projects to populate recent history
supabase-cli projects:list

# Use most recent for subsequent operations
supabase-cli db:info -r 1 --format json > project-info.json
```

## Output Formats

### List Format (Default)

Human-readable list with timestamps:

```
Recent Projects:
  1. Production API (abc123xyz) - 5 minutes ago
     Last command: projects:get
  2. Staging DB (def456uvw) - 1 hour ago
```

### Table Format

Structured table view:

```bash
supabase-cli recent --format table
```

### JSON Format

For programmatic use:

```bash
supabase-cli recent --format json
```

```json
[
  {
    "ref": "abc123xyz",
    "name": "Production API",
    "timestamp": 1698765432000,
    "lastCommand": "projects:get"
  }
]
```

### YAML Format

```bash
supabase-cli recent --format yaml
```

```yaml
- ref: abc123xyz
  name: Production API
  timestamp: 1698765432000
  lastCommand: projects:get
```

## Limits

- Maximum **10 recent projects** are stored
- When an 11th project is added, the oldest is automatically removed
- Accessing a project that's already in the list moves it to the top

## Error Handling

### Invalid Index

```bash
supabase-cli projects:get -r 99
# Error: No recent project found at index 99
```

### Conflicting Flags

```bash
supabase-cli projects:get -r 1 --project abc123
# Error: --recent and --project are mutually exclusive
```

## Commands Supporting Recent Flag

All commands that accept `--project` or `--project-ref` flags also support `--recent`:

### Project Commands
- `projects:get -r N`
- `projects:update -r N`
- `projects:pause -r N`
- `projects:restore -r N`

### Database Commands
- `db:info -r N`
- `db:query -r N`
- `db:connection-string -r N`
- `db:connection-pooler:get -r N`

### Backup Commands
- `backup:list -r N`
- `backup:pitr:restore -r N`

### Branch Commands
- `branches:list -r N`
- `branches:get -r N`
- `branches:create -r N`

### Function Commands
- `functions:list -r N`
- `functions:get -r N`

### Storage Commands
- `storage:buckets:list -r N`
- `storage:buckets:get -r N`

### Security Commands
- `security:restrictions:list -r N`
- `security:audit -r N`

## Advanced Usage

### Scripting

```bash
#!/bin/bash

# Function to get project info for recent project
get_project_info() {
  local index=$1
  supabase-cli projects:get -r "$index" --format json --quiet
}

# Get info for top 3 recent projects
for i in 1 2 3; do
  echo "Project #$i:"
  get_project_info "$i"
done
```

### Combining with jq

```bash
# Get the ref of the most recent project
RECENT_REF=$(supabase-cli recent --format json --quiet | jq -r '.[0].ref')

# Use it in another command
echo "Most recent project: $RECENT_REF"
```

## Best Practices

1. **Use recent for interactive work**: When working interactively, `--recent` saves typing
2. **Use explicit refs in scripts**: For CI/CD and scripts, prefer explicit `--project` flags for clarity
3. **Check recent list first**: Run `supabase-cli recent` to see what's available before using `-r`
4. **Clear periodically**: Run `supabase-cli recent --clear` to clean up old projects

## Troubleshooting

### Recent projects not tracked

**Problem**: Projects aren't being added to recent history

**Solution**: Ensure commands complete successfully. Only successful commands track projects.

### Permission errors

**Problem**: Can't write to `~/.supabase-cli/recent.json`

**Solution**: Check directory permissions:
```bash
ls -la ~/.supabase-cli/
chmod 755 ~/.supabase-cli/
```

### Corrupted recent file

**Problem**: Recent command shows errors or unexpected behavior

**Solution**: Delete and recreate:
```bash
rm ~/.supabase-cli/recent.json
supabase-cli projects:get --project your-ref
```

## Technical Details

### Data Structure

```typescript
interface RecentProject {
  ref: string           // Project reference
  name: string          // Project name
  timestamp: number     // Unix timestamp (ms)
  lastCommand?: string  // Last command used (optional)
}
```

### File Format

The `recent.json` file is a JSON array of `RecentProject` objects:

```json
[
  {
    "ref": "abc123xyz",
    "name": "Production",
    "timestamp": 1698765432000,
    "lastCommand": "projects:get"
  }
]
```

### Atomic Writes

Recent projects are written atomically to prevent corruption:
1. Write to temporary file
2. Rename to `recent.json` (atomic operation)

This ensures the file is never left in a corrupted state.

## See Also

- [Configuration Guide](./CONFIGURATION.md)
- [Project Context](./PROJECT_CONTEXT.md)
- [Command Reference](./COMMANDS.md)
