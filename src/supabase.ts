import { getAuthToken } from './auth'
import { cache } from './cache'
import { SupabaseError, SupabaseErrorCode } from './errors'
import { retry } from './retry'

const API_BASE_URL = 'https://api.supabase.com/v1'
const DEBUG = process.env.DEBUG === 'true'

// Cache TTLs (in milliseconds)
const CACHE_TTL = {
  AUTH: 600_000, // 10 min
  BACKUP: 300_000, // 5 min
  BRANCH: 180_000, // 3 min
  EXTENSION: 600_000, // 10 min
  FUNCTION: 300_000, // 5 min
  INTEGRATION: 600_000, // 10 min
  LOG: 120_000, // 2 min
  MIGRATION: 300_000, // 5 min
  MONITOR: 300_000, // 5 min
  NETWORK: 300_000, // 5 min
  ORGANIZATION: 600_000, // 10 min
  PROJECT: Number.parseInt(process.env.SUPABASE_CLI_CACHE_PROJECT_TTL || '600000', 10), // 10 min
  REPLICA: 300_000, // 5 min
  SCHEDULE: 600_000, // 10 min
  SECRET: 300_000, // 5 min
  SECURITY: 600_000, // 10 min
  STORAGE: 300_000, // 5 min
  TABLE: 300_000, // 5 min
}

// Type Definitions
export interface Project {
  created_at: string
  database: {
    host: string
    port: number
    version: string
  }
  id: string
  inserted_at: string
  name: string
  organization_id: string
  ref: string
  region: string
  status: ProjectStatus
}

export type ProjectStatus =
  | 'ACTIVE_HEALTHY'
  | 'ACTIVE_UNHEALTHY'
  | 'COMING_UP'
  | 'GOING_DOWN'
  | 'PAUSED'
  | 'RESTORING'
  | 'UPGRADING'

export interface Organization {
  billing_email: string
  created_at: string
  id: string
  name: string
  subscription?: {
    interval: 'month' | 'year'
    plan: 'enterprise' | 'free' | 'pro' | 'team'
  }
}

export interface Branch {
  created_at: string
  git_branch?: string
  id: string
  name: string
  persistent: boolean
  project_id: string
  project_ref: string
  status: BranchStatus
  updated_at: string
}

export type BranchStatus = 'ACTIVE' | 'CREATING' | 'DELETING' | 'ERROR' | 'MERGING' | 'UPGRADING'

export interface Migration {
  applied_at?: string
  name: string
  statements: string[]
  version: string
}

export interface EdgeFunction {
  created_at: string
  id: string
  import_map: boolean
  name: string
  slug: string
  status: FunctionStatus
  updated_at: string
  verify_jwt: boolean
  version: number
}

export type FunctionStatus = 'ACTIVE' | 'DEPLOYING' | 'INACTIVE' | 'REMOVING'

export interface Secret {
  name: string
  value: string
}

export interface Table {
  bytes: number
  dead_rows_estimate: number
  id: string
  live_rows_estimate: number
  name: string
  replica_identity: string
  rls_enabled: boolean
  rls_forced: boolean
  schema: string
  size: string
}

export interface Extension {
  comment: string
  default_version: string
  installed_version: string
  name: string
}

export interface LogEntry {
  event_message: string
  metadata?: Record<string, unknown>
  timestamp: string
}

export interface Advisor {
  category: string
  description: string
  level: 'ERROR' | 'INFO' | 'WARNING'
  metadata?: Record<string, unknown>
  remediation_url?: string
  title: string
  type: string
}

export interface ProjectStats {
  branch_count: number
  database_size: number
  function_count: number
  table_count: number
}

export interface CreateProjectConfig {
  db_pass: string
  db_pricing_tier_id?: string
  db_region?: string
  name: string
  organization_id: string
  plan?: 'enterprise' | 'free' | 'pro' | 'team'
  region: string
}

export interface DeployFunctionConfig {
  entrypoint_path?: string
  files: Array<{ content: string; name: string }>
  import_map_path?: string
  slug: string
  verify_jwt?: boolean
}

// Storage Types
export interface StorageBucket {
  allowed_mime_types?: string[]
  avif_autodetection?: boolean
  created_at: string
  file_size_limit?: number
  id: string
  name: string
  owner?: string
  public: boolean
  updated_at: string
}

export interface StoragePolicy {
  action: 'DELETE' | 'INSERT' | 'SELECT' | 'UPDATE'
  definition: string
  id: string
  name: string
  table: string
}

// Auth Types
export interface SSOProvider {
  config?: Record<string, unknown>
  created_at: string
  enabled: boolean
  id: string
  name: string
  provider: string
  updated_at: string
}

export interface JWTKey {
  algorithm: string
  created_at: string
  id: string
  key: string
  key_id: string
}

export interface AuthProvider {
  enabled: boolean
  name: string
  provider: string
}

export interface AuthProviderConfig {
  [key: string]: unknown
  client_id?: string
  client_secret?: string
  enabled: boolean
  redirect_uri?: string
}

export interface AuthServiceConfig {
  [key: string]: unknown
  auto_confirm: boolean
  disable_signup: boolean
  enable_anonymous_sign_ins: boolean
  enable_confirmations: boolean
  enable_signup: boolean
  external_email_enabled: boolean
  external_phone_enabled: boolean
  jwt_exp: number
  mailer_autoconfirm: boolean
  mailer_secure_email_change_enabled: boolean
  password_min_length: number
  password_required_characters: string
  refresh_token_rotation_enabled: boolean
  security_refresh_token_reuse_interval: number
  site_url: string
}

