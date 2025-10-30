/**
 * Configuration profile for Supabase CLI
 *
 * IMPORTANT: Supabase uses a single PAT token (sbp_*) for ALL organizations and projects.
 * Profiles are used to switch between PROJECTS, not tokens.
 */
export interface Profile {
  /**
   * Optional API URL override (for local development or staging environments)
   * @default https://api.supabase.com/v1
   */
  apiUrl?: string

  /**
   * Cache configuration for this profile
   */
  cache: {
    enabled: boolean
    ttl?: number
  }

  /**
   * Human-readable description of the profile
   */
  description?: string

  /**
   * Project reference (primary CLI identifier)
   * This is the short slug used in Supabase API calls
   */
  projectRef?: string
}

/**
 * Main configuration structure
 */
export interface Config {
  /**
   * Name of the currently active profile
   */
  currentProfile: string

  /**
   * Map of profile name to profile configuration
   */
  profiles: {
    [name: string]: Profile
  }

  /**
   * Personal Access Token (PAT) - covers ALL organizations and projects
   * Format: sbp_* (32+ alphanumeric characters)
   */
  token: string
}

/**
 * Profile with metadata for listing
 */
export interface ProfileWithMetadata extends Profile {
  /**
   * Is this the current profile?
   */
  isCurrent: boolean

  /**
   * Profile name
   */
  name: string
}

/**
 * Options for creating a profile
 */
export interface CreateProfileOptions {
  /**
   * API URL override
   */
  apiUrl?: string

  /**
   * Cache configuration
   */
  cache?: {
    enabled: boolean
    ttl?: number
  }

  /**
   * Description
   */
  description?: string
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Config = {
  currentProfile: 'default',
  profiles: {
    default: {
      cache: {
        enabled: true,
        ttl: 600_000, // 10 minutes
      },
      description: 'Default profile',
    },
  },
  token: '',
}

/**
 * Default profile values
 */
export const DEFAULT_PROFILE: Profile = {
  cache: {
    enabled: true,
    ttl: 600_000, // 10 minutes
  },
  description: '',
}

/**
 * Configuration file path constants
 */
export const CONFIG_DIR_NAME = '.supabase-cli'
export const CONFIG_FILE_NAME = 'config.json'
export const CREDENTIALS_FILE_NAME = 'credentials.json'

/**
 * Token validation regex
 * Format: sbp_ followed by 32+ alphanumeric characters
 */
export const TOKEN_REGEX = /^sbp_[\dA-Za-z]{32,}$/

/**
 * Project reference validation regex
 * Format: lowercase alphanumeric with hyphens
 */
export const PROJECT_REF_REGEX = /^[\da-z-]+$/
