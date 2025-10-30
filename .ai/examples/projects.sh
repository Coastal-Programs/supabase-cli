#!/usr/bin/env bash
#
# Project Management Examples
# Usage: ./projects.sh [project-ref]
#
# Examples from Sprint 2A workflows and patterns for managing Supabase projects
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
# Example 1: List All Projects
# ============================================================================
# Workflow: create-new-project (step 2)
# Pattern: list-then-get

example_list_projects() {
  print_header "Example 1: List All Projects"

  log_info "Listing all accessible Supabase projects..."

  if result=$("$SUPABASE_CLI" projects:list --format json); then
    log_success "Found $(echo "$result" | jq 'length') project(s)"

    # Display in table format for readability
    echo "$result" | jq -r '.[] | "\(.ref)\t\(.name)\t\(.region)\t\(.status)"' | \
      awk 'BEGIN {printf "%-20s %-30s %-15s %-20s\n", "REF", "NAME", "REGION", "STATUS";
                  printf "%-20s %-30s %-15s %-20s\n", "---", "----", "------", "------"}
           {printf "%-20s %-30s %-15s %-20s\n", $1, $2, $3, $4}'

    echo ""
    log_info "Tip: Use 'projects:get <project-ref>' to see detailed configuration"
  else
    handle_error "Failed to list projects" "$?"
  fi
}

# ============================================================================
# Example 2: Get Project Details
# ============================================================================
# Workflow: create-new-project (step 1), pause-resume-project (step 1)
# Pattern: list-then-get

example_get_project() {
  print_header "Example 2: Get Project Details"

  log_info "Fetching details for project: $PROJECT_REF"

  if result=$("$SUPABASE_CLI" projects:get "$PROJECT_REF" --format json); then
    log_success "Retrieved project details"

    # Extract and display key information
    local name region status created_at
    name=$(echo "$result" | jq -r '.name')
    region=$(echo "$result" | jq -r '.region')
    status=$(echo "$result" | jq -r '.status')
    created_at=$(echo "$result" | jq -r '.created_at')

    echo ""
    echo "Project Information:"
    echo "  Name:       $name"
    echo "  Reference:  $PROJECT_REF"
    echo "  Region:     $region"
    echo "  Status:     $status"
    echo "  Created:    $created_at"
    echo ""

    # Full JSON output
    log_info "Complete project configuration:"
    format_json "$result"
  else
    handle_error "Failed to retrieve project details" "$?"
  fi
}

# ============================================================================
# Example 3: Create New Project
# ============================================================================
# Workflow: create-new-project
# Pattern: create-verify

example_create_project() {
  print_header "Example 3: Create New Project (with confirmation)"

  log_warning "This operation will create a new Supabase project and may incur costs"

  if ! confirm_action "Create a new project named 'example-project' in us-east-1?"; then
    return 0
  fi

  log_info "Creating new project..."
  log_info "Name: example-project"
  log_info "Region: us-east-1"

  # Note: This example assumes you have organization ID
  # In real usage, you would get this from projects:list or config
  local org_id="org-example123"

  log_warning "Note: You need to set ORG_ID to your organization ID"
  log_info "Get your org ID from the Supabase dashboard or projects:list output"

  # Uncomment to actually create (requires valid org_id)
  # if result=$("$SUPABASE_CLI" projects:create \
  #   --name "example-project" \
  #   --organization "$org_id" \
  #   --region us-east-1 \
  #   --format json); then
  #
  #   local new_ref
  #   new_ref=$(echo "$result" | jq -r '.ref')
  #
  #   log_success "Project creation initiated"
  #   log_info "Project ref: $new_ref"
  #   log_info "Status: Provisioning (this takes 60-180 seconds)"
  #
  #   # Poll for status
  #   log_info "Waiting for project to become active..."
  #   spinner_start "Provisioning project..."
  #
  #   local attempts=0
  #   local max_attempts=60  # 10 minutes max
  #
  #   while [[ $attempts -lt $max_attempts ]]; do
  #     sleep 10
  #
  #     if status=$("$SUPABASE_CLI" projects:get "$new_ref" --format json 2>/dev/null); then
  #       local project_status
  #       project_status=$(echo "$status" | jq -r '.status')
  #
  #       if [[ "$project_status" == "ACTIVE_HEALTHY" ]]; then
  #         spinner_stop
  #         log_success "Project is now active!"
  #         break
  #       fi
  #     fi
  #
  #     attempts=$((attempts + 1))
  #   done
  #
  #   spinner_stop
  #
  #   if [[ $attempts -ge $max_attempts ]]; then
  #     log_warning "Project is still provisioning. Check status with: projects:get $new_ref"
  #   fi
  # else
  #   handle_error "Failed to create project" "$?"
  # fi

  log_info "Example skipped - set ORG_ID and uncomment code to actually create"
}

