#!/usr/bin/env bash
#
# Example: CLI Configuration Management
#
# This script demonstrates how to manage Supabase CLI configuration:
# 1. List configuration profiles
# 2. Create a new profile
# 3. Switch to a different profile
# 4. Set access token for a profile
#
# Usage:
#   ./config.sh
#
# Requirements:
#   - supabase-cli must be installed and in PATH
#   - SUPABASE_ACCESS_TOKEN environment variable should be set (optional)
#   - jq is recommended for JSON output formatting
#
# Workflow IDs referenced:
#   - config-update-verify
#   - multi-project-sync
#

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# ============================================================================
# Script Configuration
# ============================================================================

NEW_PROFILE_NAME="development-$(date +%s)"
TEST_TOKEN="sbp_test_token_${RANDOM}"

# ============================================================================
# Example Functions
# ============================================================================

# Example 1: List configuration profiles
example_list_profiles() {
  print_header "Example 1: List Configuration Profiles"
  log_info "Fetching configuration profiles..."

  local profiles_result
  if profiles_result=$("$SUPABASE_CLI" config:list-profiles --format json 2>&1); then
    log_success "Configuration profiles retrieved successfully!"
    echo ""
    echo "$profiles_result" | format_json
    echo ""

    # Show summary
    if command -v jq >/dev/null 2>&1; then
      local profile_count
      profile_count=$(echo "$profiles_result" | jq 'length' 2>/dev/null || echo "0")
      log_info "Total profiles: $profile_count"

      local current_profile
      current_profile=$(echo "$profiles_result" | jq -r '.[] | select(.current == true) | .name' 2>/dev/null)
      if [[ -n "$current_profile" && "$current_profile" != "null" ]]; then
        log_info "Current profile: $current_profile"
      fi
    fi
  else
    log_warning "Failed to list profiles or no profiles exist"
    echo "$profiles_result" | head -10
    log_info "This is normal for first-time CLI setup"
  fi

  print_divider
}

# Example 2: Create a new profile
example_create_profile() {
  print_header "Example 2: Create New Profile"
  log_info "Profile name: $NEW_PROFILE_NAME"

  echo ""
  log_info "Profiles are useful for:"
  echo "  - Managing multiple Supabase accounts"
  echo "  - Separating dev/staging/production environments"
  echo "  - Team members with different access levels"
  echo "  - CI/CD pipelines with dedicated tokens"
  echo ""

  if confirm_action "Create new profile '$NEW_PROFILE_NAME'?"; then
    log_info "Creating profile..."

    if run_with_spinner "Creating profile..." \
      "$SUPABASE_CLI" config:create-profile "$NEW_PROFILE_NAME" --format json 2>&1; then
      log_success "Profile '$NEW_PROFILE_NAME' created successfully!"

      echo ""
      log_info "Next steps:"
      echo "  1. Set access token for this profile:"
      echo "     supabase-cli config:set-token $NEW_PROFILE_NAME <your-token>"
      echo ""
      echo "  2. Switch to this profile:"
      echo "     supabase-cli config:set-profile $NEW_PROFILE_NAME"
      echo ""
      echo "  3. Verify current profile:"
      echo "     supabase-cli config:show-current"
      echo ""
    else
      log_error "Failed to create profile"
      log_info "Profile may already exist or name may be invalid"
    fi
  else
    log_info "Profile creation cancelled"
  fi

  print_divider
}

# Example 3: Switch to a different profile
example_switch_profile() {
  print_header "Example 3: Switch Active Profile"

  log_info "Checking available profiles..."

  local profiles_result
  profiles_result=$("$SUPABASE_CLI" config:list-profiles --format json 2>/dev/null) || {
    log_warning "No profiles available to switch"
    log_info "Create a profile first with: supabase-cli config:create-profile <name>"
    print_divider
    return
  }

  # Check if we have profiles
  local profile_count
  if command -v jq >/dev/null 2>&1; then
    profile_count=$(echo "$profiles_result" | jq 'length' 2>/dev/null || echo "0")
  else
    profile_count="unknown"
  fi

  if [[ "$profile_count" == "0" ]] || [[ -z "$profiles_result" ]]; then
    log_warning "No profiles available"
    print_divider
    return
  fi

  echo ""
  log_info "Available profiles:"
  echo "$profiles_result" | format_json
  echo ""

  # Get current profile
  local current_profile
  if command -v jq >/dev/null 2>&1; then
    current_profile=$(echo "$profiles_result" | jq -r '.[] | select(.current == true) | .name' 2>/dev/null)
  fi

  if [[ -n "$current_profile" && "$current_profile" != "null" ]]; then
    log_info "Current profile: $current_profile"
  fi

  echo ""
  log_info "To switch profiles, use:"
  echo "  supabase-cli config:set-profile <profile-name>"
  echo ""
  log_info "Example:"
  echo "  supabase-cli config:set-profile production"
  echo ""

  log_warning "Note: Switching profiles changes which access token is used"
  log_info "Different profiles may have access to different projects"

  print_divider
}

