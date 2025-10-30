#!/usr/bin/env bash
#
# Troubleshooting and Diagnostics Example
#
# This script demonstrates how to diagnose and troubleshoot common issues with Supabase projects.
# It shows how to check authentication, test connectivity, diagnose errors, and verify configuration.
#
# Prerequisites:
#   - SUPABASE_ACCESS_TOKEN environment variable set (optional for auth check)
#   - Project reference ID (optional)
#
# Usage:
#   ./troubleshooting.sh [project-ref]
#
# References:
#   - Workflows: .ai/workflows.json - "troubleshoot-common-issues" workflow
#   - Error Solutions: .ai/error-solutions.json
#

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# ============================================================================
# Example 1: Check Authentication
# ============================================================================

example_check_authentication() {
  print_header "Example 1: Check Authentication"

  log_info "Verifying Supabase CLI authentication..."

  # Check 1: Environment variable
  log_info "Check 1: SUPABASE_ACCESS_TOKEN environment variable"

  if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
    log_success "SUPABASE_ACCESS_TOKEN is set"

    # Mask token for security (show first 8 chars)
    local masked_token="${SUPABASE_ACCESS_TOKEN:0:8}..."
    log_info "Token starts with: $masked_token"
  else
    log_error "SUPABASE_ACCESS_TOKEN is not set"
    echo ""
    log_info "To fix this issue:"
    echo "  1. Get your access token from https://app.supabase.com/account/tokens"
    echo "  2. Set it in your environment:"
    echo "     export SUPABASE_ACCESS_TOKEN='your-token-here'"
    echo "  3. Or save it to ~/.supabase/access-token"
    echo ""
    log_warning "Cannot proceed with authentication test"
    return 1
  fi

  # Check 2: Token validity via config doctor
  log_info "Check 2: Testing token validity..."

  local doctor_result
  if doctor_result=$("$SUPABASE_CLI" config:doctor 2>&1); then
    log_success "Authentication is valid"
    echo ""
    echo "$doctor_result"
  else
    log_error "Authentication test failed"
    echo ""
    echo "$doctor_result"
    echo ""
    log_info "Possible issues:"
    echo "  - Token may be expired"
    echo "  - Token may be invalid"
    echo "  - Network connectivity issues"
    echo ""
    log_info "Solutions:"
    echo "  1. Generate a new token from Supabase dashboard"
    echo "  2. Update SUPABASE_ACCESS_TOKEN environment variable"
    echo "  3. Check network connection and proxy settings"
    return 1
  fi

  # Check 3: List projects to verify access
  log_info "Check 3: Verifying access to projects..."

  local projects
  if projects=$("$SUPABASE_CLI" projects:list --format json 2>&1); then
    local project_count
    project_count=$(echo "$projects" | jq 'length' 2>/dev/null || echo "0")

    log_success "Successfully accessed projects"
    log_info "You have access to $project_count project(s)"

    if [[ $project_count -gt 0 ]]; then
      echo ""
      echo "Your projects:"
      echo "$projects" | jq -r '.[] | "  - \(.name) (\(.ref))"' 2>/dev/null || true
    fi
  else
    log_error "Failed to list projects"
    echo ""
    echo "$projects"
    echo ""
    log_info "This could indicate:"
    echo "  - Token lacks necessary permissions"
    echo "  - API connectivity issues"
    echo "  - Rate limiting"
  fi

  echo ""
  print_divider
}

# ============================================================================
# Example 2: Test Project Connectivity
# ============================================================================