# ============================================================================
# Example 4: Pause Project
# ============================================================================
# Workflow: pause-resume-project
# Pattern: backup-before-destructive, project-pause-resume

example_pause_project() {
  print_header "Example 4: Pause Project (with confirmation)"

  log_warning "This operation will make the project temporarily unavailable"
  log_info "Use this for development environments to save costs during off-hours"

  if ! confirm_action "Pause project $PROJECT_REF?"; then
    return 0
  fi

  # Step 1: Check current status
  log_info "Checking current project status..."

  if current_status=$("$SUPABASE_CLI" projects:get "$PROJECT_REF" --format json); then
    local status
    status=$(echo "$current_status" | jq -r '.status')

    log_info "Current status: $status"

    if [[ "$status" != "ACTIVE_HEALTHY" ]]; then
      log_warning "Project is not in ACTIVE_HEALTHY state"
      log_info "Current state: $status"
      log_info "Pause operation may not be available"
      return 0
    fi
  else
    handle_error "Failed to check project status" "$?"
  fi

  # Step 2: Create safety backup before pausing
  log_info "Creating safety backup before pause..."

  if backup_result=$("$SUPABASE_CLI" backup:create "$PROJECT_REF" \
    --description "Pre-pause safety backup" \
    --format json); then

    local backup_id
    backup_id=$(echo "$backup_result" | jq -r '.id // .backup_id // "unknown"')
    log_success "Safety backup created: $backup_id"
  else
    log_warning "Failed to create backup, but continuing with pause..."
  fi

  # Step 3: Pause the project
  log_info "Pausing project $PROJECT_REF..."

  # Note: projects:pause command with --yes flag
  # Uncomment to actually pause (destructive operation)
  # if pause_result=$("$SUPABASE_CLI" projects:pause "$PROJECT_REF" --yes); then
  #   log_success "Project paused successfully"
  #
  #   # Step 4: Verify paused status
  #   log_info "Verifying project status..."
  #
  #   if verify_status=$("$SUPABASE_CLI" projects:get "$PROJECT_REF" --format json); then
  #     local new_status
  #     new_status=$(echo "$verify_status" | jq -r '.status')
  #     log_info "New status: $new_status"
  #
  #     if [[ "$new_status" == "PAUSED" ]]; then
  #       log_success "Project successfully paused"
  #       log_info "To resume: Use the dashboard or API to resume the project"
  #     fi
  #   fi
  # else
  #   handle_error "Failed to pause project" "$?"
  # fi

  log_info "Example skipped - uncomment code to actually pause"
  log_warning "Remember: Pausing makes the project unavailable until resumed"
}

# ============================================================================
# Main
# ============================================================================

main() {
  print_header "Supabase CLI - Project Management Examples"

  echo "Project reference: $PROJECT_REF"
  echo ""

  example_list_projects
  echo ""
  print_divider
  echo ""

  example_get_project
  echo ""
  print_divider
  echo ""

  example_create_project
  echo ""
  print_divider
  echo ""

  example_pause_project
  echo ""

  log_success "All project management examples completed"
}

# Run main if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
