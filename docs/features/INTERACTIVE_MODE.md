# Interactive Mode

The Supabase CLI includes a powerful interactive REPL (Read-Eval-Print Loop) mode that provides a shell-like interface for running commands without typing the command prefix each time.

## Table of Contents

- [Getting Started](#getting-started)
- [Basic Usage](#basic-usage)
- [Special Commands](#special-commands)
- [Context Management](#context-management)
- [Command History](#command-history)
- [Autocomplete](#autocomplete)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Advanced Features](#advanced-features)
- [Tips and Tricks](#tips-and-tricks)
- [Comparison to Normal CLI](#comparison-to-normal-cli)

## Getting Started

Start interactive mode with:

```bash
supabase-cli interactive
```

You'll see a welcome banner:

```
╔══════════════════════════════════════╗
║   Supabase CLI Interactive Mode      ║
╚══════════════════════════════════════╝

Type commands without 'supabase-cli' prefix
Special commands: help, clear, exit, history, .commands

>
```

## Basic Usage

In interactive mode, you can run any CLI command without the `supabase-cli` prefix:

```bash
# Normal CLI
supabase-cli projects:list

# Interactive mode
> projects:list
```

### Example Session

```bash
> projects:list
┌─────────────────────┬──────────────────────┬────────┬────────┐
│ Name                │ ID                   │ Region │ Status │
├─────────────────────┼──────────────────────┼────────┼────────┤
│ my-project          │ ygzhmowennlaehudyyey │ us-west│ ACTIVE │
└─────────────────────┴──────────────────────┴────────┴────────┘

> projects:get --project ygzhmowennlaehudyyey
{
  "id": "ygzhmowennlaehudyyey",
  "name": "my-project",
  "region": "us-west-1",
  "status": "ACTIVE_HEALTHY"
}

> db:info --project ygzhmowennlaehudyyey
Database: PostgreSQL 15.1
Size: 142 MB
Tables: 8

> exit
Goodbye!
```

## Special Commands

Interactive mode includes several built-in commands:

### Help Commands

| Command | Description |
|---------|-------------|
| `help`, `?` | Show help message with all special commands |
| `.commands` | List all available CLI commands |

### Display Commands

| Command | Description |
|---------|-------------|
| `clear`, `cls` | Clear the screen |
| `history` | Show command history |
| `.context`, `context` | Show current context (project, etc.) |
| `.stats`, `stats` | Show session statistics |

### Exit Commands

| Command | Description |
|---------|-------------|
| `exit`, `quit`, `q` | Exit interactive mode |
| `Ctrl+D` | Exit interactive mode |

### Context Commands

| Command | Description |
|---------|-------------|
| `use <project-ref>` | Set project context |
| `unuse`, `clear-context` | Clear project context |

## Context Management

One of the most powerful features of interactive mode is context management. You can set a project context to avoid typing `--project` on every command.

### Setting Project Context

```bash
> use ygzhmowennlaehudyyey
Switched to project: ygzhmowennlaehudyyey

[my-project] >
```

Notice the prompt changes to show the current project.

### Using Context

Once set, commands automatically use the project context:

```bash
[my-project] > db:info
# Automatically uses --project ygzhmowennlaehudyyey

Database: PostgreSQL 15.1
Size: 142 MB
Tables: 8
```

### Clearing Context

```bash
[my-project] > unuse
Cleared project context

>
```

### Starting with Context

You can start interactive mode with a project context already set:

```bash
supabase-cli interactive --project ygzhmowennlaehudyyey
```

## Command History

Interactive mode maintains a persistent command history across sessions.

### Viewing History

```bash
> history
Command History:
     1: projects:list
     2: projects:get --project ygzhmowennlaehudyyey
     3: use ygzhmowennlaehudyyey
     4: db:info
     5: functions:list
```

### Navigating History

- **Up Arrow**: Previous command
- **Down Arrow**: Next command

### History Storage

History is saved to `~/.supabase-cli/repl-history` and persists across sessions. The last 1000 commands are kept.

## Autocomplete

Interactive mode includes TAB completion for commands.

### Basic Autocomplete

```bash
> proj<TAB>
projects:get    projects:list   projects:create   projects:delete

> projects:l<TAB>
projects:list
```

### Command Completion

Press TAB to see all available commands:

```bash
> <TAB><TAB>
backup:list              db:info
backup:pitr:restore      db:query
branches:create          functions:list
branches:list            help
clear                    history
...
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+C` | Cancel current input (stay in REPL) |
| `Ctrl+D` | Exit interactive mode |
| `Up/Down Arrow` | Navigate command history |
| `Tab` | Autocomplete commands |
| `Ctrl+L` | Clear screen (on most terminals) |

## Advanced Features

### Session Statistics

View statistics about your interactive session:

```bash
> .stats
Session Statistics:
  Commands executed: 42
  Session uptime: 15m 23s
  History size: 87 commands
  Active project: my-project
```

### All Flags Supported

Interactive mode supports all flags from normal CLI usage:

```bash
> projects:list --format table --no-color
> db:query "SELECT * FROM users" --format json --pretty
> functions:list --quiet
```

### Multi-line Commands

Long commands work as expected:

```bash
> db:query "SELECT users.id, users.name, COUNT(orders.id) as order_count FROM users LEFT JOIN orders ON users.id = orders.user_id GROUP BY users.id, users.name ORDER BY order_count DESC LIMIT 10"
```

### Error Handling

Errors don't exit the REPL - you can fix and retry:

```bash
> projects:get
Error: Project reference required

> projects:get --project ygzhmowennlaehudyyey
{
  "id": "ygzhmowennlaehudyyey",
  "name": "my-project"
}
```

## Tips and Tricks

### 1. Use Context for Common Operations

Set your active project once:

```bash
> use ygzhmowennlaehudyyey
[my-project] > db:info
[my-project] > functions:list
[my-project] > migrations:list
```

### 2. Combine with Format Flags

Get clean output:

```bash
> projects:list --format table --no-color > projects.txt
```

### 3. Quick Project Switching

```bash
[project-a] > use project-b-ref
[project-b] > db:info
[project-b] > unuse
>
```

### 4. Use .commands to Discover

Explore available commands:

```bash
> .commands
backup:
  backup:list
  backup:pitr:restore

db:
  db:info
  db:query
  db:tables:list
  ...
```

### 5. Clear Screen Between Operations

```bash
> clear
# Screen cleared, fresh view
> projects:list
```

### 6. Check Context Before Commands

```bash
> .context
Current Context:
  Project: my-project (ygzhmowennlaehudyyey)
  Last command: db:info
```

### 7. Review History for Repeating Tasks

```bash
> history
# Find command you want to repeat
# Use Up arrow to navigate to it
```

## Comparison to Normal CLI

### Normal CLI Usage

```bash
$ supabase-cli projects:list
$ supabase-cli projects:get --project ygzhmowennlaehudyyey
$ supabase-cli db:info --project ygzhmowennlaehudyyey
$ supabase-cli functions:list --project ygzhmowennlaehudyyey
$ supabase-cli migrations:list --project ygzhmowennlaehudyyey
```

### Interactive Mode Usage

```bash
$ supabase-cli interactive
> use ygzhmowennlaehudyyey
[my-project] > projects:list
[my-project] > projects:get
[my-project] > db:info
[my-project] > functions:list
[my-project] > migrations:list
```

### Benefits of Interactive Mode

1. **Less Typing**: No need to type `supabase-cli` prefix
2. **Context Persistence**: Set project once, use everywhere
3. **Faster Iteration**: Quickly try multiple commands
4. **Command History**: Easy access to previous commands
5. **Autocomplete**: Discover commands as you type
6. **Error Recovery**: Fix mistakes without losing context
7. **Session Management**: Track what you've done

### When to Use Interactive Mode

**Use Interactive Mode When:**
- Exploring a project interactively
- Running multiple commands on the same project
- Learning the CLI commands
- Debugging or troubleshooting
- Quick ad-hoc queries and checks

**Use Normal CLI When:**
- Scripting or automation
- CI/CD pipelines
- Single command execution
- Cron jobs or scheduled tasks
- Integrating with other tools

## Examples

### Example 1: Database Exploration

```bash
$ supabase-cli interactive --project my-project

[my-project] > db:tables:list
# See all tables

[my-project] > db:info
# Check database info

[my-project] > db:query "SELECT COUNT(*) FROM users"
# Query data

[my-project] > db:query "EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com'"
# Analyze query performance
```

### Example 2: Function Development

```bash
$ supabase-cli interactive

> use my-project-ref
[my-project] > functions:list
# See existing functions

[my-project] > functions:deploy my-function
# Deploy new version

[my-project] > functions:get my-function
# Check function details

[my-project] > .stats
# See session stats
```

### Example 3: Multi-Project Management

```bash
$ supabase-cli interactive

> projects:list --format table
# See all projects

> use project-a-ref
[project-a] > db:info
# Check project A database

> use project-b-ref
[project-b] > db:info
# Check project B database

> unuse
> exit
```

### Example 4: Security Audit

```bash
$ supabase-cli interactive --project my-project

[my-project] > security:audit
# Run security audit

[my-project] > security:restrictions:list
# Check IP restrictions

[my-project] > .context
# Verify context

[my-project] > exit
```

## Troubleshooting

### REPL Won't Start

**Issue**: Command exits immediately

**Solution**: Check Node.js version (requires >=22.0.0)

```bash
node --version
```

### Commands Not Executing

**Issue**: Command appears to hang

**Solution**: Press Ctrl+C to cancel, check command syntax

### History Not Saving

**Issue**: History doesn't persist across sessions

**Solution**: Check permissions on `~/.supabase-cli/repl-history`

```bash
ls -la ~/.supabase-cli/
chmod 644 ~/.supabase-cli/repl-history
```

### Autocomplete Not Working

**Issue**: TAB doesn't show completions

**Solution**: Ensure terminal supports readline autocomplete

### Context Not Applied

**Issue**: Commands don't use set project context

**Solution**: Verify context is set:

```bash
> .context
```

If not set, use:

```bash
> use <project-ref>
```

## Conclusion

Interactive mode is a powerful way to work with the Supabase CLI. It combines the flexibility of command-line tools with the convenience of context management and command history.

For quick exploration, debugging, and iterative development, interactive mode can significantly speed up your workflow.

**Get Started:**

```bash
supabase-cli interactive
```

**Learn More:**

```bash
> help
```

Happy hacking!
