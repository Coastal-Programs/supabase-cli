import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { AuthenticationError, SupabaseError, SupabaseErrorCode } from './errors'

const API_BASE_URL = 'https://api.supabase.com/v1'

export interface Credentials {
  accessToken: string
  expiresAt?: number
  refreshToken?: string
}

export interface Profile {
  credentials: Credentials
  metadata?: Record<string, unknown>
  name: string
}

export interface CredentialStore {
  deleteToken(): Promise<void>
  getMetadata(): Promise<Record<string, unknown>>
  getToken(): Promise<null | string>
  saveMetadata(metadata: Record<string, unknown>): Promise<void>
  saveToken(token: string, metadata?: Record<string, unknown>): Promise<void>
  validateTokenFormat(token: string): boolean
}

class FileCredentialStore implements CredentialStore {
  private configDir: string
  private credentialsFile: string

  constructor() {
    this.configDir = join(homedir(), '.supabase-cli')
    this.credentialsFile = join(this.configDir, 'credentials.json')
  }

  async deleteToken(): Promise<void> {
    if (existsSync(this.credentialsFile)) {
      try {
        unlinkSync(this.credentialsFile)
      } catch (error) {
        throw new SupabaseError(
          `Failed to delete credentials file: ${error instanceof Error ? error.message : String(error)}`,
          SupabaseErrorCode.CONFIG_ERROR,
        )
      }
    }
  }

  async getToken(): Promise<null | string> {
    // Check environment variable first (highest priority)
    const envToken = process.env.SUPABASE_ACCESS_TOKEN
    if (envToken) {
      return envToken
    }

    // Check credentials file
    if (!existsSync(this.credentialsFile)) {
      return null
    }

    try {
      const data = JSON.parse(readFileSync(this.credentialsFile, 'utf-8'))
      const profileData = data.profiles?.default

      if (!profileData?.credentials?.accessToken) {
        return null
      }

      return profileData.credentials.accessToken
    } catch {
      return null
    }
  }

  async saveToken(token: string, metadata?: Record<string, unknown>): Promise<void> {
    if (!this.validateTokenFormat(token)) {
      throw new SupabaseError(
        'Invalid token format. Expected format: sbp_[32+ alphanumeric characters]',
        SupabaseErrorCode.INVALID_TOKEN,
      )
    }

    // Ensure config directory exists
    if (!existsSync(this.configDir)) {
      mkdirSync(this.configDir, { mode: 0o700, recursive: true })
    }

    let data: Record<string, unknown> = {}
    if (existsSync(this.credentialsFile)) {
      try {
        data = JSON.parse(readFileSync(this.credentialsFile, 'utf-8'))
      } catch {
        // Ignore parsing errors, will overwrite
      }
    }

    if (!data.profiles) {
      data.profiles = {}
    }

    ;(data.profiles as Record<string, unknown>).default = {
      credentials: {
        accessToken: token,
      },
      metadata: metadata || {},
      updatedAt: new Date().toISOString(),
    }

    // Security fix: Write with secure permissions (owner read/write only)
    // This prevents TOCTOU race conditions by setting permissions atomically
    writeFileSync(this.credentialsFile, JSON.stringify(data, null, 2), {
      encoding: 'utf-8',
      mode: 0o600, // Owner read/write only
    })
  }

  async getMetadata(): Promise<Record<string, unknown>> {
    if (!existsSync(this.credentialsFile)) {
      return {}
    }

    try {
      const data = JSON.parse(readFileSync(this.credentialsFile, 'utf-8'))
      const profileData = data.profiles?.default

      if (!profileData?.metadata) {
        return {}
      }

      return profileData.metadata
    } catch {
      return {}
    }
  }

