import { Agent as HttpAgent } from 'node:http'
import { Agent as HttpsAgent } from 'node:https'

import { getAuthToken } from './auth'
import { CACHE_PROFILES, cache } from './cache'
import { SupabaseError, SupabaseErrorCode } from './errors'
import { Helper } from './helper'
import { retry } from './retry'
import { SQL_QUERIES } from './utils/sql-queries'

const API_BASE_URL = 'https://api.supabase.com/v1'

// HTTP connection pooling for better performance
const httpAgent = new HttpAgent({
  keepAlive: true,
  keepAliveMsecs: 30_000, // 30 seconds
  maxFreeSockets: 5,
  maxSockets: 10,
})

const httpsAgent = new HttpsAgent({
  keepAlive: true,
  keepAliveMsecs: 30_000, // 30 seconds
  maxFreeSockets: 5,
  maxSockets: 10,
})

// Cache TTLs (in milliseconds) - using CACHE_PROFILES for consistency
const CACHE_TTL = {
  AUTH: CACHE_PROFILES.SLOW, // 1 hour - auth tokens rarely change
  BACKUP: CACHE_PROFILES.MEDIUM, // 5 min - backups change moderately
  BRANCH: CACHE_PROFILES.FAST, // 30 sec - branches change frequently
  EXTENSION: CACHE_PROFILES.STATIC, // 24 hours - extensions almost never change
  FUNCTION: CACHE_PROFILES.MEDIUM, // 5 min - functions change moderately
  INTEGRATION: CACHE_PROFILES.SLOW, // 1 hour - integrations rarely change
  LOG: CACHE_PROFILES.FAST, // 30 sec - logs change constantly
  MIGRATION: CACHE_PROFILES.MEDIUM, // 5 min - migrations change moderately
  MONITOR: CACHE_PROFILES.FAST, // 30 sec - monitoring data changes frequently
  NETWORK: CACHE_PROFILES.SLOW, // 1 hour - network settings rarely change
  ORGANIZATION: CACHE_PROFILES.SLOW, // 1 hour - orgs rarely change
  PROJECT: Number.parseInt(
    process.env.SUPABASE_CLI_CACHE_PROJECT_TTL || String(CACHE_PROFILES.SLOW),
    10,
  ),
  REPLICA: CACHE_PROFILES.MEDIUM, // 5 min - replicas change moderately
  SCHEDULE: CACHE_PROFILES.SLOW, // 1 hour - schedules rarely change
  SECRET: CACHE_PROFILES.MEDIUM, // 5 min - secrets change moderately
  SECURITY: CACHE_PROFILES.SLOW, // 1 hour - security settings rarely change
  STORAGE: CACHE_PROFILES.MEDIUM, // 5 min - storage changes moderately
  TABLE: CACHE_PROFILES.MEDIUM, // 5 min - tables change moderately
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
  installed_version: null | string
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

// Function Invocation Types
export interface FunctionInvocation {
  data: unknown
  status: number
}

/**
 * Validate URL to prevent file:// protocol usage
 * Security: CodeQL - Addresses file access to HTTP vulnerability
 */
function validateUrl(url: string): void {
  try {
    const urlObj = new URL(url)
    
    // Security: Only allow http and https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      throw new SupabaseError(
        'Invalid URL protocol. Only http and https are allowed.',
        SupabaseErrorCode.CONFIG_ERROR,
        400,
      )
    }
  } catch (error) {
    if (error instanceof SupabaseError) {
      throw error
    }
    throw new SupabaseError(
      'Invalid URL format',
      SupabaseErrorCode.CONFIG_ERROR,
      400,
    )
  }
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


  // Security: Validate URL before making request
  // CodeQL: Prevents file:// protocol usage
  validateUrl(url)

  // Add HTTP agent for connection pooling
  const fetchOptions: RequestInit = {
    ...options,
    // @ts-expect-error - agent is a Node.js-specific option
    agent: url.startsWith('https:') ? httpsAgent : httpAgent,
  }

  const result = await retry.execute(async () => {
    const response = await fetch(url, fetchOptions)

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

  // Debug mode already logs in retry.execute
  Helper.debug(
    `${options.method || 'GET'} ${url.replace(API_BASE_URL, '')} (${duration}ms${context ? `, ${context}` : ''})`,
  )

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
    Helper.debug(`Cache hit: ${cacheKey}`)
    return cached
  }

  // Not in cache, fetch and cache
  const data = await fetcher()
  cache.set(cacheKey, data, ttl ?? CACHE_TTL.PROJECT)

  Helper.debug(`Cache miss, fetched and cached: ${cacheKey}`)

  return data
}

