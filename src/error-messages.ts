/**
 * Centralized error messages for consistent user experience
 *
 * All error messages follow a pattern:
 * 1. Clear description of what went wrong
 * 2. Context (e.g., which resource)
 * 3. Next action (how to fix it)
 */

export const ErrorMessages = {
  // Project errors
  PROJECT_NOT_FOUND: (ref: string) =>
    `Project '${ref}' not found. Run 'supabase-cli projects:list' to see available projects.`,

  PROJECT_REQUIRED: () =>
    `Project reference required. Use --project flag, set SUPABASE_PROJECT_REF environment variable, or configure a profile with 'supabase-cli config:set-profile'.`,

  INVALID_PROJECT_REF: (ref: string) =>
    `Invalid project reference '${ref}'. Expected format: 20 character alphanumeric string (e.g., abcdefghij1234567890).`,

  // Organization errors
  ORGANIZATION_NOT_FOUND: (id: string) =>
    `Organization '${id}' not found. Run 'supabase-cli organizations:list' to see available organizations.`,

  ORGANIZATION_REQUIRED: () =>
    `Organization ID required. Use --organization flag or set SUPABASE_ORGANIZATION_ID environment variable.`,

  // Authentication errors
  UNAUTHORIZED: () =>
    `Authentication failed. Run 'supabase-cli config:init' to set up your access token.`,

  TOKEN_REQUIRED: () =>
    `Access token required. Use --token flag, set SUPABASE_ACCESS_TOKEN environment variable, or run 'supabase-cli config:init'.`,

  INVALID_TOKEN: () =>
    `Invalid access token format. Expected format: sbp_* (personal token) or service_role_* (service role key).`,

  TOKEN_EXPIRED: () =>
    `Access token has expired. Run 'supabase-cli config:init' to refresh your credentials.`,

  // Validation errors
  INVALID_INPUT: (field: string, expected: string) =>
    `Invalid ${field}. Expected: ${expected}.`,

  REQUIRED_FIELD: (field: string) =>
    `${field} is required but was not provided.`,

  INVALID_FORMAT: (field: string, format: string, example?: string) =>
    `Invalid ${field} format. Expected: ${format}${example ? `. Example: ${example}` : ''}.`,

  INVALID_OUTPUT_FORMAT: (format: string) =>
    `Invalid output format '${format}'. Supported formats: json, table, yaml, list.`,

  // Resource errors
  RESOURCE_NOT_FOUND: (type: string, id: string) =>
    `${type} '${id}' not found. It may have been deleted or you may not have access to it.`,

  RESOURCE_ALREADY_EXISTS: (type: string, id: string) =>
    `${type} '${id}' already exists. Choose a different name or use the existing resource.`,

  // Network errors
  NETWORK_ERROR: () =>
    `Network error occurred. Check your internet connection and try again.`,

  TIMEOUT: (operation: string, timeout: number) =>
    `${operation} timed out after ${timeout}ms. Try again or increase the timeout with --timeout flag.`,

  RATE_LIMIT: (retryAfter?: number) =>
    `Rate limit exceeded. ${retryAfter ? `Try again in ${retryAfter} seconds.` : 'Try again later.'}`,

  CONNECTION_FAILED: (resource: string) =>
    `Failed to connect to ${resource}. Verify the resource is running and accessible.`,

  // Database errors
  DB_CONNECTION_FAILED: () =>
    `Failed to connect to database. Verify the project is running and accessible.`,

  DB_QUERY_FAILED: (error: string) =>
    `Database query failed: ${error}`,

  INVALID_SQL: (error: string) =>
    `Invalid SQL syntax: ${error}`,

  DB_CONFIG_INVALID: (setting: string) =>
    `Invalid database configuration for '${setting}'. Check the Supabase documentation for valid values.`,

  EXTENSION_NOT_FOUND: (name: string) =>
    `Database extension '${name}' not found or not available for your plan.`,

  SCHEMA_NOT_FOUND: (name: string) =>
    `Database schema '${name}' not found. Run 'supabase-cli db:schemas' to see available schemas.`,

  POLICY_NOT_FOUND: (name: string) =>
    `RLS policy '${name}' not found.`,

  // Function errors
  FUNCTION_NOT_FOUND: (name: string) =>
    `Function '${name}' not found. Run 'supabase-cli functions:list' to see available functions.`,

  FUNCTION_INVOCATION_FAILED: (name: string, error: string) =>
    `Failed to invoke function '${name}': ${error}`,

  INVALID_FUNCTION_NAME: (name: string) =>
    `Invalid function name '${name}'. Function names must be lowercase alphanumeric with hyphens (e.g., my-function).`,

  FUNCTION_DEPLOY_FAILED: (name: string, error: string) =>
    `Failed to deploy function '${name}': ${error}`,

  // Storage errors
  BUCKET_NOT_FOUND: (bucket: string) =>
    `Bucket '${bucket}' not found. Run 'supabase-cli storage:buckets:list' to see available buckets.`,

  INVALID_BUCKET_NAME: (name: string) =>
    `Invalid bucket name '${name}'. Bucket names must be lowercase alphanumeric with hyphens and underscores (e.g., my-bucket_123).`,

  STORAGE_POLICY_NOT_FOUND: (id: string) =>
    `Storage policy '${id}' not found.`,

  // Backup errors
  BACKUP_NOT_FOUND: (id: string) =>
    `Backup '${id}' not found. Run 'supabase-cli backup:list' to see available backups.`,

  RESTORE_FAILED: (error: string) =>
    `Restore operation failed: ${error}. This is a critical operation - contact Supabase support if the issue persists.`,

  INVALID_PITR_TIMESTAMP: (timestamp: string) =>
    `Invalid timestamp '${timestamp}'. Expected ISO 8601 format (e.g., 2024-10-30T12:00:00Z).`,

  BACKUP_IN_PROGRESS: () =>
    `A backup is already in progress. Wait for it to complete before creating another.`,

  // Network security errors
  INVALID_CIDR: (cidr: string) =>
    `Invalid CIDR notation '${cidr}'. Expected format: IPv4 address with prefix (e.g., 192.168.1.0/24).`,

  RESTRICTION_NOT_FOUND: (id: string) =>
    `Network restriction '${id}' not found. Run 'supabase-cli security:restrictions:list' to see active restrictions.`,

  // Configuration errors
  PROFILE_NOT_FOUND: (profile: string) =>
    `Profile '${profile}' not found. Run 'supabase-cli config:list-profiles' to see available profiles.`,

  INVALID_CONFIG: (error: string) =>
    `Invalid configuration: ${error}. Check your config file or run 'supabase-cli config:doctor' for diagnostics.`,

  CONFIG_FILE_NOT_FOUND: (path: string) =>
    `Configuration file not found at '${path}'. Run 'supabase-cli config:init' to create one.`,

  CONFIG_WRITE_FAILED: (error: string) =>
    `Failed to write configuration: ${error}. Check file permissions.`,

  // Migration errors
  MIGRATION_FAILED: (error: string) =>
    `Migration failed: ${error}. Check your migration files and database state.`,

  MIGRATION_NOT_FOUND: (id: string) =>
    `Migration '${id}' not found. Check the migration ID and try again.`,

  MIGRATION_ALREADY_APPLIED: (id: string) =>
    `Migration '${id}' has already been applied.`,

  // Branch errors (preview features)
  BRANCH_NOT_FOUND: (branch: string) =>
    `Branch '${branch}' not found. Run 'supabase-cli branches:list' to see available branches.`,

  INVALID_BRANCH_NAME: (name: string) =>
    `Invalid branch name '${name}'. Branch names must be lowercase alphanumeric with hyphens (e.g., my-feature).`,

  BRANCH_LIMIT_REACHED: () =>
    `Branch limit reached for this project. Delete unused branches or upgrade your plan.`,

  // Replica errors
  REPLICA_NOT_FOUND: (id: string) =>
    `Database replica '${id}' not found. Run 'supabase-cli db:replicas:list' to see available replicas.`,

  INVALID_REGION: (region: string, validRegions?: string[]) =>
    `Invalid region '${region}'.${validRegions ? ` Valid regions: ${validRegions.join(', ')}` : ' Check Supabase documentation for supported regions.'}`,

  REPLICA_LIMIT_REACHED: () =>
    `Replica limit reached for this project. Delete unused replicas or upgrade your plan.`,

  // Type generation errors
  TYPES_GENERATION_FAILED: (error: string) =>
    `Failed to generate types: ${error}`,

  // Monitoring errors
  MONITORING_DATA_UNAVAILABLE: () =>
    `Monitoring data is not available. This may be a temporary issue or monitoring may not be enabled for your project.`,

  READONLY_MODE_UNAVAILABLE: () =>
    `Read-only mode information is not available. This feature may not be supported for your project plan.`,

  // Webhook errors
  WEBHOOK_NOT_FOUND: (id: string) =>
    `Webhook '${id}' not found.`,

  INVALID_WEBHOOK_URL: (url: string) =>
    `Invalid webhook URL '${url}'. Must be a valid HTTPS URL.`,

  // Generic errors
  UNKNOWN_ERROR: (message?: string) =>
    `An unexpected error occurred${message ? `: ${message}` : ''}. If this persists, contact Supabase support.`,

  OPERATION_CANCELLED: () =>
    `Operation cancelled by user.`,

  PERMISSION_DENIED: (resource: string) =>
    `Permission denied for ${resource}. Verify you have the necessary permissions for this project.`,

  FEATURE_NOT_AVAILABLE: (feature: string) =>
    `${feature} is not available for your current plan. Upgrade your plan to access this feature.`,

  INVALID_ARGUMENT: (arg: string, value: string) =>
    `Invalid value '${value}' for argument '${arg}'.`,

  MISSING_ARGUMENT: (arg: string) =>
    `Missing required argument: ${arg}`,

  // File operation errors
  FILE_NOT_FOUND: (path: string) =>
    `File not found: ${path}`,

  FILE_READ_ERROR: (path: string, error: string) =>
    `Failed to read file '${path}': ${error}`,

  FILE_WRITE_ERROR: (path: string, error: string) =>
    `Failed to write file '${path}': ${error}`,

  INVALID_JSON: (error: string) =>
    `Invalid JSON: ${error}`,

  // Confirmation messages (for destructive operations)
  CONFIRM_DELETE: (resource: string, id: string) =>
    `This will permanently delete ${resource} '${id}'. This action cannot be undone. Continue?`,

  CONFIRM_RESTORE: (timestamp: string) =>
    `This will restore the database to ${timestamp}. All data after this point will be lost. Continue?`,

  CONFIRM_DESTRUCTIVE: (operation: string) =>
    `This is a destructive operation: ${operation}. Continue?`,

  CONFIRM_PAUSE: (projectName: string) =>
    `This will pause project '${projectName}'. The database will be inaccessible until resumed. Continue?`,
}

