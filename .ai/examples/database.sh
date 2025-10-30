#!/usr/bin/env bash
#
# Database Query and Schema Examples
# Usage: ./database.sh [project-ref]
#
# Examples from Sprint 2A workflows for database management
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
# Example 1: View Database Schema
# ============================================================================
# Workflow: view-database-schema
# Pattern: database-query-inspect

example_view_schema() {
  print_header "Example 1: View Database Schema"

  log_info "Fetching database schema for project: $PROJECT_REF"

  # Get full schema DDL
  if schema=$("$SUPABASE_CLI" db:schema "$PROJECT_REF" 2>/dev/null); then
    log_success "Schema retrieved successfully"

    echo ""
    log_info "Schema DDL (first 50 lines):"
    echo "$schema" | head -n 50
    echo ""
    log_info "... (truncated for brevity)"
    echo ""
  else
    log_warning "Failed to retrieve full schema DDL"
  fi

  # List all tables in public schema
  log_info "Listing tables in public schema..."

  local query="SELECT table_name, table_type FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"

  if tables=$("$SUPABASE_CLI" db:query "$PROJECT_REF" "$query" --format json 2>/dev/null); then
    local table_count
    table_count=$(echo "$tables" | jq 'length')

    log_success "Found $table_count table(s)"

    if [[ $table_count -gt 0 ]]; then
      echo ""
      echo "Tables in public schema:"
      echo "$tables" | jq -r '.[] | "\(.table_name)\t\(.table_type)"' | \
        awk 'BEGIN {printf "%-40s %-15s\n", "TABLE NAME", "TYPE";
                    printf "%-40s %-15s\n", "----------", "----"}
             {printf "%-40s %-15s\n", $1, $2}'
      echo ""
    fi
  else
    log_warning "Failed to query table list"
  fi

  # Check installed extensions
  log_info "Checking installed PostgreSQL extensions..."

  if extensions=$("$SUPABASE_CLI" db:extensions "$PROJECT_REF" --format json 2>/dev/null); then
    local ext_count
    ext_count=$(echo "$extensions" | jq 'length')

    log_success "Found $ext_count extension(s)"

    if [[ $ext_count -gt 0 ]]; then
      echo ""
      echo "Installed Extensions:"
      echo "$extensions" | jq -r '.[] | "\(.name)\t\(.version)\t\(.schema)"' | \
        awk 'BEGIN {printf "%-30s %-15s %-15s\n", "NAME", "VERSION", "SCHEMA"}
             {printf "%-30s %-15s %-15s\n", $1, $2, $3}'
      echo ""
    fi
  else
    log_warning "Failed to query extensions"
  fi
}

# ============================================================================
# Example 2: Execute Read-Only Query
# ============================================================================
# Workflow: execute-readonly-query
# Pattern: database-query-inspect

example_readonly_query() {
  print_header "Example 2: Execute Read-Only Query"

  # Test connection first
  log_info "Testing database connection..."

  if version=$("$SUPABASE_CLI" db:query "$PROJECT_REF" "SELECT version()" --format json 2>/dev/null); then
    local pg_version
    pg_version=$(echo "$version" | jq -r '.[0].version' 2>/dev/null || echo "unknown")
    log_success "Database connection successful"
    log_info "PostgreSQL version: ${pg_version:0:50}..."
  else
    handle_error "Failed to connect to database" "$?"
  fi

  # Example 1: Count active connections
  log_info "Querying active database connections..."

  local query="SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active'"

  if result=$("$SUPABASE_CLI" db:query "$PROJECT_REF" "$query" --format json); then
    local connections
    connections=$(echo "$result" | jq -r '.[0].active_connections')
    log_success "Active connections: $connections"
  else
    log_warning "Failed to query active connections"
  fi

  # Example 2: Get database size
  log_info "Querying database size..."

  query="SELECT pg_size_pretty(pg_database_size(current_database())) as size"

  if result=$("$SUPABASE_CLI" db:query "$PROJECT_REF" "$query" --format json); then
    local size
    size=$(echo "$result" | jq -r '.[0].size')
    log_success "Database size: $size"
  else
    log_warning "Failed to query database size"
  fi

  # Example 3: List table sizes
  log_info "Querying table sizes (top 5)..."

  query="SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
         FROM pg_tables
         WHERE schemaname = 'public'
         ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
         LIMIT 5"

  if result=$("$SUPABASE_CLI" db:query "$PROJECT_REF" "$query" --format json 2>/dev/null); then
    echo ""
    echo "Largest Tables:"
    echo "$result" | jq -r '.[] | "\(.tablename)\t\(.size)"' | \
      awk 'BEGIN {printf "%-40s %-15s\n", "TABLE", "SIZE"}
           {printf "%-40s %-15s\n", $1, $2}'
    echo ""
  else
    log_warning "No tables found or query failed"
  fi
}

# ============================================================================
# Example 3: Apply Schema Migration
# ============================================================================
# Workflow: apply-schema-migration
# Pattern: migration-safe-apply, backup-before-destructive

