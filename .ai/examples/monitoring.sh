#!/usr/bin/env bash
#
# Monitoring and Logs Example
#
# This script demonstrates how to monitor Supabase projects using logs and metrics.
# It shows how to tail logs in real-time, query for errors, view performance metrics,
# and check overall project health.
#
# Prerequisites:
#   - SUPABASE_ACCESS_TOKEN environment variable set
#   - Project reference ID
#
# Usage:
#   ./monitoring.sh <project-ref>
#
# References:
#   - Workflows: .ai/workflows.json - "setup-log-monitoring", "view-metrics-performance"
#   - Patterns: .ai/patterns.json - "monitoring-setup" pattern
#

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# ============================================================================
# Example 1: Tail Logs in Real-Time
# ============================================================================

example_tail_logs() {
  local project_ref="$1"

  print_header "Example 1: Tail Logs in Real-Time"

  log_info "Fetching recent logs for project: $project_ref"
  log_info "This shows the most recent log entries"

  # Note: Real-time tailing would use logs:tail command if available
  # For now, we fetch recent logs

  # Fetch API logs
  log_info "Fetching API logs..."
  local api_logs
  if api_logs=$("$SUPABASE_CLI" logs:api:list "$project_ref" --format json 2>&1); then
    log_success "API logs retrieved"

    local log_count
    log_count=$(echo "$api_logs" | jq 'length' 2>/dev/null || echo "0")
    log_info "Recent API requests: $log_count"

    if [[ $log_count -gt 0 ]]; then
      echo ""
      echo "Most recent API requests:"
      echo "$api_logs" | jq -r '.[] | "\(.timestamp) [\(.method)] \(.path) - \(.status)"' 2>/dev/null | head -10 || true
    fi
  else
    log_warning "Could not fetch API logs"
    echo "$api_logs" >&2
  fi

  echo ""

  # Fetch function logs
  log_info "Fetching function execution logs..."
  local function_logs
  if function_logs=$("$SUPABASE_CLI" logs:functions:list "$project_ref" --format json 2>&1); then
    log_success "Function logs retrieved"

    local func_count
    func_count=$(echo "$function_logs" | jq 'length' 2>/dev/null || echo "0")
    log_info "Recent function invocations: $func_count"

    if [[ $func_count -gt 0 ]]; then
      echo ""
      echo "Most recent function invocations:"
      echo "$function_logs" | jq -r '.[] | "\(.timestamp) \(.function_name) - Status: \(.status)"' 2>/dev/null | head -10 || true
    fi
  else
    log_warning "Could not fetch function logs"
  fi

  echo ""
  log_info "Tip: Use --format json for programmatic log parsing"
  log_info "Example: $SUPABASE_CLI logs:api:list $project_ref --format json | jq '.[] | select(.status >= 400)'"

  echo ""
  print_divider
}

# ============================================================================
# Example 2: Query Logs for Errors
# ============================================================================

example_query_errors() {
  local project_ref="$1"

  print_header "Example 2: Query Logs for Errors"

  log_info "Searching for errors in project logs..."

  # Fetch error logs
  log_info "Fetching error logs..."
  local error_logs
  if error_logs=$("$SUPABASE_CLI" logs:errors:list "$project_ref" --format json 2>&1); then
    log_success "Error logs retrieved"

    local error_count
    error_count=$(echo "$error_logs" | jq 'length' 2>/dev/null || echo "0")

    if [[ $error_count -eq 0 ]]; then
      log_success "No errors found - system is healthy!"
    else
      log_warning "Found $error_count error(s)"

      echo ""
      echo "Recent errors:"
      echo "$error_logs" | jq -r '.[] | "\(.timestamp) [\(.level)] \(.message)"' 2>/dev/null || echo "$error_logs"
    fi
  else
    log_warning "Could not fetch error logs"
    echo "$error_logs" >&2
  fi

  echo ""

  # Check API logs for HTTP errors (4xx, 5xx)
  log_info "Checking API logs for HTTP errors..."
  local api_logs
  if api_logs=$("$SUPABASE_CLI" logs:api:list "$project_ref" --format json 2>&1); then
    # Count 4xx errors
    local client_errors
    client_errors=$(echo "$api_logs" | jq '[.[] | select(.status >= 400 and .status < 500)] | length' 2>/dev/null || echo "0")

    # Count 5xx errors
    local server_errors
    server_errors=$(echo "$api_logs" | jq '[.[] | select(.status >= 500)] | length' 2>/dev/null || echo "0")

    log_info "Client errors (4xx): $client_errors"
    log_info "Server errors (5xx): $server_errors"

    if [[ $server_errors -gt 0 ]]; then
      log_warning "Server errors detected - investigate immediately"
      echo ""
      echo "Recent 5xx errors:"
      echo "$api_logs" | jq -r '.[] | select(.status >= 500) | "\(.timestamp) [\(.status)] \(.method) \(.path)"' 2>/dev/null | head -5 || true
    fi
  else
    log_warning "Could not analyze API error rates"
  fi

  echo ""

  # Summary
  log_info "Error analysis complete"
  log_info "Next steps:"
  echo "  - Investigate root causes of errors"
  echo "  - Check if errors are user-related (4xx) or system-related (5xx)"
  echo "  - Set up alerts for error rate spikes"
  echo "  - Review error patterns for recurring issues"

  echo ""
  print_divider
}

