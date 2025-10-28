import { Flags } from '@oclif/core'

/**
 * Common output format flags
 */
export const OutputFormatFlags = {
  color: Flags.boolean({
    allowNo: true,
    default: true,
    description: 'Enable color output',
  }),
  format: Flags.string({
    char: 'f',
    default: 'json',
    description: 'Output format',
    options: ['json', 'table', 'list', 'yaml'],
  }),
  pretty: Flags.boolean({
    allowNo: true,
    default: true,
    description: 'Pretty print output',
  }),
}

/**
 * Common automation flags (for CI/CD)
 */
export const AutomationFlags = {
  debug: Flags.boolean({
    default: false,
    description: 'Enable debug output',
  }),
  'no-interactive': Flags.boolean({
    default: false,
    description: 'Disable interactive prompts',
  }),
  quiet: Flags.boolean({
    char: 'q',
    default: false,
    description: 'Suppress non-essential output',
  }),
  verbose: Flags.boolean({
    char: 'v',
    default: false,
    description: 'Enable verbose output',
  }),
}

/**
 * Common pagination flags
 */
export const PaginationFlags = {
  limit: Flags.integer({
    char: 'l',
    default: 100,
    description: 'Maximum number of items to return',
  }),
  offset: Flags.integer({
    char: 'o',
    default: 0,
    description: 'Number of items to skip',
  }),
  page: Flags.integer({
    char: 'p',
    description: 'Page number',
  }),
  'page-size': Flags.integer({
    default: 25,
    description: 'Number of items per page',
  }),
}

/**
 * Common filtering flags
 */
export const FilterFlags = {
  filter: Flags.string({
    description: 'Filter results by expression (e.g., "name=value")',
    multiple: true,
  }),
  search: Flags.string({
    char: 's',
    description: 'Search query',
  }),
  'sort-by': Flags.string({
    description: 'Sort results by field',
  }),
  'sort-order': Flags.string({
    default: 'asc',
    description: 'Sort order',
    options: ['asc', 'desc'],
  }),
}

/**
 * Common project flags
 */
export const ProjectFlags = {
  project: Flags.string({
    description: 'Supabase project ID or reference',
    env: 'SUPABASE_PROJECT_ID',
  }),
  'project-ref': Flags.string({
    description: 'Supabase project reference',
    env: 'SUPABASE_PROJECT_REF',
  }),
}

/**
 * Common authentication flags
 */
export const AuthFlags = {
  token: Flags.string({
    description: 'Supabase access token',
    env: 'SUPABASE_ACCESS_TOKEN',
  }),
}

/**
 * Common configuration flags
 */
export const ConfigFlags = {
  config: Flags.string({
    char: 'c',
    description: 'Path to config file',
    env: 'SUPABASE_CONFIG_PATH',
  }),
  profile: Flags.string({
    default: 'default',
    description: 'Configuration profile to use',
  }),
}

/**
 * Common confirmation flags
 */
export const ConfirmationFlags = {
  force: Flags.boolean({
    default: false,
    description: 'Force operation without confirmation',
  }),
  yes: Flags.boolean({
    char: 'y',
    default: false,
    description: 'Skip confirmation prompts',
  }),
}

/**
 * Common time range flags
 */
export const TimeRangeFlags = {
  from: Flags.string({
    description: 'Start date/time (ISO 8601 format)',
  }),
  since: Flags.string({
    description: 'Relative time (e.g., "1h", "2d", "1w")',
  }),
  to: Flags.string({
    description: 'End date/time (ISO 8601 format)',
  }),
}

/**
 * Common file flags
 */
export const FileFlags = {
  input: Flags.string({
    char: 'i',
    description: 'Input file path',
  }),
  output: Flags.string({
    char: 'o',
    description: 'Output file path',
  }),
  overwrite: Flags.boolean({
    default: false,
    description: 'Overwrite existing files',
  }),
}

/**
 * Common cache flags
 */
export const CacheFlags = {
  'cache-ttl': Flags.integer({
    description: 'Cache TTL in seconds',
  }),
  'clear-cache': Flags.boolean({
    default: false,
    description: 'Clear cache before executing',
  }),
  'no-cache': Flags.boolean({
    default: false,
    description: 'Disable cache for this request',
  }),
}

/**
 * Common retry flags
 */
export const RetryFlags = {
  'max-retries': Flags.integer({
    default: 3,
    description: 'Maximum number of retry attempts',
  }),
  'no-retry': Flags.boolean({
    default: false,
    description: 'Disable retry on failure',
  }),
}
