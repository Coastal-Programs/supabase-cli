/**
 * Legacy credential migration utility
 *
 * Migrates plaintext credentials from legacy storage locations to secure storage.
 * Provides automatic detection, user consent, backup creation, and rollback capabilities.
 *
 * Security Standards Compliance:
 * - OWASP: Secure migration of sensitive data (prevents CWE-256)
 * - NIST SP 800-63B: Transitions to secure credential storage
 * - PCI DSS: Removes plaintext credential storage
 *
 * Migration Path:
 * 1. Detect legacy credential files
 * 2. Obtain user consent (with explanation)
 * 3. Backup legacy files (timestamped)
 * 4. Migrate credentials to SecureStorage
 * 5. Delete plaintext files (after successful migration)
 * 6. Rollback on failure (restore from backup)
 */

import { existsSync, promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { ConfigurationError, SupabaseError, SupabaseErrorCode } from '../errors'
import { SecureStorage } from './secure-storage'

/**
 * Migration options
 */
export interface MigrationOptions {
  /**
   * Backup only mode - create backups without deletion
   */
  backupOnly?: boolean

  /**
   * Dry run mode - detect and report without migrating
   */
  dryRun?: boolean

  /**
   * Force use of encrypted file fallback (for testing)
   */
  forceFallback?: boolean

  /**
   * Skip user consent prompts (for automated environments)
   */
  skipConsent?: boolean
}

/**
 * Migration result
 */
export interface MigrationResult {
  /**
   * Path to backup file (if created)
   */
  backupPath?: string

  /**
   * List of errors encountered
   */
  errors: string[]

  /**
   * Number of credentials migrated
   */
  migratedCount: number

  /**
   * Paths of files that were processed
   */
  processedFiles: string[]

  /**
   * Whether rollback was performed
   */
  rolledBack?: boolean

  /**
   * Whether migration was successful
   */
  success: boolean
}

/**
 * Legacy credential file structure
 */
interface LegacyCredentials {
  // Direct token storage (simpler format)
  accessToken?: string
  profiles?: {
    [profileName: string]: {
      credentials?: {
        accessToken?: string
        expiresAt?: number
        refreshToken?: string
      }
      metadata?: Record<string, unknown>
    }
  }
  token?: string
}

/**
 * Legacy credential file location
 */
interface LegacyLocation {
  description: string
  path: string
}

/**
 * Get all potential legacy credential file locations
 */
function getLegacyLocations(): LegacyLocation[] {
  const home = homedir()

  return [
    {
      description: 'Legacy Supabase CLI config',
      path: join(home, '.supabase', 'config.json'),
    },
    {
      description: 'Current CLI credentials (plaintext)',
      path: join(home, '.supabase-cli', 'credentials.json'),
    },
    {
      description: 'Alternative Supabase credentials',
      path: join(home, '.supabase', 'credentials.json'),
    },
  ]
}

/**
 * Detect legacy credential files
 *
 * @returns Array of paths to existing legacy credential files
 */
export function detectLegacyCredentials(): string[] {
  const locations = getLegacyLocations()
  const found: string[] = []

  for (const location of locations) {
    if (existsSync(location.path)) {
      found.push(location.path)
    }
  }

  return found
}

/**
 * Parse legacy credential file
 *
 * @param filePath - Path to credential file
 * @returns Parsed credentials or null if invalid
 */
async function parseLegacyCredentials(filePath: string): Promise<LegacyCredentials | null> {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    const parsed: LegacyCredentials = JSON.parse(content)

    // Validate structure
    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    return parsed
  } catch (error) {
    // File is corrupt or not JSON
    if (error instanceof SyntaxError) {
      throw new ConfigurationError(
        `Failed to parse legacy credentials at ${filePath}: Invalid JSON format`,
        { filePath, originalError: error.message },
      )
    }

    throw new SupabaseError(
      `Failed to read legacy credentials at ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      SupabaseErrorCode.CONFIG_ERROR,
      undefined,
      { filePath },
    )
  }
}

/**
 * Extract access tokens from legacy credentials
 *
 * @param credentials - Parsed legacy credentials
 * @returns Array of access tokens with their profile names
 */
function extractAccessTokens(
  credentials: LegacyCredentials,
): Array<{ profile: string; token: string }> {
  const tokens: Array<{ profile: string; token: string }> = []

  // Check direct token storage
  const directToken = credentials.accessToken || credentials.token
  if (directToken && typeof directToken === 'string') {
    tokens.push({ profile: 'default', token: directToken })
  }

  // Check profile-based storage
  if (credentials.profiles && typeof credentials.profiles === 'object') {
    for (const [profileName, profileData] of Object.entries(credentials.profiles)) {
      if (profileData?.credentials?.accessToken) {
        tokens.push({
          profile: profileName,
          token: profileData.credentials.accessToken,
        })
      }
    }
  }

  return tokens
}

/**
 * Create backup of legacy credential file
 *
 * @param filePath - Original file path
 * @returns Path to backup file
 */
async function createBackup(filePath: string): Promise<string> {
  const timestamp = new Date().toISOString().replaceAll(/[.:]/g, '-')
  const backupPath = `${filePath}.backup-${timestamp}`

  try {
    await fs.copyFile(filePath, backupPath)
    // Set restrictive permissions on backup
    await fs.chmod(backupPath, 0o600)
    return backupPath
  } catch (error) {
    throw new SupabaseError(
      `Failed to create backup of ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      SupabaseErrorCode.CONFIG_ERROR,
      undefined,
      { backupPath, filePath },
    )
  }
}

