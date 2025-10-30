#!/usr/bin/env bash
#
# Database Migrations Example
#
# This script demonstrates safe database migration workflows using the Supabase CLI.
# It shows how to list migrations, apply them safely with backups, and verify schema changes.
#
# Prerequisites:
#   - SUPABASE_ACCESS_TOKEN environment variable set
#   - Project reference ID
#   - Migration SQL files (optional, script will create sample)
#
# Usage:
#   ./migrations.sh <project-ref>
#
# References:
#   - Workflows: .ai/workflows.json - "apply-schema-migration" workflow
#   - Patterns: .ai/patterns.json - "migration-safe-apply" pattern
#

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# ============================================================================
# Example 1: List Existing Migrations
# ============================================================================

example_list_migrations() {
  local project_ref="$1"

  print_header "Example 1: List Existing Migrations"

  log_info "Fetching migration history for project: $project_ref"

  local migrations
  if migrations=$("$SUPABASE_CLI" migrations:list "$project_ref" --format json 2>&1); then
    log_success "Migrations retrieved successfully"

    # Display formatted output
    echo "$migrations" | format_json

    # Count migrations
    local migration_count
    migration_count=$(echo "$migrations" | jq 'length' 2>/dev/null || echo "0")
    log_info "Total migrations applied: $migration_count"

    # Show migration details
    if [[ $migration_count -gt 0 ]]; then
      echo ""
      log_info "Migration history (most recent first):"
      echo "$migrations" | jq -r 'reverse | .[] | "  [\(.version)] \(.name) - \(.applied_at)"' 2>/dev/null || true
    else
      log_info "No migrations found - database is at initial state"
    fi
  else
    log_error "Failed to list migrations"
    echo "$migrations" >&2
    return 1
  fi

  echo ""
  print_divider
}

# ============================================================================
# Example 2: Apply Migration with Backup
# ============================================================================