// Helper: Invalidate cache
function invalidateCache(resourceType: string, resourceId: string): void {
  const cacheKey = `${resourceType}:${resourceId}`
  cache.delete(cacheKey)

  Helper.debug(`Cache invalidated: ${cacheKey}`)
}

// Helper: Get project URL for client-side APIs
function getProjectUrl(ref: string): string {
  return `https://${ref}.supabase.co`
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Authenticate and get organizations
 */
export async function listOrganizations(): Promise<Organization[]> {
  const headers = await getAuthHeader()
  return enhancedFetch<Organization[]>(`${API_BASE_URL}/organizations`, {
    headers,
    method: 'GET',
  })
}

/**
 * Get specific organization
 */
export async function getOrganization(orgId: string): Promise<Organization> {
  const headers = await getAuthHeader()
  return enhancedFetch<Organization>(`${API_BASE_URL}/organizations/${orgId}`, {
    headers,
    method: 'GET',
  })
}

// ============================================================================
// PROJECTS
// ============================================================================

/**
 * List projects
 */
export async function listProjects(): Promise<Project[]> {
  return cachedFetch(
    'projects',
    'all',
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<Project[]>(`${API_BASE_URL}/projects`, {
        headers,
        method: 'GET',
      })
    },
    CACHE_TTL.PROJECT,
  )
}

/**
 * Get specific project
 */
export async function getProject(ref: string): Promise<Project> {
  return cachedFetch(
    'project',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<Project>(`${API_BASE_URL}/projects/${ref}`, {
        headers,
        method: 'GET',
      })
    },
    CACHE_TTL.PROJECT,
  )
}

/**
 * Create project
 */
export async function createProject(config: CreateProjectConfig): Promise<Project> {
  const headers = await getAuthHeader()
  const project = await enhancedFetch<Project>(
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

  // Invalidate list cache
  invalidateCache('projects', 'all')

  return project
}

/**
 * Delete project
 */
export async function deleteProject(ref: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch(
    `${API_BASE_URL}/projects/${ref}`,
    {
      headers,
      method: 'DELETE',
    },
    'delete project',
  )

  // Invalidate caches
  invalidateCache('projects', 'all')
  invalidateCache('project', ref)
}

/**
 * Pause project
 */
export async function pauseProject(ref: string): Promise<Project> {
  const headers = await getAuthHeader()
  const project = await enhancedFetch<Project>(
    `${API_BASE_URL}/projects/${ref}/pause`,
    {
      headers,
      method: 'POST',
    },
    'pause project',
  )

  // Invalidate caches
  invalidateCache('projects', 'all')
  invalidateCache('project', ref)

  return project
}

/**
 * Restore project
 */
export async function restoreProject(ref: string): Promise<Project> {
  const headers = await getAuthHeader()
  const project = await enhancedFetch<Project>(
    `${API_BASE_URL}/projects/${ref}/restore`,
    {
      headers,
      method: 'POST',
    },
    'restore project',
  )

  // Invalidate caches
  invalidateCache('projects', 'all')
  invalidateCache('project', ref)

  return project
}

// ============================================================================
// BRANCHES
// ============================================================================

/**
 * List preview branches
 */
export async function listBranches(ref: string): Promise<Branch[]> {
  return cachedFetch(
    'branches',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<Branch[]>(`${API_BASE_URL}/projects/${ref}/branches`, {
        headers,
        method: 'GET',
      })
    },
    CACHE_TTL.BRANCH,
  )
}

/**
 * Create preview branch
 */
