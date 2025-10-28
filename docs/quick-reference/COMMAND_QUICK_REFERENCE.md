# Supabase CLI - Quick Reference Guide

## Configuration & Setup

### Initialize CLI
```bash
# Set token and initialize
export SUPABASE_ACCESS_TOKEN="sbp_your_token_here"
supabase-cli config init

# Or pass token directly
supabase-cli config init --token sbp_your_token_here

# Custom profile
supabase-cli config init --profile production --token sbp_xxx
```

### Health Check
```bash
# Run diagnostic checks
supabase-cli config doctor

# JSON output
supabase-cli config doctor --format json

# Quiet mode (exit codes only)
supabase-cli config doctor --quiet
```

---

## Projects

### List Projects
```bash
# List all projects
supabase-cli projects list

# Table format
supabase-cli projects list --format table

# With pagination
supabase-cli projects list --limit 50 --offset 0
```

### Create Project
```bash
# Create with required params
supabase-cli projects create \
  --name "My Project" \
  --organization org-id-123 \
  --region us-east-1 \
  --db-pass "SecurePassword123!"

# With plan specification
supabase-cli projects create \
  --name "Enterprise Project" \
  --organization org-id-123 \
  --region us-west-2 \
  --plan pro \
  --db-pass "SecurePassword123!"
```

### Get Project Details
```bash
# Get specific project
supabase-cli projects get my-project-ref

# JSON output
supabase-cli projects get my-project-ref --format json
```

### Delete Project
```bash
# Delete with confirmation
supabase-cli projects delete my-project-ref

# Force delete (skip confirmation)
supabase-cli projects delete my-project-ref --force
```

### Pause Project
```bash
# Pause project
supabase-cli projects pause my-project-ref --force
```

---

## Edge Functions

### List Functions
```bash
# List all functions
supabase-cli functions list --project my-project-ref

# Table format
supabase-cli functions list --project my-project-ref --format table
```

### Deploy Function
```bash
# Deploy from file
supabase-cli functions deploy my-function \
  --file index.ts \
  --project my-project-ref

# Deploy inline code
supabase-cli functions deploy hello \
  --code "Deno.serve(() => new Response('Hello'))" \
  --project my-project-ref

# With import map
supabase-cli functions deploy my-function \
  --file index.ts \
  --import-map deno.json \
  --project my-project-ref

# Disable JWT verification
supabase-cli functions deploy public-api \
  --file index.ts \
  --verify-jwt false \
  --project my-project-ref

# Force deploy (skip confirmation)
supabase-cli functions deploy my-function \
  --file index.ts \
  --project my-project-ref \
  --force
```

### Invoke Function
```bash
# Simple GET invocation
supabase-cli functions invoke my-function \
  --project my-project-ref \
  --method GET

# POST with JSON body
supabase-cli functions invoke hello-world \
  --project my-project-ref \
  --body '{"name":"World","message":"Hi"}'

# With custom timeout (30 seconds)
supabase-cli functions invoke long-running \
  --project my-project-ref \
  --body '{"task":"process"}' \
  --timeout 30000

# PUT request
supabase-cli functions invoke update-data \
  --project my-project-ref \
  --method PUT \
  --body '{"id":123,"data":"updated"}'

# Aliases
supabase-cli fn:invoke my-function -p my-project-ref
```

---

## Branches

### List Branches
```bash
# List all branches
supabase-cli branches list --project my-project-ref

# Filter by status
supabase-cli branches list \
  --project my-project-ref \
  --status ACTIVE

# Filter by parent branch
supabase-cli branches list \
  --project my-project-ref \
  --parent main

# Table format with status indicators
supabase-cli branches list \
  --project my-project-ref \
  --format table

# With pagination
supabase-cli branches list \
  --project my-project-ref \
  --limit 10 \
  --offset 0

# Multiple filters
supabase-cli branches list \
  --project my-project-ref \
  --status ACTIVE \
  --parent main \
  --format table

# Aliases
supabase-cli branch:list -p my-project-ref
supabase-cli branches:ls -p my-project-ref
```

### Create Branch
```bash
# Create new branch
supabase-cli branches create feature-auth \
  --project my-project-ref

# Force creation
supabase-cli branches create feature-auth \
  --project my-project-ref \
  --force
```

---

## Database

### Query Database
```bash
# Execute SQL query
supabase-cli db query \
  --project my-project-ref \
  --sql "SELECT * FROM users LIMIT 10"

# From file
supabase-cli db query \
  --project my-project-ref \
  --file query.sql

# Table output
supabase-cli db query \
  --project my-project-ref \
  --sql "SELECT * FROM users" \
  --format table
```

### List Extensions
```bash
# List database extensions
supabase-cli db extensions --project my-project-ref

# Table format
supabase-cli db extensions --project my-project-ref --format table
```

### Get Schema
```bash
# Get table schema
supabase-cli db schema users --project my-project-ref

# Specific schema
supabase-cli db schema users \
  --project my-project-ref \
  --schema public
```

---

## Migrations

### List Migrations
```bash
# List all migrations
supabase-cli migrations list --project my-project-ref

# Table format
supabase-cli migrations list \
  --project my-project-ref \
  --format table
```

### Apply Migration
```bash
# Apply migration from file
supabase-cli migrations apply \
  --project my-project-ref \
  --file 20231028_create_users.sql

# Apply inline SQL
supabase-cli migrations apply \
  --project my-project-ref \
  --name create_products \
  --sql "CREATE TABLE products (id SERIAL PRIMARY KEY, name TEXT)"

# Force apply
supabase-cli migrations apply \
  --project my-project-ref \
  --file migration.sql \
  --force
```

