# Shell Autocomplete Guide

This guide explains how to set up and use shell autocomplete for the Supabase CLI.

## Overview

Shell autocomplete makes using the CLI faster and more convenient by:
- Auto-completing command names
- Auto-completing subcommands
- Auto-completing flag names
- Suggesting available flag values
- Reducing typing and errors

## Supported Shells

- Bash
- Zsh
- Fish
- PowerShell (NOT supported - see limitations)

## Quick Setup

### Bash

**One-line setup**:
```bash
printf "$(supabase-cli autocomplete:script bash)" >> ~/.bashrc && source ~/.bashrc
```

**Step-by-step**:
1. Run the autocomplete command:
   ```bash
   supabase-cli autocomplete bash
   ```

2. Follow the instructions to add to your shell config

3. Restart your shell or run:
   ```bash
   source ~/.bashrc
   ```

**Login shell users** (macOS Terminal.app users):
If your terminal starts as a login shell, use `~/.bash_profile` instead:
```bash
printf "$(supabase-cli autocomplete:script bash)" >> ~/.bash_profile && source ~/.bash_profile
```

### Zsh

**One-line setup**:
```bash
printf "$(supabase-cli autocomplete:script zsh)" >> ~/.zshrc && source ~/.zshrc
```

**Step-by-step**:
1. Run the autocomplete command:
   ```bash
   supabase-cli autocomplete zsh
   ```

2. Follow the instructions to add to your shell config

3. (Optional) Fix permissions if needed:
   ```bash
   compaudit -D
   ```

4. Restart your shell or run:
   ```bash
   source ~/.zshrc
   ```

### Fish

**Setup**:
1. Run the autocomplete command:
   ```bash
   supabase-cli autocomplete fish
   ```

2. Follow the instructions displayed

3. Restart your fish shell

## Usage Examples

Once autocomplete is set up, you can use it like this:

### Command Completion (Bash)

```bash
# Type partial command and press TAB TAB
supabase-cli pro[TAB][TAB]
# Completes to: supabase-cli projects

# View all available commands
supabase-cli [TAB][TAB]
# Shows: projects, db, functions, storage, backup, config, etc.
```

### Subcommand Completion (Bash)

```bash
# Type partial subcommand and press TAB TAB
supabase-cli projects:[TAB][TAB]
# Shows: list, get, create, delete, pause, restore

# Type partial subcommand
supabase-cli db:[TAB][TAB]
# Shows: query, info, schema, extensions, policies, etc.
```

### Flag Completion (Bash)

```bash
# Type command and -- then press TAB TAB
supabase-cli projects:list --[TAB][TAB]
# Shows: --format, --recent, --help, --debug, etc.

# Partial flag name
supabase-cli projects:list --fo[TAB][TAB]
# Completes to: --format
```

### Zsh Differences

Zsh uses single TAB instead of double TAB:

```bash
# Zsh command completion
supabase-cli pro[TAB]
# Completes to: supabase-cli projects

# Zsh subcommand completion
supabase-cli projects:[TAB]
# Shows: list, get, create, etc.

# Zsh flag completion
supabase-cli projects:list --[TAB]
# Shows: --format, --recent, etc.
```

## What Gets Autocompleted

### Commands (Topics)

All top-level command topics:
- `projects`
- `db`
- `functions`
- `storage`
- `backup`
- `branches`
- `config`
- `daemon`
- `security`
- `migrations`
- `organizations`
- `monitoring`
- `upgrade`
- `types`

### Subcommands

All subcommands within each topic:
- `projects:list`, `projects:get`, `projects:create`, etc.
- `db:query`, `db:info`, `db:schema`, `db:extensions`, etc.
- `functions:list`, `functions:deploy`, `functions:invoke`
- `storage:buckets:list`, `storage:buckets:create`, etc.

### Flags

All available flags:
- Global flags: `--help`, `--version`, `--debug`
- Command-specific flags: `--project`, `--format`, `--recent`, `--quiet`

### Flag Values

Suggested values for certain flags:
- `--format`: `json`, `table`, `yaml`, `list`
- `--shell`: `bash`, `zsh`, `fish`, `powershell`

## Refreshing the Autocomplete Cache

The autocomplete system caches command metadata for performance. If you:
- Update the CLI to a new version
- Add custom commands
- Notice outdated completions

Refresh the cache:

```bash
supabase-cli autocomplete --refresh-cache
```

This rebuilds the autocomplete cache with the latest command metadata.

## Troubleshooting

### Autocomplete Not Working

**1. Verify installation**:
```bash
# Run the autocomplete command for your shell
supabase-cli autocomplete bash
supabase-cli autocomplete zsh
supabase-cli autocomplete fish
```

**2. Check shell config file**:

Bash users, check if this line exists in `~/.bashrc` (or `~/.bash_profile`):
```bash
grep SUPABASE_CLI_AC_BASH_SETUP_PATH ~/.bashrc
```

Zsh users, check `~/.zshrc`:
```bash
grep SUPABASE_CLI_AC_ZSH_SETUP_PATH ~/.zshrc
```

