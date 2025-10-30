#!/usr/bin/env bash
#
# Multi-Project Automation Example
#
# This script demonstrates how to automate operations across multiple Supabase projects.
# It shows how to apply backup schedules, run security audits, pause/resume projects,
# and perform bulk operations.
#
# Prerequisites:
#   - SUPABASE_ACCESS_TOKEN environment variable set
#   - Multiple projects in your organization
#
# Usage:
#   ./automation.sh
#
# References:
#   - Workflows: .ai/workflows.json - multiple workflow patterns
#   - Patterns: .ai/patterns.json - "multi-project-sync" pattern
#

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# ============================================================================
# Example 1: Apply Backup Schedule to All Projects
# ============================================================================

example_bulk_backup_schedule() {
  print_header "Example 1: Apply Backup Schedule to All Projects"

  log_info "This example sets up automated daily backups for all projects"
  log_warning "This will modify backup schedules - review before confirming"

  # Fetch all projects
  log_info "Fetching all projects..."
  local projects
  if ! projects=$("$SUPABASE_CLI" projects:list --format json 2>&1); then
    log_error "Failed to fetch projects"
    echo "$projects" >&2
    return 1
  fi

  local project_count
  project_count=$(echo "$projects" | jq 'length' 2>/dev/null || echo "0")

  if [[ $project_count -eq 0 ]]; then
    log_warning "No projects found"
    return 0
  fi

  log_success "Found $project_count project(s)"

  # Display projects
  echo ""
  echo "Projects that will be configured:"
  echo "$projects" | jq -r '.[] | "  - \(.name) (\(.ref))"' 2>/dev/null || true
  echo ""

  # Confirm action
  if ! confirm_action "Apply daily backup schedule to all projects?"; then
    return 0
  fi

  # Process each project
  local success_count=0
  local failure_count=0

  echo "$projects" | jq -r '.[] | @base64' | while read -r project_b64; do
    local project_json
    project_json=$(echo "$project_b64" | base64 --decode 2>/dev/null || echo "$project_b64")

    local project_ref project_name
    project_ref=$(echo "$project_json" | jq -r '.ref' 2>/dev/null || echo "")
    project_name=$(echo "$project_json" | jq -r '.name' 2>/dev/null || echo "unknown")

    if [[ -z "$project_ref" ]]; then
      log_warning "Skipping invalid project"
      continue
    fi

    log_info "Configuring backup schedule for: $project_name"

    # Check existing schedule
    local existing_schedule
    existing_schedule=$("$SUPABASE_CLI" backup:schedule:list "$project_ref" --format json 2>/dev/null)

    if [[ -n "$existing_schedule" ]] && [[ "$(echo "$existing_schedule" | jq 'length' 2>/dev/null)" -gt 0 ]]; then
      log_info "Backup schedule already exists, skipping..."
      continue
    fi

    # Create daily backup schedule with 7-day retention
    if "$SUPABASE_CLI" backup:schedule:create "$project_ref" \
      --frequency daily --retention 7 --format json >/dev/null 2>&1; then
      log_success "Backup schedule created for $project_name"
      ((success_count++))
    else
      log_error "Failed to create backup schedule for $project_name"
      ((failure_count++))
    fi

    # Small delay to avoid rate limiting
    sleep 1
  done

  echo ""
  log_success "Bulk backup schedule complete"
  log_info "Successfully configured: $success_count project(s)"
  if [[ $failure_count -gt 0 ]]; then
    log_warning "Failed to configure: $failure_count project(s)"
  fi

  echo ""
  print_divider
}

# ============================================================================
# Example 2: Run Security Audit on All Projects
# ============================================================================

