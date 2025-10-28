/**
 * Parsing utilities
 *
 * TODO: Implement parsing functions:
 * - parseJSON(input: string): unknown
 * - parseCSV(input: string): unknown[]
 * - parseQueryString(query: string): Record<string, string>
 * - parseRelativeTime(time: string): number (e.g., "1h" -> 3600000)
 * - parseFileSize(size: string): number (e.g., "10MB" -> 10485760)
 * - etc.
 */

export const Parser = {
  /**
   * Parse file size string to bytes
   * Examples: "10KB" -> 10240, "5MB" -> 5242880
   */
  parseFileSize(size: string): number {
    const match = size.match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb|tb)?$/i)
    if (!match) {
      throw new Error(`Invalid file size format: ${size}`)
    }

    const value = Number.parseFloat(match[1])
    const unit = (match[2] || 'B').toUpperCase()

    switch (unit) {
      case 'B': {
      return value
    }

      case 'KB': {
      return value * 1024
    }

      case 'MB': {
      return value * 1024 * 1024
    }

      case 'GB': {
      return value * 1024 * 1024 * 1024
    }

      case 'TB': {
      return value * 1024 * 1024 * 1024 * 1024
    }

      default: {
      throw new Error(`Unknown size unit: ${unit}`)
    }
    }
  },

  /**
   * Parse relative time string to milliseconds
   * Examples: "1h" -> 3600000, "2d" -> 172800000, "1w" -> 604800000
   */
  parseRelativeTime(time: string): number {
    const match = time.match(/^(\d+)([dhmsw])$/)
    if (!match) {
      throw new Error(`Invalid relative time format: ${time}`)
    }

    const value = Number.parseInt(match[1], 10)
    const unit = match[2]

    switch (unit) {
      case 's': {
      return value * 1000
    }

      case 'm': {
      return value * 60 * 1000
    }

      case 'h': {
      return value * 60 * 60 * 1000
    }

      case 'd': {
      return value * 24 * 60 * 60 * 1000
    }

      case 'w': {
      return value * 7 * 24 * 60 * 60 * 1000
    }

      default: {
      throw new Error(`Unknown time unit: ${unit}`)
    }
    }
  },
}
