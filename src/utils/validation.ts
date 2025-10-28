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
