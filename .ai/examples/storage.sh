#!/usr/bin/env bash
#
# Example: Storage Bucket Management
#
# This script demonstrates how to manage Supabase Storage buckets:
# 1. List all storage buckets
# 2. Create a public bucket
# 3. Create a private bucket
# 4. Get bucket details and configuration
#
# Usage:
#   ./storage.sh
#   ./storage.sh <project-ref>
#
# Requirements:
#   - supabase-cli must be installed and in PATH
#   - SUPABASE_ACCESS_TOKEN environment variable must be set
#   - jq is recommended for JSON output formatting
#
# Workflow IDs referenced:
#   - setup-storage-bucket
#   - configure-bucket-permissions
#

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# ============================================================================
# Script Configuration
# ============================================================================

PROJECT_REF="${1:-}"
PUBLIC_BUCKET_NAME="public-assets-$(date +%s)"
PRIVATE_BUCKET_NAME="user-uploads-$(date +%s)"

# ============================================================================
# Example Functions
# ============================================================================

# Example 1: List all storage buckets
# Workflow: setup-storage-bucket (step 1)
example_list_buckets() {
  print_header "Example 1: List Storage Buckets"
  log_info "Fetching storage buckets for project $PROJECT_REF..."

  log_warning "Storage bucket commands are not yet implemented in the CLI"
  log_info "These examples demonstrate the planned API"
  echo ""
  log_info "Command that would be used:"
  echo "  supabase-cli storage:buckets:list $PROJECT_REF --format json"
  echo ""
  log_info "Expected output format:"
  cat << 'EOF'
  [
    {
      "id": "bucket-123",
      "name": "avatars",
      "public": false,
      "created_at": "2024-10-29T12:00:00Z",
      "file_size_limit": 5242880,
      "allowed_mime_types": ["image/jpeg", "image/png"]
    },
    {
      "id": "bucket-456",
      "name": "public-assets",
      "public": true,
      "created_at": "2024-10-29T11:00:00Z",
      "file_size_limit": null,
      "allowed_mime_types": null
    }
  ]
EOF
  echo ""

  print_divider
}

# Example 2: Create a public bucket
# Workflow: setup-storage-bucket (step 2)
example_create_public_bucket() {
  print_header "Example 2: Create Public Bucket"
  log_info "Bucket name: $PUBLIC_BUCKET_NAME"
  log_info "Access: Public (anyone can read)"

  echo ""
  log_info "Command that would be used:"
  echo "  supabase-cli storage:buckets:create $PROJECT_REF \\"
  echo "    --name '$PUBLIC_BUCKET_NAME' \\"
  echo "    --public true \\"
  echo "    --format json"
  echo ""

  log_info "Use cases for public buckets:"
  echo "  - Static assets (images, CSS, JavaScript)"
  echo "  - Public downloads"
  echo "  - CDN-delivered content"
  echo "  - Marketing materials"
  echo ""

  log_warning "Security note:"
  echo "  Public buckets allow anyone to read files"
  echo "  Only use for truly public content"
  echo "  Consider using signed URLs for temporary public access instead"
  echo ""

  log_info "Expected response:"
  cat << EOF
  {
    "id": "bucket-789",
    "name": "$PUBLIC_BUCKET_NAME",
    "public": true,
    "created_at": "$(date -Iseconds)",
    "owner": "user-id",
    "file_size_limit": null,
    "allowed_mime_types": null
  }
EOF
  echo ""

  print_divider
}

# Example 3: Create a private bucket
# Workflow: setup-storage-bucket (step 2 variation)
example_create_private_bucket() {
  print_header "Example 3: Create Private Bucket"
  log_info "Bucket name: $PRIVATE_BUCKET_NAME"
  log_info "Access: Private (requires authentication)"

  echo ""
  log_info "Command that would be used:"
  echo "  supabase-cli storage:buckets:create $PROJECT_REF \\"
  echo "    --name '$PRIVATE_BUCKET_NAME' \\"
  echo "    --public false \\"
  echo "    --file-size-limit 10485760 \\"
  echo "    --allowed-mime-types 'image/jpeg,image/png,application/pdf' \\"
  echo "    --format json"
  echo ""

  log_info "Use cases for private buckets:"
  echo "  - User profile images"
  echo "  - Private documents"
  echo "  - User-generated content"
  echo "  - Sensitive files requiring authentication"
  echo ""

  log_info "Configuration options:"
  echo "  --file-size-limit: Maximum file size in bytes (10MB = 10485760)"
  echo "  --allowed-mime-types: Comma-separated list of allowed types"
  echo "  --public: false for private, true for public"
  echo ""

  log_info "Expected response:"
  cat << EOF
  {
    "id": "bucket-012",
    "name": "$PRIVATE_BUCKET_NAME",
    "public": false,
    "created_at": "$(date -Iseconds)",
    "owner": "user-id",
    "file_size_limit": 10485760,
    "allowed_mime_types": ["image/jpeg", "image/png", "application/pdf"]
  }
EOF
  echo ""

  print_divider
}