  async saveMetadata(metadata: Record<string, unknown>): Promise<void> {
    // Ensure config directory exists
    if (!existsSync(this.configDir)) {
      mkdirSync(this.configDir, { mode: 0o700, recursive: true })
    }

    let data: Record<string, unknown> = {}
    if (existsSync(this.credentialsFile)) {
      try {
        data = JSON.parse(readFileSync(this.credentialsFile, 'utf-8'))
      } catch {
        // Ignore parsing errors
      }
    }

    if (!data.profiles) {
      data.profiles = {}
    }

    const existingProfile = (data.profiles as Record<string, unknown>).default as Record<string, unknown> || {}
    
    ;(data.profiles as Record<string, unknown>).default = {
      ...existingProfile,
      metadata: metadata,
      updatedAt: new Date().toISOString(),
    }

    writeFileSync(this.credentialsFile, JSON.stringify(data, null, 2), {
      encoding: 'utf-8',
      mode: 0o600,
    })
  }

  validateTokenFormat(token: string): boolean {
    // Supabase PAT format: sbp_ followed by 32+ alphanumeric characters
    const tokenRegex = /^sbp_[\dA-Za-z]{32,}$/
    return tokenRegex.test(token)
  }
}

// Singleton credential store
const credentialStore = new FileCredentialStore()

/**
 * Initialize authentication with a new token
 * Validates the token and stores it securely
 */
export async function initializeAuth(token?: string): Promise<string> {
  let actualToken = token

  // If no token provided, try to get from environment
  if (!actualToken) {
    actualToken = process.env.SUPABASE_ACCESS_TOKEN || undefined
  }

  if (!actualToken) {
    throw new AuthenticationError(
      'No authentication token provided. Please provide a token or set SUPABASE_ACCESS_TOKEN environment variable.',
    )
  }

  // Validate token format
  if (!credentialStore.validateTokenFormat(actualToken)) {
    throw new SupabaseError(
      'Invalid token format. Expected format: sbp_[32+ alphanumeric characters]\n' +
        'Get your Personal Access Token from: https://supabase.com/dashboard/account/tokens',
      SupabaseErrorCode.INVALID_TOKEN,
    )
  }

  // Validate token works by making a test API call
  const isValid = await validateToken(actualToken)
  if (!isValid) {
    throw new SupabaseError(
      'Token is invalid or expired. Please generate a new token from:\n' +
        'https://supabase.com/dashboard/account/tokens',
      SupabaseErrorCode.INVALID_TOKEN,
    )
  }

  // Store the token
  await credentialStore.saveToken(actualToken)

  return actualToken
}

/**
 * Get the stored authentication token
 * Returns null if no token is found
 */
export async function getAuthToken(): Promise<null | string> {
  return credentialStore.getToken()
}

/**
 * Validate a token by making a test API call
 * Makes a call to /v1/organizations to verify the token works
 */
export async function validateToken(token: string): Promise<boolean> {
  try {
    // codeql[js/file-access-to-http] - Intentional: validating auth token with Supabase API
    const response = await fetch(`${API_BASE_URL}/organizations`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'GET',
    })

    // Token is valid if we get 200 OK or any success response
    // Even if they have no organizations, we'll get 200 with empty array
    if (response.ok) {
      return true
    }

    // 401/403 means invalid/unauthorized token
    if (response.status === 401 || response.status === 403) {
      return false
    }

    // Other errors (rate limit, server error) - assume token might be valid
    // but service is having issues
    if (response.status >= 500) {
      return true
    }

    return false
  } catch {
    // Network errors - can't validate, assume token format is correct
    // User will get proper error when they try to use it
    if (credentialStore.validateTokenFormat(token)) {
      return true
    }

    return false
  }
}

/**
 * Clear stored authentication credentials
 * Used for logout functionality
 */
export async function clearAuth(): Promise<void> {
  await credentialStore.deleteToken()
}

/**
 * Check if user is authenticated and token is valid
 * Returns true if token exists and is valid
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken()
  if (!token) {
    return false
  }

  return validateToken(token)
}

/**
 * Ensure user is authenticated, throw error if not
 * Used by commands that require authentication
 */
