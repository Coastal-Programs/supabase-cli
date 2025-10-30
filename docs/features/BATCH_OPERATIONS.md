# Batch Operations

Execute multiple CLI commands from a file with parallel execution and progress tracking.

## Overview

The batch operation feature allows you to run multiple Supabase CLI commands efficiently:

- **Parallel Execution**: Run multiple commands concurrently with configurable concurrency
- **Progress Tracking**: Real-time progress bars showing status of each command
- **Error Handling**: Continue on error or stop on first failure
- **Timeout Support**: Set timeouts per command or globally
- **Dry Run**: Preview commands before execution
- **Result Export**: Save detailed results to JSON for analysis

## Quick Start

### Simple Text File

Create a text file with one command per line:

```bash
# commands.txt
supabase-cli projects:list --format json
supabase-cli db:info --project my-project-ref
supabase-cli functions:list --project my-project-ref
```

Execute:

```bash
supabase-cli batch --file commands.txt
```

### JSON Format

Create a JSON file with command definitions:

```json
[
  {
    "command": "supabase-cli",
    "args": ["projects:list", "--format", "json"],
    "id": "list-projects"
  },
  {
    "command": "supabase-cli",
    "args": ["db:info", "--project", "my-project-ref"],
    "id": "get-db-info",
    "timeout": 30
  }
]
```

Execute:

```bash
supabase-cli batch --file commands.json --parallel 10
```

## Command File Formats

### Simple Text Format

One command per line. Lines starting with `#` are treated as comments.

**Example:**

```text
# List all projects
supabase-cli projects:list --format json

# Get database info for specific project
supabase-cli db:info --project ygzhmowennlaehudyyey

# List functions
supabase-cli functions:list --project ygzhmowennlaehudyyey

# Check recent projects
supabase-cli recent --format table
```

**Advantages:**
- Simple and human-readable
- Easy to create and edit
- No special syntax required

**Limitations:**
- No per-command configuration
- Commands assigned automatic IDs
- No individual timeouts

### JSON Format

Structured format with per-command configuration.

**Example:**

```json
[
  {
    "command": "supabase-cli",
    "args": ["projects:list", "--format", "json"],
    "id": "list-projects",
    "timeout": 30
  },
  {
    "command": "supabase-cli",
    "args": ["db:info", "--project", "my-project"],
    "id": "db-info",
    "timeout": 60
  }
]
```

**Fields:**

- `command` (required): The command to execute
- `args` (optional): Array of command arguments
- `id` (optional): Unique identifier for the command (auto-generated if not provided)
- `timeout` (optional): Command-specific timeout in seconds

**Advantages:**
- Per-command configuration
- Custom command IDs
- Individual timeouts
- Structured data for programmatic generation

## Usage

### Basic Usage

```bash
# Execute commands from text file
supabase-cli batch --file commands.txt

# Execute from JSON file
supabase-cli batch --file commands.json

# Dry run (preview without executing)
supabase-cli batch --file commands.txt --dry-run
```

### Parallel Execution

Control how many commands run concurrently:

```bash
# Run 10 commands in parallel (default is 5)
supabase-cli batch --file commands.txt --parallel 10

# Run 1 command at a time (sequential)
supabase-cli batch --file commands.txt --parallel 1

# Run 20 commands in parallel for high throughput
supabase-cli batch --file commands.txt --parallel 20
```

**Choosing Concurrency:**

- **Low (1-3)**: For commands that are resource-intensive or affect shared resources
- **Medium (5-10)**: Good default for most scenarios
- **High (15-20)**: For read-only operations or when time is critical

### Error Handling

```bash
# Stop on first error (default)
supabase-cli batch --file commands.txt

# Continue even if commands fail
supabase-cli batch --file commands.txt --continue-on-error
```

### Timeouts

Set timeouts to prevent commands from hanging:

```bash
# Set global timeout of 30 seconds per command
supabase-cli batch --file commands.txt --timeout 30

# Combine with per-command timeouts in JSON (JSON timeout takes precedence)
supabase-cli batch --file commands.json --timeout 60
```

### Output Control

```bash
# Quiet mode (minimal output)
supabase-cli batch --file commands.txt --quiet

# Verbose mode (show command output as it runs)
supabase-cli batch --file commands.txt --verbose

# Save results to JSON file
supabase-cli batch --file commands.txt --output results.json
```

### Complete Example

```bash
supabase-cli batch \
  --file commands.json \
  --parallel 10 \
  --timeout 60 \
  --continue-on-error \
  --output results.json \
  --verbose
```

## Use Cases

### 1. Multi-Project Health Check

Check the status of multiple projects in parallel:

```json
[
  {
    "command": "supabase-cli",
    "args": ["db:info", "--project", "project-1-ref"],
    "id": "project-1-db"
  },
  {
    "command": "supabase-cli",
    "args": ["db:info", "--project", "project-2-ref"],
    "id": "project-2-db"
  },
  {
    "command": "supabase-cli",
    "args": ["db:info", "--project", "project-3-ref"],
    "id": "project-3-db"
  }
]
```