# Example 4: Get bucket details
# Workflow: setup-storage-bucket (step 5)
example_get_bucket_details() {
  print_header "Example 4: Get Bucket Details"
  log_info "Retrieving configuration for existing buckets"

  echo ""
  log_info "Command that would be used:"
  echo "  supabase-cli storage:buckets:get $PROJECT_REF avatars --format json"
  echo ""

  log_info "Expected output includes:"
  echo "  - Bucket ID and name"
  echo "  - Public/private status"
  echo "  - File size limits"
  echo "  - Allowed MIME types"
  echo "  - Creation date"
  echo "  - Total files and storage used"
  echo "  - RLS policies applied"
  echo ""

  log_info "Sample detailed response:"
  cat << 'EOF'
  {
    "id": "bucket-123",
    "name": "avatars",
    "public": false,
    "created_at": "2024-10-29T12:00:00Z",
    "file_size_limit": 5242880,
    "allowed_mime_types": ["image/jpeg", "image/png"],
    "stats": {
      "total_files": 1247,
      "total_size_bytes": 45389012,
      "last_upload_at": "2024-10-29T15:30:00Z"
    },
    "policies": [
      {
        "name": "authenticated_users_read",
        "operation": "SELECT",
        "check": "auth.role() = 'authenticated'"
      },
      {
        "name": "users_upload_own",
        "operation": "INSERT",
        "check": "auth.uid() = owner"
      }
    ]
  }
EOF
  echo ""

  log_info "Use this information to:"
  echo "  - Verify bucket configuration"
  echo "  - Monitor storage usage"
  echo "  - Review security policies"
  echo "  - Audit file access patterns"
  echo ""

  print_divider
}

# Additional: Storage policies example
example_storage_policies() {
  print_header "Bonus: Storage Policies"
  log_info "Configuring Row Level Security (RLS) for storage"

  echo ""
  log_warning "Storage policies control who can access files"
  log_info "Common policy patterns:"
  echo ""

  echo "1. Authenticated users can read their own files:"
  cat << 'EOF'
  CREATE POLICY "Users read own files"
  ON storage.objects FOR SELECT
  USING (auth.uid() = owner);
EOF
  echo ""

  echo "2. Authenticated users can upload to their folder:"
  cat << 'EOF'
  CREATE POLICY "Users upload own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    auth.uid() = owner AND
    bucket_id = 'user-uploads'
  );
EOF
  echo ""

  echo "3. Public read access for specific bucket:"
  cat << 'EOF'
  CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'public-assets');
EOF
  echo ""

  log_info "Command that would be used:"
  echo "  supabase-cli storage:policies:list $PROJECT_REF --format json"
  echo ""

  log_info "Best practices:"
  echo "  - Default to private buckets"
  echo "  - Use specific policies for each operation (SELECT, INSERT, UPDATE, DELETE)"
  echo "  - Test policies with different user roles"
  echo "  - Regularly audit policy effectiveness"
  echo "  - Use path-based restrictions for multi-tenant applications"
  echo ""

  print_divider
}

# ============================================================================
# Main Script Logic
# ============================================================================

main() {
  print_header "Supabase Storage Management Examples"

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
  example_list_buckets
  example_create_public_bucket
  example_create_private_bucket
  example_get_bucket_details
  example_storage_policies

  # Summary
  print_header "Examples Complete"
  log_success "All storage management examples completed!"
  echo ""
  log_warning "Note: Storage commands are planned but not yet implemented"
  log_info "Use the Supabase Dashboard for storage management currently"
  echo ""
  log_info "Planned commands:"
  echo "  - storage:buckets:list <ref>"
  echo "  - storage:buckets:create <ref> --name <name> [options]"
  echo "  - storage:buckets:get <ref> <name>"
  echo "  - storage:buckets:update <ref> <name> [options]"
  echo "  - storage:buckets:delete <ref> <name>"
  echo "  - storage:policies:list <ref>"
  echo "  - storage:policies:set <ref> --bucket <name> --policy <sql>"
  echo ""
}

# ============================================================================
# Error Handling
# ============================================================================

# Set up trap to clean up spinner if script is interrupted
trap 'spinner_stop 2>/dev/null; exit 130' INT TERM

# Run main function
main "$@"
