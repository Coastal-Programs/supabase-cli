/**
 * Data transformation utilities
 *
 * TODO: Implement transformation functions:
 * - camelToSnake(str: string): string
 * - snakeToCamel(str: string): string
 * - kebabToCamel(str: string): string
 * - flattenObject(obj: Record<string, unknown>): Record<string, unknown>
 * - unflattenObject(obj: Record<string, unknown>): Record<string, unknown>
 * - pickKeys(obj: Record<string, unknown>, keys: string[]): Record<string, unknown>
 * - omitKeys(obj: Record<string, unknown>, keys: string[]): Record<string, unknown>
 * - etc.
 */

export const Transformer = {
  /**
   * Convert camelCase to snake_case
   */
  camelToSnake(str: string): string {
    return str.replaceAll(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`)
  },

  /**
   * Convert kebab-case to camelCase
   */
  kebabToCamel(str: string): string {
    return str.replaceAll(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase())
  },

  /**
   * Omit specific keys from object
   */
  omitKeys<T extends Record<string, unknown>>(obj: T, keys: string[]): Partial<T> {
    const result = { ...obj }
    for (const key of keys) {
      delete result[key]
    }

    return result
  },

  /**
   * Pick specific keys from object
   */
  pickKeys<T extends Record<string, unknown>>(obj: T, keys: string[]): Partial<T> {
    const result: Partial<T> = {}
    for (const key of keys) {
      if (key in obj) {
        // Type assertion needed because we're dynamically building the object
        result[key as keyof T] = obj[key] as T[keyof T]
      }
    }

    return result
  },

  /**
   * Convert snake_case to camelCase
   */
  snakeToCamel(str: string): string {
    return str.replaceAll(/_([a-z])/g, (_: string, letter: string) => letter.toUpperCase())
  },
}