```bash
supabase-cli batch --file health-check.json --parallel 10 --output health-report.json
```

### 2. Data Collection

Gather data from multiple projects for reporting:

```json
[
  {
    "command": "supabase-cli",
    "args": ["projects:list", "--format", "json"],
    "id": "all-projects"
  },
  {
    "command": "supabase-cli",
    "args": ["functions:list", "--project", "prod-ref"],
    "id": "prod-functions"
  },
  {
    "command": "supabase-cli",
    "args": ["backup:list", "--project", "prod-ref"],
    "id": "prod-backups"
  }
]
```

### 3. Automated Testing

Run a series of test commands:

```text
# Test basic commands
supabase-cli --version
supabase-cli projects:list --format json
supabase-cli config:get --format json

# Test with different formats
supabase-cli recent --format table
supabase-cli recent --format json
supabase-cli recent --format yaml
```

### 4. Monitoring Script

Create a monitoring script that runs periodically:

```bash
#!/bin/bash

# Run batch health check
supabase-cli batch \
  --file monitoring-commands.json \
  --parallel 15 \
  --timeout 45 \
  --continue-on-error \
  --output "health-check-$(date +%Y%m%d-%H%M%S).json" \
  --quiet

# Check exit code
if [ $? -ne 0 ]; then
  echo "Some health checks failed. Review results."
  exit 1
fi

echo "All health checks passed."
```

### 5. Migration Verification

Verify multiple migrations across environments:

```json
[
  {
    "command": "supabase-cli",
    "args": ["migrations:list", "--project", "dev-ref"],
    "id": "dev-migrations"
  },
  {
    "command": "supabase-cli",
    "args": ["migrations:list", "--project", "staging-ref"],
    "id": "staging-migrations"
  },
  {
    "command": "supabase-cli",
    "args": ["migrations:list", "--project", "prod-ref"],
    "id": "prod-migrations"
  }
]
```

## Output Format

### Console Output

During execution, you'll see:
1. **Header**: Batch execution information
2. **Progress Bars**: Real-time progress for each command
3. **Summary**: Statistics about the execution
4. **Failed Commands**: Details of any failures
5. **Successful Commands**: List of completed commands

Example:

```
═══════════════════════════════════════
  Batch Execution
═══════════════════════════════════════

Reading commands from: commands.json
Found 5 command(s)

─────────────────────────────────────────

████████████████████████████████████████ 100% | list-projects | Success
████████████████████████████████████████ 100% | db-info | Success
████████████████████████████████████████ 100% | functions-list | Success
████████████████████████████████████████ 100% | backups-list | Failed
████████████████████████████████████████ 100% | config-get | Success

─────────────────────────────────────────

═══════════════════════════════════════
  Execution Results
═══════════════════════════════════════

Summary:
  Total commands:    5
  Successful:        4
  Failed:            1
  Success rate:      80.0%
  Total duration:    2.35s
  Average duration:  470ms

Failed Commands:

  ✗ backups-list: supabase-cli backup:list --project test-ref
    Error: Project not found

Successful Commands:
  ✓ list-projects: supabase-cli projects:list --format json (350ms)
  ✓ db-info: supabase-cli db:info --project my-ref (520ms)
  ✓ functions-list: supabase-cli functions:list --project my-ref (480ms)
  ✓ config-get: supabase-cli config:get --format json (180ms)
```

### JSON Output File

When using `--output results.json`, the file contains:

```json
{
  "timestamp": "2025-10-31T12:34:56.789Z",
  "statistics": {
    "total": 5,
    "successful": 4,
    "failed": 1,
    "timedOut": 0,
    "totalDuration": 2350,
    "averageDuration": 470,
    "successRate": 80.0
  },
  "results": [
    {
      "command": "supabase-cli projects:list --format json",
      "exitCode": 0,
      "stdout": "[{\"id\":\"abc123\",\"name\":\"My Project\",...}]",
      "stderr": "",
      "success": true,
      "duration": 350,
      "id": "list-projects"
    },
    {
      "command": "supabase-cli backup:list --project test-ref",
      "exitCode": 1,
      "stdout": "",
      "stderr": "Error: Project not found",
      "success": false,
      "duration": 520,
      "id": "backups-list",
      "error": "Command failed"
    }
  ]
}
```

## Best Practices

### 1. Use Appropriate Concurrency

- Start with default (5) and adjust based on performance
- Consider API rate limits (Supabase: 60 requests/minute per endpoint)
- For 60 req/min limit with safety margin: Use parallel=10 or less

### 2. Set Reasonable Timeouts

- Simple queries: 10-30 seconds
- Complex operations: 60-120 seconds
- Long-running tasks: 300+ seconds

### 3. Structure Your Commands

Group related commands in separate batch files:

```
commands/
├── health-check.json       # Quick health checks
├── full-audit.json         # Comprehensive audit
├── monitoring.json         # Monitoring commands
└── data-collection.json    # Data gathering
```

### 4. Use Meaningful IDs

In JSON format, use descriptive IDs:

```json
{
  "id": "prod-db-backup-check",
  "command": "supabase-cli",
  "args": ["backup:list", "--project", "prod-ref"]
}
```

### 5. Handle Errors Appropriately

- **Critical operations**: Use default (stop on error)
- **Data collection**: Use `--continue-on-error`
- **Testing**: Use `--continue-on-error` to see all failures

### 6. Save Results for Analysis

Always use `--output` for production scenarios:

```bash
supabase-cli batch \
  --file production-audit.json \
  --output "audit-$(date +%Y%m%d-%H%M%S).json" \
  --continue-on-error
```

### 7. Dry Run Before Production

Always test with `--dry-run` first:

```bash
# Preview
supabase-cli batch --file commands.json --dry-run

# Execute
supabase-cli batch --file commands.json
```

### 8. Combine with Other Tools

Use batch results in pipelines:

```bash
# Run batch and parse results
supabase-cli batch --file commands.json --output results.json --quiet

# Parse with jq
cat results.json | jq '.statistics.successRate'

# Alert if success rate is low
RATE=$(cat results.json | jq -r '.statistics.successRate')
if (( $(echo "$RATE < 90" | bc -l) )); then
  echo "Alert: Success rate below 90%"
fi
```

## Performance Considerations

### Parallel Execution

Batch execution can significantly reduce total time:

- **Sequential (parallel=1)**: 10 commands × 500ms = 5 seconds
- **Parallel (parallel=5)**: 10 commands ÷ 5 × 500ms = 1 second
- **Speedup**: 5x faster

### Rate Limiting

Be aware of API rate limits:

- Supabase Management API: 60 requests/minute per endpoint
- With parallel=10: Can execute 10 commands in ~10 seconds
- Adjust based on your needs and limits

### Memory Usage

Each parallel command consumes memory:

- Low concurrency (1-5): ~50-100 MB
- Medium concurrency (5-10): ~100-200 MB
- High concurrency (15-20): ~200-400 MB

## Troubleshooting

### Commands Not Found

**Problem**: `Command not found: supabase-cli`

**Solution**: Use the full path or ensure CLI is in PATH:

```json
{
  "command": "/full/path/to/supabase-cli",
  "args": ["projects:list"]
}
```

### Timeout Issues

**Problem**: Commands timing out

**Solution**: Increase timeout:

```bash
supabase-cli batch --file commands.txt --timeout 120
```

### High Failure Rate

**Problem**: Many commands failing

**Solution**:
1. Run with `--verbose` to see errors
2. Test individual commands first
3. Check authentication and project refs
4. Verify API rate limits aren't exceeded

### Memory Issues

**Problem**: System running out of memory

**Solution**: Reduce parallelism:

```bash
supabase-cli batch --file commands.txt --parallel 3
```

## Examples

See the `examples/` directory for complete examples:

- `batch-commands.txt` - Simple text format
- `batch-commands.json` - JSON format with metadata
- `batch-multi-project.json` - Multi-project operations

## Integration Examples

### CI/CD Pipeline

```yaml
# .github/workflows/health-check.yml
name: Production Health Check

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Health Check
        run: |
          npx @coastal-programs/supabase-cli batch \
            --file .github/health-check.json \
            --output health-results.json \
            --continue-on-error \
            --quiet
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_TOKEN }}

      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: health-check-results
          path: health-results.json
```

### Monitoring Script

```bash
#!/bin/bash
# monitor.sh - Run every 5 minutes via cron

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RESULTS_DIR="./monitoring-results"

mkdir -p "$RESULTS_DIR"

supabase-cli batch \
  --file monitoring-commands.json \
  --parallel 15 \
  --timeout 45 \
  --continue-on-error \
  --output "$RESULTS_DIR/health-$TIMESTAMP.json" \
  --quiet

# Parse results
SUCCESS_RATE=$(cat "$RESULTS_DIR/health-$TIMESTAMP.json" | jq -r '.statistics.successRate')

if (( $(echo "$SUCCESS_RATE < 95" | bc -l) )); then
  # Send alert
  echo "ALERT: Health check success rate is $SUCCESS_RATE%"
  # Add your alerting logic here
fi

# Cleanup old results (keep last 24 hours)
find "$RESULTS_DIR" -name "health-*.json" -mtime +1 -delete
```

## API Reference

### Command Line Flags

- `--file`, `-f`: Path to batch file (required)
- `--parallel`, `-p`: Max concurrent commands (default: 5)
- `--dry-run`: Preview without executing
- `--continue-on-error`: Continue on failures
- `--timeout`, `-t`: Timeout per command (seconds)
- `--output`, `-o`: Save results to JSON file
- `--quiet`, `-q`: Minimal output
- `--verbose`, `-v`: Show command output
- `--debug`: Enable debug output

### Exit Codes

- `0`: All commands successful
- `1`: One or more commands failed

## See Also

- [CLI Configuration](./CONFIGURATION.md)
- [Authentication](./AUTHENTICATION.md)
- [Project Management](./PROJECT_MANAGEMENT.md)