example_test_connectivity() {
  local project_ref="${1:-}"

  print_header "Example 2: Test Project Connectivity"

  if [[ -z "$project_ref" ]]; then
    log_warning "No project reference provided"
    log_info "Usage: $0 <project-ref>"
    log_info "Skipping connectivity test"
    return 0
  fi

  log_info "Testing connectivity to project: $project_ref"

  # Test 1: Project exists and is accessible
  log_info "Test 1: Checking if project exists..."

  local project_info
  if project_info=$("$SUPABASE_CLI" projects:get "$project_ref" --format json 2>&1); then
    log_success "Project is accessible"

    local project_name project_status
    project_name=$(echo "$project_info" | jq -r '.name' 2>/dev/null || echo "unknown")
    project_status=$(echo "$project_info" | jq -r '.status' 2>/dev/null || echo "unknown")

    log_info "Project name: $project_name"
    log_info "Project status: $project_status"

    if [[ "$project_status" != "ACTIVE_HEALTHY" ]]; then
      log_warning "Project status is not ACTIVE_HEALTHY"
      log_info "Current status: $project_status"
      echo ""
      log_info "Common statuses:"
      echo "  - PROVISIONING: Project is being created (wait 1-3 minutes)"
      echo "  - PAUSED: Project is paused (resume it to access)"
      echo "  - INACTIVE: Project may be suspended"
      echo "  - RESTORING: Project is being restored from backup"
    fi
  else
    log_error "Cannot access project"
    echo ""
    echo "$project_info"
    echo ""
    log_info "Possible reasons:"
    echo "  - Project reference is incorrect"
    echo "  - Project was deleted"
    echo "  - You don't have access to this project"
    echo "  - Project is in different organization"
    return 1
  fi

  # Test 2: Database connectivity
  log_info "Test 2: Testing database connectivity..."

  local db_test
  if db_test=$("$SUPABASE_CLI" db:query "$project_ref" "SELECT 1 as test" --format json 2>&1); then
    log_success "Database is accessible"

    local result
    result=$(echo "$db_test" | jq -r '.rows[0][0]' 2>/dev/null || echo "")

    if [[ "$result" == "1" ]]; then
      log_success "Database query executed successfully"
    fi
  else
    log_error "Database connection failed"
    echo ""
    echo "$db_test"
    echo ""
    log_info "Common database connection issues:"
    echo "  - Database is starting up (wait 30 seconds and retry)"
    echo "  - Network restrictions or IP allowlist"
    echo "  - Project is paused"
    echo "  - Database credentials invalid"
  fi

  # Test 3: API health
  log_info "Test 3: Checking API health..."

  local health
  if health=$("$SUPABASE_CLI" monitor:health "$project_ref" --format json 2>&1); then
    local health_status
    health_status=$(echo "$health" | jq -r '.status' 2>/dev/null || echo "unknown")

    if [[ "$health_status" == "healthy" ]]; then
      log_success "All services are healthy"
    else
      log_warning "Health status: $health_status"
      echo ""
      echo "Service details:"
      echo "$health" | format_json
    fi
  else
    log_warning "Could not check health status"
    echo "$health" >&2
  fi

  # Test 4: Network latency
  log_info "Test 4: Measuring network latency..."

  local start_time end_time latency
  start_time=$(date +%s%N)

  if "$SUPABASE_CLI" projects:get "$project_ref" >/dev/null 2>&1; then
    end_time=$(date +%s%N)
    latency=$(( (end_time - start_time) / 1000000 ))

    log_success "Network latency: ${latency}ms"

    if [[ $latency -gt 2000 ]]; then
      log_warning "High latency detected (> 2000ms)"
      log_info "This could indicate:"
      echo "  - Slow network connection"
      echo "  - Geographic distance to Supabase servers"
      echo "  - Network congestion"
    fi
  else
    log_warning "Could not measure latency"
  fi

  echo ""
  print_divider
}

# ============================================================================
# Example 3: Diagnose Common Errors
# ============================================================================

