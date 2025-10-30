#!/usr/bin/env bash
#
# Backup and Restore Examples
# Usage: ./backup.sh [project-ref]
#
# Examples from Sprint 2A workflows for database backup and recovery
#

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source common utilities
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

# ============================================================================
# Configuration
# ============================================================================

PROJECT_REF="${1:-}"

# ============================================================================
# Validation
# ============================================================================

check_command "$SUPABASE_CLI"
check_auth

if [[ -z "$PROJECT_REF" ]]; then
  log_warning "No project ref provided"
  PROJECT_REF=$(get_project_ref)
fi

# ============================================================================
# Example 1: List All Backups
# ============================================================================
# Workflow: create-first-backup (step 2), restore-from-backup (step 2)
# Pattern: list-then-get

example_list_backups() {
  print_header "Example 1: List All Backups"

  log_info "Fetching backup list for project: $PROJECT_REF"

  if result=$("$SUPABASE_CLI" backup:list "$PROJECT_REF" --format json); then
    local backup_count
    backup_count=$(echo "$result" | jq 'length')

    log_success "Found $backup_count backup(s)"

    if [[ $backup_count -eq 0 ]]; then
      log_info "No backups exist yet. Create one with: backup:create"
      return 0
    fi

    # Display backups in table format
    echo ""
    echo "Recent Backups:"
    echo "$result" | jq -r '.[] | "\(.id)\t\(.created_at)\t\(.status)\t\(.description // "N/A")"' | \
      awk 'BEGIN {printf "%-25s %-25s %-15s %-30s\n", "ID", "CREATED", "STATUS", "DESCRIPTION";
                  printf "%-25s %-25s %-15s %-30s\n", "--", "-------", "------", "-----------"}
           {printf "%-25s %-25s %-15s %-30s\n", $1, $2, $3, $4}'

    echo ""
    log_info "Tip: Use 'backup:get <project-ref> <backup-id>' for detailed information"
  else
    handle_error "Failed to list backups" "$?"
  fi
}

# ============================================================================
# Example 2: Create Manual Backup
# ============================================================================
# Workflow: create-first-backup
# Pattern: create-verify

example_create_backup() {
  print_header "Example 2: Create Manual Backup"

  log_info "Creating manual database backup..."
  log_info "Project: $PROJECT_REF"

  local description="Manual backup - $(date '+%Y-%m-%d %H:%M:%S')"

  log_info "Description: $description"

  if result=$("$SUPABASE_CLI" backup:create "$PROJECT_REF" \
    --description "$description" \
    --format json); then

    local backup_id
    backup_id=$(echo "$result" | jq -r '.id // .backup_id')

    log_success "Backup creation initiated"
    log_info "Backup ID: $backup_id"

    # Step 2: Verify backup completion
    log_info "Waiting for backup to complete..."
    spinner_start "Creating backup..."

    local attempts=0
    local max_attempts=30  # 5 minutes max (30 * 10 seconds)
    local backup_status=""

    while [[ $attempts -lt $max_attempts ]]; do
      sleep 10

      if status_result=$("$SUPABASE_CLI" backup:get "$PROJECT_REF" "$backup_id" --format json 2>/dev/null); then
        backup_status=$(echo "$status_result" | jq -r '.status')

        if [[ "$backup_status" == "COMPLETED" ]]; then
          spinner_stop
          log_success "Backup completed successfully!"

          # Display backup details
          local size created_at
          size=$(echo "$status_result" | jq -r '.size_bytes // 0')
          created_at=$(echo "$status_result" | jq -r '.created_at')

          echo ""
          echo "Backup Details:"
          echo "  ID:          $backup_id"
          echo "  Status:      $backup_status"
          echo "  Size:        $size bytes"
          echo "  Created At:  $created_at"
          echo "  Description: $description"
          echo ""

          break
        elif [[ "$backup_status" == "FAILED" ]]; then
          spinner_stop
          handle_error "Backup failed" 1
        fi
      fi

      attempts=$((attempts + 1))
    done

    spinner_stop

    if [[ $attempts -ge $max_attempts ]]; then
      log_warning "Backup is still in progress. Check status with: backup:get $PROJECT_REF $backup_id"
    fi
  else
    handle_error "Failed to create backup" "$?"
  fi
}

# ============================================================================
# Example 3: Restore from Backup
# ============================================================================
# Workflow: restore-from-backup
# Pattern: backup-before-destructive

