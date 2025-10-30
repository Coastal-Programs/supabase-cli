# Supabase CLI Examples

This directory contains example scripts demonstrating how to use the Supabase CLI in bash/shell environments.

## Quick Start

All example scripts source `common.sh` which provides reusable utility functions.

### Setup

1. Ensure `supabase-cli` is installed and in your PATH
2. Set your authentication token:
   ```bash
   export SUPABASE_ACCESS_TOKEN='your-token-here'
   ```
3. Make scripts executable:
   ```bash
   chmod +x *.sh
   ```

### Running Examples

```bash
# Interactive project selection
./example-backup-workflow.sh

# With explicit project reference
./example-backup-workflow.sh my-project
```

## common.sh - Shared Utilities

The `common.sh` file provides utility functions used by all example scripts.

### Sourcing common.sh

```bash
source "$(dirname "$0")/common.sh"
```

### Available Functions

#### Authentication & Validation

- **check_auth()** - Verify SUPABASE_ACCESS_TOKEN is set
- **check_project_ref(PROJECT_REF)** - Validate project reference format
- **get_project_ref()** - Interactively select project from available projects
- **check_command(COMMAND)** - Verify command is available in PATH

#### Logging Functions

All logging functions include timestamps and use colors (if available).

- **log_info(MESSAGE)** - Blue info message
- **log_success(MESSAGE)** - Green success message
- **log_warning(MESSAGE)** - Yellow warning message
- **log_error(MESSAGE)** - Red error message

#### User Interaction

- **confirm_action(PROMPT)** - Prompt for confirmation on destructive operations
- **pause(MESSAGE)** - Wait for user to press Enter

#### Output Formatting

- **format_json(JSON_STRING)** - Pretty-print JSON using jq (if available)
- **print_header(TITLE)** - Print formatted section header
- **print_divider()** - Print horizontal divider line

#### Error Handling

- **handle_error(MESSAGE, [EXIT_CODE], [DETAILS])** - Log error and exit with status code

#### Spinners (for long operations)

```bash
# Method 1: Start/stop manually
spinner_start "Processing..."
SPINNER_PID=$!
# ... do work ...
spinner_stop

# Method 2: Use run_with_spinner
run_with_spinner "Uploading..." some_command arg1 arg2
```

- **spinner_start(MESSAGE)** - Start animated spinner in background
- **spinner_stop()** - Stop the running spinner
- **run_with_spinner(MESSAGE, COMMAND, [ARGS...])** - Run command with spinner

#### Validation

- **validate_cidr(CIDR)** - Validate CIDR notation (e.g., 192.168.1.0/24)
- **validate_timestamp(TIMESTAMP)** - Validate ISO 8601 timestamp

## Example Scripts

### example-backup-workflow.sh

Demonstrates a complete backup workflow:
1. Authentication verification
2. Interactive project selection
3. List existing backups
4. Create new backup with confirmation
5. Display updated backup list

**Usage:**
```bash
./example-backup-workflow.sh
./example-backup-workflow.sh my-project
```

## Creating Your Own Examples

To create a new example script:

1. Create a new file: `example-my-feature.sh`
2. Make it executable: `chmod +x example-my-feature.sh`
3. Source common.sh at the top:
   ```bash
   SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
   source "$SCRIPT_DIR/common.sh"
   ```
4. Use the provided utility functions

### Template

```bash
#!/usr/bin/env bash
#
# Example: Your Feature Name
#
# Description of what this example does
#
# Usage:
#   ./example-your-feature.sh [OPTIONS]
#

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Set up error handling
trap 'spinner_stop 2>/dev/null; exit 130' INT TERM

main() {
  print_header "Your Feature Name"

  # Check authentication
  check_auth

  # Your logic here
  log_info "Starting operation..."
  log_success "Operation completed!"
}

main "$@"
```

## Error Handling Best Practices

All scripts follow these patterns:

1. **Check authentication first**
   ```bash
   check_auth
   ```

2. **Validate inputs**
   ```bash
   check_project_ref "$project_ref"
   ```

3. **Confirm destructive operations**
   ```bash
   if confirm_action "Delete this resource?"; then
     # perform operation
   fi
   ```

4. **Use consistent error handling**
   ```bash
   handle_error "Something went wrong" 1 "Additional details"
   ```

5. **Clean up on exit**
   ```bash
   trap 'spinner_stop 2>/dev/null; exit 130' INT TERM
   ```

## Requirements

### Required
- bash 4.0+
- supabase-cli (in PATH)
- SUPABASE_ACCESS_TOKEN environment variable

### Optional (but recommended)
- jq - for JSON output formatting
- tput - for color support (usually available on Linux/macOS)

## Color Support

Colors are automatically detected via `tput`. If colors are not available, scripts will still work with plain text output.

### Color Codes
- **Red** - Errors
- **Green** - Success
- **Yellow** - Warnings
- **Blue** - Info messages and headers

## Compatibility

These scripts are designed to work on:
- Linux (all distributions)
- macOS
- Windows (with Git Bash, WSL, or Cygwin)

Scripts use portable bash idioms to ensure cross-platform compatibility.

## Troubleshooting

### "supabase-cli: command not found"
Install the CLI and ensure it's in your PATH:
```bash
npm install -g @coastal-programs/supabase-cli
# or
which supabase-cli
```

### "SUPABASE_ACCESS_TOKEN not set"
Set your authentication token:
```bash
export SUPABASE_ACCESS_TOKEN='your-token'
```

### Color output not working
This is normal on some systems. Scripts will still function correctly with plain text.

### "jq not found"
jq is optional. Scripts will display raw JSON if jq is not available.
```bash
# To install jq:
# Ubuntu/Debian:
sudo apt-get install jq

# macOS:
brew install jq

# Windows (WSL):
sudo apt-get install jq
```

## Contributing

To contribute new examples:

1. Follow the established patterns from existing examples
2. Use common.sh utilities for consistency
3. Include comprehensive comments
4. Test on multiple platforms if possible
5. Update this README with your new example

## License

These examples are provided as part of the Supabase CLI project and follow the same license as the main project.