/**
 * Success messages for consistent positive feedback
 */
export const SuccessMessages = {
  OPERATION_COMPLETE: (operation: string) =>
    `${operation} completed successfully`,

  RESOURCE_CREATED: (type: string, id: string) =>
    `${type} '${id}' created successfully`,

  RESOURCE_UPDATED: (type: string, id: string) =>
    `${type} '${id}' updated successfully`,

  RESOURCE_DELETED: (type: string, id: string) =>
    `${type} '${id}' deleted successfully`,

  CONFIGURATION_SAVED: () =>
    `Configuration saved successfully`,

  BACKUP_CREATED: (id: string) =>
    `Backup '${id}' created successfully`,

  BACKUP_RESTORED: () =>
    `Database restored successfully`,

  FUNCTION_DEPLOYED: (name: string) =>
    `Function '${name}' deployed successfully`,

  FUNCTION_INVOKED: (name: string) =>
    `Function '${name}' invoked successfully`,

  MIGRATION_APPLIED: (id: string) =>
    `Migration '${id}' applied successfully`,

  PROJECT_CREATED: (name: string) =>
    `Project '${name}' created successfully`,

  PROJECT_PAUSED: (name: string) =>
    `Project '${name}' paused successfully`,

  PROJECT_RESTORED: (name: string) =>
    `Project '${name}' restored successfully`,

  TYPES_GENERATED: () =>
    `TypeScript types generated successfully`,

  QUERY_EXECUTED: () =>
    `Query executed successfully`,
}

