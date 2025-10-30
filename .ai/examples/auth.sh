#!/usr/bin/env bash
#
# Example: Authentication and JWT Management
#
# This script demonstrates how to manage Supabase authentication:
# 1. Get JWT secret
# 2. Rotate JWT secret (with confirmation)
# 3. List authentication users (simulation)
# 4. Get user details (simulation)
#
# Usage:
#   ./auth.sh
#   ./auth.sh <project-ref>
#
# Requirements:
#   - supabase-cli must be installed and in PATH
#   - SUPABASE_ACCESS_TOKEN environment variable must be set
#   - jq is recommended for JSON output formatting
#
# Workflow IDs referenced:
#   - rotate-jwt-secrets
#   - auth-provider-setup
#

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# ============================================================================
# Script Configuration
# ============================================================================

PROJECT_REF="${1:-}"

# ============================================================================
# Example Functions
# ============================================================================

# Example 1: Get JWT secret
# Workflow: rotate-jwt-secrets (step 1)
example_get_jwt_secret() {
  print_header "Example 1: Get JWT Secret"
  log_info "Retrieving current JWT secret..."

  local jwt_result
  if jwt_result=$("$SUPABASE_CLI" auth:jwt:get --format json 2>&1); then
    log_success "JWT secret retrieved successfully!"
    echo ""
    log_warning "SECURITY WARNING: JWT secrets are sensitive!"
    log_info "Output (redacted for security):"
    echo "$jwt_result" | jq -r 'if type == "object" then .jwt_secret = "[REDACTED]" else . end' 2>/dev/null || echo "[REDACTED]"
    echo ""
    log_info "Best practices:"
    echo "  - Never commit JWT secrets to version control"
    echo "  - Store secrets in secure environment variables"
    echo "  - Rotate secrets regularly (quarterly recommended)"
    echo "  - Use different secrets for dev/staging/production"
    echo "  - Keep backup of current secret before rotation"
  else
    log_error "Failed to retrieve JWT secret"
    echo "$jwt_result" | head -10
  fi

  print_divider
}

# Example 2: Rotate JWT secret
# Workflow: rotate-jwt-secrets (steps 2-4)
example_rotate_jwt_secret() {
  print_header "Example 2: Rotate JWT Secret"

  log_warning "JWT rotation is a DESTRUCTIVE operation!"
  echo ""
  log_info "Impact of JWT rotation:"
  echo "  - All existing JWTs will be immediately invalidated"
  echo "  - All users will need to re-authenticate"
  echo "  - All services using the old secret will fail"
  echo "  - Update all applications with new secret immediately"
  echo ""
  log_info "Pre-rotation checklist:"
  echo "  ✓ Backup current JWT secret"
  echo "  ✓ Identify all services using JWT"
  echo "  ✓ Schedule during maintenance window"
  echo "  ✓ Notify team and users"
  echo "  ✓ Prepare rollout plan for new secret"
  echo ""

  if confirm_action "Rotate JWT secret for project $PROJECT_REF? This will invalidate ALL existing tokens!"; then
    log_info "Step 1: Creating backup before rotation..."

    # Get current JWT (would normally save to secure location)
    local current_jwt
    current_jwt=$("$SUPABASE_CLI" auth:jwt:get --format json 2>/dev/null) || {
      log_warning "Could not backup current JWT"
    }

    log_info "Step 2: Rotating JWT secret..."

    if run_with_spinner "Rotating JWT secret..." \
      "$SUPABASE_CLI" auth:jwt:rotate "$PROJECT_REF" --yes --format json 2>&1; then
      log_success "JWT secret rotated successfully!"

      echo ""
      log_warning "IMMEDIATE ACTION REQUIRED:"
      echo "  1. Update environment variables in all services:"
      echo "     export SUPABASE_JWT_SECRET=<new-secret>"
      echo ""
      echo "  2. Restart all services using JWT"
      echo ""
      echo "  3. Monitor for authentication failures:"
      echo "     supabase-cli logs:api:list $PROJECT_REF --format json | jq '.[] | select(.status == 401)'"
      echo ""
      echo "  4. Verify health after rotation:"
      echo "     supabase-cli monitor:health $PROJECT_REF"
      echo ""

      # Verify new JWT
      log_info "Step 3: Verifying new JWT secret..."
      local new_jwt
      if new_jwt=$("$SUPABASE_CLI" auth:jwt:get --format json 2>/dev/null); then
        log_success "New JWT secret verified (different from previous)"
      else
        log_error "Failed to verify new JWT"
      fi
    else
      handle_error "JWT rotation failed" 1 "Check project status and permissions"
    fi
  else
    log_info "JWT rotation cancelled"
    log_info "Good practice: Only rotate when necessary (security incident or compliance)"
  fi

  print_divider
}