example_restore_backup() {
  print_header "Example 3: Restore from Backup (with confirmation)"

  log_warning "This is a DESTRUCTIVE operation - current data will be replaced!"

  # Step 1: List available backups
  log_info "Fetching available backups..."

  if backups=$("$SUPABASE_CLI" backup:list "$PROJECT_REF" --format json); then
    local backup_count
    backup_count=$(echo "$backups" | jq 'length')

    if [[ $backup_count -eq 0 ]]; then
      log_error "No backups available to restore from"
      return 1
    fi

    log_info "Available backups: $backup_count"

    # Display backups for selection
    echo "$backups" | jq -r '.[] | "\(.id)\t\(.created_at)\t\(.description // "N/A")"' | \
      awk 'BEGIN {printf "%-25s %-25s %-30s\n", "ID", "CREATED", "DESCRIPTION"}
           {printf "%-25s %-25s %-30s\n", $1, $2, $3}'

    # For this example, use the most recent backup
    local backup_id
    backup_id=$(echo "$backups" | jq -r '.[0].id')

    log_info "Using most recent backup: $backup_id"
  else
    handle_error "Failed to list backups" "$?"
  fi

  # Step 2: Create safety backup before restore
  log_info "Creating safety backup of current state..."

  if safety_backup=$("$SUPABASE_CLI" backup:create "$PROJECT_REF" \
    --description "Pre-restore safety backup" \
    --format json); then

    local safety_id
    safety_id=$(echo "$safety_backup" | jq -r '.id // .backup_id')
    log_success "Safety backup created: $safety_id"
    log_info "If restore fails, you can restore from: $safety_id"
  else
    log_warning "Failed to create safety backup, but continuing..."
  fi

  # Step 3: Confirm restore operation
  if ! confirm_action "Restore from backup $backup_id? This will REPLACE current data."; then
    return 0
  fi

  # Step 4: Perform restore
  log_info "Restoring from backup: $backup_id"

  # Note: Destructive operation - commented out for safety
  # Uncomment to actually restore (use --yes to skip prompt)
  # if restore_result=$("$SUPABASE_CLI" backup:restore "$PROJECT_REF" "$backup_id" --yes); then
  #   log_success "Restore operation initiated"
  #
  #   # Step 5: Verify database is operational
  #   log_info "Verifying database after restore..."
  #   sleep 5  # Wait for restore to complete
  #
  #   if query_result=$("$SUPABASE_CLI" db:query "$PROJECT_REF" \
  #     "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'" \
  #     --format json 2>/dev/null); then
  #     log_success "Database is operational after restore"
  #   else
  #     log_error "Database query failed after restore"
  #     log_info "Consider restoring from safety backup: $safety_id"
  #   fi
  # else
  #   handle_error "Failed to restore from backup" "$?"
  # fi

  log_info "Example skipped - uncomment code to actually restore"
  log_warning "Always test restores in non-production environments first!"
}

# ============================================================================
# Example 4: Set Up Automated Backup Schedule
# ============================================================================
# Workflow: setup-automated-backups
# Pattern: backup-lifecycle-full

example_setup_schedule() {
  print_header "Example 4: Set Up Automated Backup Schedule"

  log_info "Configuring automated daily backups with 7-day retention"

  # Step 1: Check existing schedules
  log_info "Checking for existing backup schedules..."

  if schedules=$("$SUPABASE_CLI" backup:schedule:list "$PROJECT_REF" --format json 2>/dev/null); then
    local schedule_count
    schedule_count=$(echo "$schedules" | jq 'length' 2>/dev/null || echo "0")

    log_info "Existing schedules: $schedule_count"

    if [[ $schedule_count -gt 0 ]]; then
      echo ""
      echo "Current Schedules:"
      echo "$schedules" | jq -r '.[] | "\(.id)\t\(.frequency)\t\(.retention_days) days"' | \
        awk 'BEGIN {printf "%-25s %-15s %-15s\n", "ID", "FREQUENCY", "RETENTION"}
             {printf "%-25s %-15s %-15s\n", $1, $2, $3}'
      echo ""

      log_warning "Backup schedule already exists"
      log_info "To modify retention, you may need to delete and recreate"
      return 0
    fi
  else
    log_info "No existing schedules found"
  fi

  # Step 2: Create daily backup schedule
  log_info "Creating daily backup schedule..."
  log_info "Frequency: daily"
  log_info "Retention: 7 days"

  if schedule_result=$("$SUPABASE_CLI" backup:schedule:create "$PROJECT_REF" \
    --frequency daily \
    --retention 7 \
    --format json); then

    local schedule_id
    schedule_id=$(echo "$schedule_result" | jq -r '.id // .schedule_id')

    log_success "Backup schedule created successfully!"

    echo ""
    echo "Schedule Details:"
    echo "  ID:         $schedule_id"
    echo "  Frequency:  daily"
    echo "  Retention:  7 days"
    echo "  Status:     active"
    echo ""

    # Step 3: Verify schedule
    log_info "Verifying schedule configuration..."

    if verify=$("$SUPABASE_CLI" backup:schedule:list "$PROJECT_REF" --format json); then
      local found
      found=$(echo "$verify" | jq -r ".[] | select(.id == \"$schedule_id\") | .id")

      if [[ "$found" == "$schedule_id" ]]; then
        log_success "Schedule verified in schedule list"
      fi
    fi

    log_info "First automated backup will occur within 24 hours"
    log_info "Backups older than 7 days will be automatically deleted"
  else
    handle_error "Failed to create backup schedule" "$?"
  fi
}

# ============================================================================
# Main
# ============================================================================

main() {
  print_header "Supabase CLI - Backup & Restore Examples"

  echo "Project reference: $PROJECT_REF"
  echo ""

  example_list_backups
  echo ""
  print_divider
  echo ""

  example_create_backup
  echo ""
  print_divider
  echo ""

  example_restore_backup
  echo ""
  print_divider
  echo ""

  example_setup_schedule
  echo ""

  log_success "All backup examples completed"
  log_info "Remember: Always verify backups and test restore procedures regularly!"
}

# Run main if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