**3. Refresh the cache**:
```bash
supabase-cli autocomplete --refresh-cache
```

**4. Restart your shell**:
Close and reopen your terminal, or:
```bash
# Bash
source ~/.bashrc

# Zsh
source ~/.zshrc

# Fish
source ~/.config/fish/config.fish
```

### Permissions Issues (Zsh)

If zsh shows permission warnings:

```bash
# Check for issues
compaudit

# Fix permissions
compaudit -D

# Restart shell
source ~/.zshrc
```

### Completions Are Outdated

If completions show old commands or are missing new ones:

```bash
# Rebuild the cache
supabase-cli autocomplete --refresh-cache

# Restart shell
source ~/.bashrc  # or ~/.zshrc
```

### PATH Issues

If the CLI is not in your PATH:

```bash
# Check if CLI is accessible
which supabase-cli

# If not found, ensure it's installed globally
npm install -g @coastal-programs/supabase-cli

# Or add local installation to PATH
export PATH="$PATH:./node_modules/.bin"
```

### Autocomplete Script Not Found

If you see errors about missing autocomplete script:

```bash
# Reinstall the CLI
npm install -g @coastal-programs/supabase-cli

# Regenerate autocomplete
supabase-cli autocomplete bash --refresh-cache
```

## Limitations

### PowerShell

PowerShell autocomplete is **NOT supported** because PowerShell doesn't work well with colon-separated commands (`projects:list`).

**Windows users should use**:
- Git Bash (recommended)
- WSL with bash or zsh
- Windows Terminal with WSL

### Windows CMD

Windows CMD does not support autocomplete for oclif CLIs.

**Windows users should use**:
- Git Bash (recommended)
- PowerShell (limited support)
- WSL with bash or zsh

### Fish Shell on Windows

Fish shell autocomplete may have limited support on Windows. We recommend using WSL for the best experience.

## Advanced Configuration

### Custom Autocomplete Location

By default, autocomplete files are stored in:
- Bash: `~/.bashrc` (or `~/.bash_profile`)
- Zsh: `~/.zshrc`
- Fish: `~/.config/fish/config.fish`

You can customize the location by manually adding the autocomplete script to your preferred config file.

### Disable Autocomplete

To disable autocomplete:

**Bash**:
```bash
# Remove the SUPABASE_CLI_AC_BASH_SETUP_PATH line from ~/.bashrc
sed -i '/SUPABASE_CLI_AC_BASH_SETUP_PATH/d' ~/.bashrc
source ~/.bashrc
```

**Zsh**:
```bash
# Remove the SUPABASE_CLI_AC_ZSH_SETUP_PATH line from ~/.zshrc
sed -i '/SUPABASE_CLI_AC_ZSH_SETUP_PATH/d' ~/.zshrc
source ~/.zshrc
```

**Fish**:
Remove the autocomplete setup from `~/.config/fish/config.fish` and restart fish.

### Multiple Shells

If you use multiple shells, set up autocomplete for each:

```bash
# Bash
supabase-cli autocomplete bash

# Zsh
supabase-cli autocomplete zsh

# Fish
supabase-cli autocomplete fish
```

Each shell maintains its own autocomplete cache.

## Performance

Autocomplete is optimized for speed:
- **Cache**: Command metadata is cached for instant lookups
- **Lazy loading**: Completions are generated on-demand
- **Minimal overhead**: <50ms completion time

## How It Works

The autocomplete system uses oclif's built-in `@oclif/plugin-autocomplete` plugin:

1. **Installation**: Adds an environment variable to your shell config
2. **Cache building**: Generates command metadata on first use
3. **Completion**: Shell integration provides suggestions as you type
4. **Updates**: Cache is rebuilt when CLI is updated

## Getting Help

If you're still having issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Run diagnostics:
   ```bash
   supabase-cli autocomplete --help
   ```
3. File an issue: https://github.com/coastal-programs/supabase-cli/issues

## Examples

### Daily Workflow

```bash
# Morning: List projects
supabase-cli pro[TAB][TAB]  # Completes to projects
supabase-cli projects:l[TAB][TAB]  # Completes to list

# Database query
supabase-cli db:[TAB][TAB]  # Shows all db commands
supabase-cli db:query "SELECT * FROM users" --pro[TAB][TAB]  # Completes to --project

# Check configuration
supabase-cli con[TAB][TAB]  # Completes to config
supabase-cli config:do[TAB][TAB]  # Completes to doctor
```

### CI/CD Setup

Autocomplete works in interactive shells but is not needed for CI/CD:

```yaml
# GitHub Actions (no autocomplete needed)
- name: Run CLI command
  run: supabase-cli projects:list --format json
```

### Development Workflow

```bash
# Build and test
npm run build

# Refresh autocomplete after changes
supabase-cli autocomplete --refresh-cache

# Test completions
supabase-cli [TAB][TAB]
```

## See Also

- [README.md](../README.md) - Main documentation
- [Getting Started Guide](./guides/getting-started.md)
- [Troubleshooting Guide](./guides/troubleshooting.md)
- [oclif Autocomplete Documentation](https://oclif.io/docs/autocomplete)