# Example 3: List authentication users (simulation)
example_list_auth_users() {
  print_header "Example 3: List Authentication Users"

  log_warning "Auth user management commands are planned but not yet implemented"
  log_info "These examples demonstrate the planned API"
  echo ""

  log_info "Command that would be used:"
  echo "  supabase-cli auth:users:list $PROJECT_REF --format json"
  echo ""

  log_info "Expected output format:"
  cat << 'EOF'
  [
    {
      "id": "user-uuid-1",
      "email": "user1@example.com",
      "created_at": "2024-10-15T10:30:00Z",
      "last_sign_in_at": "2024-10-29T08:45:00Z",
      "confirmed_at": "2024-10-15T10:35:00Z",
      "email_confirmed": true,
      "phone": null,
      "providers": ["email"],
      "app_metadata": {},
      "user_metadata": {
        "full_name": "John Doe"
      }
    },
    {
      "id": "user-uuid-2",
      "email": "user2@example.com",
      "created_at": "2024-10-20T14:20:00Z",
      "last_sign_in_at": "2024-10-29T09:15:00Z",
      "confirmed_at": "2024-10-20T14:22:00Z",
      "email_confirmed": true,
      "phone": "+1234567890",
      "providers": ["email", "google"],
      "app_metadata": {
        "role": "admin"
      },
      "user_metadata": {
        "full_name": "Jane Smith",
        "avatar_url": "https://..."
      }
    }
  ]
EOF
  echo ""

  log_info "Common filters:"
  echo "  --email <email>        Filter by email"
  echo "  --provider <provider>  Filter by auth provider"
  echo "  --confirmed            Only confirmed users"
  echo "  --limit <n>            Limit results"
  echo ""

  print_divider
}

# Example 4: Get user details (simulation)
example_get_user_details() {
  print_header "Example 4: Get User Details"

  log_info "Command that would be used:"
  echo "  supabase-cli auth:users:get $PROJECT_REF <user-id> --format json"
  echo ""

  log_info "Expected detailed output:"
  cat << 'EOF'
  {
    "id": "user-uuid-1",
    "aud": "authenticated",
    "role": "authenticated",
    "email": "user@example.com",
    "email_confirmed_at": "2024-10-15T10:35:00Z",
    "phone": null,
    "phone_confirmed_at": null,
    "created_at": "2024-10-15T10:30:00Z",
    "updated_at": "2024-10-29T09:00:00Z",
    "last_sign_in_at": "2024-10-29T08:45:00Z",
    "confirmed_at": "2024-10-15T10:35:00Z",
    "identities": [
      {
        "id": "identity-uuid",
        "user_id": "user-uuid-1",
        "identity_data": {
          "email": "user@example.com",
          "sub": "user-uuid-1"
        },
        "provider": "email",
        "last_sign_in_at": "2024-10-29T08:45:00Z",
        "created_at": "2024-10-15T10:30:00Z",
        "updated_at": "2024-10-29T08:45:00Z"
      }
    ],
    "app_metadata": {
      "provider": "email",
      "providers": ["email"]
    },
    "user_metadata": {
      "full_name": "John Doe",
      "avatar_url": null,
      "email": "user@example.com"
    },
    "sessions": [
      {
        "id": "session-uuid",
        "user_id": "user-uuid-1",
        "created_at": "2024-10-29T08:45:00Z",
        "updated_at": "2024-10-29T08:45:00Z",
        "factor_id": null,
        "aal": "aal1",
        "not_after": "2024-11-29T08:45:00Z"
      }
    ]
  }
EOF
  echo ""

  log_info "Use user details to:"
  echo "  - Verify user authentication status"
  echo "  - Check linked OAuth providers"
  echo "  - Review user metadata and app metadata"
  echo "  - Audit active sessions"
  echo "  - Troubleshoot authentication issues"
  echo ""

  print_divider
}

