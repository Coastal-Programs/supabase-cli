# Commands

This document provides detailed information about all available commands.

## Global Flags

These flags are available for all commands:

- `--format, -f` - Output format (json, table, list, yaml)
- `--pretty` - Pretty print output (default: true)
- `--color` - Enable color output (default: true)
- `--quiet, -q` - Suppress non-essential output
- `--verbose, -v` - Enable verbose output
- `--debug` - Enable debug output
- `--no-interactive` - Disable interactive prompts
- `--yes, -y` - Skip confirmation prompts
- `--force` - Force operation without confirmation

## Projects

### `projects:list`

List all Supabase projects.

**Aliases**: `projects:ls`, `proj:list`

**Usage**:
```bash
supabase-cli projects:list
supabase-cli projects:list --format table
supabase-cli projects:list --limit 50
```

**Flags**:
- `--limit, -l` - Maximum number of items to return (default: 100)
- `--offset, -o` - Number of items to skip (default: 0)
- `--page, -p` - Page number
- `--page-size` - Number of items per page (default: 25)

**Output**:
```json
[
  {
    "id": "proj_123456",
    "name": "My Project",
    "region": "us-east-1",
    "status": "active",
    "created_at": "2025-10-26T00:00:00Z"
  }
]
```

## Config

### `config:init`

Initialize CLI configuration.

**Usage**:
```bash
supabase-cli config:init
supabase-cli config:init --profile production
```

**Flags**:
- `--profile, -p` - Configuration profile name (default: default)

**Interactive**:
- Prompts for access token if not set
- Validates token
- Stores credentials

### `config:doctor`

Check CLI configuration and environment.

**Usage**:
```bash
supabase-cli config:doctor
```

**Checks**:
- Platform and architecture
- Node.js version
- Access token availability
- Cache status
- Retry logic status
- API connectivity

**Output**:
```json
[
  {
    "name": "Platform",
    "status": "pass",
    "value": "macOS (arm64)"
  },
  {
    "name": "Node.js Version",
    "status": "pass",
    "value": "v22.0.0"
  }
]
```

## Common Patterns

### Pagination

```bash
# Get first page
supabase-cli projects:list --page 1 --page-size 25

# Get specific range
supabase-cli projects:list --limit 50 --offset 100
```

### Filtering

```bash
# Search
supabase-cli projects:list --search "my-project"

# Filter
supabase-cli projects:list --filter "status=active"

# Sort
supabase-cli projects:list --sort-by name --sort-order desc
```

### Output Formats

```bash
# JSON (default)
supabase-cli projects:list

# Table
supabase-cli projects:list --format table

# List
supabase-cli projects:list --format list

# YAML
supabase-cli projects:list --format yaml
```

### Automation

```bash
# Non-interactive
supabase-cli projects:delete proj_123 --yes --no-interactive

# Quiet mode
supabase-cli projects:list --quiet

# Debug mode
supabase-cli projects:list --debug
```

## Exit Codes

- `0` - Success
- `1` - General error
- `401` - Authentication error
- `404` - Resource not found
- `422` - Validation error
- `429` - Rate limit exceeded
- `500` - Internal error

## Environment Variables

Commands respect these environment variables:

- `SUPABASE_ACCESS_TOKEN` - Access token
- `SUPABASE_PROJECT_ID` - Default project
- `CACHE_ENABLED` - Enable caching
- `RETRY_ENABLED` - Enable retry logic
- `DEBUG` - Enable debug mode

## Examples

### Basic Usage

```bash
# List projects
supabase-cli projects:list

# List projects in table format
supabase-cli projects:list --format table

# Initialize configuration
supabase-cli config:init
```

### Advanced Usage

```bash
# List projects with caching disabled
supabase-cli projects:list --no-cache

# List projects with custom retry settings
RETRY_MAX_ATTEMPTS=5 supabase-cli projects:list

# Export to file
supabase-cli projects:list > projects.json
```

### CI/CD Usage

```bash
# Non-interactive with error handling
supabase-cli projects:list --no-interactive --quiet || exit 1

# With specific token
SUPABASE_ACCESS_TOKEN=token supabase-cli projects:list
```