export async function createBranch(
  ref: string,
  name: string,
  options?: { gitBranch?: string },
): Promise<Branch> {
  const headers = await getAuthHeader()
  const branch = await enhancedFetch<Branch>(
    `${API_BASE_URL}/projects/${ref}/branches`,
    {
      body: JSON.stringify({
        git_branch: options?.gitBranch,
        name,
      }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'create branch',
  )

  // Invalidate cache
  invalidateCache('branches', ref)

  return branch
}

/**
 * Delete preview branch
 */
export async function deleteBranch(ref: string, branchId: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch(
    `${API_BASE_URL}/projects/${ref}/branches/${branchId}`,
    {
      headers,
      method: 'DELETE',
    },
    'delete branch',
  )

  // Invalidate cache
  invalidateCache('branches', ref)
}

/**
 * Reset branch to main
 */
export async function resetBranch(ref: string, branchId: string): Promise<Branch> {
  const headers = await getAuthHeader()
  return enhancedFetch<Branch>(
    `${API_BASE_URL}/projects/${ref}/branches/${branchId}/reset`,
    {
      headers,
      method: 'POST',
    },
    'reset branch',
  )
}

/**
 * Rebase branch
 */
export async function rebaseBranch(ref: string, branchId: string): Promise<Branch> {
  const headers = await getAuthHeader()
  return enhancedFetch<Branch>(
    `${API_BASE_URL}/projects/${ref}/branches/${branchId}/rebase`,
    {
      headers,
      method: 'POST',
    },
    'rebase branch',
  )
}

/**
 * Merge branch into main
 */
export async function mergeBranch(ref: string, branchId: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch(
    `${API_BASE_URL}/projects/${ref}/branches/${branchId}/merge`,
    {
      headers,
      method: 'POST',
    },
    'merge branch',
  )

  // Invalidate cache
  invalidateCache('branches', ref)
}

// ============================================================================
// MIGRATIONS
// ============================================================================

/**
 * List migrations
 */
export async function listMigrations(ref: string): Promise<Migration[]> {
  return cachedFetch(
    'migrations',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<Migration[]>(`${API_BASE_URL}/projects/${ref}/database/migrations`, {
        headers,
        method: 'GET',
      })
    },
    CACHE_TTL.MIGRATION,
  )
}

/**
 * Apply migration
 */
export async function applyMigration(ref: string, name: string, sql: string): Promise<Migration> {
  const headers = await getAuthHeader()
  const migration = await enhancedFetch<Migration>(
    `${API_BASE_URL}/projects/${ref}/database/migrations`,
    {
      body: JSON.stringify({
        name,
        statements: [sql],
      }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'apply migration',
  )

  // Invalidate cache
  invalidateCache('migrations', ref)

  return migration
}

// ============================================================================
// EDGE FUNCTIONS
// ============================================================================

/**
 * List edge functions
 */
export async function listFunctions(ref: string): Promise<EdgeFunction[]> {
  return cachedFetch(
    'functions',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<EdgeFunction[]>(`${API_BASE_URL}/projects/${ref}/functions`, {
        headers,
        method: 'GET',
      })
    },
    CACHE_TTL.FUNCTION,
  )
}

/**
 * Get specific function
 */
export async function getFunction(ref: string, slug: string): Promise<EdgeFunction> {
  const headers = await getAuthHeader()
  return enhancedFetch<EdgeFunction>(`${API_BASE_URL}/projects/${ref}/functions/${slug}`, {
    headers,
    method: 'GET',
  })
}

/**
 * Deploy function
 */
export async function deployFunction(
  ref: string,
  config: DeployFunctionConfig,
): Promise<EdgeFunction> {
  const headers = await getAuthHeader()
  const func = await enhancedFetch<EdgeFunction>(
    `${API_BASE_URL}/projects/${ref}/functions/${config.slug}`,
    {
      body: JSON.stringify(config),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'deploy function',
  )

  // Invalidate cache
  invalidateCache('functions', ref)

  return func
}

/**
 * Delete function
 */
export async function deleteFunction(ref: string, slug: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch(
    `${API_BASE_URL}/projects/${ref}/functions/${slug}`,
    {
      headers,
      method: 'DELETE',
    },
    'delete function',
  )

  // Invalidate cache
  invalidateCache('functions', ref)
}

/**
 * Invoke edge function
 * Note: This uses the project URL, not the management API
 */
export async function invokeFunction(
  ref: string,
  slug: string,
  options?: {
    body?: unknown
    method?: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'
  },
): Promise<FunctionInvocation> {
  const headers = await getAuthHeader()
  const projectUrl = getProjectUrl(ref)
  const method = options?.method || 'POST'

  const response = await retry.execute(async () => {
    const fetchOptions: RequestInit = {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method,
    }

    if (options?.body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.body)
    }

    const res = await fetch(`${projectUrl}/functions/v1/${slug}`, fetchOptions)

    // Don't throw on non-2xx status codes, return them as part of the result
    const data = await res.json().catch(() => null)

    return {
      data,
      status: res.status,
    }
  })

  Helper.debug(`Invoked function ${slug}: status ${response.status}`)

  return response
}

// ============================================================================
// SECRETS
// ============================================================================

/**
 * List secrets
 */
export async function listSecrets(ref: string): Promise<Secret[]> {
  return cachedFetch(
    'secrets',
    ref,
    async () => {
      const headers = await getAuthHeader()
      return enhancedFetch<Secret[]>(`${API_BASE_URL}/projects/${ref}/secrets`, {
        headers,
        method: 'GET',
      })
    },
    CACHE_TTL.SECRET,
  )
}

/**
 * Create secret
 */
export async function createSecret(ref: string, name: string, value: string): Promise<Secret> {
  const headers = await getAuthHeader()
  const secret = await enhancedFetch<Secret>(
    `${API_BASE_URL}/projects/${ref}/secrets`,
    {
      body: JSON.stringify({ name, value }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'create secret',
  )

  // Invalidate cache
  invalidateCache('secrets', ref)

  return secret
}

/**
 * Delete secret
 */
export async function deleteSecret(ref: string, name: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch(
    `${API_BASE_URL}/projects/${ref}/secrets/${name}`,
    {
      headers,
      method: 'DELETE',
    },
    'delete secret',
  )

  // Invalidate cache
  invalidateCache('secrets', ref)
}

// ============================================================================
// DATABASE - QUERIES
// ============================================================================

/**
 * Execute SQL query against database
 * Used for database introspection and custom queries
 */
export async function queryDatabase(ref: string, sql: string): Promise<unknown[]> {
  const headers = await getAuthHeader()
  const result = await enhancedFetch<unknown[]>(
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

  // API returns array directly, not wrapped in { rows: [] }
  // If result is not an array, return empty array
  return Array.isArray(result) ? result : []
}

/**
 * List tables in a schema using SQL query
 */
export async function listTables(ref: string, schema = 'public'): Promise<Table[]> {
  return cachedFetch(
    'tables',
    `${ref}:${schema}`,
    async () => {
      const allTables = (await queryDatabase(ref, SQL_QUERIES.listTableDetails)) as any[]
      // Filter to the requested schema
      const filteredTables = allTables.filter((t) => t.schema === schema)
      return filteredTables as Table[]
    },
    CACHE_TTL.TABLE,
  )
}

/**
 * Get schema for a specific table using pg_catalog
 * Returns column information and constraints
 */
export async function getTableSchema(ref: string, table: string): Promise<unknown> {
  // Query to get table schema information
  // Use identifier quoting for security
  const escapedTable = table.replaceAll('"', '""')
  const sql = `
    SELECT
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default,
      c.ordinal_position
    FROM information_schema.columns c
    WHERE c.table_name = '${escapedTable}'
    ORDER BY c.ordinal_position;
  `

  const result = (await queryDatabase(ref, sql)) as unknown[]
  return result
}

/**
 * List extensions using SQL query
 * Shows both available and installed extensions
 */
export async function listExtensions(ref: string): Promise<Extension[]> {
  return cachedFetch(
    'extensions',
    ref,
    async () => {
      const extensions = (await queryDatabase(ref, SQL_QUERIES.listExtensions)) as Extension[]
      return extensions
    },
    CACHE_TTL.EXTENSION,
  )
}

/**
 * Dump database
 */
export async function dumpDatabase(ref: string): Promise<unknown> {
  const headers = await getAuthHeader()
  return enhancedFetch<unknown>(
    `${API_BASE_URL}/projects/${ref}/database/dump`,
    {
      headers,
      method: 'GET',
    },
    'dump database',
  )
}

// ============================================================================
// LOGS & MONITORING
// ============================================================================

/**
 * Get logs
 */
export async function getLogs(
  ref: string,
  service: 'auth' | 'database' | 'edge_function' | 'realtime' | 'storage',
  options?: { limit?: number; offset?: number; search?: string },
): Promise<LogEntry[]> {
  const headers = await getAuthHeader()
  let url = `${API_BASE_URL}/projects/${ref}/logs/${service}`

  if (options?.search || options?.limit || options?.offset) {
    const params = new URLSearchParams()
    if (options.search) params.append('search', options.search)
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.offset) params.append('offset', options.offset.toString())
    url += `?${params.toString()}`
  }

  return enhancedFetch<LogEntry[]>(url, {
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
export async function getErrorLogs(
  ref: string,
  options?: { limit?: number; severity?: 'critical' | 'error' | 'warning' },
): Promise<ErrorLog[]> {
  const headers = await getAuthHeader()
  let url = `${API_BASE_URL}/projects/${ref}/logs/errors`

  if (options?.limit || options?.severity) {
    const params = new URLSearchParams()
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.severity) params.append('severity', options.severity)
    url += `?${params.toString()}`
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
 * Get function logs
 */
export async function getFunctionLogs(ref: string, functionId: string): Promise<FunctionLog[]> {
  const headers = await getAuthHeader()
  return enhancedFetch<FunctionLog[]>(
    `${API_BASE_URL}/projects/${ref}/functions/${functionId}/logs`,
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'GET',
    },
  )
}

/**
 * Get API logs
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
      let url = `${API_BASE_URL}/projects/${ref}/database/backups`

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
 * Get specific backup details
 */
export async function getBackup(ref: string, backupId: string): Promise<Backup> {
  const headers = await getAuthHeader()
  return enhancedFetch<Backup>(`${API_BASE_URL}/projects/${ref}/database/backups/${backupId}`, {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })
}

/**
 * Create on-demand backup
 */
export async function createBackup(ref: string, description?: string): Promise<Backup> {
  const headers = await getAuthHeader()
  const backup = await enhancedFetch<Backup>(
    `${API_BASE_URL}/projects/${ref}/database/backups`,
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

  // Invalidate cache
  invalidateCache('backups', ref)

  return backup
}

/**
 * Delete backup
 */
export async function deleteBackup(ref: string, backupId: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch(
    `${API_BASE_URL}/projects/${ref}/database/backups/${backupId}`,
    {
      headers,
      method: 'DELETE',
    },
    'delete backup',
  )

  // Invalidate caches
  invalidateCache('backups', ref)
}

/**
 * Restore from backup
 */
export async function restoreFromBackup(ref: string, backupId: string): Promise<RestoreStatus> {
  const headers = await getAuthHeader()
  return enhancedFetch<RestoreStatus>(
    `${API_BASE_URL}/projects/${ref}/database/backups/${backupId}/restore`,
    {
      headers,
      method: 'POST',
    },
    'restore from backup',
  )
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
      return enhancedFetch<BackupSchedule[]>(
        `${API_BASE_URL}/projects/${ref}/database/backup-schedules`,
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          method: 'GET',
        },
      )
    },
    CACHE_TTL.SCHEDULE,
  )
}

/**
 * Create backup schedule
 */
export async function createBackupSchedule(
  ref: string,
  frequency: 'daily' | 'monthly' | 'weekly',
  retentionDays: number,
): Promise<BackupSchedule> {
  const headers = await getAuthHeader()
  const schedule = await enhancedFetch<BackupSchedule>(
    `${API_BASE_URL}/projects/${ref}/database/backup-schedules`,
    {
      body: JSON.stringify({ frequency, retention_days: retentionDays }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'create backup schedule',
  )

  // Invalidate cache
  invalidateCache('backup-schedules', ref)

  return schedule
}

/**
 * Point-in-time restore
 */
export async function restoreFromPITR(ref: string, timestamp: string): Promise<RestoreStatus> {
  const headers = await getAuthHeader()
  return enhancedFetch<RestoreStatus>(
    `${API_BASE_URL}/projects/${ref}/database/backups/restore-pitr`,
    {
      body: JSON.stringify({ timestamp }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'restore from PITR',
  )
}

/**
 * Alias for restoreFromPITR for backward compatibility
 */
export async function restoreToPointInTime(ref: string, timestamp: string): Promise<RestoreStatus> {
  return restoreFromPITR(ref, timestamp)
}

// ============================================================================
// PHASE 2B: DATABASE REPLICAS
// ============================================================================

/**
 * List database replicas
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
 * Create database replica
 */
export async function createDatabaseReplica(
  ref: string,
  location: string,
): Promise<DatabaseReplica> {
  const headers = await getAuthHeader()
  const replica = await enhancedFetch<DatabaseReplica>(
    `${API_BASE_URL}/projects/${ref}/database/replicas`,
    {
      body: JSON.stringify({ location }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'create replica',
  )

  // Invalidate cache
  invalidateCache('replicas', ref)

  return replica
}

/**
 * Delete database replica
 */
export async function deleteDatabaseReplica(ref: string, replicaId: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch(
    `${API_BASE_URL}/projects/${ref}/database/replicas/${replicaId}`,
    {
      headers,
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
 * List network IP restrictions
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
 * Add network IP restriction
 */
export async function addNetworkRestriction(
  ref: string,
  cidr: string,
  description?: string,
): Promise<NetworkRestriction> {
  const headers = await getAuthHeader()
  const restriction = await enhancedFetch<NetworkRestriction>(
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

  // Invalidate cache
  invalidateCache('network-restrictions', ref)

  return restriction
}

/**
 * Remove network IP restriction
 */
export async function removeNetworkRestriction(ref: string, restrictionId: string): Promise<void> {
  const headers = await getAuthHeader()
  await enhancedFetch(
    `${API_BASE_URL}/projects/${ref}/network/restrictions/${restrictionId}`,
    {
      headers,
      method: 'DELETE',
    },
    'remove network restriction',
  )

  // Invalidate cache
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
  return enhancedFetch<SecurityAudit>(
    `${API_BASE_URL}/projects/${ref}/security/audit`,
    {
      headers,
      method: 'POST',
    },
    'run security audit',
  )
}

// ============================================================================
// STORAGE
// ============================================================================

/**
 * List storage buckets
 * Note: This uses the project URL, not the management API
 */
export async function getStorageBuckets(ref: string): Promise<StorageBucket[]> {
  return cachedFetch(
    'storage-buckets',
    ref,
    async () => {
      const headers = await getAuthHeader()
      const projectUrl = getProjectUrl(ref)

      return enhancedFetch<StorageBucket[]>(`${projectUrl}/storage/v1/bucket`, {
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
 * Get specific storage bucket
 * Note: This uses the project URL, not the management API
 */
export async function getStorageBucket(ref: string, bucketId: string): Promise<StorageBucket> {
  const headers = await getAuthHeader()
  const projectUrl = getProjectUrl(ref)

  return enhancedFetch<StorageBucket>(`${projectUrl}/storage/v1/bucket/${bucketId}`, {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })
}

/**
 * Create storage bucket
 * Note: This uses the project URL, not the management API
 */
export async function createStorageBucket(
  ref: string,
  name: string,
  isPublic: boolean,
): Promise<StorageBucket> {
  const headers = await getAuthHeader()
  const projectUrl = getProjectUrl(ref)

  const bucket = await enhancedFetch<StorageBucket>(
    `${projectUrl}/storage/v1/bucket`,
    {
      body: JSON.stringify({
        id: name,
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

  // Invalidate cache
  invalidateCache('storage-buckets', ref)

  return bucket
}

/**
 * Delete storage bucket
 * Note: This uses the project URL, not the management API
 */
export async function deleteStorageBucket(ref: string, bucketId: string): Promise<void> {
  const headers = await getAuthHeader()
  const projectUrl = getProjectUrl(ref)

  await enhancedFetch(
    `${projectUrl}/storage/v1/bucket/${bucketId}`,
    {
      headers,
      method: 'DELETE',
    },
    'delete storage bucket',
  )

  // Invalidate cache
  invalidateCache('storage-buckets', ref)
}

/**
 * Get storage bucket policies
 * Note: This uses the project URL, not the management API
 */
export async function getStoragePolicies(ref: string, bucketId: string): Promise<StoragePolicy[]> {
  const headers = await getAuthHeader()
  const projectUrl = getProjectUrl(ref)

  return enhancedFetch<StoragePolicy[]>(`${projectUrl}/storage/v1/bucket/${bucketId}/policies`, {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })
}

/**
 * Set storage bucket policies
 * Note: This uses the project URL, not the management API
 */
export async function setStoragePolicies(
  ref: string,
  bucketId: string,
  policies: Partial<StoragePolicy>[],
): Promise<StoragePolicy[]> {
  const headers = await getAuthHeader()
  const projectUrl = getProjectUrl(ref)

  return enhancedFetch<StoragePolicy[]>(
    `${projectUrl}/storage/v1/bucket/${bucketId}/policies`,
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
}

// ============================================================================
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
