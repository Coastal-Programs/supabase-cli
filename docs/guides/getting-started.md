# Getting Started with Supabase CLI

Welcome! This guide will walk you through installing, configuring, and using the Supabase CLI for the first time.

## Prerequisites

Before you begin, make sure you have:

- **Node.js** version 22.0.0 or higher
- **npm** (comes with Node.js)
- A **Supabase account** (sign up at https://supabase.com)
- At least one **Supabase project** created

Check your Node.js version:

```bash
node --version
# Should output v22.0.0 or higher
```

## Step 1: Installation

### Option A: Global Installation (Recommended)

Install globally to use the CLI from anywhere:

```bash
npm install -g @coastal-programs/supabase-cli
```

Verify installation:

```bash
supabase-cli --version
# Should output: @coastal-programs/supabase-cli/0.1.0
```

### Option B: Use with npx

Run without installing:

```bash
npx @coastal-programs/supabase-cli --version
```

For the rest of this guide, we'll use `supabase-cli`, but you can replace it with `npx @coastal-programs/supabase-cli` if using npx.

## Step 2: Get Your Access Token

1. Go to https://supabase.com/dashboard/account/tokens
2. Click "Generate New Token"
3. Give it a name (e.g., "CLI Access")
4. Copy the token (starts with `sbp_`)

IMPORTANT: Keep this token secure! Don't commit it to version control.

## Step 3: Set Your Access Token

### Option A: Environment Variable (Recommended)

Add to your shell configuration file (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
export SUPABASE_ACCESS_TOKEN=sbp_your_token_here
```

Then reload your shell:

```bash
source ~/.bashrc  # or ~/.zshrc
```

### Option B: Set for Current Session

For a temporary session:

```bash
export SUPABASE_ACCESS_TOKEN=sbp_your_token_here
```

### Option C: Use .env File

Create a `.env` file in your project directory:

```env
SUPABASE_ACCESS_TOKEN=sbp_your_token_here
```

Then load it before running commands:

```bash
source .env
supabase-cli projects:list
```

## Step 4: Initialize Configuration

Initialize the CLI configuration:

```bash
supabase-cli config:init
```

This creates a configuration file at `~/.supabase-cli/credentials.json`.

Verify configuration:

```bash
supabase-cli config:doctor
```

You should see:
```
✓ Configuration file exists
✓ Access token is set
✓ Can connect to Supabase API
```

## Step 5: Your First Command

List all your Supabase projects:

```bash
supabase-cli projects:list
```

Output:
```
┌──────────────────────┬────────────────┬────────────┬──────────────────┐
│ ID                   │ Name           │ Region     │ Status           │
├──────────────────────┼────────────────┼────────────┼──────────────────┤
│ ygzhmowennlaehudyyey │ My Project     │ us-east-1  │ ACTIVE_HEALTHY   │
└──────────────────────┴────────────────┴────────────┴──────────────────┘
```

Get details for a specific project:

```bash
supabase-cli projects:get ygzhmowennlaehudyyey
```

## Step 6: Try Different Output Formats

### JSON Format (Default)

```bash
supabase-cli projects:list --format json
```

### Table Format

```bash
supabase-cli projects:list --format table
```

### YAML Format

```bash
supabase-cli projects:list --format yaml
```

## Step 7: Explore Database Commands

Execute a simple SQL query:

```bash
supabase-cli db:query "SELECT version()" --project ygzhmowennlaehudyyey
```

List installed extensions:

```bash
supabase-cli db:extensions --project ygzhmowennlaehudyyey
```

Get database info:

```bash
supabase-cli db:info --project ygzhmowennlaehudyyey
```

## Step 8: Get Help

### General Help

```bash
supabase-cli --help
```

### Command-Specific Help

```bash
supabase-cli projects:list --help
supabase-cli db:query --help
```

### List All Commands

```bash
supabase-cli --help
```

## Common Tasks

### Check Configuration Health

```bash
supabase-cli config:doctor
```

### List Organizations

```bash
supabase-cli organizations:list
```

### Check Table Sizes

```bash
supabase-cli db:table-sizes --project your-project-ref --format table
```

### List Storage Buckets

```bash
supabase-cli storage:buckets:list --project your-project-ref
```

### Run Security Audit

```bash
supabase-cli security:audit --project your-project-ref
```

## Environment Variables Reference

All available environment variables:

```bash
# Required
SUPABASE_ACCESS_TOKEN=sbp_your_token_here

# Optional (with defaults)
CACHE_ENABLED=true                # Enable caching
CACHE_TTL=300000                  # Cache TTL in milliseconds (5 min)
RETRY_ENABLED=true                # Enable retry logic
RETRY_MAX_ATTEMPTS=3              # Maximum retry attempts
DEBUG=false                       # Enable debug logging
```

## Configuration File

The CLI stores configuration at:
- Linux/macOS: `~/.supabase-cli/credentials.json`
- Windows: `%USERPROFILE%\.supabase-cli\credentials.json`

Example configuration:

```json
{
  "accessToken": "sbp_your_token_here",
  "defaultProject": "ygzhmowennlaehudyyey",
  "defaultFormat": "table"
}
```

## Tips and Tricks

### 1. Set a Default Project

Add to your `.env` file:

```bash
SUPABASE_PROJECT_REF=ygzhmowennlaehudyyey
```

### 2. Use Aliases

Add to your shell config:

```bash
alias sp='supabase-cli'
alias spq='supabase-cli db:query'
```

Then use:

```bash
sp projects:list
spq "SELECT * FROM users LIMIT 10" --project my-ref
```

### 3. Quiet Mode for Scripts

Use `--quiet` flag to suppress non-essential output:

```bash
supabase-cli projects:list --quiet --format json
```

### 4. Debug Mode

Enable detailed logging:

```bash
DEBUG=true supabase-cli projects:list
```

### 5. Save Output to File

```bash
supabase-cli projects:list --format json > projects.json
supabase-cli db:info --project my-ref > db-info.txt
```

## Next Steps

Now that you're set up, explore more features:

1. [Database Operations Guide](database-operations.md) - Deep dive into database commands
2. [Automation Guide](automation.md) - Use the CLI in scripts and CI/CD
3. [Troubleshooting Guide](troubleshooting.md) - Fix common issues

## Need Help?

- Run `supabase-cli --help` for command reference
- Check [Troubleshooting Guide](troubleshooting.md)
- Open an issue: https://github.com/coastal-programs/supabase-cli/issues
- Join discussions: https://github.com/coastal-programs/supabase-cli/discussions

## Quick Reference Card

```bash
# Installation
npm install -g @coastal-programs/supabase-cli

# Authentication
export SUPABASE_ACCESS_TOKEN=sbp_your_token_here

# Configuration
supabase-cli config:init
supabase-cli config:doctor

# Core Commands
supabase-cli projects:list
supabase-cli projects:get <ref>
supabase-cli db:query "<sql>" --project <ref>
supabase-cli db:info --project <ref>

# Help
supabase-cli --help
supabase-cli <command> --help

# Output Formats
--format json   # JSON output (default)
--format table  # Table output
--format yaml   # YAML output

# Flags
--quiet         # Suppress non-essential output
--debug         # Enable debug logging
```

---

**Version**: 0.1.0
**Last Updated**: October 30, 2025
**Next Guide**: [Database Operations](database-operations.md)