example_diagnose_errors() {
  local project_ref="${1:-}"

  print_header "Example 3: Diagnose Common Errors"

  if [[ -z "$project_ref" ]]; then
    log_warning "No project reference provided"
    log_info "Showing general error diagnostic information"
    echo ""

    # Show common errors and solutions
    log_info "Common Supabase CLI errors and solutions:"
    echo ""

    echo "${BOLD}Error: UNAUTHORIZED${RESET}"
    echo "  Cause: Invalid or expired access token"
    echo "  Solution: Regenerate token at https://app.supabase.com/account/tokens"
    echo ""

    echo "${BOLD}Error: PROJECT_NOT_FOUND${RESET}"
    echo "  Cause: Project doesn't exist or wrong project reference"
    echo "  Solution: Run 'supabase-cli projects:list' to get correct project ref"
    echo ""

    echo "${BOLD}Error: RATE_LIMIT${RESET}"
    echo "  Cause: Too many API requests in short time"
    echo "  Solution: Wait 60 seconds and retry, implement exponential backoff"
    echo ""

    echo "${BOLD}Error: TIMEOUT${RESET}"
    echo "  Cause: Operation taking longer than expected"
    echo "  Solution: Wait and retry, check project status"
    echo ""

    echo "${BOLD}Error: DATABASE_ERROR${RESET}"
    echo "  Cause: SQL query error or database connection issue"
    echo "  Solution: Check query syntax, verify database is accessible"
    echo ""

    return 0
  fi

  log_info "Diagnosing errors for project: $project_ref"

  # Check error logs
  log_info "Checking recent error logs..."

  local error_logs
  if error_logs=$("$SUPABASE_CLI" logs:errors:list "$project_ref" --format json 2>&1); then
    local error_count
    error_count=$(echo "$error_logs" | jq 'length' 2>/dev/null || echo "0")

    if [[ $error_count -eq 0 ]]; then
      log_success "No errors found in logs"
    else
      log_warning "Found $error_count error(s) in logs"
      echo ""
      echo "Recent errors:"
      echo "$error_logs" | jq -r '.[] | "\(.timestamp) [\(.level)] \(.message)"' 2>/dev/null | head -5 || true
      echo ""

      # Analyze error patterns
      log_info "Analyzing error patterns..."

      local auth_errors db_errors api_errors
      auth_errors=$(echo "$error_logs" | jq '[.[] | select(.category=="auth")] | length' 2>/dev/null || echo "0")
      db_errors=$(echo "$error_logs" | jq '[.[] | select(.category=="database")] | length' 2>/dev/null || echo "0")
      api_errors=$(echo "$error_logs" | jq '[.[] | select(.category=="api")] | length' 2>/dev/null || echo "0")

      log_info "Error breakdown:"
      echo "  Authentication errors: $auth_errors"
      echo "  Database errors: $db_errors"
      echo "  API errors: $api_errors"

      # Provide specific guidance
      if [[ $auth_errors -gt 0 ]]; then
        echo ""
        log_warning "Authentication errors detected"
        echo "  Check: JWT configuration, API keys, user authentication flow"
      fi

      if [[ $db_errors -gt 0 ]]; then
        echo ""
        log_warning "Database errors detected"
        echo "  Check: SQL queries, database schema, connection limits"
      fi

      if [[ $api_errors -gt 0 ]]; then
        echo ""
        log_warning "API errors detected"
        echo "  Check: Request validation, rate limits, endpoint configurations"
      fi
    fi
  else
    log_warning "Could not fetch error logs"
    echo "$error_logs" >&2
  fi

  # Check for HTTP errors in API logs
  echo ""
  log_info "Checking for HTTP errors in API logs..."

  local api_logs
  if api_logs=$("$SUPABASE_CLI" logs:api:list "$project_ref" --format json 2>&1); then
    local client_errors server_errors
    client_errors=$(echo "$api_logs" | jq '[.[] | select(.status >= 400 and .status < 500)] | length' 2>/dev/null || echo "0")
    server_errors=$(echo "$api_logs" | jq '[.[] | select(.status >= 500)] | length' 2>/dev/null || echo "0")

    log_info "HTTP error summary:"
    echo "  4xx (client errors): $client_errors"
    echo "  5xx (server errors): $server_errors"

    if [[ $server_errors -gt 0 ]]; then
      echo ""
      log_error "Server errors detected - this requires immediate attention"
      echo ""
      echo "Recent 5xx errors:"
      echo "$api_logs" | jq -r '.[] | select(.status >= 500) | "\(.timestamp) [\(.status)] \(.method) \(.path)"' 2>/dev/null | head -3 || true
    fi
  else
    log_warning "Could not fetch API logs"
  fi

  echo ""
  print_divider
}

# ============================================================================
# Example 4: Verify Configuration
# ============================================================================

