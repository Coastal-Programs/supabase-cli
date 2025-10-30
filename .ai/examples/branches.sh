#!/usr/bin/env bash
#
# Branch-Based Development Example
#
# This script demonstrates branch-based database development workflows using the Supabase CLI.
# It shows how to create development branches, test changes in isolation, and merge to production.
#
# Prerequisites:
#   - SUPABASE_ACCESS_TOKEN environment variable set
#   - Project reference ID
#   - Pro plan or higher (required for branches feature)
#
# Usage:
#   ./branches.sh <project-ref>
#
# References:
#   - Workflows: .ai/workflows.json - "branch-workflow" pattern
#   - Patterns: .ai/patterns.json - "branch-workflow" pattern
#

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# ============================================================================
# Example 1: List All Branches
# ============================================================================

example_list_branches() {
  local project_ref="$1"

  print_header "Example 1: List All Branches"

  log_info "Listing all branches for project: $project_ref"

  local branches
  if branches=$("$SUPABASE_CLI" branches:list "$project_ref" --format json 2>&1); then
    log_success "Branches retrieved successfully"

    # Display formatted output
    echo "$branches" | format_json

    # Count branches
    local branch_count
    branch_count=$(echo "$branches" | jq 'length' 2>/dev/null || echo "0")
    log_info "Total branches: $branch_count"

    # Show branch names and status
    if [[ $branch_count -gt 0 ]]; then
      echo ""
      log_info "Branch details:"
      echo "$branches" | jq -r '.[] | "  - \(.name): \(.status) (created: \(.created_at))"' 2>/dev/null || true
    fi
  else
    log_error "Failed to list branches"
    echo "$branches" >&2
    return 1
  fi

  echo ""
  print_divider
}

# ============================================================================
# Example 2: Create New Development Branch
# ============================================================================

example_create_branch() {
  local project_ref="$1"

  print_header "Example 2: Create New Development Branch"

  # Generate unique branch name with timestamp
  local branch_name="dev-$(date +%Y%m%d-%H%M%S)"

  log_info "Creating branch: $branch_name"
  log_warning "Branch creation can take 30-90 seconds"

  # Create branch
  spinner_start "Creating branch..."
  local result
  if result=$("$SUPABASE_CLI" branches:create "$project_ref" --name "$branch_name" --format json 2>&1); then
    spinner_stop
    log_success "Branch created successfully"

    # Extract branch ID and project ref
    local branch_id branch_ref
    branch_id=$(echo "$result" | jq -r '.id' 2>/dev/null || echo "")
    branch_ref=$(echo "$result" | jq -r '.ref' 2>/dev/null || echo "")

    log_info "Branch ID: $branch_id"
    log_info "Branch Ref: $branch_ref"

    # Poll for branch readiness
    log_info "Waiting for branch to be ready..."
    local max_attempts=30
    local attempt=0

    while [[ $attempt -lt $max_attempts ]]; do
      local status
      status=$("$SUPABASE_CLI" branches:list "$project_ref" --format json 2>/dev/null | \
        jq -r ".[] | select(.id==\"$branch_id\") | .status" 2>/dev/null || echo "")

      if [[ "$status" == "ACTIVE" ]]; then
        log_success "Branch is ready!"
        break
      fi

      log_info "Status: $status (attempt $((attempt + 1))/$max_attempts)"
      sleep 5
      attempt=$((attempt + 1))
    done

    if [[ $attempt -ge $max_attempts ]]; then
      log_warning "Branch creation timed out (status: $status)"
    fi

    # Display full details
    echo ""
    echo "$result" | format_json
  else
    spinner_stop
    log_error "Failed to create branch"
    echo "$result" >&2
    return 1
  fi

  echo ""
  print_divider
}

# ============================================================================
# Example 3: Test Changes on Branch
# ============================================================================

example_test_on_branch() {
  local project_ref="$1"

  print_header "Example 3: Test Changes on Branch"

  # Get list of branches
  log_info "Fetching available branches..."
  local branches
  if ! branches=$("$SUPABASE_CLI" branches:list "$project_ref" --format json 2>&1); then
    log_error "Failed to list branches"
    return 1
  fi

  # Check if any branches exist
  local branch_count
  branch_count=$(echo "$branches" | jq 'length' 2>/dev/null || echo "0")

  if [[ $branch_count -eq 0 ]]; then
    log_warning "No branches found. Create a branch first with Example 2."
    return 0
  fi

  # Display branches
  echo "Available branches:"
  echo "$branches" | jq -r '.[] | "\(.name) - Status: \(.status)"' | nl

  # Select first active branch for demo
  local branch_ref branch_name
  branch_ref=$(echo "$branches" | jq -r '.[] | select(.status=="ACTIVE") | .ref' 2>/dev/null | head -1 || echo "")
  branch_name=$(echo "$branches" | jq -r '.[] | select(.status=="ACTIVE") | .name' 2>/dev/null | head -1 || echo "")

  if [[ -z "$branch_ref" ]]; then
    log_warning "No active branches found. Wait for branch to be ready."
    return 0
  fi

  log_info "Testing on branch: $branch_name (ref: $branch_ref)"

  # Test 1: Check database connectivity
  log_info "Test 1: Checking database connectivity..."
  local test_result
  if test_result=$("$SUPABASE_CLI" db:query "$branch_ref" "SELECT version()" --format json 2>&1); then
    log_success "Database is accessible"
    echo "$test_result" | jq -r '.rows[0][0]' 2>/dev/null || echo "$test_result"
  else
    log_error "Database connection failed"
    echo "$test_result" >&2
  fi

  # Test 2: List tables
  log_info "Test 2: Listing tables in branch..."
  if test_result=$("$SUPABASE_CLI" db:query "$branch_ref" \
    "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename" \
    --format json 2>&1); then
    log_success "Tables retrieved"
    echo "$test_result" | jq -r '.rows[] | "  - \(.[0])"' 2>/dev/null || echo "$test_result"
  else
    log_error "Failed to list tables"
  fi

  # Test 3: Run sample query
  log_info "Test 3: Running sample query..."
  if test_result=$("$SUPABASE_CLI" db:query "$branch_ref" \
    "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema='public'" \
    --format json 2>&1); then
    log_success "Query executed"
    local count
    count=$(echo "$test_result" | jq -r '.rows[0][0]' 2>/dev/null || echo "0")
    log_info "Total tables in branch: $count"
  else
    log_error "Query failed"
  fi

  echo ""
  print_divider
}

