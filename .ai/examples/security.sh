#!/usr/bin/env bash
#
# Security Audit and Restrictions Examples
# Usage: ./security.sh [project-ref]
#
# Examples from Sprint 2A workflows for security management
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
check_command jq

if [[ -z "$PROJECT_REF" ]]; then
  log_warning "No project ref provided"
  PROJECT_REF=$(get_project_ref)
fi

# ============================================================================
# Example 1: Run Security Audit
# ============================================================================
# Workflow: run-security-audit
# Pattern: security-audit-remediate

example_security_audit() {
  print_header "Example 1: Run Security Audit"

  log_info "Running comprehensive security audit on project: $PROJECT_REF"
  log_info "This checks for security issues, missing policies, and vulnerabilities"

  if audit=$("$SUPABASE_CLI" security:audit "$PROJECT_REF" --format json 2>/dev/null); then
    local finding_count
    finding_count=$(echo "$audit" | jq 'length' 2>/dev/null || echo "0")

    log_success "Security audit completed"
    log_info "Total findings: $finding_count"

    if [[ $finding_count -eq 0 ]]; then
      log_success "No security issues found!"
      return 0
    fi

    # Count by severity
    local critical high medium low
    critical=$(echo "$audit" | jq '[.[] | select(.severity == "critical")] | length')
    high=$(echo "$audit" | jq '[.[] | select(.severity == "high")] | length')
    medium=$(echo "$audit" | jq '[.[] | select(.severity == "medium")] | length')
    low=$(echo "$audit" | jq '[.[] | select(.severity == "low")] | length')

    echo ""
    echo "Findings by Severity:"
    [[ $critical -gt 0 ]] && echo "  ${RED}Critical:${RESET} $critical"
    [[ $high -gt 0 ]] && echo "  ${YELLOW}High:${RESET}     $high"
    [[ $medium -gt 0 ]] && echo "  ${BLUE}Medium:${RESET}   $medium"
    [[ $low -gt 0 ]] && echo "  Low:      $low"
    echo ""

    # Display critical and high severity findings
    if [[ $critical -gt 0 ]] || [[ $high -gt 0 ]]; then
      log_warning "Critical and High severity findings require immediate attention:"
      echo ""

      echo "$audit" | jq -r '.[] | select(.severity == "critical" or .severity == "high") |
        "[\(.severity | ascii_upcase)] \(.title)\n  Category: \(.category)\n  Description: \(.description)\n  Recommendation: \(.recommendation)\n"'
    fi

    # Save full audit report
    local report_file="security_audit_$(date +%Y%m%d_%H%M%S).json"
    echo "$audit" | jq '.' > "$report_file"
    log_info "Full audit report saved to: $report_file"

  else
    handle_error "Failed to run security audit" "$?"
  fi
}

# ============================================================================
# Example 2: List Security Policies
# ============================================================================
# Workflow: review-security-policies
# Pattern: security-audit-remediate

example_list_policies() {
  print_header "Example 2: List Security Policies"

  log_info "Fetching Row Level Security (RLS) policies..."

  if policies=$("$SUPABASE_CLI" security:policies:list "$PROJECT_REF" --format json 2>/dev/null); then
    local policy_count
    policy_count=$(echo "$policies" | jq 'length' 2>/dev/null || echo "0")

    log_success "Found $policy_count policy/policies"

    if [[ $policy_count -eq 0 ]]; then
      log_warning "No security policies found!"
      log_info "Consider adding RLS policies to protect your data"
      return 0
    fi

    # Display policies grouped by table
    echo ""
    echo "Security Policies by Table:"
    echo "$policies" | jq -r '.[] | "\(.table_name)\t\(.policy_name)\t\(.command)"' | \
      awk 'BEGIN {printf "%-30s %-40s %-15s\n", "TABLE", "POLICY", "COMMAND";
                  printf "%-30s %-40s %-15s\n", "-----", "------", "-------"}
           {printf "%-30s %-40s %-15s\n", $1, $2, $3}'
    echo ""

  else
    log_warning "Failed to retrieve security policies"
  fi

  # Check RLS status on tables
  log_info "Checking RLS status on public tables..."

  local query="SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename"

  if rls_status=$("$SUPABASE_CLI" db:query "$PROJECT_REF" "$query" --format json 2>/dev/null); then
    local tables_without_rls
    tables_without_rls=$(echo "$rls_status" | jq '[.[] | select(.rowsecurity == false)] | length')

    if [[ $tables_without_rls -gt 0 ]]; then
      log_warning "Found $tables_without_rls table(s) without RLS enabled:"
      echo ""
      echo "$rls_status" | jq -r '.[] | select(.rowsecurity == false) | "  - \(.tablename)"'
      echo ""
      log_info "Enable RLS to protect these tables from unauthorized access"
    else
      log_success "All public tables have RLS enabled"
    fi
  fi
}