# Example 4: Set access token for a profile
example_set_token() {
  print_header "Example 4: Set Access Token"

  log_warning "Access tokens are HIGHLY SENSITIVE"
  echo ""
  log_info "Best practices for tokens:"
  echo "  - Never commit tokens to version control"
  echo "  - Use different tokens for each environment"
  echo "  - Rotate tokens regularly (quarterly recommended)"
  echo "  - Use minimal permissions required"
  echo "  - Store tokens in secure password managers"
  echo ""

  log_info "Ways to set access token:"
  echo ""
  echo "1. For current profile:"
  echo "   supabase-cli config:set-token <your-token>"
  echo ""
  echo "2. For specific profile:"
  echo "   supabase-cli config:set-token <profile-name> <your-token>"
  echo ""
  echo "3. Via environment variable (temporary):"
  echo "   export SUPABASE_ACCESS_TOKEN=<your-token>"
  echo ""
  echo "4. Via config file (persistent):"
  echo "   echo '<your-token>' > ~/.supabase/access-token"
  echo ""

  log_info "Token precedence (highest to lowest):"
  echo "  1. Environment variable (SUPABASE_ACCESS_TOKEN)"
  echo "  2. Profile-specific token"
  echo "  3. Default token in ~/.supabase/access-token"
  echo ""

  log_warning "DO NOT set test tokens in production profiles!"

  print_divider
}

# Additional: Configuration doctor
example_config_doctor() {
  print_header "Bonus: Configuration Doctor"
  log_info "Diagnose configuration issues..."

  echo ""
  log_info "Running configuration health check..."

  if run_with_spinner "Checking configuration..." \
    "$SUPABASE_CLI" config:doctor --format json 2>&1; then
    log_success "Configuration is healthy!"
  else
    log_warning "Configuration issues detected"
  fi

  echo ""
  log_info "What config:doctor checks:"
  echo "  ✓ CLI installation and version"
  echo "  ✓ Access token validity"
  echo "  ✓ Profile configuration"
  echo "  ✓ Network connectivity to Supabase API"
  echo "  ✓ Required dependencies (jq, etc.)"
  echo "  ✓ Config file permissions"
  echo ""

  log_info "Common issues and solutions:"
  echo ""
  echo "Issue: 'UNAUTHORIZED' errors"
  echo "  Solution: Set valid access token with config:set-token"
  echo ""
  echo "Issue: 'No profile found'"
  echo "  Solution: Create profile with config:create-profile"
  echo ""
  echo "Issue: 'Command not found'"
  echo "  Solution: Ensure supabase-cli is in PATH"
  echo ""
  echo "Issue: 'Network timeout'"
  echo "  Solution: Check internet connection and firewall settings"
  echo ""

  print_divider
}

# Additional: Show current configuration
example_show_current() {
  print_header "Bonus: Show Current Configuration"
  log_info "Displaying current CLI configuration..."

  local config_result
  if config_result=$("$SUPABASE_CLI" config:show-current --format json 2>&1); then
    log_success "Current configuration:"
    echo ""
    echo "$config_result" | format_json
    echo ""

    if command -v jq >/dev/null 2>&1; then
      local profile_name
      profile_name=$(echo "$config_result" | jq -r '.profile' 2>/dev/null)
      if [[ -n "$profile_name" && "$profile_name" != "null" ]]; then
        log_info "Active profile: $profile_name"
      fi

      # Show if token is set (but not the actual token)
      local has_token
      has_token=$(echo "$config_result" | jq -r '.has_token' 2>/dev/null)
      if [[ "$has_token" == "true" ]]; then
        log_success "Access token: configured ✓"
      else
        log_warning "Access token: not configured ✗"
      fi
    fi
  else
    log_warning "Could not retrieve current configuration"
    echo "$config_result" | head -10
  fi

  print_divider
}

# ============================================================================
# Main Script Logic
# ============================================================================

main() {
  print_header "Supabase CLI Configuration Examples"

  log_info "Configuration management allows you to:"
  echo "  - Manage multiple Supabase accounts"
  echo "  - Separate development and production environments"
  echo "  - Secure access tokens per profile"
  echo "  - Quick switching between projects"
  echo ""

  print_divider

  # Run examples
  example_show_current
  example_list_profiles
  example_create_profile
  example_switch_profile
  example_set_token
  example_config_doctor

  # Summary
  print_header "Examples Complete"
  log_success "All configuration management examples completed!"
  echo ""
  log_info "Essential configuration commands:"
  echo "  - config:show-current              Show active configuration"
  echo "  - config:list-profiles             List all profiles"
  echo "  - config:create-profile <name>     Create new profile"
  echo "  - config:set-profile <name>        Switch to profile"
  echo "  - config:delete-profile <name>     Delete profile"
  echo "  - config:set-token [profile] <token>  Set access token"
  echo "  - config:doctor                    Diagnose configuration issues"
  echo ""
  log_info "Configuration file locations:"
  echo "  - Profiles: ~/.supabase/profiles/"
  echo "  - Default token: ~/.supabase/access-token"
  echo "  - Global config: ~/.supabase/config.json"
  echo ""
  log_warning "Security reminders:"
  echo "  - Never commit tokens to version control"
  echo "  - Use different tokens for dev/staging/production"
  echo "  - Rotate tokens regularly"
  echo "  - Use environment variables for CI/CD"
  echo ""
}

# ============================================================================
# Error Handling
# ============================================================================

# Set up trap to clean up spinner if script is interrupted
trap 'spinner_stop 2>/dev/null; exit 130' INT TERM

# Run main function
main "$@"
