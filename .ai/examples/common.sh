#!/usr/bin/env bash
#
# Common utility functions for Supabase CLI examples
#
# This file provides reusable functions for all example scripts in the .ai/examples directory.
# Source this file in your scripts using:
#   source "$(dirname "$0")/common.sh"
#
# Author: Supabase CLI Examples
# License: Same as parent project
#

# Strict mode: exit on error, undefined variables, pipe failures
set -euo pipefail

# ============================================================================
# Color Setup - Use tput for portability with fallback to no colors
# ============================================================================

# Initialize color variables with tput if available, otherwise use empty strings
if command -v tput >/dev/null 2>&1; then
  RED=$(tput setaf 1)
  GREEN=$(tput setaf 2)
  YELLOW=$(tput setaf 3)
  BLUE=$(tput setaf 4)
  BOLD=$(tput bold)
  RESET=$(tput sgr0)
else
  # Fallback for systems without tput
  RED=""
  GREEN=""
  YELLOW=""
  BLUE=""
  BOLD=""
  RESET=""
fi

# ============================================================================
# Configuration
# ============================================================================

# CLI command name (can be overridden by setting SUPABASE_CLI before sourcing)
SUPABASE_CLI="${SUPABASE_CLI:-supabase-cli}"

# Default spinner characters
SPINNER_CHARS="⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
SPINNER_DELAY=0.1

# ============================================================================
# Logging Functions
# ============================================================================

# Log info message (blue, with timestamp)
# Usage: log_info "Your message here"
log_info() {
  echo "${BLUE}[INFO]${RESET} $(date '+%Y-%m-%d %H:%M:%S') - $*" >&2
}

# Log success message (green, with timestamp)
# Usage: log_success "Operation completed"
log_success() {
  echo "${GREEN}[SUCCESS]${RESET} $(date '+%Y-%m-%d %H:%M:%S') - $*" >&2
}

# Log warning message (yellow, with timestamp)
# Usage: log_warning "Be careful about this"
log_warning() {
  echo "${YELLOW}[WARNING]${RESET} $(date '+%Y-%m-%d %H:%M:%S') - $*" >&2
}

# Log error message (red, with timestamp)
# Usage: log_error "Something went wrong"
log_error() {
  echo "${RED}[ERROR]${RESET} $(date '+%Y-%m-%d %H:%M:%S') - $*" >&2
}

# ============================================================================
# Utility Functions
# ============================================================================

# Check if SUPABASE_ACCESS_TOKEN environment variable is set
# Exits with status 1 if not set
# Usage: check_auth
check_auth() {
  if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
    log_error "SUPABASE_ACCESS_TOKEN environment variable not set"
    log_info "Set it with: export SUPABASE_ACCESS_TOKEN='your-token'"
    log_info "Or save it to ~/.supabase/access-token"
    exit 1
  fi
}