example_verify_configuration() {
  local project_ref="${1:-}"

  print_header "Example 4: Verify Configuration"

  # Check CLI configuration
  log_info "Verifying CLI configuration..."

  local config_check
  if config_check=$("$SUPABASE_CLI" config:doctor 2>&1); then
    log_success "CLI configuration is valid"
    echo ""
    echo "$config_check"
  else
    log_error "CLI configuration has issues"
    echo ""
    echo "$config_check"
    echo ""
    log_info "Run 'supabase-cli config:doctor' for detailed diagnostics"
  fi

  echo ""

  # Check current profile
  log_info "Checking current CLI profile..."

  local current_config
  if current_config=$("$SUPABASE_CLI" config:show-current --format json 2>&1); then
    log_success "Current configuration:"
    echo "$current_config" | format_json
  else
    log_warning "Could not retrieve current configuration"
  fi

  echo ""

  if [[ -z "$project_ref" ]]; then
    log_info "No project specified - skipping project configuration check"
    return 0
  fi

  # Check project configuration
  log_info "Verifying project configuration for: $project_ref"

  local project_info
  if project_info=$("$SUPABASE_CLI" projects:get "$project_ref" --format json 2>&1); then
    log_success "Project configuration retrieved"

    # Extract key configuration
    local region database_version organization
    region=$(echo "$project_info" | jq -r '.region' 2>/dev/null || echo "unknown")
    database_version=$(echo "$project_info" | jq -r '.database_version' 2>/dev/null || echo "unknown")
    organization=$(echo "$project_info" | jq -r '.organization_id' 2>/dev/null || echo "unknown")

    echo ""
    log_info "Project details:"
    echo "  Region: $region"
    echo "  Database version: $database_version"
    echo "  Organization: $organization"
  else
    log_error "Could not retrieve project configuration"
  fi

  # Check database configuration
  echo ""
  log_info "Checking database configuration..."

  local db_config
  if db_config=$("$SUPABASE_CLI" db:query "$project_ref" \
    "SHOW max_connections" --format json 2>&1); then

    local max_conn
    max_conn=$(echo "$db_config" | jq -r '.rows[0][0]' 2>/dev/null || echo "unknown")
    log_success "Max connections: $max_conn"
  else
    log_warning "Could not check database configuration"
  fi

  # Run security audit
  echo ""
  log_info "Running security configuration audit..."

  local audit_result
  if audit_result=$("$SUPABASE_CLI" security:audit "$project_ref" --format json 2>&1); then
    local finding_count
    finding_count=$(echo "$audit_result" | jq 'length' 2>/dev/null || echo "0")

    if [[ $finding_count -eq 0 ]]; then
      log_success "No security configuration issues found"
    else
      log_warning "Found $finding_count security finding(s)"

      # Count by severity
      local critical high
      critical=$(echo "$audit_result" | jq '[.[] | select(.severity=="critical")] | length' 2>/dev/null || echo "0")
      high=$(echo "$audit_result" | jq '[.[] | select(.severity=="high")] | length' 2>/dev/null || echo "0")

      if [[ $critical -gt 0 ]] || [[ $high -gt 0 ]]; then
        log_error "Critical or high severity findings require attention"
        echo "  Critical: $critical"
        echo "  High: $high"
      fi
    fi
  else
    log_warning "Could not run security audit"
  fi

  echo ""
  print_divider
}

# ============================================================================
# Main Function
# ============================================================================

main() {
  # Check for jq
  check_command jq

  # Get project reference (optional for troubleshooting)
  local project_ref="${1:-}"

  print_header "Troubleshooting and Diagnostics"

  if [[ -z "$project_ref" ]]; then
    log_info "Running diagnostics in general mode (no project specified)"
    log_info "For project-specific diagnostics, run: $0 <project-ref>"
  else
    log_info "Running diagnostics for project: $project_ref"
  fi

  echo ""

  # Run all examples
  example_check_authentication || true
  pause "Press Enter to continue to Example 2..."

  example_test_connectivity "$project_ref" || true
  pause "Press Enter to continue to Example 3..."

  example_diagnose_errors "$project_ref" || true
  pause "Press Enter to continue to Example 4..."

  example_verify_configuration "$project_ref" || true

  # Summary
  echo ""
  print_header "Diagnostics Complete"
  log_success "All troubleshooting checks completed"
  echo ""
  log_info "Next steps:"
  echo "  - Review any errors or warnings above"
  echo "  - Address critical issues first (authentication, connectivity)"
  echo "  - Check error logs for recurring patterns"
  echo "  - Run security audit to verify configuration"
  echo "  - Contact support if issues persist"
  echo ""
  log_info "For more help:"
  echo "  - Documentation: https://docs.supabase.com"
  echo "  - Support: https://supabase.com/support"
  echo "  - Community: https://github.com/supabase/supabase/discussions"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