// Integration Types
export interface Webhook {
  created_at: string
  enabled: boolean
  events: string[]
  id: string
  last_error?: string
  last_triggered_at?: string
  name: string
  secret: string
  status: 'active' | 'failed' | 'inactive'
  updated_at: string
  url: string
}

export interface Integration {
  available: boolean
  description: string
  enabled: boolean
  name: string
  setup_url?: string
  type: string
}

// Logs & Monitoring Types
export interface FunctionLog {
  duration_ms: number
  event_message: string
  execution_time_ms: number
  function_id: string
  function_name: string
  id: string
  metadata?: Record<string, unknown>
  status: 'error' | 'success'
  timestamp: string
}

export interface ErrorLog {
  error_code?: string
  error_message: string
  function_name?: string
  id: string
  metadata?: Record<string, unknown>
  service: string
  severity: 'critical' | 'error' | 'warning'
  stack_trace?: string
  timestamp: string
}

export interface APILog {
  endpoint: string
  id: string
  metadata?: Record<string, unknown>
  method: string
  request_body?: unknown
  request_headers?: Record<string, string>
  response_body?: unknown
  response_headers?: Record<string, string>
  response_time_ms: number
  status_code: number
  timestamp: string
}

export interface Metrics {
  api_response_time_avg: number
  api_response_time_p95: number
  api_response_time_p99: number
  database_query_time_avg: number
  database_query_time_p95: number
  database_query_time_p99: number
  function_execution_time_avg: number
  function_execution_time_p95: number
  function_execution_time_p99: number
  period: string
  storage_usage_bytes: number
  timestamp: string
}

export interface HealthCheck {
  api: ServiceHealth
  auth: ServiceHealth
  database: ServiceHealth
  functions: ServiceHealth
  storage: ServiceHealth
}

export interface ServiceHealth {
  healthy: boolean
  message?: string
  response_time_ms: number
  status: 'degraded' | 'down' | 'healthy'
}

// Phase 2B Types - Backup & Recovery
export interface Backup {
  completed_at?: string
  created_at: string
  description?: string
  expires_at?: string
  id: string
  name: string
  retention_days?: number
  size_bytes: number
  size_formatted: string
  status: 'completed' | 'failed' | 'in_progress' | 'pending'
}

export interface BackupSchedule {
  created_at: string
  enabled: boolean
  frequency: 'daily' | 'monthly' | 'weekly'
  id: string
  name: string
  retention_days: number
  updated_at: string
}

export interface RestoreStatus {
  completed_at?: string
  id: string
  progress: number
  started_at: string
  status: 'completed' | 'failed' | 'in_progress' | 'pending'
}

// Phase 2B Types - Database Replicas
export interface DatabaseReplica {
  compute_size: string
  created_at: string
  id: string
  location: string
  name: string
  region: string
  status: 'active' | 'creating' | 'deleting' | 'error' | 'upgrading'
  updated_at: string
}

export interface DatabaseConfig {
  key: string
  value: string
}

// Phase 2B Types - Network & Security
export interface NetworkRestriction {
  cidr: string
  created_at: string
  description?: string
  id: string
  updated_at: string
}

export interface SecurityPolicy {
  created_at: string
  description?: string
  enabled: boolean
  id: string
  name: string
  policy_type: string
  updated_at: string
}

export interface SecurityAudit {
  findings: SecurityFinding[]
  passed_checks: number
  run_at: string
  score: number
  total_checks: number
}

export interface SecurityFinding {
  category: string
  description: string
  recommendation: string
  resource?: string
  severity: 'critical' | 'high' | 'info' | 'low' | 'medium'
  title: string
}

// Phase 5B Types - API Keys & Configuration
export interface APIKeysResponse {
  anon: string
  service_role: string
}

// Helper: Get auth headers
async function getAuthHeader(): Promise<{ Authorization: string }> {
  const token = await getAuthToken()
  if (!token) {
    throw new SupabaseError(
      'No authentication token found. Run "supabase-cli init" to set up authentication.',
      SupabaseErrorCode.UNAUTHORIZED,
    )
  }

  return { Authorization: `Bearer ${token}` }
}