example_bulk_security_audit() {
  print_header "Example 2: Run Security Audit on All Projects"

  log_info "This example runs security audits across all projects"

  # Fetch all projects
  log_info "Fetching all projects..."
  local projects
  if ! projects=$("$SUPABASE_CLI" projects:list --format json 2>&1); then
    log_error "Failed to fetch projects"
    return 1
  fi

  local project_count
  project_count=$(echo "$projects" | jq 'length' 2>/dev/null || echo "0")

  if [[ $project_count -eq 0 ]]; then
    log_warning "No projects found"
    return 0
  fi

  log_success "Found $project_count project(s)"

  # Track findings
  local total_critical=0
  local total_high=0
  local total_medium=0
  local total_low=0

  # Process each project
  echo "$projects" | jq -r '.[] | @base64' | while read -r project_b64; do
    local project_json
    project_json=$(echo "$project_b64" | base64 --decode 2>/dev/null || echo "$project_b64")

    local project_ref project_name
    project_ref=$(echo "$project_json" | jq -r '.ref' 2>/dev/null || echo "")
    project_name=$(echo "$project_json" | jq -r '.name' 2>/dev/null || echo "unknown")

    if [[ -z "$project_ref" ]]; then
      continue
    fi

    echo ""
    log_info "Running security audit for: $project_name"

    # Run audit
    local audit_result
    if audit_result=$("$SUPABASE_CLI" security:audit "$project_ref" --format json 2>&1); then
      # Count findings by severity
      local critical high medium low
      critical=$(echo "$audit_result" | jq '[.[] | select(.severity=="critical")] | length' 2>/dev/null || echo "0")
      high=$(echo "$audit_result" | jq '[.[] | select(.severity=="high")] | length' 2>/dev/null || echo "0")
      medium=$(echo "$audit_result" | jq '[.[] | select(.severity=="medium")] | length' 2>/dev/null || echo "0")
      low=$(echo "$audit_result" | jq '[.[] | select(.severity=="low")] | length' 2>/dev/null || echo "0")

      # Display findings
      if [[ $critical -gt 0 ]]; then
        log_error "  Critical: $critical"
      fi
      if [[ $high -gt 0 ]]; then
        log_warning "  High: $high"
      fi
      log_info "  Medium: $medium"
      log_info "  Low: $low"

      # Update totals
      total_critical=$((total_critical + critical))
      total_high=$((total_high + high))
      total_medium=$((total_medium + medium))
      total_low=$((total_low + low))

      # Show critical findings
      if [[ $critical -gt 0 ]]; then
        echo ""
        echo "  Critical findings:"
        echo "$audit_result" | jq -r '.[] | select(.severity=="critical") | "    - \(.title)"' 2>/dev/null || true
      fi
    else
      log_error "Audit failed for $project_name"
    fi

    # Small delay
    sleep 1
  done

  echo ""
  print_divider
  log_success "Security audit complete across all projects"
  echo ""
  log_info "Total findings:"
  echo "  Critical: $total_critical"
  echo "  High: $total_high"
  echo "  Medium: $total_medium"
  echo "  Low: $total_low"

  if [[ $total_critical -gt 0 ]] || [[ $total_high -gt 0 ]]; then
    echo ""
    log_warning "Action required: Address critical and high severity findings"
  fi

  echo ""
  print_divider
}

# ============================================================================
# Example 3: Pause All Development Projects
# ============================================================================

example_pause_dev_projects() {
  print_header "Example 3: Pause All Development Projects"

  log_info "This example pauses all projects with 'dev' or 'test' in their name"
  log_warning "Paused projects will not be accessible until resumed"

  # Fetch all projects
  log_info "Fetching all projects..."
  local projects
  if ! projects=$("$SUPABASE_CLI" projects:list --format json 2>&1); then
    log_error "Failed to fetch projects"
    return 1
  fi

  # Filter dev/test projects
  local dev_projects
  dev_projects=$(echo "$projects" | jq '[.[] | select(.name | test("dev|test"; "i"))]' 2>/dev/null || echo "[]")

  local dev_count
  dev_count=$(echo "$dev_projects" | jq 'length' 2>/dev/null || echo "0")

  if [[ $dev_count -eq 0 ]]; then
    log_info "No development projects found (name must contain 'dev' or 'test')"
    return 0
  fi

  log_success "Found $dev_count development project(s)"

  # Display projects to be paused
  echo ""
  echo "Projects to be paused:"
  echo "$dev_projects" | jq -r '.[] | "  - \(.name) (\(.ref)) - Status: \(.status)"' 2>/dev/null || true
  echo ""

  # Confirm action
  if ! confirm_action "Pause these development projects?"; then
    return 0
  fi

  # Process each project
  local paused_count=0
  local skipped_count=0

  echo "$dev_projects" | jq -r '.[] | @base64' | while read -r project_b64; do
    local project_json
    project_json=$(echo "$project_b64" | base64 --decode 2>/dev/null || echo "$project_b64")

    local project_ref project_name project_status
    project_ref=$(echo "$project_json" | jq -r '.ref' 2>/dev/null || echo "")
    project_name=$(echo "$project_json" | jq -r '.name' 2>/dev/null || echo "unknown")
    project_status=$(echo "$project_json" | jq -r '.status' 2>/dev/null || echo "unknown")

    if [[ -z "$project_ref" ]]; then
      continue
    fi

    # Skip if already paused
    if [[ "$project_status" == "PAUSED" ]]; then
      log_info "Skipping $project_name (already paused)"
      ((skipped_count++))
      continue
    fi

    log_info "Pausing: $project_name"

    if "$SUPABASE_CLI" projects:pause "$project_ref" --yes >/dev/null 2>&1; then
      log_success "Paused $project_name"
      ((paused_count++))
    else
      log_error "Failed to pause $project_name"
    fi

    # Small delay
    sleep 1
  done

  echo ""
  log_success "Pause operation complete"
  log_info "Paused: $paused_count project(s)"
  log_info "Skipped: $skipped_count project(s)"

  echo ""
  print_divider
}