# Validate that a project reference is provided
# Exits with status 1 if project ref is empty or invalid
# Usage: check_project_ref "$project_ref"
check_project_ref() {
  local project_ref="${1:-}"

  if [[ -z "$project_ref" ]]; then
    log_error "Project reference is required"
    log_info "Usage: $0 <project-ref>"
    exit 1
  fi

  # Basic validation: project refs are typically alphanumeric with hyphens
  if ! [[ "$project_ref" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
    log_error "Invalid project reference: '$project_ref'"
    log_info "Project references should start with a letter or digit and contain only lowercase letters, digits, and hyphens"
    exit 1
  fi
}

# Get project reference interactively using projects:list command
# Prompts user to select from available projects
# Usage: PROJECT_REF=$(get_project_ref)
get_project_ref() {
  log_info "Fetching available projects..."

  # Call the projects:list command and capture output
  local projects_json
  projects_json=$("$SUPABASE_CLI" projects:list --format json 2>/dev/null) || {
    log_error "Failed to fetch projects. Make sure you're authenticated."
    exit 1
  }

  # Check if jq is available for parsing JSON
  if ! command -v jq >/dev/null 2>&1; then
    log_error "jq is required for parsing project data"
    log_info "Install jq and try again"
    exit 1
  fi

  # Parse project list and display options
  local project_count
  project_count=$(echo "$projects_json" | jq 'length' 2>/dev/null) || {
    log_error "Failed to parse project list"
    exit 1
  }

  if [[ $project_count -eq 0 ]]; then
    log_error "No projects found"
    exit 1
  fi

  echo "Available projects:" >&2
  echo "$projects_json" | jq -r ".[] | \"\(.ref) - \(.name)\"" | nl >&2

  # Prompt user for selection
  local selection
  read -rp "Select project number (1-$project_count): " selection >&2

  # Validate selection is a number
  if ! [[ "$selection" =~ ^[0-9]+$ ]] || [[ $selection -lt 1 ]] || [[ $selection -gt $project_count ]]; then
    log_error "Invalid selection: $selection"
    exit 1
  fi

  # Extract selected project ref (convert to 0-based index)
  local project_ref
  project_ref=$(echo "$projects_json" | jq -r ".[$((selection - 1))].ref") || {
    log_error "Failed to extract project reference"
    exit 1
  }

  echo "$project_ref"
}

# Handle errors consistently across all scripts
# Logs error message, optional details, and exits with specified status
# Usage: handle_error "Something went wrong" 1
# Usage: handle_error "API call failed" 2 "Response: $response"
handle_error() {
  local message="${1:-Unknown error}"
  local exit_code="${2:-1}"
  local details="${3:-}"

  log_error "$message"

  if [[ -n "$details" ]]; then
    echo "${RED}Details:${RESET} $details" >&2
  fi

  exit "$exit_code"
}

# Prompt user for confirmation on destructive operations
# Defaults to "no" for safety
# Returns 0 if confirmed, 1 if declined
# Usage: if confirm_action "Delete this project?"; then # do something; fi
confirm_action() {
  local prompt="${1:-Are you sure?}"
  local user_response

  # Display warning in yellow
  echo "${YELLOW}⚠ WARNING${RESET}" >&2
  echo "$prompt" >&2
  read -rp "Type 'yes' to confirm, or press Enter to cancel: " user_response >&2

  if [[ "$user_response" == "yes" ]]; then
    return 0
  else
    log_info "Operation cancelled"
    return 1
  fi
}

# Check if a command is available in PATH
# Exits with error message if command not found
# Usage: check_command "jq"
check_command() {
  local cmd="${1:-}"

  if [[ -z "$cmd" ]]; then
    log_error "check_command: command name is required"
    exit 1
  fi

  if ! command -v "$cmd" >/dev/null 2>&1; then
    log_error "Required command not found: $cmd"
    log_info "Please install $cmd and try again"
    exit 1
  fi
}

# Format JSON output using jq if available, otherwise output raw JSON
# Usage: format_json "$json_string"
# Usage: some_command | format_json
format_json() {
  local input="${1:-}"

  # If input is provided as argument
  if [[ -n "$input" ]]; then
    if command -v jq >/dev/null 2>&1; then
      echo "$input" | jq '.' 2>/dev/null || echo "$input"
    else
      echo "$input"
    fi
  else
    # If input is piped to this function
    if command -v jq >/dev/null 2>&1; then
      jq '.' 2>/dev/null || cat
    else
      cat
    fi
  fi
}

# Show an animated spinner while waiting for a long-running operation
# The spinner runs in the background and stops when the operation completes
# Usage:
#   spinner "Uploading..." &
#   SPINNER_PID=$!
#   some_long_operation
#   kill $SPINNER_PID 2>/dev/null
# Or with a function:
#   spinner_start "Loading..."
#   # do work
#   spinner_stop
spinner_start() {
  local message="${1:-Processing...}"

  # Hide cursor
  if command -v tput >/dev/null 2>&1; then
    tput civis 2>/dev/null || true
  fi

  # Start spinner in background
  {
    local idx=0
    while true; do
      local char="${SPINNER_CHARS:$((idx % ${#SPINNER_CHARS})):1}"
      printf "\r${BLUE}${char}${RESET} %s" "$message" >&2
      idx=$((idx + 1))
      sleep "$SPINNER_DELAY"
    done
  } &

  # Save background process ID
  SPINNER_PID=$!
}

# Stop the running spinner
# Usage: spinner_stop
spinner_stop() {
  if [[ -n "${SPINNER_PID:-}" ]] && kill -0 "$SPINNER_PID" 2>/dev/null; then
    kill "$SPINNER_PID" 2>/dev/null || true
    wait "$SPINNER_PID" 2>/dev/null || true
  fi

  # Show cursor again
  if command -v tput >/dev/null 2>&1; then
    tput cnorm 2>/dev/null || true
  fi

  # Clear the line
  printf "\r" >&2
}

# Execute a command with spinner
# Usage: run_with_spinner "Processing..." some_command arg1 arg2
run_with_spinner() {
  local message="${1:-}"
  shift

  local output
  local exit_code=0

  spinner_start "$message"

  if output=$("$@" 2>&1); then
    spinner_stop
    echo "$output"
  else
    exit_code=$?
    spinner_stop
    log_error "Command failed: $*"
    echo "$output" >&2
    return $exit_code
  fi
}

# ============================================================================
# Helper Functions
# ============================================================================

# Print a formatted section header
# Usage: print_header "Starting Database Backup"
print_header() {
  local title="${1:-}"

  echo "" >&2
  echo "${BOLD}${BLUE}=== $title ===${RESET}" >&2
  echo "" >&2
}

# Print a horizontal divider
# Usage: print_divider
print_divider() {
  echo "${BLUE}────────────────────────────────────────${RESET}" >&2
}

# Pause and wait for user to press Enter
# Usage: pause "Press Enter to continue..."
pause() {
  local message="${1:-Press Enter to continue...}"
  read -rp "$message" >&2
}

# ============================================================================
# Validation Functions
# ============================================================================

# Validate CIDR notation for IP restrictions
# Returns 0 if valid, 1 if invalid
# Usage: if validate_cidr "192.168.1.0/24"; then # valid; fi
validate_cidr() {
  local cidr="${1:-}"

  if [[ -z "$cidr" ]]; then
    log_error "CIDR is required"
    return 1
  fi

  # Basic CIDR validation (IP/prefix)
  if [[ ! "$cidr" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/[0-9]{1,2}$ ]]; then
    log_error "Invalid CIDR notation: $cidr"
    log_info "Expected format: 192.168.1.0/24"
    return 1
  fi

  return 0
}

# Validate timestamp in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
# Returns 0 if valid, 1 if invalid
# Usage: if validate_timestamp "2024-01-15T10:30:00Z"; then # valid; fi
validate_timestamp() {
  local timestamp="${1:-}"

  if [[ -z "$timestamp" ]]; then
    log_error "Timestamp is required"
    return 1
  fi

  # Basic ISO 8601 validation
  if [[ ! "$timestamp" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]]; then
    log_error "Invalid timestamp format: $timestamp"
    log_info "Expected format: 2024-01-15T10:30:00Z (ISO 8601)"
    return 1
  fi

  return 0
}

# ============================================================================
# Export for use in scripts
# ============================================================================

# Make all functions available to scripts that source this file
export -f log_info log_success log_warning log_error
export -f check_auth check_project_ref get_project_ref
export -f handle_error confirm_action check_command
export -f format_json spinner_start spinner_stop run_with_spinner
export -f print_header print_divider pause
export -f validate_cidr validate_timestamp