/**
 * Info messages for helpful guidance
 */
export const InfoMessages = {
  NO_RESULTS: (type: string) =>
    `No ${type} found`,

  RESULTS_COUNT: (count: number, type: string) =>
    `Found ${count} ${type}${count === 1 ? '' : 's'}`,

  USING_PROJECT: (ref: string) =>
    `Using project: ${ref}`,

  USING_PROFILE: (profile: string) =>
    `Using profile: ${profile}`,

  CHECKING_STATUS: (resource: string) =>
    `Checking ${resource} status...`,

  FETCHING_DATA: (resource: string) =>
    `Fetching ${resource}...`,

  PROCESSING: (operation: string) =>
    `Processing ${operation}...`,

  VALIDATING: (item: string) =>
    `Validating ${item}...`,
}

/**
 * Warning messages for caution
 */
export const WarningMessages = {
  OPERATION_CANCELLED: () =>
    `Operation cancelled`,

  DEPRECATED: (feature: string, alternative: string) =>
    `${feature} is deprecated. Use ${alternative} instead.`,

  BETA_FEATURE: (feature: string) =>
    `${feature} is in beta. Use with caution in production.`,

  SLOW_OPERATION: (operation: string) =>
    `${operation} may take several minutes to complete...`,

  NO_DATA: (resource: string) =>
    `No ${resource} data available`,

  PARTIAL_SUCCESS: (success: number, total: number) =>
    `${success} of ${total} operations completed successfully`,

  CACHE_MISS: () =>
    `Cache miss - fetching fresh data`,

  RATE_LIMIT_WARNING: () =>
    `Approaching rate limit - operations may be throttled`,
}
