import chalk from 'chalk'
import Table from 'cli-table3'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export interface OutputOptions {
  color?: boolean
  format?: 'json' | 'list' | 'table' | 'yaml'
  pretty?: boolean
}

/**
 * Sanitize data before logging to prevent sensitive information leakage
 * Redacts common sensitive patterns like tokens, passwords, and API keys
 */
function sanitizeForLogging(message: string): string {
  // Redact tokens (sbp_, sk-, etc.)
  let sanitized = message.replace(/sbp_[a-zA-Z0-9_-]+/g, 'sbp_[REDACTED]')
  sanitized = sanitized.replace(/sk-[a-zA-Z0-9_-]+/g, 'sk-[REDACTED]')

  // Redact common password patterns
  sanitized = sanitized.replace(/"password"\s*:\s*"[^"]+"/gi, '"password":"[REDACTED]"')
  sanitized = sanitized.replace(/'password'\s*:\s*'[^']+'/gi, "'password':'[REDACTED]'")

  // Redact API keys
  sanitized = sanitized.replace(/"api[_-]?key"\s*:\s*"[^"]+"/gi, '"api_key":"[REDACTED]"')
  sanitized = sanitized.replace(/'api[_-]?key'\s*:\s*'[^']+'/gi, "'api_key':'[REDACTED]'")

  // Redact JWT tokens
  sanitized = sanitized.replace(/eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, '[JWT_REDACTED]')

  return sanitized
}

export const Helper = {
  /**
   * Print debug message
   */
  debug(message: string): void {
    if (process.env.DEBUG === 'true') {
      // eslint-disable-next-line no-console
      console.log(chalk.gray('[DEBUG]'), message)
    }
  },

  /**
   * Print divider
   */
  divider(): void {
    // eslint-disable-next-line no-console
    console.log(chalk.gray('─'.repeat(80)))
  },

  /**
   * Print error message
   */
  error(message: string): void {
    // eslint-disable-next-line no-console
    console.error(chalk.red('ERROR:'), message)
  },

  /**
   * Format a date
   */
  formatDate(date: Date | number | string, format?: string): string {
    const d = dayjs(date)

    if (format) {
      return d.format(format)
    }

    return d.format('YYYY-MM-DD HH:mm:ss')
  },

  /**
   * Format duration in milliseconds
   */
  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60_000) return `${(ms / 1000).toFixed(2)}s`
    if (ms < 3_600_000) return `${(ms / 60_000).toFixed(2)}m`

    return `${(ms / 3_600_000).toFixed(2)}h`
  },

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  },

  /**
   * Format data as a list
   */
  formatList(data: unknown): string {
    if (Array.isArray(data)) {
      return data.map((item, i) => `${i + 1}. ${Helper.formatValue(item)}`).join('\n')
    }

    if (typeof data === 'object' && data !== null) {
      return Object.entries(data)
        .map(([key, value]) => `${chalk.bold(key)}: ${Helper.formatValue(value)}`)
        .join('\n')
    }

    return String(data)
  },

  /**
   * Format output based on options
   */
  formatOutput(data: unknown, options: OutputOptions = {}): string {
    const format = options.format ?? 'json'
    const pretty = options.pretty ?? true

    switch (format) {
      case 'json': {
        return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)
      }

      case 'table': {
        return Helper.formatTable(data)
      }

      case 'list': {
        return Helper.formatList(data)
      }

      case 'yaml': {
        return Helper.formatYaml(data)
      }

      default: {
        return String(data)
      }
    }
  },

  /**
   * Format relative time
   */
  formatRelativeTime(date: Date | number | string): string {
    return dayjs(date).fromNow()
  },

  /**
   * Format data as a table
   */
  formatTable(data: unknown): string {
    let arrayData: unknown[]
    arrayData = Array.isArray(data) ? data : [data]

    if (arrayData.length === 0) {
      return 'No data'
    }

    // Type guard to ensure first element is an object
    const firstItem = arrayData[0]
    if (typeof firstItem !== 'object' || firstItem === null) {
      return Helper.formatList(arrayData)
    }

    const keys = Object.keys(firstItem as Record<string, unknown>)
    const table = new Table({
      head: keys.map((k) => chalk.bold.cyan(k)),
      style: {
        border: [],
        head: [],
      },
    })

    for (const row of arrayData) {
      if (typeof row === 'object' && row !== null) {
        const values = keys.map((k) => {
          const value = (row as Record<string, unknown>)[k]
          return Helper.formatValue(value)
        })
        table.push(values)
      }
    }

    return table.toString()
  },

  /**
   * Format a single value
   */
  formatValue(value: unknown): string {
    if (value === null) return chalk.gray('null')
    if (value === undefined) return chalk.gray('undefined')
    if (typeof value === 'boolean') return value ? chalk.green('true') : chalk.red('false')
    if (typeof value === 'number') return chalk.yellow(String(value))
    if (typeof value === 'string') return value
    if (value instanceof Date) return Helper.formatDate(value)
    if (typeof value === 'object') return JSON.stringify(value)

    return String(value)
  },

  /**
   * Format data as YAML (simple implementation)
   */
  formatYaml(data: unknown, indent = 0): string {
    const spaces = ' '.repeat(indent)

    if (Array.isArray(data)) {
      return data.map((item) => `${spaces}- ${Helper.formatYaml(item, indent + 2)}`).join('\n')
    }

    if (typeof data === 'object' && data !== null) {
      return Object.entries(data)
        .map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return `${spaces}${key}:\n${Helper.formatYaml(value, indent + 2)}`
          }

          return `${spaces}${key}: ${Helper.formatValue(value)}`
        })
        .join('\n')
    }

    return String(data)
  },

  /**
   * Print header
   */
  header(title: string): void {
    // eslint-disable-next-line no-console
    console.log('\n' + chalk.bold.underline(title) + '\n')
  },

  /**
   * Print info message
   */
  info(message: string): void {
    // eslint-disable-next-line no-console
    console.log(chalk.blue('INFO:'), message)
  },

  /**
   * Pad string
   */
  pad(str: string, length: number, char = ' '): string {
    return str.padEnd(length, char)
  },

  /**
   * Print success message
   *
   * Security: Sanitizes message to prevent logging of sensitive data
   * CodeQL: Addresses clear-text logging vulnerability
   */
  success(message: string): void {
    // eslint-disable-next-line no-console
    console.log(chalk.green('SUCCESS:'), sanitizeForLogging(message))
  },

  /**
   * Truncate string
   */
  truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str

    return `${str.slice(0, maxLength - 3)}...`
  },

  /**
   * Print warning message
   *
   * Security: Sanitizes message to prevent logging of sensitive data
   * CodeQL: Addresses clear-text logging vulnerability
   */
  warning(message: string): void {
    // eslint-disable-next-line no-console
    console.warn(chalk.yellow('WARNING:'), sanitizeForLogging(message))
  },
}
