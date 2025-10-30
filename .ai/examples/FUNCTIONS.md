# common.sh Function Reference

Complete reference for all utility functions available in `common.sh`.

## Table of Contents

- [Logging Functions](#logging-functions)
- [Authentication & Validation](#authentication--validation)
- [User Interaction](#user-interaction)
- [Output Formatting](#output-formatting)
- [Error Handling](#error-handling)
- [Spinners & Progress](#spinners--progress)
- [Helper Functions](#helper-functions)
- [Additional Validation](#additional-validation)

---

## Logging Functions

All logging functions include ISO 8601 timestamps and color coding. Colors are automatically disabled if not supported.

### log_info()

Log an informational message in blue.

```bash
log_info "Starting backup process..."
log_info "Found ${count} projects"
```

**Output:**
```
[INFO] 2024-01-15 10:30:45 - Starting backup process...
```

---

### log_success()

Log a success message in green.

```bash
log_success "Backup created successfully"
log_success "All 5 projects processed"
```

**Output:**
```
[SUCCESS] 2024-01-15 10:30:50 - Backup created successfully
```

---

### log_warning()

Log a warning message in yellow.

```bash
log_warning "No backups found for this project"
log_warning "API rate limit approaching"
```

**Output:**
```
[WARNING] 2024-01-15 10:30:55 - No backups found for this project
```

---

### log_error()

Log an error message in red.

```bash
log_error "Failed to authenticate"
log_error "Invalid project reference: $project_ref"
```

**Output:**
```
[ERROR] 2024-01-15 10:31:00 - Failed to authenticate
```

---

## Authentication & Validation

Functions for checking authentication and validating inputs.

### check_auth()

Verify that the `SUPABASE_ACCESS_TOKEN` environment variable is set. Exits with status 1 if not set.

```bash
#!/usr/bin/env bash
source common.sh

check_auth  # Exits if token not set
```

**Exit behavior:**
- Returns 0 if token is set
- Exits with status 1 if token is not set

---

### check_project_ref()

Validate that a project reference is provided and follows the correct format (alphanumeric lowercase with hyphens). Exits with status 1 if invalid.

```bash
PROJECT_REF="${1:-}"
check_project_ref "$PROJECT_REF"  # Exits if invalid
```

**Format requirements:**
- Must start with lowercase letter or digit
- Can contain lowercase letters, digits, and hyphens
- Example valid: `my-project`, `project123`, `p1`
- Example invalid: `MyProject`, `project_123`, `-project`

---

### get_project_ref()

Interactively prompt user to select a project from available projects. Uses the `projects:list` CLI command and displays numbered options.

```bash
# Interactive selection if project ref not provided
if [[ -z "$PROJECT_REF" ]]; then
  PROJECT_REF=$(get_project_ref)
fi
```

**Requirements:**
- `jq` must be installed
- User must be authenticated (SUPABASE_ACCESS_TOKEN set)

**Behavior:**
- Fetches list of projects
- Displays numbered options
- Prompts for selection
- Returns selected project reference
- Exits with status 1 on error

**Example output:**
```
[INFO] 2024-01-15 10:30:45 - Fetching available projects...
Available projects:
     1  my-project - My First Project
     2  prod-app - Production App
     3  staging-db - Staging Database
Select project number (1-3): 2
```

---

### check_command()

Verify that a command is available in PATH. Exits with error message if not found.

```bash
check_command "jq"
check_command "curl"
```

**Exit behavior:**
- Returns 0 if command exists
- Exits with status 1 if command not found

---

## User Interaction

Functions for interactive prompts and confirmations.

### confirm_action()

Prompt user for confirmation on destructive operations. Requires user to type "yes" to confirm, defaults to "no" for safety.

```bash
if confirm_action "Delete this backup? This cannot be undone."; then
  # Delete the backup
  supabase-cli backup:delete "$PROJECT_REF" "$BACKUP_ID"
fi
```

**Return values:**
- Returns 0 if user types "yes"
- Returns 1 if user presses Enter or types anything else
- Always logs cancellation message if declined

**Example interaction:**
```
⚠ WARNING
Delete this backup? This cannot be undone.
Type 'yes' to confirm, or press Enter to cancel: no
[INFO] 2024-01-15 10:30:45 - Operation cancelled
```

---

### pause()

Wait for user to press Enter. Useful for breakpoints in scripts.

```bash
pause "Review the above information and press Enter to continue..."
```

**Parameters:**
- `$1`: Message to display (optional, defaults to "Press Enter to continue...")

---

## Output Formatting

Functions for formatting and displaying output.

### format_json()

Pretty-print JSON using `jq` if available, otherwise output raw JSON. Can accept input as argument or via pipe.

```bash
# As argument
format_json "$json_response"

# Via pipe
echo "$json_response" | format_json

# With command output
supabase-cli backup:list "$PROJECT_REF" --format json | format_json
```

**Behavior:**
- Uses `jq` for pretty-printing if available
- Falls back to raw output if `jq` not installed
- Handles piped input automatically

---

### print_header()

Print a formatted section header with styling.

```bash
print_header "Backup Operations"
print_header "Project: $PROJECT_REF"
```

**Output:**
```
=== Backup Operations ===
```

---

### print_divider()

Print a horizontal divider line for visual separation.

```bash
print_header "Section 1"
# ... content ...
print_divider
print_header "Section 2"
```

**Output:**
```
────────────────────────────────────────
```

---

## Error Handling

Functions for consistent error handling and exit.

### handle_error()

Log error message with optional details and exit with specified status code.

```bash
# Simple error
handle_error "Failed to create backup" 1

# With details
if [[ $? -ne 0 ]]; then
  handle_error "API call failed" 1 "Status code: 500"
fi

# Custom exit code
handle_error "Configuration error" 2 "Missing required setting"
```

**Parameters:**
- `$1`: Error message (required)
- `$2`: Exit code (optional, defaults to 1)
- `$3`: Additional details (optional)

**Behavior:**
- Logs error message in red
- Logs details if provided
- Exits with specified status code
- Does not return

---

## Spinners & Progress

Functions for showing progress during long operations.

### spinner_start()

Start an animated spinner in the background. Typically used with `spinner_stop()`.

```bash
spinner_start "Creating backup..."
SPINNER_PID=$!

# ... long operation ...

spinner_stop
```

**Parameters:**
- `$1`: Message to display alongside spinner

**Behavior:**
- Starts spinner in background
- Sets `SPINNER_PID` variable
- Hides cursor during operation
- Updates display at 100ms intervals

---

### spinner_stop()

Stop the running spinner and show cursor again.

```bash
spinner_start "Uploading..."
SPINNER_PID=$!

# ... operation ...

spinner_stop
```

**Behavior:**
- Kills background spinner process
- Shows cursor again
- Clears spinner line
- Safe to call even if no spinner is running

---

### run_with_spinner()

Execute a command with spinner display. Combines `spinner_start()` and `spinner_stop()`.

```bash
# Simple command
run_with_spinner "Fetching data..." curl https://api.example.com

# With multiple arguments
run_with_spinner "Creating backup..." \
  supabase-cli backup:create "$PROJECT_REF" \
  --description "Automated backup"

# Capture output
output=$(run_with_spinner "Processing..." some_command arg1 arg2)
```

**Parameters:**
- `$1`: Message to display (required)
- `$2+`: Command and arguments to execute (required)

**Behavior:**
- Shows spinner while command runs
- Captures stdout and stderr
- Logs error if command fails
- Returns command exit code

---

## Helper Functions

General utility functions for common tasks.

### print_header()

Print a bold, colored section header. (Also documented under Output Formatting above)

```bash
print_header "Main Operations"
print_header "Step 1: Validation"
```

---

### print_divider()

Print a colored horizontal line for visual separation. (Also documented under Output Formatting above)

```bash
print_divider
```

---

## Additional Validation

Functions for validating specific input formats.

### validate_cidr()

Validate CIDR notation for IP address ranges. Used for network restrictions.

```bash
if validate_cidr "192.168.1.0/24"; then
  log_success "Valid CIDR notation"
else
  handle_error "Invalid CIDR format" 1
fi
```

**Format requirements:**
- Must be in format: `XXX.XXX.XXX.XXX/YY`
- Each octet: 0-255
- Prefix length: 0-32

**Valid examples:**
- `192.168.1.0/24`
- `10.0.0.0/8`
- `172.16.0.0/12`
- `192.168.1.1/32`

**Invalid examples:**
- `192.168.1.0` (missing prefix)
- `192.168.1.0/33` (prefix > 32)
- `256.1.1.1/24` (octet > 255)

**Return values:**
- Returns 0 if valid
- Returns 1 if invalid

---

### validate_timestamp()

Validate ISO 8601 timestamp format. Used for point-in-time recovery and time-based operations.

```bash
if validate_timestamp "2024-01-15T10:30:00Z"; then
  log_success "Valid timestamp"
else
  handle_error "Invalid timestamp format" 1
fi
```

**Format requirements:**
- Must be in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ`
- Date: Valid year, month (01-12), day (01-31)
- Time: Valid hours (00-23), minutes (00-59), seconds (00-59)
- Must end with 'Z' (UTC indicator)

**Valid examples:**
- `2024-01-15T10:30:00Z`
- `2024-12-31T23:59:59Z`
- `2024-01-01T00:00:00Z`

**Invalid examples:**
- `2024-01-15T10:30:00` (missing Z)
- `2024-01-15 10:30:00Z` (space instead of T)
- `15/01/2024T10:30:00Z` (wrong date format)

**Return values:**
- Returns 0 if valid
- Returns 1 if invalid

---

## Color Constants

The following color variables are available for advanced formatting:

```bash
# Color variables
$RED      # Red color
$GREEN    # Green color
$YELLOW   # Yellow color
$BLUE     # Blue color
$BOLD     # Bold text
$RESET    # Reset all formatting
```

**Example usage:**
```bash
echo "${BLUE}[INFO]${RESET} Custom message"
echo "${RED}${BOLD}CRITICAL ERROR${RESET}"
```

---

## Environment Variables

### SUPABASE_CLI

The command name for the CLI. Defaults to `supabase-cli`.

```bash
# Override default
export SUPABASE_CLI="my-cli"
source common.sh
```

### SPINNER_CHARS

Unicode characters used for spinner animation. Defaults to Braille pattern characters.

```bash
# Override for ASCII-only environments
export SPINNER_CHARS="/-\|"
```

### SPINNER_DELAY

Delay between spinner frames in seconds. Defaults to 0.1 (100ms).

```bash
# Slower animation
export SPINNER_DELAY="0.2"
```

---

## Common Patterns

### Complete Authentication & Selection

```bash
#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"

check_auth
PROJECT_REF="${1:-}"

if [[ -z "$PROJECT_REF" ]]; then
  PROJECT_REF=$(get_project_ref)
fi

check_project_ref "$PROJECT_REF"
log_success "Using project: $PROJECT_REF"
```

### Destructive Operation with Confirmation

```bash
if confirm_action "Delete backup $BACKUP_ID? This cannot be undone."; then
  run_with_spinner "Deleting..." \
    supabase-cli backup:delete "$PROJECT_REF" "$BACKUP_ID"
  log_success "Backup deleted"
else
  log_warning "Deletion cancelled"
fi
```

### Error Handling Chain

```bash
check_auth || exit 1
check_project_ref "$PROJECT_REF" || exit 1
check_command "jq" || exit 1

if ! data=$(supabase-cli backup:list "$PROJECT_REF" --format json); then
  handle_error "Failed to fetch backups" 1
fi
```

### Long-Running Operation with Progress

```bash
log_info "Starting operation..."
spinner_start "Processing..."

if result=$(long_running_command arg1 arg2 2>&1); then
  spinner_stop
  log_success "Operation completed"
  echo "$result" | format_json
else
  spinner_stop
  handle_error "Operation failed" 1
fi
```

---

## Related Files

- [README.md](./README.md) - General examples documentation
- [example-backup-workflow.sh](./example-backup-workflow.sh) - Complete example script