# ============================================================================
# Example 3: Add IP Restriction
# ============================================================================
# Workflow: add-ip-restrictions
# Pattern: security-audit-remediate, create-verify

example_add_restriction() {
  print_header "Example 3: Add IP Restriction"

  log_info "IP restrictions limit database access to specific networks"
  log_warning "Be careful not to lock yourself out!"

  # Example CIDR - replace with your actual network
  local example_cidr="203.0.113.0/24"
  local description="Example corporate network restriction"

  log_info "Example CIDR: $example_cidr (TEST-NET-3 - not a real network)"
  log_warning "Replace with your actual network CIDR before using"

  # Validate CIDR format
  if ! validate_cidr "$example_cidr"; then
    return 1
  fi

  # Step 1: Check existing restrictions
  log_info "Step 1: Checking existing IP restrictions..."

  if restrictions=$("$SUPABASE_CLI" security:restrictions:list "$PROJECT_REF" --format json 2>/dev/null); then
    local restriction_count
    restriction_count=$(echo "$restrictions" | jq 'length' 2>/dev/null || echo "0")

    log_info "Existing restrictions: $restriction_count"

    if [[ $restriction_count -gt 0 ]]; then
      echo ""
      echo "Current IP Restrictions:"
      echo "$restrictions" | jq -r '.[] | "\(.id)\t\(.cidr)\t\(.description // "N/A")"' | \
        awk 'BEGIN {printf "%-25s %-20s %-40s\n", "ID", "CIDR", "DESCRIPTION"}
             {printf "%-25s %-20s %-40s\n", $1, $2, $3}'
      echo ""
    fi
  else
    log_info "No existing restrictions or failed to list"
  fi

  # Step 2: Add restriction (example only)
  log_info "Step 2: Adding IP restriction..."
  log_warning "Example only - uncomment to actually add restriction"

  # Uncomment to add restriction:
  # if result=$("$SUPABASE_CLI" security:restrictions:add "$PROJECT_REF" \
  #   --cidr "$example_cidr" \
  #   --description "$description" \
  #   --format json); then
  #
  #   local restriction_id
  #   restriction_id=$(echo "$result" | jq -r '.id')
  #
  #   log_success "IP restriction added successfully!"
  #   log_info "Restriction ID: $restriction_id"
  #   log_info "CIDR: $example_cidr"
  #   log_info "Description: $description"
  #
  #   # Step 3: Verify restriction was added
  #   log_info "Step 3: Verifying restriction..."
  #
  #   if verify=$("$SUPABASE_CLI" security:restrictions:list "$PROJECT_REF" --format json); then
  #     local found
  #     found=$(echo "$verify" | jq -r ".[] | select(.id == \"$restriction_id\") | .id")
  #
  #     if [[ "$found" == "$restriction_id" ]]; then
  #       log_success "Restriction verified in list"
  #     fi
  #   fi
  #
  #   # Step 4: Test database access
  #   log_info "Step 4: Testing database access from allowed IP..."
  #
  #   if "$SUPABASE_CLI" db:query "$PROJECT_REF" "SELECT 1" --format json >/dev/null 2>&1; then
  #     log_success "Database accessible from current IP"
  #   else
  #     log_error "Database access blocked! Check if current IP is in allowed range"
  #   fi
  # else
  #   handle_error "Failed to add IP restriction" "$?"
  # fi

  log_info "Example skipped - uncomment code to add restriction"
  log_warning "Always ensure your current IP is in the allowed range before adding restrictions!"
}