---

## Global Flags

All commands support these flags:

### Output Format
```bash
--format json    # JSON output (default)
--format table   # Table output
--format list    # List output
--format yaml    # YAML output
```

### Output Control
```bash
--pretty         # Pretty print (default: true)
--no-pretty      # Disable pretty print
--color          # Color output (default: true)
--no-color       # Disable colors
--quiet          # Suppress non-essential output
--verbose        # Enable verbose output
--debug          # Enable debug output
```

### Automation
```bash
--yes            # Skip confirmation prompts
--force          # Force operation without confirmation
--no-interactive # Disable interactive prompts
```

### Project
```bash
--project <ref>          # Project reference
--project-ref <ref>      # Project reference (alias)
-p <ref>                 # Project reference (short)

# Or set environment variable
export SUPABASE_PROJECT_REF="my-project-ref"
```

### Pagination
```bash
--limit 100      # Max items to return
--offset 0       # Items to skip
--page 1         # Page number
--page-size 25   # Items per page
```

---

## Environment Variables

### Required
```bash
# Access token
export SUPABASE_ACCESS_TOKEN="sbp_your_token_here"
```

### Optional
```bash
# Project reference (avoid --project flag)
export SUPABASE_PROJECT_REF="my-project-ref"

# Cache settings
export CACHE_ENABLED="true"
export CACHE_TTL="300000"  # 5 minutes
export CACHE_MAX_SIZE="100"

# Retry settings
export RETRY_ENABLED="true"
export RETRY_MAX_ATTEMPTS="3"
export RETRY_INITIAL_DELAY="1000"
export RETRY_MAX_DELAY="10000"

# Circuit breaker
export CIRCUIT_BREAKER_ENABLED="true"
export CIRCUIT_BREAKER_THRESHOLD="5"
export CIRCUIT_BREAKER_TIMEOUT="30000"

# Debug
export DEBUG="true"
```

---

## Exit Codes

- `0` - Success
- `1` - Error occurred

---

## Common Workflows

### Initial Setup
```bash
# 1. Set token
export SUPABASE_ACCESS_TOKEN="sbp_xxx"

# 2. Initialize CLI
supabase-cli config init

# 3. Run health check
supabase-cli config doctor

# 4. List projects
supabase-cli projects list
```

### Deploy Function Workflow
```bash
# 1. Create function file
echo 'Deno.serve(() => new Response("Hello"))' > index.ts

# 2. Deploy function
supabase-cli functions deploy hello \
  --file index.ts \
  --project my-ref \
  --yes

# 3. Test function
supabase-cli functions invoke hello \
  --project my-ref \
  --method GET

# 4. Verify deployment
supabase-cli functions list --project my-ref
```

### Database Query Workflow
```bash
# 1. Check extensions
supabase-cli db extensions --project my-ref

# 2. Run query
supabase-cli db query \
  --project my-ref \
  --sql "SELECT * FROM users LIMIT 5" \
  --format table

# 3. Get schema
supabase-cli db schema users --project my-ref
```

### Branch Development Workflow
```bash
# 1. Create feature branch
supabase-cli branches create feature-auth --project my-ref

# 2. Apply migration to branch
supabase-cli migrations apply \
  --project feature-auth-ref \
  --file add_auth.sql

# 3. Test on branch
supabase-cli db query \
  --project feature-auth-ref \
  --sql "SELECT * FROM auth.users"

# 4. List branches
supabase-cli branches list \
  --project my-ref \
  --status ACTIVE
```

---

## Tips & Best Practices

### Performance
- Use `--no-cache` flag to bypass cache for fresh data
- Set `SUPABASE_PROJECT_REF` to avoid repeating `--project` flag
- Use `--quiet` flag in scripts for cleaner output

### Security
- Store token in environment variable, not in scripts
- Use `--no-interactive` in CI/CD pipelines
- Rotate tokens regularly via Supabase dashboard

### Debugging
- Enable `DEBUG=true` for detailed logging
- Use `--verbose` for operation details
- Check `config doctor` when facing issues

### Automation
- Use `--yes` or `--force` to skip prompts
- Set `--format json` for parsing in scripts
- Check exit codes (`$?`) for success/failure

---

## Troubleshooting

### "No authentication token found"
```bash
# Solution
export SUPABASE_ACCESS_TOKEN="sbp_your_token_here"
supabase-cli config init
```

### "Project reference required"
```bash
# Solution 1: Use --project flag
supabase-cli command --project my-ref

# Solution 2: Set environment variable
export SUPABASE_PROJECT_REF="my-ref"
supabase-cli command
```

### "Circuit breaker is open"
```bash
# Check status
supabase-cli config doctor

# Wait 30 seconds for circuit to close
# Or restart CLI
```

### "Token is invalid or expired"
```bash
# Generate new token
# Visit: https://supabase.com/dashboard/account/tokens
# Then initialize again
supabase-cli config init --token sbp_new_token_here
```

---

## Getting Help

```bash
# Command help
supabase-cli --help

# Specific command help
supabase-cli functions deploy --help
supabase-cli branches list --help

# Version
supabase-cli --version
```

---

**Quick Reference Version**: 1.0
**Last Updated**: 2025-10-28
**Compatible With**: Supabase CLI v0.1.0