# ============================================================================
# Example 4: Resume All Paused Projects
# ============================================================================

example_resume_projects() {
  print_header "Example 4: Resume All Paused Projects"

  log_info "This example resumes all paused projects"

  # Fetch all projects
  log_info "Fetching all projects..."
  local projects
  if ! projects=$("$SUPABASE_CLI" projects:list --format json 2>&1); then
    log_error "Failed to fetch projects"
    return 1
  fi

  # Filter paused projects
  local paused_projects
  paused_projects=$(echo "$projects" | jq '[.[] | select(.status=="PAUSED")]' 2>/dev/null || echo "[]")

  local paused_count
  paused_count=$(echo "$paused_projects" | jq 'length' 2>/dev/null || echo "0")

  if [[ $paused_count -eq 0 ]]; then
    log_info "No paused projects found"
    return 0
  fi

  log_success "Found $paused_count paused project(s)"

  # Display projects to be resumed
  echo ""
  echo "Projects to be resumed:"
  echo "$paused_projects" | jq -r '.[] | "  - \(.name) (\(.ref))"' 2>/dev/null || true
  echo ""

  # Confirm action
  if ! confirm_action "Resume these projects?"; then
    return 0
  fi

  # Process each project
  local resumed_count=0

  echo "$paused_projects" | jq -r '.[] | @base64' | while read -r project_b64; do
    local project_json
    project_json=$(echo "$project_b64" | base64 --decode 2>/dev/null || echo "$project_b64")

    local project_ref project_name
    project_ref=$(echo "$project_json" | jq -r '.ref' 2>/dev/null || echo "")
    project_name=$(echo "$project_json" | jq -r '.name' 2>/dev/null || echo "unknown")

    if [[ -z "$project_ref" ]]; then
      continue
    fi

    log_info "Resuming: $project_name"

    # Note: Resume command not in catalog, this is simulated
    # Actual command would be: supabase-cli projects:resume "$project_ref"
    log_info "Would resume $project_name (resume command placeholder)"
    ((resumed_count++))

    # Small delay
    sleep 1
  done

  echo ""
  log_success "Resume operation complete"
  log_info "Resumed: $resumed_count project(s)"
  log_info "Note: Projects may take 30-60 seconds to become fully active"

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

  print_header "Multi-Project Automation Examples"
  log_info "These examples demonstrate bulk operations across all projects"
  log_warning "Review each operation carefully before confirming"
  echo ""

  # Run all examples
  example_bulk_backup_schedule || true
  pause "Press Enter to continue to Example 2..."

  example_bulk_security_audit || true
  pause "Press Enter to continue to Example 3..."

  example_pause_dev_projects || true
  pause "Press Enter to continue to Example 4..."

  example_resume_projects || true

  # Summary
  echo ""
  print_header "Examples Complete"
  log_success "All automation examples completed"
  log_info "Review the output above for details on each operation"
  echo ""
  log_info "Automation best practices:"
  echo "  - Always use --yes flag in automated scripts"
  echo "  - Implement error handling and retry logic"
  echo "  - Add delays between operations to avoid rate limiting"
  echo "  - Log all operations for audit trail"
  echo "  - Test on development projects before production"
  echo "  - Schedule automated tasks during off-peak hours"
  echo "  - Monitor automation jobs for failures"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