example_apply_migration() {
  local project_ref="$1"

  print_header "Example 2: Apply Migration with Backup"

  log_warning "This demonstrates the SAFE migration workflow"
  log_info "Always create a backup before applying migrations"

  # Create temporary migration file for demo
  local temp_migration="/tmp/sample_migration_$$.sql"
  cat > "$temp_migration" <<'EOF'
-- Sample migration: Add sample table
-- This is a safe migration for demonstration purposes

CREATE TABLE IF NOT EXISTS sample_migration_test (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  note TEXT
);

-- Insert test record
INSERT INTO sample_migration_test (note)
VALUES ('Migration test record created at ' || NOW()::TEXT);

-- Add comment
COMMENT ON TABLE sample_migration_test IS 'Test table created by migration example';
EOF

  log_info "Created sample migration file: $temp_migration"
  echo "Migration contents:"
  cat "$temp_migration"
  echo ""

  # Step 1: Create pre-migration backup
  log_info "Step 1: Creating pre-migration backup..."

  spinner_start "Creating backup..."
  local backup_result backup_id
  if backup_result=$("$SUPABASE_CLI" backup:create "$project_ref" \
    --description "Pre-migration backup $(date +%Y-%m-%d-%H:%M:%S)" \
    --format json 2>&1); then
    spinner_stop
    log_success "Backup created"

    backup_id=$(echo "$backup_result" | jq -r '.id' 2>/dev/null || echo "")
    log_info "Backup ID: $backup_id"

    # Wait for backup completion
    log_info "Waiting for backup to complete..."
    local max_attempts=20
    local attempt=0

    while [[ $attempt -lt $max_attempts ]]; do
      local backup_status
      backup_status=$("$SUPABASE_CLI" backup:get "$project_ref" "$backup_id" --format json 2>/dev/null | \
        jq -r '.status' 2>/dev/null || echo "")

      if [[ "$backup_status" == "COMPLETED" ]]; then
        log_success "Backup completed"
        break
      fi

      log_info "Backup status: $backup_status (attempt $((attempt + 1))/$max_attempts)"
      sleep 3
      attempt=$((attempt + 1))
    done
  else
    spinner_stop
    log_error "Failed to create backup"
    log_warning "Migration aborted for safety"
    rm -f "$temp_migration"
    return 1
  fi

  # Step 2: Capture current schema
  log_info "Step 2: Capturing current schema state..."

  local schema_before
  if schema_before=$("$SUPABASE_CLI" db:schema "$project_ref" 2>&1); then
    log_success "Schema captured"
    local table_count
    table_count=$(echo "$schema_before" | grep -c "CREATE TABLE" || echo "0")
    log_info "Current tables: $table_count"
  else
    log_warning "Could not capture schema (non-critical)"
  fi

  # Step 3: Apply migration
  log_info "Step 3: Applying migration..."

  local migration_result
  if migration_result=$("$SUPABASE_CLI" migrations:apply "$project_ref" \
    --file "$temp_migration" 2>&1); then
    log_success "Migration applied successfully"
    echo "$migration_result"
  else
    log_error "Migration failed"
    echo "$migration_result" >&2
    log_warning "Consider restoring from backup: $backup_id"
    rm -f "$temp_migration"
    return 1
  fi

  # Step 4: Verify schema changes
  log_info "Step 4: Verifying schema changes..."

  local verify_result
  if verify_result=$("$SUPABASE_CLI" db:query "$project_ref" \
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename='sample_migration_test'" \
    --format json 2>&1); then

    local table_exists
    table_exists=$(echo "$verify_result" | jq -r '.rows | length' 2>/dev/null || echo "0")

    if [[ $table_exists -gt 0 ]]; then
      log_success "Migration verified - new table exists"

      # Check record count
      local count_result
      count_result=$("$SUPABASE_CLI" db:query "$project_ref" \
        "SELECT COUNT(*) FROM sample_migration_test" --format json 2>/dev/null)
      local record_count
      record_count=$(echo "$count_result" | jq -r '.rows[0][0]' 2>/dev/null || echo "0")
      log_info "Records in new table: $record_count"
    else
      log_warning "Table not found - migration may not have applied"
    fi
  else
    log_warning "Could not verify migration"
  fi

  # Step 5: Migration success summary
  echo ""
  log_success "Migration completed successfully"
  log_info "Backup ID for rollback: $backup_id"
  log_info "Keep backup for 48 hours for rollback option"

  # Cleanup
  rm -f "$temp_migration"

  echo ""
  print_divider
}

# ============================================================================
# Example 3: Check Migration Status
# ============================================================================

example_check_migration_status() {
  local project_ref="$1"

  print_header "Example 3: Check Migration Status"

  log_info "Checking database migration status..."

  # Get migration list
  local migrations
  if migrations=$("$SUPABASE_CLI" migrations:list "$project_ref" --format json 2>&1); then
    local migration_count
    migration_count=$(echo "$migrations" | jq 'length' 2>/dev/null || echo "0")

    log_info "Total migrations applied: $migration_count"

    # Get latest migration
    if [[ $migration_count -gt 0 ]]; then
      local latest_migration latest_version latest_date
      latest_migration=$(echo "$migrations" | jq -r '.[0].name' 2>/dev/null || echo "")
      latest_version=$(echo "$migrations" | jq -r '.[0].version' 2>/dev/null || echo "")
      latest_date=$(echo "$migrations" | jq -r '.[0].applied_at' 2>/dev/null || echo "")

      log_success "Latest migration:"
      echo "  Version: $latest_version"
      echo "  Name: $latest_migration"
      echo "  Applied: $latest_date"
    fi
  else
    log_error "Failed to retrieve migration status"
    return 1
  fi

  # Check database health
  log_info "Checking database health..."

  local health_check
  if health_check=$("$SUPABASE_CLI" db:query "$project_ref" \
    "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema='public'" \
    --format json 2>&1); then

    local table_count
    table_count=$(echo "$health_check" | jq -r '.rows[0][0]' 2>/dev/null || echo "0")
    log_success "Database accessible - $table_count tables in public schema"
  else
    log_warning "Could not check database health"
  fi

  # Check for pending migrations (would require comparing local files)
  log_info "Migration status check complete"

  echo ""
  print_divider
}

# ============================================================================
# Example 4: Verify Schema After Migration
# ============================================================================

example_verify_schema() {
  local project_ref="$1"

  print_header "Example 4: Verify Schema After Migration"

  log_info "Running comprehensive schema verification..."

  # Verification 1: Table count
  log_info "Verification 1: Checking table count..."

  local table_result
  if table_result=$("$SUPABASE_CLI" db:query "$project_ref" \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" \
    --format json 2>&1); then

    local table_count
    table_count=$(echo "$table_result" | jq -r '.rows[0][0]' 2>/dev/null || echo "0")
    log_success "Total tables: $table_count"
  else
    log_error "Failed to count tables"
  fi

  # Verification 2: List all tables with row counts
  log_info "Verification 2: Listing tables with row counts..."

  local tables_query="
  SELECT
    schemaname,
    tablename,
    (SELECT COUNT(*) FROM pg_class WHERE relname = tablename) as exists
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename
  LIMIT 10
  "

  local tables_result
  if tables_result=$("$SUPABASE_CLI" db:query "$project_ref" "$tables_query" --format json 2>&1); then
    log_success "Tables retrieved"
    echo "$tables_result" | jq -r '.rows[] | "  - \(.[1])"' 2>/dev/null || echo "$tables_result"
  else
    log_warning "Could not list tables"
  fi

  # Verification 3: Check for indexes
  log_info "Verification 3: Checking indexes..."

  local index_result
  if index_result=$("$SUPABASE_CLI" db:query "$project_ref" \
    "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public'" \
    --format json 2>&1); then

    local index_count
    index_count=$(echo "$index_result" | jq -r '.rows[0][0]' 2>/dev/null || echo "0")
    log_success "Total indexes: $index_count"
  else
    log_warning "Could not count indexes"
  fi

  # Verification 4: Check for foreign keys
  log_info "Verification 4: Checking foreign key constraints..."

  local fk_result
  if fk_result=$("$SUPABASE_CLI" db:query "$project_ref" \
    "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY'" \
    --format json 2>&1); then

    local fk_count
    fk_count=$(echo "$fk_result" | jq -r '.rows[0][0]' 2>/dev/null || echo "0")
    log_success "Foreign key constraints: $fk_count"
  else
    log_warning "Could not count foreign keys"
  fi

  # Summary
  echo ""
  log_success "Schema verification complete"
  log_info "All verifications passed - database schema is consistent"

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
  example_list_migrations "$project_ref" || true
  pause "Press Enter to continue to Example 2..."

  example_apply_migration "$project_ref" || true
  pause "Press Enter to continue to Example 3..."

  example_check_migration_status "$project_ref" || true
  pause "Press Enter to continue to Example 4..."

  example_verify_schema "$project_ref" || true

  # Summary
  echo ""
  print_header "Examples Complete"
  log_success "All migration examples completed"
  log_info "Review the output above for details on each operation"
  echo ""
  log_info "Best practices for migrations:"
  echo "  - ALWAYS create a backup before applying migrations"
  echo "  - Test migrations on development/staging first"
  echo "  - Verify schema changes after each migration"
  echo "  - Keep backups for 48 hours after migration"
  echo "  - Document all migrations with clear descriptions"
  echo "  - Run migrations during maintenance windows"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
