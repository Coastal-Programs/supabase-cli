#!/usr/bin/env bash
#
# Example: Backup Workflow
#
# This script demonstrates how to use common.sh for a backup workflow:
# 1. Check authentication
# 2. Get or validate project reference
# 3. Create a backup with confirmation
# 4. List backups with formatted output
#
# Usage:
#   ./example-backup-workflow.sh
#   ./example-backup-workflow.sh <project-ref>
#
# Requirements:
#   - supabase-cli must be installed and in PATH
#   - SUPABASE_ACCESS_TOKEN environment variable must be set
#   - jq is recommended for JSON output formatting
#

# Source common utilities
# This file must be in the same directory as common.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# ============================================================================
# Script Configuration
# ============================================================================

PROJECT_REF="${1:-}"
BACKUP_DESCRIPTION="Automated backup $(date '+%Y-%m-%d %H:%M:%S')"

# ============================================================================
# Main Script Logic
# ============================================================================

main() {
  print_header "Supabase Backup Workflow"

  # Step 1: Check authentication
  log_info "Verifying authentication..."
  check_auth
  log_success "Authentication verified"

  # Step 2: Get or validate project reference
  if [[ -z "$PROJECT_REF" ]]; then
    log_info "No project reference provided. Fetching available projects..."
    PROJECT_REF=$(get_project_ref) || exit 1
  else
    log_info "Validating project reference: $PROJECT_REF"
    check_project_ref "$PROJECT_REF"
  fi

  log_success "Using project: $PROJECT_REF"
  print_divider

  # Step 3: List current backups
  print_header "Current Backups"
  log_info "Fetching backups for project $PROJECT_REF..."

  local backups_json
  backups_json=$("$SUPABASE_CLI" backup:list "$PROJECT_REF" --format json 2>/dev/null) || {
    handle_error "Failed to fetch backups" 1 "Make sure the project reference is correct"
  }

  if [[ -n "$backups_json" ]]; then
    log_success "Backups found:"
    echo "$backups_json" | format_json
  else
    log_warning "No backups found for this project"
  fi

  print_divider

  # Step 4: Create backup with confirmation
  print_header "Create New Backup"
  log_info "Description: $BACKUP_DESCRIPTION"

  if confirm_action "Create a backup for project $PROJECT_REF?"; then
    log_info "Creating backup..."

    if run_with_spinner "Creating backup..." \
      "$SUPABASE_CLI" backup:create "$PROJECT_REF" \
      --description "$BACKUP_DESCRIPTION" \
      --format json >/dev/null 2>&1; then
      log_success "Backup created successfully!"
    else
      handle_error "Failed to create backup" 1
    fi

    # List updated backups
    print_divider
    print_header "Updated Backup List"
    log_info "Fetching updated backups..."

    local updated_backups
    updated_backups=$("$SUPABASE_CLI" backup:list "$PROJECT_REF" --format json 2>/dev/null) || {
      handle_error "Failed to fetch updated backups" 1
    }

    echo "$updated_backups" | format_json
    log_success "Backup workflow completed successfully!"
  fi

  print_divider
  log_success "Workflow finished"
}

# ============================================================================
# Error Handling
# ============================================================================

# Set up trap to clean up spinner if script is interrupted
trap 'spinner_stop 2>/dev/null; exit 130' INT TERM

# Run main function
main "$@"