example_apply_migration() {
  print_header "Example 3: Apply Schema Migration (with backup)"

  log_warning "This is a demonstration - actual migration file required"

  # Step 1: Create backup before migration
  log_info "Step 1: Creating pre-migration backup..."

  local description="Pre-migration backup - $(date '+%Y-%m-%d %H:%M:%S')"

  if backup=$("$SUPABASE_CLI" backup:create "$PROJECT_REF" \
    --description "$description" \
    --format json); then

    local backup_id
    backup_id=$(echo "$backup" | jq -r '.id // .backup_id')
    log_success "Backup created: $backup_id"
  else
    log_error "Failed to create backup - migration aborted for safety"
    return 1
  fi

  # Step 2: Check migration history
  log_info "Step 2: Checking migration history..."

  if migrations=$("$SUPABASE_CLI" migrations:list "$PROJECT_REF" --format json 2>/dev/null); then
    local migration_count
    migration_count=$(echo "$migrations" | jq 'length' 2>/dev/null || echo "0")
    log_info "Previous migrations: $migration_count"

    if [[ $migration_count -gt 0 ]]; then
      echo ""
      echo "Recent Migrations:"
      echo "$migrations" | jq -r '.[-3:] | .[] | "\(.version)\t\(.name)"' 2>/dev/null | \
        awk '{printf "  %-20s %s\n", $1, $2}'
      echo ""
    fi
  else
    log_info "No previous migrations or failed to list"
  fi

  # Step 3: Capture current schema
  log_info "Step 3: Capturing current schema for comparison..."

  local temp_before="/tmp/schema_before_$$.sql"
  if "$SUPABASE_CLI" db:schema "$PROJECT_REF" > "$temp_before" 2>/dev/null; then
    log_success "Schema snapshot saved: $temp_before"
  fi

  # Step 4: Apply migration (example only)
  log_info "Step 4: Applying migration..."
  log_warning "Example migration file not provided - skipping actual application"

  # Uncomment to apply actual migration:
  # local migration_file="./migrations/001_example.sql"
  # if [[ ! -f "$migration_file" ]]; then
  #   log_error "Migration file not found: $migration_file"
  #   return 1
  # fi
  #
  # if "$SUPABASE_CLI" migrations:apply "$PROJECT_REF" --file "$migration_file"; then
  #   log_success "Migration applied successfully"
  # else
  #   log_error "Migration failed!"
  #   log_warning "Consider restoring from backup: $backup_id"
  #   return 1
  # fi

  # Step 5: Verify schema changes
  log_info "Step 5: Verifying schema changes..."

  local temp_after="/tmp/schema_after_$$.sql"
  if "$SUPABASE_CLI" db:schema "$PROJECT_REF" > "$temp_after" 2>/dev/null; then
    if command -v diff >/dev/null 2>&1; then
      log_info "Schema differences:"
      diff "$temp_before" "$temp_after" | head -n 20 || true
    fi

    # Cleanup temp files
    rm -f "$temp_before" "$temp_after"
  fi

  log_info "Migration example complete (not actually applied)"
  log_info "In production: Test migrations on dev/staging first!"
}

# ============================================================================
# Example 4: Create Read Replica
# ============================================================================
# Workflow: create-read-replica
# Pattern: replica-scale-read

example_create_replica() {
  print_header "Example 4: Create Read Replica (demonstration)"

  log_info "Read replicas improve performance for read-heavy workloads"
  log_warning "Requires Pro plan or higher"

  # Step 1: Check current replicas
  log_info "Step 1: Checking existing read replicas..."

  if replicas=$("$SUPABASE_CLI" db:replicas:list "$PROJECT_REF" --format json 2>/dev/null); then
    local replica_count
    replica_count=$(echo "$replicas" | jq 'length' 2>/dev/null || echo "0")

    log_info "Existing replicas: $replica_count"

    if [[ $replica_count -gt 0 ]]; then
      echo ""
      echo "Current Replicas:"
      echo "$replicas" | jq -r '.[] | "\(.id)\t\(.region)\t\(.status)"' | \
        awk 'BEGIN {printf "%-25s %-15s %-15s\n", "ID", "REGION", "STATUS"}
             {printf "%-25s %-15s %-15s\n", $1, $2, $3}'
      echo ""
    fi
  else
    log_info "No replicas found or feature not available"
  fi

  # Step 2: Create replica (example only)
  log_info "Step 2: Creating read replica in us-west-1..."
  log_warning "Example only - uncomment to actually create"

  # Uncomment to create replica (requires Pro plan):
  # if replica=$("$SUPABASE_CLI" db:replicas:create "$PROJECT_REF" \
  #   --region us-west-1 \
  #   --format json); then
  #
  #   local replica_id
  #   replica_id=$(echo "$replica" | jq -r '.id')
  #   log_success "Replica creation initiated: $replica_id"
  #   log_info "Provisioning takes 30-90 seconds..."
  #
  #   # Step 3: Poll until ready
  #   spinner_start "Waiting for replica to become active..."
  #
  #   local attempts=0
  #   local max_attempts=30
  #
  #   while [[ $attempts -lt $max_attempts ]]; do
  #     sleep 10
  #
  #     if status=$("$SUPABASE_CLI" db:replicas:list "$PROJECT_REF" --format json 2>/dev/null); then
  #       local replica_status
  #       replica_status=$(echo "$status" | jq -r ".[] | select(.id == \"$replica_id\") | .status")
  #
  #       if [[ "$replica_status" == "ACTIVE" ]]; then
  #         spinner_stop
  #         log_success "Replica is now active!"
  #         break
  #       fi
  #     fi
  #
  #     attempts=$((attempts + 1))
  #   done
  #
  #   spinner_stop
  # else
  #   log_error "Failed to create replica"
  # fi

  log_info "Example skipped - uncomment code to create replica"
  log_info "Use replicas for read-only queries to reduce load on primary database"
}

# ============================================================================
# Main
# ============================================================================

main() {
  print_header "Supabase CLI - Database Management Examples"

  echo "Project reference: $PROJECT_REF"
  echo ""

  example_view_schema
  echo ""
  print_divider
  echo ""

  example_readonly_query
  echo ""
  print_divider
  echo ""

  example_apply_migration
  echo ""
  print_divider
  echo ""

  example_create_replica
  echo ""

  log_success "All database examples completed"
  log_info "Remember: Always backup before schema changes!"
}

# Run main if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
