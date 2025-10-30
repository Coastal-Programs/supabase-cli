# Command Shortcuts Reference

All Supabase CLI commands support aliases for faster typing. This document lists all available shortcuts.

## Quick Start

Instead of typing the full command:
```bash
supabase-cli projects:list --format table
```

You can use shortcuts:
```bash
supabase-cli proj:list --format table
# or even shorter
supabase-cli projects:ls
```

## Global Shortcuts

These shortcuts work from any context:

| Full Command | Shortcuts | Description |
|--------------|-----------|-------------|
| `recent` | `r`, `history` | Show recently used projects |
| `config:init` | `init`, `configure` | Initialize CLI configuration |
| `config:doctor` | `doctor`, `health` | Check CLI health |
| `auth:setup` | `setup`, `auth:init` | Setup authentication |
| `auth:migrate` | `migrate`, `auth:mig` | Migrate legacy credentials |

## Projects Commands

| Full Command | Shortcuts | Description |
|--------------|-----------|-------------|
| `projects:list` | `projects:ls`, `proj:list` | List all projects |
| `projects:get` | `projects:show`, `proj:get` | Get project details |
| `projects:create` | `projects:new`, `proj:create` | Create a new project |
| `projects:delete` | `projects:rm`, `proj:delete` | Delete a project |
| `projects:pause` | `projects:stop`, `proj:pause` | Pause a project |
| `projects:restore` | `projects:resume`, `proj:restore` | Restore a paused project |
| `projects:link` | `proj:link` | Link to local project |

## Database Commands

| Full Command | Shortcuts | Description |
|--------------|-----------|-------------|
| `db:query` | `db:sql`, `query` | Execute SQL query |
| `db:schema` | `db:tables`, `schema` | Show database schema |
| `db:extensions` | `db:ext`, `extensions` | List extensions |
| `db:info` | `db:database-info`, `info` | Database info |
| `db:connections` | `db:active-connections`, `connections` | Active connections |
| `db:policies` | `db:list-policies`, `policies` | List RLS policies |
| `db:schemas` | `db:list-schemas`, `schemas` | List all schemas |
| `db:table-sizes` | `db:sizes`, `table-sizes` | Table sizes |
| `db:user-info` | `db:users`, `user-info` | Database users |
| `db:config:set` | `db:cfg:set`, `dbset` | Set database config |

## Functions Commands

| Full Command | Shortcuts | Description |
|--------------|-----------|-------------|
| `functions:list` | `functions:ls`, `fn:list` | List Edge Functions |
| `functions:deploy` | `functions:push`, `fn:deploy` | Deploy a function |
| `functions:invoke` | `fn:invoke` | Invoke a function |

## Backup Commands

| Full Command | Shortcuts | Description |
|--------------|-----------|-------------|
| `backup:list` | `backup:ls` | List backups |
| `backup:pitr:restore` | `pitr:restore`, `restore:pitr` | Point-in-time restore |

## Migrations Commands

| Full Command | Shortcuts | Description |
|--------------|-----------|-------------|
| `migrations:list` | `migrations:ls`, `mig:list` | List migrations |
| `migrations:apply` | `migrations:run`, `mig:apply` | Apply migrations |

## Branches Commands

| Full Command | Shortcuts | Description |
|--------------|-----------|-------------|
| `branches:list` | `branches:ls`, `branch:list` | List branches |
| `branches:create` | `branch:create` | Create a branch |

## Storage Commands

| Full Command | Shortcuts | Description |
|--------------|-----------|-------------|
| `storage:buckets:list` | `storage:buckets:ls` | List storage buckets |
| `storage:buckets:get` | `storage:bucket:get` | Get bucket details |
| `storage:buckets:create` | `storage:bucket:create` | Create a bucket |
| `storage:buckets:delete` | `storage:bucket:delete`, `storage:bucket:rm` | Delete a bucket |
| `storage:policies:list` | `storage:policies:ls` | List storage policies |
| `storage:policies:set` | `storage:policy:set` | Set storage policy |

## Daemon Commands

For 10x faster command execution:

| Full Command | Shortcuts | Description |
|--------------|-----------|-------------|
| `daemon:start` | `d:start` | Start daemon |
| `daemon:stop` | `d:stop` | Stop daemon |
| `daemon:status` | `d:status`, `ds` | Daemon status |
| `daemon:restart` | `d:restart` | Restart daemon |
| `daemon:server` | `daemon:srv`, `dsrv` | Run daemon server |

## Usage Examples

### Projects

```bash
# List all projects (multiple ways)
supabase-cli projects:list
supabase-cli projects:ls
supabase-cli proj:list

# Get project details
supabase-cli projects:get my-ref
supabase-cli proj:get my-ref

# Create a project
supabase-cli projects:create "My App" --org org_123 --region us-east-1
supabase-cli proj:create "My App" --org org_123 -r us-east-1
```

### Database

```bash
# Execute a query (multiple ways)
supabase-cli db:query "SELECT * FROM users"
supabase-cli query "SELECT * FROM users"
supabase-cli db:sql "SELECT * FROM users"

# List tables
supabase-cli db:schema
supabase-cli schema

# Check database info
supabase-cli db:info --project my-ref
supabase-cli info -p my-ref
```

### Functions

```bash
# List functions
supabase-cli functions:list --project my-ref
supabase-cli fn:list -p my-ref

# Deploy a function
supabase-cli functions:deploy my-func --file index.ts
supabase-cli fn:deploy my-func -f index.ts

# Invoke a function
supabase-cli functions:invoke my-func --body '{"test":true}'
supabase-cli fn:invoke my-func -b '{"test":true}'
```

### Quick Operations

```bash
# Check CLI health
supabase-cli doctor
supabase-cli health

# Initialize configuration
supabase-cli init
supabase-cli configure

# Show recent projects
supabase-cli recent
supabase-cli r
supabase-cli history

# Setup authentication
supabase-cli setup
supabase-cli auth:setup
```

### Daemon Mode (10x Faster)

```bash
# Start daemon
supabase-cli daemon:start
supabase-cli d:start

# Check daemon status
supabase-cli daemon:status
supabase-cli d:status
supabase-cli ds

# Enable daemon mode globally
export SUPABASE_CLI_DAEMON=true

# Now all commands are 10x faster!
supabase-cli projects:list  # <100ms instead of ~1.5s
```

## Alias Discovery

All aliases are shown in the command help:

```bash
# See all aliases for a command
supabase-cli projects:list --help

# Aliases section will show:
# ALIASES
#   $ supabase-cli projects:ls
#   $ supabase-cli proj:list
```

## Tips for Efficiency

1. **Use the shortest alias**: `r` instead of `recent`, `ds` instead of `daemon:status`
2. **Combine with flags**: `supabase-cli pl -f table` (projects list as table)
3. **Tab completion**: Most terminals support tab completion for commands
4. **Daemon mode**: Enable daemon for 10x faster execution
5. **Recent projects**: Use `--recent 1` flag to reference last used project

## Creating Your Own Shell Aliases

You can create even shorter aliases in your shell:

### Bash/Zsh

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Short CLI alias
alias sb='supabase-cli'

# Common operations
alias sbl='supabase-cli projects:list'
alias sbq='supabase-cli db:query'
alias sbd='supabase-cli daemon:start'

# With common flags
alias sblt='supabase-cli projects:list --format table'
alias sbr='supabase-cli recent'
```

Usage:
```bash
sb pl              # projects list
sbl               # projects list
sblt              # projects list as table
sbq "SELECT 1"    # run query
sbr               # show recent
```

### PowerShell

Add to your PowerShell profile:

```powershell
# Short CLI alias
function sb { supabase-cli @args }

# Common operations
function sbl { supabase-cli projects:list @args }
function sbq { supabase-cli db:query @args }
function sbd { supabase-cli daemon:start }
```

## See Also

- [Main README](../README.md) - Full CLI documentation
- [Getting Started Guide](guides/getting-started.md) - Setup and first steps
- [Database Operations](guides/database-operations.md) - Database command examples
- [Automation Guide](guides/automation.md) - CI/CD and scripting