// Helper: Enhanced fetch with retry
async function enhancedFetch<T>(url: string, options: RequestInit = {}, context = ''): Promise<T> {
  const startTime = Date.now()

  const result = await retry.execute(async () => {
    const response = await fetch(url, options)

    // Handle response
    if (!response.ok) {
      const errorBody = await response.text()
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`
      let errorDetails: unknown

      try {
        const errorJson = JSON.parse(errorBody)
        errorMessage = errorJson.message || errorJson.error?.message || errorMessage
        errorDetails = errorJson
      } catch {
        // Error body is not JSON
        if (errorBody) {
          errorMessage = errorBody
        }
      }

      throw SupabaseError.fromResponse(response.status, errorMessage, errorDetails)
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return undefined as T
    }

    // Parse JSON response
    const data = await response.json()
    return data as T
  })

  const duration = Date.now() - startTime

  if (DEBUG) {
    console.log(
      `[SUPABASE] ${options.method || 'GET'} ${url.replace(API_BASE_URL, '')} (${duration}ms${context ? `, ${context}` : ''})`,
    )
  }

  return result
}

// Helper: Cached fetch pattern
async function cachedFetch<T>(
  resourceType: string,
  resourceId: string,
  fetcher: () => Promise<T>,
  ttl?: number,
): Promise<T> {
  const cacheKey = `${resourceType}:${resourceId}`

  // Check cache first
  const cached = cache.get<T>(cacheKey)
  if (cached) {
    if (DEBUG) {
      console.log(`[SUPABASE] Cache hit: ${cacheKey}`)
    }

    return cached
  }

  if (DEBUG) {
    console.log(`[SUPABASE] Cache miss: ${cacheKey}`)
  }

  // Fetch with retry
  const result = await fetcher()

  // Store in cache
  cache.set(cacheKey, result, ttl)

  return result
}

// Helper: Invalidate cache for resource type
function invalidateCache(resourceType: string, resourceId?: string): void {
  if (resourceId) {
    cache.delete(`${resourceType}:${resourceId}`)
  } else {
    // Invalidate all keys of this type
    for (const key of cache.keys()) {
      if (key.startsWith(`${resourceType}:`)) {
        cache.delete(key)
      }
    }
  }
}

// ============================================================================
// PROJECTS
// ============================================================================

/**
 * List all projects accessible to the authenticated user
 */
export async function listProjects(): Promise<Project[]> {
  return cachedFetch(
    'projects',
    'all',
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<Project[]>(`${API_BASE_URL}/projects`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.PROJECT,
  )
}

/**
 * Get details for a specific project
 */
export async function getProject(ref: string): Promise<Project> {
  return cachedFetch(
    'project',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<Project>(`${API_BASE_URL}/projects/${ref}`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.PROJECT,
  )
}

/**
 * Create a new project
 */
export async function createProject(config: CreateProjectConfig): Promise<Project> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<Project>(
    `${API_BASE_URL}/projects`,
    {
      body: JSON.stringify(config),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'create project',
  )

  // Invalidate projects cache
  invalidateCache('projects')

  return result
}

/**
 * Delete a project
 */
export async function deleteProject(ref: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch<void>(
    `${API_BASE_URL}/projects/${ref}`,
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    },
    'delete project',
  )

  // Invalidate caches
  invalidateCache('projects')
  invalidateCache('project', ref)
}

/**
 * Pause a project (paid plans only)
 */
export async function pauseProject(ref: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch<void>(
    `${API_BASE_URL}/projects/${ref}/pause`,
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'pause project',
  )

  // Invalidate caches
  invalidateCache('project', ref)
}

/**
 * Restore a paused project
 */
export async function restoreProject(ref: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch<void>(
    `${API_BASE_URL}/projects/${ref}/restore`,
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'restore project',
  )

  // Invalidate caches
  invalidateCache('project', ref)
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Execute a SQL query against the database
 */
export async function queryDatabase(ref: string, sql: string): Promise<unknown[]> {
  const headers = await getAuthHeader()
  const response = await enhancedFetch<{ rows: unknown[] }>(
    `${API_BASE_URL}/projects/${ref}/database/query`,
    {
      body: JSON.stringify({ query: sql }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'query database',
  )

  return response.rows || []
}

/**
 * List tables in a schema
 */
export async function listTables(ref: string, schema = 'public'): Promise<Table[]> {
  return cachedFetch(
    'tables',
    `${ref}:${schema}`,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<Table[]>(
        `${API_BASE_URL}/projects/${ref}/database/tables?schemas=${schema}`,
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          method: 'GET',
        },
      )
    },
    CACHE_TTL.TABLE,
  )
}

/**
 * Get schema for a specific table
 */
export async function getTableSchema(ref: string, table: string): Promise<unknown> {
  const headers = await getAuthHeader()
  return enhancedFetch<unknown>(`${API_BASE_URL}/projects/${ref}/database/tables/${table}`, {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })
}

/**
 * List database extensions
 */
export async function listExtensions(ref: string): Promise<Extension[]> {
  return cachedFetch(
    'extensions',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<Extension[]>(`${API_BASE_URL}/projects/${ref}/database/extensions`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.EXTENSION,
  )
}

/**
 * Dump database schema
 */
export async function dumpDatabase(ref: string, schema?: string): Promise<string> {
  const headers = await getAuthHeader()
  const url = schema
    ? `${API_BASE_URL}/projects/${ref}/database/dump?schema=${schema}`
    : `${API_BASE_URL}/projects/${ref}/database/dump`

  return enhancedFetch<string>(url, {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })
}

// ============================================================================
// MIGRATIONS
// ============================================================================

/**
 * List all migrations for a project
 */
export async function listMigrations(ref: string): Promise<Migration[]> {
  return cachedFetch(
    'migrations',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<Migration[]>(`${API_BASE_URL}/projects/${ref}/database/migrations`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.MIGRATION,
  )
}

/**
 * Apply a new migration
 */
export async function applyMigration(ref: string, name: string, sql: string): Promise<Migration> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<Migration>(
    `${API_BASE_URL}/projects/${ref}/database/migrations`,
    {
      body: JSON.stringify({ name, query: sql }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'apply migration',
  )

  // Invalidate caches
  invalidateCache('migrations', ref)
  invalidateCache('tables', ref)

  return result
}

// ============================================================================
// EDGE FUNCTIONS
// ============================================================================

/**
 * List all edge functions for a project
 */
export async function listFunctions(ref: string): Promise<EdgeFunction[]> {
  return cachedFetch(
    'functions',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<EdgeFunction[]>(`${API_BASE_URL}/projects/${ref}/functions`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.FUNCTION,
  )
}

/**
 * Get details for a specific edge function
 */
export async function getFunction(ref: string, slug: string): Promise<EdgeFunction> {
  return cachedFetch(
    'function',
    `${ref}:${slug}`,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<EdgeFunction>(`${API_BASE_URL}/projects/${ref}/functions/${slug}`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.FUNCTION,
  )
}

/**
 * Deploy an edge function
 */
export async function deployFunction(
  ref: string,
  config: DeployFunctionConfig,
): Promise<EdgeFunction> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<EdgeFunction>(
    `${API_BASE_URL}/projects/${ref}/functions/${config.slug}/deploy`,
    {
      body: JSON.stringify({
        entrypoint_path: config.entrypoint_path || 'index.ts',
        files: config.files,
        import_map_path: config.import_map_path,
        verify_jwt: config.verify_jwt ?? true,
      }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'deploy function',
  )

  // Invalidate caches
  invalidateCache('functions', ref)
  invalidateCache('function', `${ref}:${config.slug}`)

  return result
}

/**
 * Delete an edge function
 */
export async function deleteFunction(ref: string, slug: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch<void>(
    `${API_BASE_URL}/projects/${ref}/functions/${slug}`,
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    },
    'delete function',
  )

  // Invalidate caches
  invalidateCache('functions', ref)
  invalidateCache('function', `${ref}:${slug}`)
}

/**
 * Invoke an edge function
 */
export async function invokeFunction(
  ref: string,
  slug: string,
  options: {
    body?: unknown
    headers?: Record<string, string>
    method?: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'
  } = {},
): Promise<{ data: unknown; status: number }> {
  const headers = await getAuthHeader()
  const method = options.method || 'POST'

  const requestOptions: RequestInit = {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    method,
  }

  if (options.body && method !== 'GET') {
    requestOptions.body = JSON.stringify(options.body)
  }

  // Direct fetch without retry for invoke (user may want to see actual errors)
  const response = await fetch(
    `${API_BASE_URL}/projects/${ref}/functions/${slug}/invoke`,
    requestOptions,
  )

  let data: unknown
  try {
    data = await response.json()
  } catch {
    data = await response.text()
  }

  return {
    data,
    status: response.status,
  }
}

// ============================================================================
// BRANCHES
// ============================================================================

/**
 * List all branches for a project
 */
export async function listBranches(ref: string): Promise<Branch[]> {
  return cachedFetch(
    'branches',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<Branch[]>(`${API_BASE_URL}/projects/${ref}/branches`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.BRANCH,
  )
}

/**
 * Create a new branch
 */
export async function createBranch(
  ref: string,
  name: string,
  confirmCostId?: string,
): Promise<Branch> {
  const headers = await getAuthHeader()
  const body: Record<string, unknown> = { branch_name: name }
  if (confirmCostId) {
    body.confirm_cost_id = confirmCostId
  }

  const result = await enhancedFetch<Branch>(
    `${API_BASE_URL}/projects/${ref}/branches`,
    {
      body: JSON.stringify(body),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'create branch',
  )

  // Invalidate caches
  invalidateCache('branches', ref)

  return result
}

/**
 * Delete a branch
 */
export async function deleteBranch(branchId: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch<void>(
    `${API_BASE_URL}/branches/${branchId}`,
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    },
    'delete branch',
  )

  // Invalidate branches cache (we don't know which project)
  invalidateCache('branches')
}

/**
 * Merge a branch to production
 */
export async function mergeBranch(branchId: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch<void>(
    `${API_BASE_URL}/branches/${branchId}/merge`,
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'merge branch',
  )

  // Invalidate branches cache
  invalidateCache('branches')
}

/**
 * Reset a branch to a specific migration version
 */
export async function resetBranch(branchId: string, migrationVersion?: string): Promise<void> {
  const headers = await getAuthHeader()
  const body = migrationVersion ? { migration_version: migrationVersion } : {}

  await enhancedFetch<void>(
    `${API_BASE_URL}/branches/${branchId}/reset`,
    {
      body: JSON.stringify(body),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'reset branch',
  )

  // Invalidate branches cache
  invalidateCache('branches')
}

/**
 * Rebase a branch with production migrations
 */
export async function rebaseBranch(branchId: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch<void>(
    `${API_BASE_URL}/branches/${branchId}/rebase`,
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'rebase branch',
  )

  // Invalidate branches cache
  invalidateCache('branches')
}

// ============================================================================
// SECRETS
// ============================================================================

/**
 * List all secrets for a project (values are hidden)
 */
export async function listSecrets(ref: string): Promise<Secret[]> {
  return cachedFetch(
    'secrets',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<Secret[]>(`${API_BASE_URL}/projects/${ref}/secrets`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.SECRET,
  )
}

/**
 * Create or update secrets
 */
export async function createSecret(ref: string, name: string, value: string): Promise<Secret> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<Secret>(
    `${API_BASE_URL}/projects/${ref}/secrets`,
    {
      body: JSON.stringify({
        secrets: [{ name, value }],
      }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'create secret',
  )

  // Invalidate caches
  invalidateCache('secrets', ref)

  return result
}

/**
 * Delete a secret
 */
export async function deleteSecret(ref: string, name: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch<void>(
    `${API_BASE_URL}/projects/${ref}/secrets/${name}`,
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    },
    'delete secret',
  )

  // Invalidate caches
  invalidateCache('secrets', ref)
}

// ============================================================================
// STORAGE
// ============================================================================

/**
 * List all storage buckets for a project
 */
export async function getStorageBuckets(ref: string): Promise<StorageBucket[]> {
  return cachedFetch(
    'storage-buckets',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<StorageBucket[]>(`${API_BASE_URL}/projects/${ref}/storage/buckets`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.STORAGE,
  )
}

/**
 * Get details for a specific storage bucket
 */
export async function getStorageBucket(ref: string, bucketId: string): Promise<StorageBucket> {
  return cachedFetch(
    'storage-bucket',
    `${ref}:${bucketId}`,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<StorageBucket>(
        `${API_BASE_URL}/projects/${ref}/storage/buckets/${bucketId}`,
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          method: 'GET',
        },
      )
    },
    CACHE_TTL.STORAGE,
  )
}

/**
 * Create a new storage bucket
 */
export async function createStorageBucket(
  ref: string,
  name: string,
  isPublic = false,
): Promise<StorageBucket> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<StorageBucket>(
    `${API_BASE_URL}/projects/${ref}/storage/buckets`,
    {
      body: JSON.stringify({
        name,
        public: isPublic,
      }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'create storage bucket',
  )

  // Invalidate caches
  invalidateCache('storage-buckets', ref)

  return result
}

/**
 * Delete a storage bucket
 */
export async function deleteStorageBucket(ref: string, bucketId: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch<void>(
    `${API_BASE_URL}/projects/${ref}/storage/buckets/${bucketId}`,
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    },
    'delete storage bucket',
  )

  // Invalidate caches
  invalidateCache('storage-buckets', ref)
  invalidateCache('storage-bucket', `${ref}:${bucketId}`)
}

/**
 * List storage policies for a bucket
 */
export async function getStoragePolicies(ref: string, bucketId: string): Promise<StoragePolicy[]> {
  return cachedFetch(
    'storage-policies',
    `${ref}:${bucketId}`,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<StoragePolicy[]>(
        `${API_BASE_URL}/projects/${ref}/storage/buckets/${bucketId}/policies`,
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          method: 'GET',
        },
      )
    },
    CACHE_TTL.STORAGE,
  )
}

/**
 * Set storage policies for a bucket
 */
export async function setStoragePolicies(
  ref: string,
  bucketId: string,
  policies: Partial<StoragePolicy>[],
): Promise<StoragePolicy[]> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<StoragePolicy[]>(
    `${API_BASE_URL}/projects/${ref}/storage/buckets/${bucketId}/policies`,
    {
      body: JSON.stringify({ policies }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'set storage policies',
  )

  // Invalidate caches
  invalidateCache('storage-policies', `${ref}:${bucketId}`)

  return result
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * List all SSO providers
 */
export async function getSSOProviders(ref: string): Promise<SSOProvider[]> {
  return cachedFetch(
    'sso-providers',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<SSOProvider[]>(`${API_BASE_URL}/projects/${ref}/auth/sso/providers`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.AUTH,
  )
}

/**
 * Enable SSO provider
 */
export async function enableSSOProvider(
  ref: string,
  providerId: string,
  config: Record<string, unknown>,
): Promise<SSOProvider> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<SSOProvider>(
    `${API_BASE_URL}/projects/${ref}/auth/sso/providers/${providerId}/enable`,
    {
      body: JSON.stringify({ config }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'enable SSO provider',
  )

  // Invalidate caches
  invalidateCache('sso-providers', ref)

  return result
}

/**
 * Disable SSO provider
 */
export async function disableSSOProvider(ref: string, providerId: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch<void>(
    `${API_BASE_URL}/projects/${ref}/auth/sso/providers/${providerId}/disable`,
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'disable SSO provider',
  )

  // Invalidate caches
  invalidateCache('sso-providers', ref)
}

/**
 * Get JWT signing key
 */
export async function getJWTKey(ref: string): Promise<JWTKey> {
  return cachedFetch(
    'jwt-key',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<JWTKey>(`${API_BASE_URL}/projects/${ref}/auth/jwt`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.AUTH,
  )
}

/**
 * Rotate JWT signing key
 */
export async function rotateJWTKey(ref: string): Promise<JWTKey> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<JWTKey>(
    `${API_BASE_URL}/projects/${ref}/auth/jwt/rotate`,
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'rotate JWT key',
  )

  // Invalidate caches
  invalidateCache('jwt-key', ref)

  return result
}

/**
 * List auth providers
 */
export async function getAuthProviders(ref: string): Promise<AuthProvider[]> {
  return cachedFetch(
    'auth-providers',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<AuthProvider[]>(`${API_BASE_URL}/projects/${ref}/auth/providers`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.AUTH,
  )
}

/**
 * Set auth provider configuration
 */
export async function setAuthProviderConfig(
  ref: string,
  provider: string,
  key: string,
  value: string,
): Promise<AuthProviderConfig> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<AuthProviderConfig>(
    `${API_BASE_URL}/projects/${ref}/auth/providers/${provider}/config`,
    {
      body: JSON.stringify({ [key]: value }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    },
    'set auth provider config',
  )

  // Invalidate caches
  invalidateCache('auth-providers', ref)

  return result
}

/**
 * Set auth service configuration
 */
export async function setAuthServiceConfig(
  ref: string,
  settings: Record<string, unknown>,
): Promise<AuthServiceConfig> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<AuthServiceConfig>(
    `${API_BASE_URL}/projects/${ref}/auth/config`,
    {
      body: JSON.stringify(settings),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    },
    'set auth service config',
  )

  // Invalidate caches
  invalidateCache('auth-service-config', ref)

  return result
}

/**
 * Get auth service configuration
 */
export async function getAuthServiceConfig(ref: string): Promise<AuthServiceConfig> {
  return cachedFetch(
    'auth-service-config',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<AuthServiceConfig>(`${API_BASE_URL}/projects/${ref}/auth/config`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.AUTH,
  )
}

/**
 * Get API keys for a project
 * WARNING: Returns sensitive credentials (anon and service_role keys)
 * Phase 5B: Added for GoTrue API integration
 */
export async function getAPIKeys(ref: string): Promise<APIKeysResponse> {
  return cachedFetch(
    'api-keys',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<APIKeysResponse>(`${API_BASE_URL}/projects/${ref}/api-keys`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.AUTH, // 10 min
  )
}

// ============================================================================
// INTEGRATIONS
// ============================================================================

/**
 * List all webhooks
 */
export async function getWebhooks(ref: string): Promise<Webhook[]> {
  return cachedFetch(
    'webhooks',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<Webhook[]>(`${API_BASE_URL}/projects/${ref}/integrations/webhooks`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.INTEGRATION,
  )
}

/**
 * Create a webhook
 */
export async function createWebhook(
  ref: string,
  url: string,
  events: string[],
  name?: string,
): Promise<Webhook> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<Webhook>(
    `${API_BASE_URL}/projects/${ref}/integrations/webhooks`,
    {
      body: JSON.stringify({
        events,
        name: name || 'Webhook',
        url,
      }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'create webhook',
  )

  // Invalidate caches
  invalidateCache('webhooks', ref)

  return result
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(ref: string, webhookId: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch<void>(
    `${API_BASE_URL}/projects/${ref}/integrations/webhooks/${webhookId}`,
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    },
    'delete webhook',
  )

  // Invalidate caches
  invalidateCache('webhooks', ref)
}

/**
 * List available integrations
 */
export async function getAvailableIntegrations(ref: string): Promise<Integration[]> {
  return cachedFetch(
    'integrations',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<Integration[]>(`${API_BASE_URL}/projects/${ref}/integrations`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.INTEGRATION,
  )
}

/**
 * Setup an integration
 */
export async function setupIntegration(
  ref: string,
  integrationName: string,
  config: Record<string, unknown>,
): Promise<Integration> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<Integration>(
    `${API_BASE_URL}/projects/${ref}/integrations/${integrationName}/setup`,
    {
      body: JSON.stringify({ config }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'setup integration',
  )

  // Invalidate caches
  invalidateCache('integrations', ref)

  return result
}

// ============================================================================
// LOGS & MONITORING
// ============================================================================

/**
 * Get logs for a specific service
 */
export async function getLogs(
  ref: string,
  service: 'api' | 'auth' | 'edge-function' | 'postgres' | 'realtime' | 'storage',
): Promise<LogEntry[]> {
  const headers = await getAuthHeader()
  const response = await enhancedFetch<{ logs: LogEntry[] }>(
    `${API_BASE_URL}/projects/${ref}/logs/${service}`,
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'GET',
    },
  )

  return response.logs || []
}

/**
 * Get function execution logs
 */
export async function getFunctionLogs(
  ref: string,
  options?: { since?: string; until?: string },
): Promise<FunctionLog[]> {
  const headers = await getAuthHeader()
  let url = `${API_BASE_URL}/projects/${ref}/logs/functions`

  if (options?.since || options?.until) {
    const params = new URLSearchParams()
    if (options.since) params.append('since', options.since)
    if (options.until) params.append('until', options.until)
    url += `?${params.toString()}`
  }

  return enhancedFetch<FunctionLog[]>(url, {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })
}

/**
 * Get specific function execution log
 */
export async function getFunctionLog(ref: string, logId: string): Promise<FunctionLog> {
  const headers = await getAuthHeader()
  return enhancedFetch<FunctionLog>(`${API_BASE_URL}/projects/${ref}/logs/functions/${logId}`, {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })
}

/**
 * Get error logs
 */
export async function getErrorLogs(ref: string, options?: { since?: string }): Promise<ErrorLog[]> {
  const headers = await getAuthHeader()
  let url = `${API_BASE_URL}/projects/${ref}/logs/errors`

  if (options?.since) {
    url += `?since=${options.since}`
  }

  return enhancedFetch<ErrorLog[]>(url, {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })
}

/**
 * Get specific error log
 */
export async function getErrorLog(ref: string, errorId: string): Promise<ErrorLog> {
  const headers = await getAuthHeader()
  return enhancedFetch<ErrorLog>(`${API_BASE_URL}/projects/${ref}/logs/errors/${errorId}`, {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })
}

/**
 * Get API request logs
 */
export async function getAPILogs(
  ref: string,
  options?: { endpoint?: string; since?: string },
): Promise<APILog[]> {
  const headers = await getAuthHeader()
  let url = `${API_BASE_URL}/projects/${ref}/logs/api`

  if (options?.since || options?.endpoint) {
    const params = new URLSearchParams()
    if (options.since) params.append('since', options.since)
    if (options.endpoint) params.append('endpoint', options.endpoint)
    url += `?${params.toString()}`
  }

  return enhancedFetch<APILog[]>(url, {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })
}

/**
 * Get specific API request log
 */
export async function getAPILog(ref: string, logId: string): Promise<APILog> {
  const headers = await getAuthHeader()
  return enhancedFetch<APILog>(`${API_BASE_URL}/projects/${ref}/logs/api/${logId}`, {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })
}

/**
 * Get performance metrics
 */
export async function getMetrics(ref: string, period?: string): Promise<Metrics> {
  return cachedFetch(
    'metrics',
    `${ref}:${period || '1h'}`,
    async () => {
      const headers = await getAuthHeader()
      let url = `${API_BASE_URL}/projects/${ref}/monitor/metrics`

      if (period) {
        url += `?period=${period}`
      }

      return enhancedFetch<Metrics>(url, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.MONITOR,
  )
}

/**
 * Get health check status
 */
export async function getHealthCheck(ref: string): Promise<HealthCheck> {
  return cachedFetch(
    'health',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<HealthCheck>(`${API_BASE_URL}/projects/${ref}/monitor/health`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    60_000, // 1 min cache for health checks
  )
}

/**
 * Get security or performance advisors
 */
export async function getAdvisors(
  ref: string,
  type: 'performance' | 'security',
): Promise<Advisor[]> {
  const headers = await getAuthHeader()
  return enhancedFetch<Advisor[]>(`${API_BASE_URL}/projects/${ref}/advisors/${type}`, {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })
}

/**
 * Get project statistics
 */
export async function getProjectStats(ref: string): Promise<ProjectStats> {
  // This is a custom aggregation since the API doesn't have a single stats endpoint
  // We fetch multiple resources and aggregate
  const [tables, functions, branches] = await Promise.all([
    listTables(ref).catch(() => []),
    listFunctions(ref).catch(() => []),
    listBranches(ref).catch(() => []),
  ])

  return {
    branch_count: branches.length,
    database_size: tables.reduce((sum, t) => sum + t.bytes, 0),
    function_count: functions.length,
    table_count: tables.length,
  }
}

// ============================================================================
// PHASE 2B: BACKUP & RECOVERY
// ============================================================================

/**
 * List all backups for a project
 */
export async function listBackups(
  ref: string,
  options?: { since?: string; until?: string },
): Promise<Backup[]> {
  return cachedFetch(
    'backups',
    `${ref}:${options?.since || ''}:${options?.until || ''}`,
    async () => {
      const headers = await getAuthHeader()
      let url = `${API_BASE_URL}/projects/${ref}/backups`

      if (options?.since || options?.until) {
        const params = new URLSearchParams()
        if (options.since) params.append('since', options.since)
        if (options.until) params.append('until', options.until)
        url += `?${params.toString()}`
      }

      return enhancedFetch<Backup[]>(url, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.BACKUP,
  )
}

/**
 * Get details for a specific backup
 */
export async function getBackup(ref: string, backupId: string): Promise<Backup> {
  return cachedFetch(
    'backup',
    `${ref}:${backupId}`,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<Backup>(`${API_BASE_URL}/projects/${ref}/backups/${backupId}`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.BACKUP,
  )
}

/**
 * Create an on-demand backup
 */
export async function createBackup(ref: string, description?: string): Promise<Backup> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<Backup>(
    `${API_BASE_URL}/projects/${ref}/backups`,
    {
      body: JSON.stringify({ description }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'create backup',
  )

  // Invalidate caches
  invalidateCache('backups')

  return result
}

/**
 * Delete a backup
 */
export async function deleteBackup(ref: string, backupId: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch<void>(
    `${API_BASE_URL}/projects/${ref}/backups/${backupId}`,
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    },
    'delete backup',
  )

  // Invalidate caches
  invalidateCache('backups')
  invalidateCache('backup', `${ref}:${backupId}`)
}

/**
 * Restore from a backup
 */
export async function restoreFromBackup(ref: string, backupId: string): Promise<RestoreStatus> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<RestoreStatus>(
    `${API_BASE_URL}/projects/${ref}/backups/${backupId}/restore`,
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'restore from backup',
  )

  // Invalidate all data caches
  invalidateCache('projects')
  invalidateCache('project', ref)
  invalidateCache('tables')
  invalidateCache('functions')
  invalidateCache('branches')

  return result
}

/**
 * List backup schedules
 */
export async function listBackupSchedules(ref: string): Promise<BackupSchedule[]> {
  return cachedFetch(
    'backup-schedules',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<BackupSchedule[]>(`${API_BASE_URL}/projects/${ref}/backups/schedules`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.SCHEDULE,
  )
}

/**
 * Create a backup schedule
 */
export async function createBackupSchedule(
  ref: string,
  frequency: 'daily' | 'monthly' | 'weekly',
  retentionDays: number,
  name?: string,
): Promise<BackupSchedule> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<BackupSchedule>(
    `${API_BASE_URL}/projects/${ref}/backups/schedules`,
    {
      body: JSON.stringify({
        enabled: true,
        frequency,
        name: name || `Automated ${frequency} backup`,
        retention_days: retentionDays,
      }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'create backup schedule',
  )

  // Invalidate caches
  invalidateCache('backup-schedules', ref)

  return result
}

/**
 * Restore to a point in time (PITR)
 */
export async function restoreToPointInTime(ref: string, timestamp: string): Promise<RestoreStatus> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<RestoreStatus>(
    `${API_BASE_URL}/projects/${ref}/backups/pitr/restore`,
    {
      body: JSON.stringify({ timestamp }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'point-in-time restore',
  )

  // Invalidate all data caches
  invalidateCache('projects')
  invalidateCache('project', ref)
  invalidateCache('tables')
  invalidateCache('functions')
  invalidateCache('branches')

  return result
}

// ============================================================================
// PHASE 2B: DATABASE REPLICAS
// ============================================================================

/**
 * List all read replicas for a project
 */
export async function listDatabaseReplicas(ref: string): Promise<DatabaseReplica[]> {
  return cachedFetch(
    'replicas',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<DatabaseReplica[]>(`${API_BASE_URL}/projects/${ref}/database/replicas`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.REPLICA,
  )
}

/**
 * Create a read replica
 */
export async function createDatabaseReplica(
  ref: string,
  location: string,
  name?: string,
): Promise<DatabaseReplica> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<DatabaseReplica>(
    `${API_BASE_URL}/projects/${ref}/database/replicas`,
    {
      body: JSON.stringify({
        location,
        name: name || `replica-${location}`,
      }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'create replica',
  )

  // Invalidate caches
  invalidateCache('replicas', ref)

  return result
}

/**
 * Delete a read replica
 */
export async function deleteDatabaseReplica(ref: string, replicaId: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch<void>(
    `${API_BASE_URL}/projects/${ref}/database/replicas/${replicaId}`,
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    },
    'delete replica',
  )

  // Invalidate caches
  invalidateCache('replicas', ref)
}

/**
 * Set database configuration
 */
export async function setDatabaseConfig(
  ref: string,
  setting: string,
  value: string,
): Promise<DatabaseConfig> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<DatabaseConfig>(
    `${API_BASE_URL}/projects/${ref}/database/config`,
    {
      body: JSON.stringify({ [setting]: value }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    },
    'set database config',
  )

  // Invalidate caches
  invalidateCache('database-config', ref)

  return result
}

// ============================================================================
// PHASE 2B: NETWORK & SECURITY
// ============================================================================

/**
 * List network restrictions (IP whitelist)
 */
export async function listNetworkRestrictions(ref: string): Promise<NetworkRestriction[]> {
  return cachedFetch(
    'network-restrictions',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<NetworkRestriction[]>(
        `${API_BASE_URL}/projects/${ref}/network/restrictions`,
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          method: 'GET',
        },
      )
    },
    CACHE_TTL.NETWORK,
  )
}

/**
 * Add network restriction (IP whitelist)
 */
export async function addNetworkRestriction(
  ref: string,
  cidr: string,
  description?: string,
): Promise<NetworkRestriction> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<NetworkRestriction>(
    `${API_BASE_URL}/projects/${ref}/network/restrictions`,
    {
      body: JSON.stringify({ cidr, description }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'add network restriction',
  )

  // Invalidate caches
  invalidateCache('network-restrictions', ref)

  return result
}

/**
 * Remove network restriction
 */
export async function removeNetworkRestriction(ref: string, restrictionId: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch<void>(
    `${API_BASE_URL}/projects/${ref}/network/restrictions/${restrictionId}`,
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    },
    'remove network restriction',
  )

  // Invalidate caches
  invalidateCache('network-restrictions', ref)
}

/**
 * List security policies
 */
export async function listSecurityPolicies(ref: string): Promise<SecurityPolicy[]> {
  return cachedFetch(
    'security-policies',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<SecurityPolicy[]>(`${API_BASE_URL}/projects/${ref}/security/policies`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    },
    CACHE_TTL.SECURITY,
  )
}

/**
 * Run security audit
 */
export async function runSecurityAudit(ref: string): Promise<SecurityAudit> {
  const headers = await getAuthHeader()
  return enhancedFetch<SecurityAudit>(`${API_BASE_URL}/projects/${ref}/security/audit`, {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
}

// Export for backward compatibility
export class SupabaseAPIWrapper {
  private accessToken: null | string = null

  constructor(config: { accessToken?: string } = {}) {
    this.accessToken = config.accessToken ?? process.env.SUPABASE_ACCESS_TOKEN ?? null
  }

  getClient(): never {
    throw new SupabaseError(
      'This method is deprecated. Use the exported functions instead.',
      SupabaseErrorCode.CONFIG_ERROR,
    )
  }

  hasAccessToken(): boolean {
    return this.accessToken !== null
  }

  // Legacy methods that throw not implemented errors
  initialize(): void {
    throw new SupabaseError(
      'This method is deprecated. Use the exported functions instead.',
      SupabaseErrorCode.CONFIG_ERROR,
    )
  }

  isInitialized(): boolean {
    return false
  }

  setAccessToken(token: string): void {
    this.accessToken = token
  }
}

export const supabase = new SupabaseAPIWrapper()
