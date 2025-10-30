# Automation Guide

This guide shows you how to use the Supabase CLI in automated workflows, scripts, and CI/CD pipelines.

## Quick Start

```bash
# Set token in environment
export SUPABASE_ACCESS_TOKEN=sbp_your_token_here

# Use quiet mode for scripts
supabase-cli projects:list --quiet --format json

# Check exit codes
if supabase-cli config:doctor --quiet; then
  echo "Configuration is valid"
else
  echo "Configuration error"
  exit 1
fi
```

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Output Formats](#output-formats)
3. [Error Handling](#error-handling)
4. [CI/CD Integration](#cicd-integration)
5. [Common Automation Tasks](#common-automation-tasks)
6. [Best Practices](#best-practices)

## Environment Setup

### 1. Setting the Access Token

Always set via environment variable in automated contexts:

```bash
export SUPABASE_ACCESS_TOKEN=sbp_your_token_here
```

Or use a secrets manager:

```bash
# GitHub Actions
export SUPABASE_ACCESS_TOKEN=${{ secrets.SUPABASE_ACCESS_TOKEN }}

# GitLab CI
export SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN

# AWS Secrets Manager
export SUPABASE_ACCESS_TOKEN=$(aws secretsmanager get-secret-value \
  --secret-id supabase-token \
  --query SecretString \
  --output text)
```

### 2. Optional Environment Variables

```bash
# Disable caching for fresh data
export CACHE_ENABLED=false

# Reduce retry attempts for faster failures
export RETRY_MAX_ATTEMPTS=2

# Enable debug logging
export DEBUG=true
```

## Output Formats

### JSON Format (Recommended for Automation)

```bash
# Default format
supabase-cli projects:list --format json

# Parse with jq
PROJECT_ID=$(supabase-cli projects:list --format json | jq -r '.[0].id')
echo "First project: $PROJECT_ID"
```

### Quiet Mode

Suppress non-essential output:

```bash
# Only output data, no headers or status messages
supabase-cli projects:list --quiet --format json
```

### Table Format

Human-readable format (not recommended for parsing):

```bash
supabase-cli projects:list --format table
```

### YAML Format

Alternative structured format:

```bash
supabase-cli projects:list --format yaml
```

## Error Handling

### Exit Codes

The CLI uses standard exit codes:

- `0` - Success
- `1` - Error

```bash
# Check if command succeeded
if supabase-cli config:doctor --quiet; then
  echo "Configuration valid"
else
  echo "Configuration invalid"
  exit 1
fi
```

### Handling Errors in Scripts

```bash
#!/bin/bash
set -e  # Exit on error
set -o pipefail  # Catch errors in pipes

# Function to handle errors
handle_error() {
  echo "Error on line $1"
  exit 1
}
trap 'handle_error $LINENO' ERR

# Your automation
supabase-cli config:doctor --quiet
supabase-cli projects:list --quiet --format json
```

### Parsing Error Messages

```bash
# Capture stderr
ERROR=$(supabase-cli projects:get invalid-ref 2>&1 >/dev/null)

if [[ $? -ne 0 ]]; then
  echo "Error occurred: $ERROR"
  # Handle specific errors
  if [[ $ERROR == *"not found"* ]]; then
    echo "Project not found"
  fi
fi
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Supabase CLI Automation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  database-check:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install Supabase CLI
        run: npm install -g @coastal-programs/supabase-cli

      - name: Verify Configuration
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: |
          supabase-cli config:doctor --quiet

      - name: List Projects
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: |
          supabase-cli projects:list --quiet --format json

      - name: Run Database Health Check
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          PROJECT_REF: ${{ secrets.PROJECT_REF }}
        run: |
          supabase-cli db:info --project $PROJECT_REF --quiet
          supabase-cli db:connections --project $PROJECT_REF --quiet
          supabase-cli db:table-sizes --project $PROJECT_REF --quiet

      - name: Run Security Audit
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          PROJECT_REF: ${{ secrets.PROJECT_REF }}
        run: |
          supabase-cli security:audit --project $PROJECT_REF --quiet
```

### GitLab CI

```yaml
stages:
  - check
  - deploy

variables:
  NODE_VERSION: "22"

before_script:
  - npm install -g @coastal-programs/supabase-cli
  - export SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN

health-check:
  stage: check
  script:
    - supabase-cli config:doctor --quiet
    - supabase-cli projects:list --quiet --format json
    - supabase-cli db:info --project $PROJECT_REF --quiet
    - supabase-cli security:audit --project $PROJECT_REF --quiet
  only:
    - main
    - merge_requests
```

### CircleCI

```yaml
version: 2.1

jobs:
  check:
    docker:
      - image: cimg/node:22.0
    steps:
      - checkout
      - run:
          name: Install Supabase CLI
          command: npm install -g @coastal-programs/supabase-cli
      - run:
          name: Health Check
          command: |
            export SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN
            supabase-cli config:doctor --quiet
            supabase-cli projects:list --quiet --format json
      - run:
          name: Database Check
          command: |
            export SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN
            supabase-cli db:info --project $PROJECT_REF --quiet

workflows:
  check-workflow:
    jobs:
      - check
```

### Jenkins

```groovy
pipeline {
    agent any

    environment {
        SUPABASE_ACCESS_TOKEN = credentials('supabase-access-token')
        PROJECT_REF = credentials('project-ref')
    }

    stages {
        stage('Setup') {
            steps {
                sh 'npm install -g @coastal-programs/supabase-cli'
            }
        }

        stage('Health Check') {
            steps {
                sh 'supabase-cli config:doctor --quiet'
                sh 'supabase-cli projects:list --quiet --format json'
            }
        }

        stage('Database Check') {
            steps {
                sh '''
                    supabase-cli db:info --project $PROJECT_REF --quiet
                    supabase-cli db:connections --project $PROJECT_REF --quiet
                '''
            }
        }

        stage('Security Audit') {
            steps {
                sh 'supabase-cli security:audit --project $PROJECT_REF --quiet'
            }
        }
    }

    post {
        failure {
            mail to: 'team@example.com',
                 subject: "Pipeline Failed: ${currentBuild.fullDisplayName}",
                 body: "Check console output at ${env.BUILD_URL}"
        }
    }
}
```

## Common Automation Tasks

### 1. Daily Health Check Script

```bash
#!/bin/bash
# daily-health-check.sh

set -e

PROJECT_REF="your-project-ref"
REPORT_FILE="health-report-$(date +%Y%m%d).txt"

echo "Supabase Health Report - $(date)" > "$REPORT_FILE"
echo "========================================" >> "$REPORT_FILE"

# Database Info
echo "" >> "$REPORT_FILE"
echo "Database Information:" >> "$REPORT_FILE"
supabase-cli db:info --project "$PROJECT_REF" --quiet >> "$REPORT_FILE"

# Connections
echo "" >> "$REPORT_FILE"
echo "Active Connections:" >> "$REPORT_FILE"
supabase-cli db:connections --project "$PROJECT_REF" --quiet >> "$REPORT_FILE"

# Table Sizes
echo "" >> "$REPORT_FILE"
echo "Table Sizes:" >> "$REPORT_FILE"
supabase-cli db:table-sizes --project "$PROJECT_REF" --quiet >> "$REPORT_FILE"

# Security Audit
echo "" >> "$REPORT_FILE"
echo "Security Audit:" >> "$REPORT_FILE"
supabase-cli security:audit --project "$PROJECT_REF" --quiet >> "$REPORT_FILE"

echo "Report saved to $REPORT_FILE"

# Email report (optional)
# mail -s "Daily Supabase Health Report" team@example.com < "$REPORT_FILE"
```

### 2. Backup Verification

```bash
#!/bin/bash
# verify-backups.sh

set -e

PROJECT_REF="your-project-ref"

# Get latest backup
LATEST_BACKUP=$(supabase-cli backup:list --project "$PROJECT_REF" \
  --quiet --format json | jq -r '.[0].id')

if [[ -z "$LATEST_BACKUP" ]]; then
  echo "No backups found!"
  exit 1
fi

# Verify backup age
BACKUP_DATE=$(supabase-cli backup:get "$LATEST_BACKUP" \
  --project "$PROJECT_REF" --quiet --format json | jq -r '.created_at')

echo "Latest backup: $LATEST_BACKUP (created: $BACKUP_DATE)"

# Alert if backup is older than 24 hours
BACKUP_AGE=$(( ($(date +%s) - $(date -d "$BACKUP_DATE" +%s)) / 3600 ))

if [[ $BACKUP_AGE -gt 24 ]]; then
  echo "WARNING: Latest backup is $BACKUP_AGE hours old"
  exit 1
fi

echo "Backup verification successful"
```

### 3. Type Generation for CI/CD

```bash
#!/bin/bash
# generate-types.sh

set -e

PROJECT_REF="your-project-ref"
OUTPUT_FILE="src/types/database.types.ts"

echo "Generating TypeScript types..."

supabase-cli types:generate --project "$PROJECT_REF" > "$OUTPUT_FILE"

echo "Types generated: $OUTPUT_FILE"

# Commit if changed
if git diff --quiet "$OUTPUT_FILE"; then
  echo "No changes to types"
else
  git add "$OUTPUT_FILE"
  git commit -m "chore: update database types [skip ci]"
  echo "Types updated and committed"
fi
```

### 4. Multi-Project Deployment Check

```bash
#!/bin/bash
# check-all-projects.sh

set -e

# Get all projects
PROJECTS=$(supabase-cli projects:list --quiet --format json)

# Check each project
echo "$PROJECTS" | jq -c '.[]' | while read -r project; do
  PROJECT_REF=$(echo "$project" | jq -r '.id')
  PROJECT_NAME=$(echo "$project" | jq -r '.name')

  echo "Checking project: $PROJECT_NAME ($PROJECT_REF)"

  # Database health
  supabase-cli db:info --project "$PROJECT_REF" --quiet

  # Security audit
  supabase-cli security:audit --project "$PROJECT_REF" --quiet

  echo "✓ $PROJECT_NAME is healthy"
done

echo "All projects checked successfully"
```

### 5. Database Size Monitoring

```bash
#!/bin/bash
# monitor-db-size.sh

set -e

PROJECT_REF="your-project-ref"
THRESHOLD_MB=1000  # Alert if DB exceeds 1GB

# Get database size
DB_SIZE=$(supabase-cli db:info --project "$PROJECT_REF" \
  --quiet --format json | jq -r '.size_mb')

echo "Current database size: ${DB_SIZE}MB"

if (( $(echo "$DB_SIZE > $THRESHOLD_MB" | bc -l) )); then
  echo "WARNING: Database size exceeds threshold of ${THRESHOLD_MB}MB"
  # Send alert (Slack, email, etc.)
  exit 1
fi

echo "Database size is within acceptable limits"
```

## Best Practices

### 1. Always Use Quiet Mode

```bash
# Good for automation
supabase-cli projects:list --quiet --format json

# Bad for automation (noisy output)
supabase-cli projects:list
```

### 2. Parse JSON with jq

```bash
# Extract specific fields
PROJECT_NAME=$(supabase-cli projects:get "$PROJECT_REF" \
  --quiet --format json | jq -r '.name')

# Filter results
ACTIVE_PROJECTS=$(supabase-cli projects:list --quiet --format json | \
  jq -r '.[] | select(.status == "ACTIVE_HEALTHY") | .id')
```

### 3. Use Environment Variables

```bash
# Good
export SUPABASE_ACCESS_TOKEN=$SECRET
export PROJECT_REF=$PROJECT

# Bad (hardcoded secrets)
SUPABASE_ACCESS_TOKEN=sbp_123456
```

### 4. Set Timeouts

```bash
# Use timeout command
timeout 30s supabase-cli db:query "SELECT * FROM large_table" \
  --project "$PROJECT_REF"
```

### 5. Log Everything

```bash
# Log to file
exec 1> >(tee -a automation.log)
exec 2>&1

# Timestamp logs
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

log "Starting automation..."
supabase-cli projects:list --quiet --format json
log "Automation complete"
```

### 6. Handle Failures Gracefully

```bash
# Retry on failure
retry() {
  local max_attempts=$1
  shift
  local cmd="$@"
  local attempt=1

  until $cmd; do
    if [[ $attempt -eq $max_attempts ]]; then
      echo "Command failed after $max_attempts attempts"
      return 1
    fi
    echo "Attempt $attempt failed, retrying..."
    sleep $((attempt * 2))
    ((attempt++))
  done
}

# Usage
retry 3 supabase-cli config:doctor --quiet
```

### 7. Validate Before Running

```bash
# Check prerequisites
if [[ -z "$SUPABASE_ACCESS_TOKEN" ]]; then
  echo "Error: SUPABASE_ACCESS_TOKEN not set"
  exit 1
fi

if ! command -v supabase-cli &> /dev/null; then
  echo "Error: supabase-cli not installed"
  exit 1
fi

# Verify access
if ! supabase-cli config:doctor --quiet; then
  echo "Error: CLI configuration invalid"
  exit 1
fi
```

## Troubleshooting Automation

### "Command not found"

Install CLI in your CI environment:

```bash
npm install -g @coastal-programs/supabase-cli
```

### "Authentication failed"

Check environment variable is set:

```bash
echo ${SUPABASE_ACCESS_TOKEN:0:10}...  # Show first 10 chars
```

### Timeouts in CI/CD

Increase timeout or disable cache:

```bash
export CACHE_ENABLED=false
export RETRY_MAX_ATTEMPTS=2
```

### Rate Limiting

Add delays between commands:

```bash
supabase-cli projects:list --quiet
sleep 1
supabase-cli db:info --project "$PROJECT_REF" --quiet
```

## Next Steps

- [Database Operations Guide](database-operations.md) - Database commands
- [Troubleshooting Guide](troubleshooting.md) - Fix common issues
- [Getting Started Guide](getting-started.md) - Basics

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [jq Manual](https://stedolan.github.io/jq/manual/)

---

**Version**: 0.1.0
**Last Updated**: October 30, 2025
**Next Guide**: [Troubleshooting Guide](troubleshooting.md)
