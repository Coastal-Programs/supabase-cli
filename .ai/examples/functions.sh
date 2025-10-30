#!/usr/bin/env bash
#
# Example: Edge Functions Management
#
# This script demonstrates how to manage Supabase Edge Functions:
# 1. List all deployed functions
# 2. Deploy a new function
# 3. Invoke/test function with payload
# 4. Update and redeploy function
#
# Usage:
#   ./functions.sh
#   ./functions.sh <project-ref>
#
# Requirements:
#   - supabase-cli must be installed and in PATH
#   - SUPABASE_ACCESS_TOKEN environment variable must be set
#   - jq is recommended for JSON output formatting
#
# Workflow IDs referenced:
#   - deploy-new-function
#   - test-existing-function
#   - update-and-redeploy-function
#

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# ============================================================================
# Script Configuration
# ============================================================================

PROJECT_REF="${1:-}"
FUNCTION_NAME="hello-world"
TEST_PAYLOAD='{"name":"test-user","timestamp":"'"$(date -Iseconds)"'"}'

# ============================================================================
# Example Functions
# ============================================================================

# Example 1: List all deployed functions
# Workflow: deploy-new-function (step 1)
example_list_functions() {
  print_header "Example 1: List All Functions"
  log_info "Fetching functions for project $PROJECT_REF..."

  local functions_json
  functions_json=$("$SUPABASE_CLI" functions:list "$PROJECT_REF" --format json 2>/dev/null) || {
    handle_error "Failed to list functions" 1 "Make sure the project reference is correct"
  }

  if [[ -n "$functions_json" ]] && [[ "$functions_json" != "[]" ]]; then
    log_success "Functions found:"
    echo "$functions_json" | format_json

    # Display summary
    local count
    count=$(echo "$functions_json" | jq 'length' 2>/dev/null || echo "0")
    log_info "Total functions: $count"
  else
    log_warning "No functions found for this project"
    log_info "Deploy a function with: supabase-cli functions:deploy $PROJECT_REF <function-name> --file <path>"
  fi

  print_divider
}

# Example 2: Deploy a new function
# Workflow: deploy-new-function (steps 2-3)
example_deploy_function() {
  print_header "Example 2: Deploy Function (Simulation)"
  log_info "Function name: $FUNCTION_NAME"

  # Note: This is a simulation since we don't have actual function files
  log_warning "This example simulates function deployment"
  log_info "In a real scenario, you would:"
  echo ""
  echo "  1. Create function file: ./functions/$FUNCTION_NAME/index.ts"
  echo "  2. Deploy with command:"
  echo "     supabase-cli functions:deploy $PROJECT_REF $FUNCTION_NAME \\"
  echo "       --file ./functions/$FUNCTION_NAME/index.ts"
  echo ""
  log_info "Example function code:"
  echo ""
  cat << 'EOF'
  import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

  serve(async (req) => {
    const { name } = await req.json()
    const data = {
      message: `Hello ${name || 'World'}!`,
      timestamp: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(data),
      { headers: { "Content-Type": "application/json" } }
    )
  })
EOF
  echo ""
  log_info "After deployment, verify with functions:list"

  print_divider
}

# Example 3: Invoke/test function with payload
# Workflow: test-existing-function (steps 2-3)
example_invoke_function() {
  print_header "Example 3: Invoke Function"

  # Check if functions exist first
  local functions_json
  functions_json=$("$SUPABASE_CLI" functions:list "$PROJECT_REF" --format json 2>/dev/null) || {
    log_warning "Cannot list functions"
    log_info "Skipping function invocation example"
    print_divider
    return
  }

  local function_count
  function_count=$(echo "$functions_json" | jq 'length' 2>/dev/null || echo "0")

  if [[ "$function_count" -eq 0 ]]; then
    log_warning "No functions deployed to invoke"
    log_info "Deploy a function first using Example 2"
    print_divider
    return
  fi

  # Get first function name for testing
  local test_function
  test_function=$(echo "$functions_json" | jq -r '.[0].name' 2>/dev/null)

  if [[ -z "$test_function" || "$test_function" == "null" ]]; then
    log_warning "Could not determine function name"
    print_divider
    return
  fi

  log_info "Testing function: $test_function"
  log_info "Payload: $TEST_PAYLOAD"

  if confirm_action "Invoke function '$test_function' with test payload?"; then
    log_info "Invoking function..."

    local result
    if result=$("$SUPABASE_CLI" functions:invoke "$PROJECT_REF" "$test_function" \
      --payload "$TEST_PAYLOAD" --format json 2>&1); then
      log_success "Function invoked successfully!"
      echo ""
      echo "Response:"
      echo "$result" | format_json
    else
      log_error "Function invocation failed"
      echo "$result" | head -20
      log_info "Check function logs for more details"
    fi
  else
    log_info "Function invocation skipped"
  fi

  print_divider
}

# Example 4: Update and redeploy function
# Workflow: update-and-redeploy-function (steps 1-3)
example_update_function() {
  print_header "Example 4: Update and Redeploy Function"

  log_warning "This example demonstrates the update workflow"
  log_info "In a real scenario, you would:"
  echo ""
  echo "  Step 1: Test current version"
  echo "    supabase-cli functions:invoke $PROJECT_REF $FUNCTION_NAME \\"
  echo "      --payload '$TEST_PAYLOAD'"
  echo ""
  echo "  Step 2: Update function code"
  echo "    # Edit ./functions/$FUNCTION_NAME/index.ts"
  echo ""
  echo "  Step 3: Redeploy with same command"
  echo "    supabase-cli functions:deploy $PROJECT_REF $FUNCTION_NAME \\"
  echo "      --file ./functions/$FUNCTION_NAME/index.ts"
  echo ""
  echo "  Step 4: Test updated version"
  echo "    supabase-cli functions:invoke $PROJECT_REF $FUNCTION_NAME \\"
  echo "      --payload '$TEST_PAYLOAD'"
  echo ""
  echo "  Step 5: Check logs for deployment issues"
  echo "    # Logs command not yet implemented in CLI"
  echo ""

  log_info "Best practices:"
  echo "  - Keep previous version in version control for rollback"
  echo "  - Test locally before deploying"
  echo "  - Monitor function logs after deployment"
  echo "  - Use canary deployments for gradual rollout"

  print_divider
}

# ============================================================================
# Main Script Logic
# ============================================================================

main() {
  print_header "Supabase Edge Functions Examples"

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

  # Run examples
  example_list_functions
  example_deploy_function
  example_invoke_function
  example_update_function

  # Summary
  print_header "Examples Complete"
  log_success "All edge functions examples completed!"
  echo ""
  log_info "Next steps:"
  echo "  1. Create function files in ./functions/<name>/index.ts"
  echo "  2. Deploy with: supabase-cli functions:deploy <ref> <name> --file <path>"
  echo "  3. Test with: supabase-cli functions:invoke <ref> <name> --payload '{...}'"
  echo "  4. Monitor performance and errors in production"
  echo ""
}

# ============================================================================
# Error Handling
# ============================================================================

# Set up trap to clean up spinner if script is interrupted
trap 'spinner_stop 2>/dev/null; exit 130' INT TERM

# Run main function
main "$@"