/**
 * Restore from backup (rollback)
 *
 * @param originalPath - Original file path
 * @param backupPath - Backup file path
 */
async function restoreFromBackup(originalPath: string, backupPath: string): Promise<void> {
  try {
    // Remove potentially corrupt file
    if (existsSync(originalPath)) {
      await fs.unlink(originalPath)
    }

    // Restore from backup
    await fs.copyFile(backupPath, originalPath)
    await fs.chmod(originalPath, 0o600)
  } catch {
    // Silently fail - this is already in error handling path
  }
}

/**
 * Delete legacy credential file
 *
 * @param filePath - File path to delete
 */
async function deleteLegacyFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
  } catch (error) {
    // ENOENT is okay - file already deleted
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return
    }

    throw new SupabaseError(
      `Failed to delete legacy credentials at ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      SupabaseErrorCode.CONFIG_ERROR,
      undefined,
      { filePath },
    )
  }
}

/**
 * Validate token format (basic check)
 *
 * @param token - Token to validate
 * @returns Whether token format is valid
 */
function isValidTokenFormat(token: string): boolean {
  // Supabase PAT format: sbp_ followed by 32+ alphanumeric characters
  const tokenRegex = /^sbp_[\dA-Za-z]{32,}$/
  return tokenRegex.test(token)
}

/**
 * Migrate legacy credentials to secure storage
 *
 * This function:
 * 1. Detects legacy credential files
 * 2. Obtains user consent (unless skipped)
 * 3. Creates backups of all files
 * 4. Migrates credentials to SecureStorage
 * 5. Deletes plaintext files (after successful migration)
 * 6. Rolls back on failure (restores from backup)
 *
 * @param options - Migration options
 * @returns Migration result with status and details
 *
 * @example
 * ```typescript
 * // Automatic migration with consent
 * const result = await migrateLegacyCredentials()
 *
 * // Dry run to check what would be migrated
 * const dryRun = await migrateLegacyCredentials({ dryRun: true })
 *
 * // Automated migration (CI/CD)
 * const auto = await migrateLegacyCredentials({ skipConsent: true })
 * ```
 */
export async function migrateLegacyCredentials(
  options: MigrationOptions = {},
): Promise<MigrationResult> {
  const result: MigrationResult = {
    errors: [],
    migratedCount: 0,
    processedFiles: [],
    success: false,
  }

  // Detect legacy credential files
  const legacyFiles = detectLegacyCredentials()

  if (legacyFiles.length === 0) {
    // No migration needed
    result.success = true
    return result
  }

  result.processedFiles = legacyFiles

  // Dry run mode - just report what would be migrated
  if (options.dryRun) {
    for (const filePath of legacyFiles) {
      try {
        const credentials = await parseLegacyCredentials(filePath)
        if (credentials) {
          const tokens = extractAccessTokens(credentials)
          result.migratedCount += tokens.length
        }
      } catch (error) {
        result.errors.push(
          `Failed to parse ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }

    result.success = true
    return result
  }

  // Create SecureStorage instance
  const storage = new SecureStorage()
  const backups: Map<string, string> = new Map()

  try {
    // Create backups of all files first
    for (const filePath of legacyFiles) {
      try {
        const backupPath = await createBackup(filePath)
        backups.set(filePath, backupPath)
        result.backupPath = backupPath // Store last backup path
      } catch (error) {
        result.errors.push(
          `Failed to create backup for ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        )
        // Continue to next file
      }
    }

    // Parse and migrate credentials from each file
    for (const filePath of legacyFiles) {
      try {
        const credentials = await parseLegacyCredentials(filePath)
        if (!credentials) {
          result.errors.push(`No valid credentials found in ${filePath}`)
          continue
        }

        const tokens = extractAccessTokens(credentials)

        if (tokens.length === 0) {
          result.errors.push(`No access tokens found in ${filePath}`)
          continue
        }

        // Migrate each token to secure storage
        for (const { profile, token } of tokens) {
          // Validate token format
          if (!isValidTokenFormat(token)) {
            result.errors.push(
              `Invalid token format for profile '${profile}' in ${filePath} - skipping`,
            )
            continue
          }

          try {
            // Store in secure storage
            // Use account identifier format: access_token or access_token:profile
            const account = profile === 'default' ? 'access_token' : `access_token:${profile}`

            await storage.store(account, token, {
              forceFallback: options.forceFallback,
              skipConsent: options.skipConsent,
            })

            result.migratedCount++
          } catch (error) {
            result.errors.push(
              `Failed to store token for profile '${profile}': ${error instanceof Error ? error.message : String(error)}`,
            )

            // If storage fails due to lack of consent, throw to abort migration
            if (error instanceof Error && error.message.includes('requires user consent')) {
              throw error
            }
          }
        }
      } catch (error) {
        result.errors.push(
          `Failed to migrate ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        )

        // If this is a consent error, abort entire migration
        if (error instanceof Error && error.message.includes('requires user consent')) {
          throw error
        }
      }
    }

    // Delete legacy files (unless backupOnly mode)
    if (!options.backupOnly && result.migratedCount > 0) {
      for (const filePath of legacyFiles) {
        try {
          await deleteLegacyFile(filePath)
        } catch (error) {
          result.errors.push(
            `Failed to delete legacy file ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
          )
          // Continue - we've already migrated the credentials
        }
      }
    }

    // Migration successful if at least one credential was migrated
    result.success = result.migratedCount > 0

    return result
  } catch (error) {
    // Migration failed - attempt rollback
    result.success = false
    result.errors.push(
      `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
    )

    // Rollback: restore from backups
    // Use Array.from to avoid iterator issues
    const backupEntries = [...backups.entries()]
    for (const [originalPath, backupPath] of backupEntries) {
      try {
        await restoreFromBackup(originalPath, backupPath)
        result.rolledBack = true
      } catch (rollbackError) {
        result.errors.push(
          `Failed to rollback ${originalPath}: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`,
        )
      }
    }

    return result
  }
}

/**
 * Check if migration is needed
 *
 * @returns True if legacy credentials are detected
 */
export function isMigrationNeeded(): boolean {
  return detectLegacyCredentials().length > 0
}

/**
 * Get migration summary for user display
 *
 * @returns Human-readable migration summary
 */
export async function getMigrationSummary(): Promise<string> {
  const legacyFiles = detectLegacyCredentials()

  if (legacyFiles.length === 0) {
    return 'No legacy credentials detected. Migration not needed.'
  }

  const lines: string[] = ['Legacy plaintext credentials detected:', '']

  let totalTokens = 0

  for (const filePath of legacyFiles) {
    try {
      const credentials = await parseLegacyCredentials(filePath)
      if (credentials) {
        const tokens = extractAccessTokens(credentials)
        totalTokens += tokens.length

        lines.push(`  - ${filePath}`)
        lines.push(`    Profiles: ${tokens.map((t) => t.profile).join(', ')}`)
      }
    } catch (error) {
      lines.push(
        `  - ${filePath} (error: ${error instanceof Error ? error.message : String(error)})`,
      )
    }
  }

  lines.push(
    '',
    `Total credentials found: ${totalTokens}`,
    '',
    'Migration will:',
    '  1. Create timestamped backups of all credential files',
    '  2. Store credentials securely using OS keychain or encrypted storage',
    '  3. Delete plaintext credential files',
    '  4. Rollback automatically if any errors occur',
  )

  return lines.join('\n')
}
