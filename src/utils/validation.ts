/**
 * Validation utilities
 *
 * TODO: Implement validation functions:
 * - validateProjectId(id: string): boolean
 * - validateEmail(email: string): boolean
 * - validateUrl(url: string): boolean
 * - validateUUID(uuid: string): boolean
 * - validateJSON(json: string): boolean
 * - etc.
 */

export const Validator = {
  isValidEmail(email: string): boolean {
    // Security fix: Prevent ReDoS by limiting input length before regex test
    // RFC 5321 specifies max email length of 320 characters
    if (!email || email.length > 320) {
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i
    return uuidRegex.test(uuid)
  },

  isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },
}
