/**
 * GoTrue API Client
 *
 * Provides access to Supabase Auth service (GoTrue) via project-level APIs.
 * This is an alternative to Management API v1 auth endpoints that are not available.
 *
 * Docs: https://supabase.com/docs/reference/auth
 * Base URL: https://{project-ref}.supabase.co/auth/v1/
 */

import { SupabaseError } from '../errors'
import { retry } from '../retry'

const DEBUG = process.env.DEBUG === 'true'

/**
 * Auth settings response from GoTrue /settings endpoint
 */
export interface AuthSettings {
  disable_signup: boolean
  external: Record<string, boolean>
  mailer_autoconfirm: boolean
  phone_autoconfirm: boolean
  saml_enabled: boolean
  sms_provider: string
}

/**
 * Auth provider with enabled status
 */
export interface AuthProvider {
  enabled: boolean
  name: string
  provider: string
}

/**
 * GoTrue API client for auth operations
 */
export class GoTrueAPI {
  private anonKey: string
  private baseUrl: string

  constructor(projectRef: string, anonKey: string, _serviceKey?: string) {
    this.anonKey = anonKey
    this.baseUrl = `https://${projectRef}.supabase.co/auth/v1`
  }

  /**
   * Check auth service health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: {
          apikey: this.anonKey,
        },
        method: 'GET',
      })

      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Get auth settings including enabled providers
   * Uses anon key by default, falls back to service key if provided
   */
  async getSettings(): Promise<AuthSettings> {
    return retry.execute(async () => {
      const key = this.anonKey
      const response = await fetch(`${this.baseUrl}/settings`, {
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          apikey: key,
        },
        method: 'GET',
      })

      if (!response.ok) {
        const errorBody = await response.text()
        let errorMessage = `GoTrue API error: ${response.status} ${response.statusText}`

        try {
          const errorJson = JSON.parse(errorBody)
          errorMessage = errorJson.message || errorJson.error?.message || errorMessage
        } catch {
          if (errorBody) {
            errorMessage = errorBody
          }
        }

        throw SupabaseError.fromResponse(response.status, errorMessage, errorBody)
      }

      const data = (await response.json()) as AuthSettings

      if (DEBUG) {
        console.log('[GoTrueAPI] Settings fetched successfully')
      }

      return data
    })
  }

  /**
   * List auth providers with enabled status
   * Parses the external providers from settings endpoint
   */
  async listProviders(): Promise<AuthProvider[]> {
    const settings = await this.getSettings()
    const providers: AuthProvider[] = []

    // Parse external providers (OAuth, email, phone, etc.)
    for (const [provider, enabled] of Object.entries(settings.external)) {
      providers.push({
        enabled: Boolean(enabled),
        name: this.formatProviderName(provider),
        provider,
      })
    }

    // Sort by name for consistent output
    providers.sort((a, b) => a.name.localeCompare(b.name))

    if (DEBUG) {
      console.log(`[GoTrueAPI] Listed ${providers.length} providers`)
    }

    return providers
  }

  /**
   * Format provider name for display
   * Examples: "email" -> "Email", "google" -> "Google", "linkedin_oidc" -> "LinkedIn OIDC"
   */
  private formatProviderName(provider: string): string {
    return provider
      .split('_')
      .map((word) => {
        // Special cases
        if (word.toLowerCase() === 'oidc') return 'OIDC'
        if (word.toLowerCase() === 'saml') return 'SAML'

        // Capitalize first letter
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      })
      .join(' ')
  }
}

/**
 * Create GoTrueAPI instance
 * Helper function for easy instantiation
 */
export function createGoTrueAPI(
  projectRef: string,
  anonKey: string,
  serviceKey?: string,
): GoTrueAPI {
  return new GoTrueAPI(projectRef, anonKey, serviceKey)
}