export async function ensureAuthenticated(): Promise<string> {
  const token = await getAuthToken()

  if (!token) {
    const { platform } = process
    let instructions = ''

    instructions =
      platform === 'win32'
        ? 'Run the following in PowerShell or CMD:\n' +
          '  $env:SUPABASE_ACCESS_TOKEN="your-token-here"\n' +
          'Or run: supabase-cli init'
        : 'Run the following in your terminal:\n' +
          '  export SUPABASE_ACCESS_TOKEN="your-token-here"\n' +
          'Or run: supabase-cli init'

    throw new AuthenticationError(
      `No authentication token found.\n\n${instructions}\n\n` +
        'Get your Personal Access Token from: https://supabase.com/dashboard/account/tokens',
    )
  }

  // Validate token format at least
  if (!credentialStore.validateTokenFormat(token)) {
    throw new SupabaseError(
      'Stored token format is invalid. Please run: supabase-cli init',
      SupabaseErrorCode.INVALID_TOKEN,
    )
  }

  return token
}

/**
 * Get profile metadata (project_name, scope, etc.)
 */
export async function getProfileMetadata(): Promise<Record<string, unknown>> {
  return credentialStore.getMetadata()
}

/**
 * Save profile metadata (project_name, scope, etc.)
 */
export async function saveProfileMetadata(metadata: Record<string, unknown>): Promise<void> {
  return credentialStore.saveMetadata(metadata)
}

// Legacy AuthManager class for backward compatibility
export class AuthManager {
  private configDir: string
  private credentialsFile: string

  constructor() {
    this.configDir = join(homedir(), '.supabase-cli')
    this.credentialsFile = join(this.configDir, 'credentials.json')
  }

  /**
   * Ensure user is authenticated
   */
  ensureAuthenticated(): void {
    const token = this.getAccessToken()
    if (!token) {
      throw new AuthenticationError(
        'Not authenticated. Please set SUPABASE_ACCESS_TOKEN environment variable or run login command.',
      )
    }
  }

  /**
   * Get access token from environment or credentials file
   */
  getAccessToken(profile = 'default'): null | string {
    // Check environment variable first
    const envToken = process.env.SUPABASE_ACCESS_TOKEN
    if (envToken) return envToken

    // Check credentials file
    const credentials = this.loadCredentials(profile)
    return credentials?.accessToken ?? null
  }

  /**
   * Save credentials to file
   * @internal - Reserved for future use
   */
  // @ts-ignore - Method reserved for future use
  /**
   * Load credentials from file
   */
  private loadCredentials(profile: string): Credentials | null {
    if (!existsSync(this.credentialsFile)) {
      return null
    }

    try {
      const data = JSON.parse(readFileSync(this.credentialsFile, 'utf-8'))
      const profileData = data.profiles?.[profile]

      if (!profileData?.credentials) {
        return null
      }

      return profileData.credentials
    } catch {
      return null
    }
  }

  // @ts-expect-error - Reserved for future use in Sprint 2
  private saveCredentials(profile: string, credentials: Credentials): void {
    if (!existsSync(this.configDir)) {
      mkdirSync(this.configDir, { recursive: true })
    }

    let data: Record<string, unknown> = {}
    if (existsSync(this.credentialsFile)) {
      try {
        data = JSON.parse(readFileSync(this.credentialsFile, 'utf-8'))
      } catch {
        // Ignore parsing errors
      }
    }

    if (!data.profiles) {
      data.profiles = {}
    }

    ;(data.profiles as Record<string, unknown>)[profile] = {
      credentials,
      updatedAt: new Date().toISOString(),
    }

    // Security fix: Write with secure permissions (owner read/write only)
    // This prevents TOCTOU race conditions by setting permissions atomically
    writeFileSync(this.credentialsFile, JSON.stringify(data, null, 2), {
      encoding: 'utf-8',
      mode: 0o600, // Owner read/write only
    })
  }
}

// Export singleton instance for backward compatibility
export const auth = new AuthManager()