# ============================================================================
# Example 3: View Performance Metrics
# ============================================================================

example_view_metrics() {
  local project_ref="$1"

  print_header "Example 3: View Performance Metrics"

  log_info "Fetching performance metrics for project: $project_ref"

  # Get health metrics
  log_info "Checking overall project health..."
  local health
  if health=$("$SUPABASE_CLI" monitor:health "$project_ref" --format json 2>&1); then
    log_success "Health metrics retrieved"

    echo ""
    echo "Health Status:"
    echo "$health" | format_json

    # Parse health status
    local overall_status
    overall_status=$(echo "$health" | jq -r '.status' 2>/dev/null || echo "unknown")

    if [[ "$overall_status" == "healthy" ]]; then
      log_success "All systems operational"
    else
      log_warning "System status: $overall_status"
    fi
  else
    log_warning "Could not fetch health metrics"
    echo "$health" >&2
  fi

  echo ""

  # Get performance metrics
  log_info "Fetching performance metrics..."
  local metrics
  if metrics=$("$SUPABASE_CLI" monitor:metrics "$project_ref" --format json 2>&1); then
    log_success "Performance metrics retrieved"

    echo ""
    echo "Performance Metrics:"
    echo "$metrics" | format_json

    # Extract key metrics
    local cpu_usage memory_usage connections
    cpu_usage=$(echo "$metrics" | jq -r '.cpu_usage_percent // "N/A"' 2>/dev/null)
    memory_usage=$(echo "$metrics" | jq -r '.memory_usage_percent // "N/A"' 2>/dev/null)
    connections=$(echo "$metrics" | jq -r '.active_connections // "N/A"' 2>/dev/null)

    echo ""
    log_info "Key metrics:"
    echo "  CPU Usage: $cpu_usage%"
    echo "  Memory Usage: $memory_usage%"
    echo "  Active Connections: $connections"
  else
    log_warning "Could not fetch performance metrics"
  fi

  echo ""

  # Check database connections
  log_info "Checking database connection statistics..."
  local conn_result
  if conn_result=$("$SUPABASE_CLI" db:query "$project_ref" \
    "SELECT state, count(*) FROM pg_stat_activity GROUP BY state" \
    --format json 2>&1); then

    log_success "Connection statistics retrieved"
    echo ""
    echo "Connection states:"
    echo "$conn_result" | jq -r '.rows[] | "  \(.[0]): \(.[1])"' 2>/dev/null || echo "$conn_result"
  else
    log_warning "Could not query connection statistics"
  fi

  echo ""

  # Performance tips
  log_info "Performance monitoring tips:"
  echo "  - Monitor CPU usage (alert if > 80%)"
  echo "  - Track memory usage trends over time"
  echo "  - Watch for connection pool exhaustion"
  echo "  - Set up automated alerts for threshold breaches"
  echo "  - Export metrics to external monitoring system"

  echo ""
  print_divider
}

# ============================================================================
# Example 4: Check Project Health
# ============================================================================