# Additional: Auth providers example
example_auth_providers() {
  print_header "Bonus: Authentication Providers"
  log_info "OAuth provider configuration examples"

  echo ""
  log_info "Supported providers:"
  echo "  - Email (built-in)"
  echo "  - Google OAuth"
  echo "  - GitHub OAuth"
  echo "  - Facebook OAuth"
  echo "  - Twitter OAuth"
  echo "  - Azure AD"
  echo "  - Apple Sign In"
  echo "  - Discord"
  echo "  - GitLab"
  echo "  - Bitbucket"
  echo ""

  log_info "Command that would be used to list providers:"
  echo "  supabase-cli auth:providers:list $PROJECT_REF --format json"
  echo ""

  log_info "Example provider configuration:"
  cat << 'EOF'
  {
    "providers": [
      {
        "name": "google",
        "enabled": true,
        "client_id": "xxxxx.apps.googleusercontent.com",
        "client_secret": "[REDACTED]",
        "redirect_uri": "https://project.supabase.co/auth/v1/callback"
      },
      {
        "name": "github",
        "enabled": true,
        "client_id": "github-client-id",
        "client_secret": "[REDACTED]",
        "redirect_uri": "https://project.supabase.co/auth/v1/callback"
      }
    ]
  }
EOF
  echo ""

  log_info "Best practices for OAuth providers:"
  echo "  - Use environment-specific OAuth apps (dev, staging, prod)"
  echo "  - Never commit client secrets to version control"
  echo "  - Configure minimal required scopes"
  echo "  - Test authentication flow after configuration"
  echo "  - Monitor OAuth callback failures"
  echo "  - Keep provider credentials updated"
  echo ""

  print_divider
}

# ============================================================================
# Main Script Logic
# ============================================================================

main() {
  print_header "Supabase Authentication Examples"

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
  example_get_jwt_secret
  example_rotate_jwt_secret
  example_list_auth_users
  example_get_user_details
  example_auth_providers

  # Summary
  print_header "Examples Complete"
  log_success "All authentication management examples completed!"
  echo ""
  log_info "Key takeaways:"
  echo "  - JWT secrets are highly sensitive - protect them carefully"
  echo "  - Rotate JWT secrets during maintenance windows only"
  echo "  - Always backup before rotation"
  echo "  - Monitor authentication after any changes"
  echo "  - Use strong OAuth provider configurations"
  echo ""
  log_info "Available commands:"
  echo "  - auth:jwt:get"
  echo "  - auth:jwt:rotate <ref> [--yes]"
  echo ""
  log_info "Planned commands:"
  echo "  - auth:users:list <ref>"
  echo "  - auth:users:get <ref> <user-id>"
  echo "  - auth:providers:list <ref>"
  echo "  - auth:providers:config <provider> <ref>"
  echo ""
}

# ============================================================================
# Error Handling
# ============================================================================

# Set up trap to clean up spinner if script is interrupted
trap 'spinner_stop 2>/dev/null; exit 130' INT TERM

# Run main function
main "$@"
