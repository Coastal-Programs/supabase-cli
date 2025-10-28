// Export main modules
export { AuthManager, Credentials, Profile, auth } from './auth'
// Export auth functions
export {
  clearAuth,
  ensureAuthenticated,
  getAuthToken,
  initializeAuth,
  isAuthenticated,
  validateToken,
} from './auth'
export { BaseCommand } from './base-command'
export * from './base-flags'
export { Cache, CacheEntry, CacheOptions, cache } from './cache'
export {
  Envelope,
  ErrorEnvelope,
  ResponseEnvelope,
  ResponseMetadata,
  SuccessEnvelope,
} from './envelope'
// Export errors
export {
  AuthenticationError,
  ConfigurationError,
  NotFoundError,
  RateLimitError,
  SupabaseError,
  SupabaseErrorCode,
  ValidationError,
} from './errors'
export { Helper, OutputOptions } from './helper'

export { CircuitBreaker, CircuitBreakerOptions, RetryHandler, RetryOptions, retry } from './retry'

export { SupabaseAPIWrapper, supabase } from './supabase'

// Export supabase API functions
export {
  applyMigration,
  createBranch,
  createProject,
  createSecret,
  deleteBranch,
  deleteFunction,
  deleteProject,
  deleteSecret,
  deployFunction,
  dumpDatabase,
  getAdvisors,
  getFunction,
  getLogs,
  getProject,
  getProjectStats,
  getTableSchema,
  listBranches,
  listExtensions,
  listFunctions,
  listMigrations,
  listProjects,
  listSecrets,
  listTables,
  mergeBranch,
  pauseProject,
  queryDatabase,
  rebaseBranch,
  resetBranch,
  restoreProject,
} from './supabase'

// Export types
export type {
  Advisor,
  Branch,
  BranchStatus,
  CreateProjectConfig,
  DeployFunctionConfig,
  EdgeFunction,
  Extension,
  FunctionStatus,
  LogEntry,
  Migration,
  Organization,
  Project,
  ProjectStats,
  ProjectStatus,
  Secret,
  Table,
} from './supabase'

export { Parser } from './utils/parsing'
export { Platform } from './utils/platform'
export { Transformer } from './utils/transform'
// Export utilities
export { Validator } from './utils/validation'