example_check_health() {
  local project_ref="$1"

  print_header "Example 4: Check Project Health"

  log_info "Running comprehensive health check for project: $project_ref"

  # Health check 1: Project status
  log_info "Health Check 1: Project status..."
  local project_info
  if project_info=$("$SUPABASE_CLI" projects:get "$project_ref" --format json 2>&1); then
    local project_status
    project_status=$(echo "$project_info" | jq -r '.status' 2>/dev/null || echo "unknown")

    if [[ "$project_status" == "ACTIVE_HEALTHY" ]]; then
      log_success "Project status: $project_status"
    else
      log_warning "Project status: $project_status"
    fi
  else
    log_error "Could not fetch project status"
  fi

  # Health check 2: Database connectivity
  log_info "Health Check 2: Database connectivity..."
  local db_test
  if db_test=$("$SUPABASE_CLI" db:query "$project_ref" "SELECT 1" --format json 2>&1); then
    log_success "Database is accessible"
  else
    log_error "Database connection failed"
    echo "$db_test" >&2
  fi

  # Health check 3: System health
  log_info "Health Check 3: System health..."
  local health
  if health=$("$SUPABASE_CLI" monitor:health "$project_ref" --format json 2>&1); then
    log_success "System health check passed"

    # Check individual services
    local db_health api_health auth_health storage_health
    db_health=$(echo "$health" | jq -r '.services.database // "unknown"' 2>/dev/null)
    api_health=$(echo "$health" | jq -r '.services.api // "unknown"' 2>/dev/null)
    auth_health=$(echo "$health" | jq -r '.services.auth // "unknown"' 2>/dev/null)
    storage_health=$(echo "$health" | jq -r '.services.storage // "unknown"' 2>/dev/null)

    echo ""
    log_info "Service health:"
    echo "  Database: $db_health"
    echo "  API: $api_health"
    echo "  Auth: $auth_health"
    echo "  Storage: $storage_health"
  else
    log_warning "Could not perform system health check"
  fi

  # Health check 4: Recent errors
  log_info "Health Check 4: Recent errors..."
  local error_logs
  if error_logs=$("$SUPABASE_CLI" logs:errors:list "$project_ref" --format json 2>&1); then
    local error_count
    error_count=$(echo "$error_logs" | jq 'length' 2>/dev/null || echo "0")

    if [[ $error_count -eq 0 ]]; then
      log_success "No recent errors"
    else
      log_warning "Found $error_count recent error(s)"
    fi
  else
    log_warning "Could not check error logs"
  fi

  # Health check 5: Response times
  log_info "Health Check 5: API response times..."
  local api_logs
  if api_logs=$("$SUPABASE_CLI" logs:api:list "$project_ref" --format json 2>&1); then
    local avg_response_time
    avg_response_time=$(echo "$api_logs" | jq '[.[] | .response_time_ms] | add / length' 2>/dev/null || echo "N/A")

    if [[ "$avg_response_time" != "N/A" ]] && [[ "$avg_response_time" != "null" ]]; then
      log_success "Average response time: ${avg_response_time}ms"

      # Warn if response time is high
      if (( $(echo "$avg_response_time > 1000" | bc -l 2>/dev/null || echo 0) )); then
        log_warning "Response times are high - investigate performance"
      fi
    else
      log_info "Response time data not available"
    fi
  else
    log_warning "Could not analyze response times"
  fi

  echo ""

  # Overall health summary
  log_success "Health check complete"
  log_info "All critical systems checked"

  echo ""
  log_info "Recommended monitoring schedule:"
  echo "  - Health checks: Every 5 minutes (automated)"
  echo "  - Error log review: Every hour"
  echo "  - Performance metrics: Every 15 minutes"
  echo "  - Full system audit: Daily"

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
  example_tail_logs "$project_ref" || true
  pause "Press Enter to continue to Example 2..."

  example_query_errors "$project_ref" || true
  pause "Press Enter to continue to Example 3..."

  example_view_metrics "$project_ref" || true
  pause "Press Enter to continue to Example 4..."

  example_check_health "$project_ref" || true

  # Summary
  echo ""
  print_header "Examples Complete"
  log_success "All monitoring examples completed"
  log_info "Review the output above for details on each operation"
  echo ""
  log_info "Next steps for production monitoring:"
  echo "  - Set up automated health checks in CI/CD"
  echo "  - Configure alerts for errors and performance degradation"
  echo "  - Export logs to external logging service (Datadog, Splunk, etc.)"
  echo "  - Create dashboards for real-time monitoring"
  echo "  - Document incident response procedures"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