# ============================================================================
# Example 4: Merge Branch to Main
# ============================================================================

example_merge_branch() {
  local project_ref="$1"

  print_header "Example 4: Merge Branch to Main"

  log_warning "This is a DESTRUCTIVE operation"
  log_info "Always create a backup before merging to production"

  # Get list of branches
  log_info "Fetching available branches..."
  local branches
  if ! branches=$("$SUPABASE_CLI" branches:list "$project_ref" --format json 2>&1); then
    log_error "Failed to list branches"
    return 1
  fi

  # Check if any branches exist
  local branch_count
  branch_count=$(echo "$branches" | jq 'length' 2>/dev/null || echo "0")

  if [[ $branch_count -eq 0 ]]; then
    log_warning "No branches found. Nothing to merge."
    return 0
  fi

  # Display branches
  echo "Available branches:"
  echo "$branches" | jq -r '.[] | "\(.name) - Status: \(.status)"' | nl

  # Step 1: Create pre-merge backup
  log_info "Step 1: Creating pre-merge backup of main project..."

  local backup_result backup_id
  if backup_result=$("$SUPABASE_CLI" backup:create "$project_ref" \
    --description "Pre-branch-merge backup $(date +%Y-%m-%d-%H:%M:%S)" \
    --format json 2>&1); then
    log_success "Backup created"
    backup_id=$(echo "$backup_result" | jq -r '.id' 2>/dev/null || echo "")
    log_info "Backup ID: $backup_id"

    # Wait for backup to complete
    log_info "Waiting for backup to complete..."
    sleep 5

    local backup_status
    backup_status=$("$SUPABASE_CLI" backup:get "$project_ref" "$backup_id" --format json 2>/dev/null | \
      jq -r '.status' 2>/dev/null || echo "")

    if [[ "$backup_status" == "COMPLETED" ]]; then
      log_success "Backup completed successfully"
    else
      log_warning "Backup status: $backup_status (may still be in progress)"
    fi
  else
    log_error "Failed to create backup"
    log_warning "Merge aborted for safety"
    return 1
  fi

  # Step 2: Verify branch readiness
  log_info "Step 2: Verifying branch is ready to merge..."

  local branch_status
  branch_status=$(echo "$branches" | jq -r '.[0].status' 2>/dev/null || echo "")

  if [[ "$branch_status" != "ACTIVE" ]]; then
    log_warning "Branch is not ready (status: $branch_status)"
    log_info "Merge skipped - branch must be in ACTIVE status"
    return 0
  fi

  # Step 3: Simulate merge (actual merge would use branches:merge command)
  log_info "Step 3: Preparing to merge..."
  log_warning "NOTE: Actual merge command would be:"
  echo "  supabase-cli branches:merge $project_ref <branch-id> --yes"
  log_info "Skipping actual merge in example script"

  # Step 4: Post-merge verification (simulated)
  log_info "Step 4: Post-merge verification steps:"
  echo "  1. Run db:schema to verify schema changes"
  echo "  2. Run test queries to verify data integrity"
  echo "  3. Run security:audit to check for security issues"
  echo "  4. Monitor logs for errors"
  echo "  5. Keep backup for 48 hours for rollback option"

  echo ""
  print_divider
}

# ============================================================================
# Main Function
# ============================================================================

main() {
  # Validate prerequisites
  check_auth
  check_command jq

  # Get project reference
  local project_ref="${1:-}"

  if [[ -z "$project_ref" ]]; then
    log_info "No project reference provided. Fetching available projects..."
    project_ref=$(get_project_ref)
  fi

  check_project_ref "$project_ref"

  log_info "Using project: $project_ref"
  echo ""

  # Run all examples
  example_list_branches "$project_ref" || true
  pause "Press Enter to continue to Example 2..."

  example_create_branch "$project_ref" || true
  pause "Press Enter to continue to Example 3..."

  example_test_on_branch "$project_ref" || true
  pause "Press Enter to continue to Example 4..."

  example_merge_branch "$project_ref" || true

  # Summary
  echo ""
  print_header "Examples Complete"
  log_success "All branch development examples completed"
  log_info "Review the output above for details on each operation"
  echo ""
  log_info "Next steps:"
  echo "  - Review branch status with: $SUPABASE_CLI branches:list $project_ref"
  echo "  - Test changes on branches before merging to production"
  echo "  - Always create backups before merging"
  echo "  - Clean up unused branches to save costs"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