# ============================================================================
# Example 4: Remove IP Restriction
# ============================================================================
# Workflow: add-ip-restrictions (rollback steps)
# Pattern: security-audit-remediate

example_remove_restriction() {
  print_header "Example 4: Remove IP Restriction (with confirmation)"

  log_info "Remove IP restrictions to allow broader access"

  # Step 1: List restrictions
  log_info "Step 1: Fetching current IP restrictions..."

  if restrictions=$("$SUPABASE_CLI" security:restrictions:list "$PROJECT_REF" --format json 2>/dev/null); then
    local restriction_count
    restriction_count=$(echo "$restrictions" | jq 'length' 2>/dev/null || echo "0")

    if [[ $restriction_count -eq 0 ]]; then
      log_info "No IP restrictions configured"
      return 0
    fi

    log_info "Current restrictions: $restriction_count"

    echo ""
    echo "IP Restrictions:"
    echo "$restrictions" | jq -r '.[] | "\(.id)\t\(.cidr)\t\(.description // "N/A")"' | \
      awk 'BEGIN {printf "%-25s %-20s %-40s\n", "ID", "CIDR", "DESCRIPTION";
                  printf "%-25s %-20s %-40s\n", "--", "----", "-----------"}
           {printf "%-25s %-20s %-40s\n", $1, $2, $3}'
    echo ""

    # For demonstration, select first restriction
    local restriction_id
    restriction_id=$(echo "$restrictions" | jq -r '.[0].id')
    local restriction_cidr
    restriction_cidr=$(echo "$restrictions" | jq -r '.[0].cidr')

    log_info "Example: Would remove restriction $restriction_id ($restriction_cidr)"

  else
    log_error "Failed to list IP restrictions"
    return 1
  fi

  # Step 2: Confirm removal
  log_warning "Removing IP restrictions may expose your database to unauthorized access"

  if ! confirm_action "Remove IP restriction $restriction_id ($restriction_cidr)?"; then
    return 0
  fi

  # Step 3: Remove restriction (example only)
  log_info "Step 2: Removing IP restriction..."
  log_warning "Example only - uncomment to actually remove"

  # Uncomment to remove restriction:
  # if "$SUPABASE_CLI" security:restrictions:remove "$PROJECT_REF" "$restriction_id" --yes; then
  #   log_success "IP restriction removed successfully"
  #
  #   # Step 4: Verify removal
  #   log_info "Verifying restriction was removed..."
  #
  #   if verify=$("$SUPABASE_CLI" security:restrictions:list "$PROJECT_REF" --format json); then
  #     local found
  #     found=$(echo "$verify" | jq -r ".[] | select(.id == \"$restriction_id\") | .id")
  #
  #     if [[ -z "$found" ]]; then
  #       log_success "Restriction successfully removed from list"
  #     else
  #       log_warning "Restriction still appears in list"
  #     fi
  #   fi
  # else
  #   handle_error "Failed to remove IP restriction" "$?"
  # fi

  log_info "Example skipped - uncomment code to remove restriction"
  log_info "After removing restrictions, database is accessible from any IP"
}

# ============================================================================
# Main
# ============================================================================

main() {
  print_header "Supabase CLI - Security Management Examples"

  echo "Project reference: $PROJECT_REF"
  echo ""

  example_security_audit
  echo ""
  print_divider
  echo ""

  example_list_policies
  echo ""
  print_divider
  echo ""

  example_add_restriction
  echo ""
  print_divider
  echo ""

  example_remove_restriction
  echo ""

  log_success "All security examples completed"
  log_info "Remember: Run security audits regularly and before production deployments!"
}

# Run main if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
