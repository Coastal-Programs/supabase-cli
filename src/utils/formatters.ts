import chalk from 'chalk'
import Table from 'cli-table3'

/**
 * Enhanced output formatter for database commands
 * Provides beautiful, color-coded output formatting
 */
export class OutputFormatter {
  /**
   * Format database size with color coding
   * Red: > 10GB, Yellow: > 1GB, Green: < 1GB
   */
  formatSize(sizeString: string): string {
    // Parse size string like "1.5 GB", "500 MB", etc.
    const match = sizeString.match(/^([\d.]+)\s*([A-Z]+)$/i)
    if (!match) return sizeString

    const value = Number.parseFloat(match[1])
    const unit = match[2].toUpperCase()

    // Convert to GB for comparison
    let gb = value
    if (unit === 'MB') gb = value / 1024
    if (unit === 'KB') gb = value / (1024 * 1024)
    if (unit === 'BYTES') gb = value / (1024 * 1024 * 1024)

    if (gb > 10) return chalk.red(sizeString)
    if (gb > 1) return chalk.yellow(sizeString)
    return chalk.green(sizeString)
  }

  /**
   * Format bytes as human-readable size with color coding
   */
  formatBytes(bytes: number): string {
    const gb = bytes / (1024 ** 3)
    const mb = bytes / (1024 ** 2)
    const kb = bytes / 1024

    let formatted: string
    if (gb >= 1) {
      formatted = `${gb.toFixed(2)} GB`
    } else if (mb >= 1) {
      formatted = `${mb.toFixed(2)} MB`
    } else if (kb >= 1) {
      formatted = `${kb.toFixed(2)} KB`
    } else {
      formatted = `${bytes} bytes`
    }

    return this.formatSize(formatted)
  }

  /**
   * Format connection state with colors
   */
  formatConnectionState(state: string): string {
    const stateColors: Record<string, string> = {
      'active': chalk.green('● Active'),
      'idle': chalk.yellow('○ Idle'),
      'idle in transaction': chalk.red('⚠ Idle in TX'),
      'idle in transaction (aborted)': chalk.red('✗ TX Aborted'),
      'fastpath function call': chalk.blue('⚡ Fastpath'),
      'disabled': chalk.gray('○ Disabled'),
    }

    return stateColors[state.toLowerCase()] || state
  }

  /**
   * Format boolean status with colors
   */
  formatStatus(enabled: boolean | string): string {
    const isEnabled = typeof enabled === 'string'
      ? enabled.toLowerCase() === 'true' || enabled.toLowerCase() === 'enabled'
      : enabled

    return isEnabled
      ? chalk.green('✓ Enabled')
      : chalk.gray('○ Disabled')
  }

  /**
   * Format RLS policy enforcement
   */
  formatPolicyEnforcement(enabled: boolean | string): string {
    const isEnabled = typeof enabled === 'string'
      ? enabled.toLowerCase() === 'permissive'
      : enabled

    return isEnabled
      ? chalk.green('✓ Permissive')
      : chalk.yellow('⚠ Restrictive')
  }

  /**
   * Format PostgreSQL version with highlighting
   */
  formatVersion(version: string): string {
    // Extract version number (e.g., "PostgreSQL 15.1" -> "15.1")
    const match = version.match(/(\d+\.\d+)/)
    if (match) {
      return version.replace(match[1], chalk.cyan.bold(match[1]))
    }

    return chalk.cyan(version)
  }

  /**
   * Format schema owner with icon
   */
  formatOwner(owner: string): string {
    if (owner === 'postgres') {
      return chalk.magenta(`👤 ${owner}`)
    }

    return chalk.blue(`👤 ${owner}`)
  }

  /**
   * Format table type with icons
   */
  formatTableType(type: string): string {
    const typeMap: Record<string, string> = {
      'BASE TABLE': chalk.green('📋 Table'),
      'VIEW': chalk.blue('👁  View'),
      'MATERIALIZED VIEW': chalk.cyan('💾 Mat. View'),
      'FOREIGN TABLE': chalk.yellow('🔗 Foreign'),
    }

    return typeMap[type.toUpperCase()] || type
  }

  /**
   * Format index type with icons
   */
  formatIndexType(type: string): string {
    const typeMap: Record<string, string> = {
      'btree': chalk.green('🌲 B-Tree'),
      'hash': chalk.yellow('# Hash'),
      'gist': chalk.blue('🗺  GiST'),
      'gin': chalk.cyan('📊 GIN'),
      'brin': chalk.magenta('📈 BRIN'),
      'spgist': chalk.blue('🌿 SP-GiST'),
    }

    return typeMap[type.toLowerCase()] || type
  }

  /**
   * Format SQL command type
   */
  formatCommandType(cmd: string): string {
    const cmdColors: Record<string, string> = {
      'SELECT': chalk.green('SELECT'),
      'INSERT': chalk.blue('INSERT'),
      'UPDATE': chalk.yellow('UPDATE'),
      'DELETE': chalk.red('DELETE'),
      'ALL': chalk.cyan('ALL'),
    }

    return cmdColors[cmd.toUpperCase()] || cmd
  }

  /**
   * Format role array
   */
  formatRoles(roles: string[] | string): string {
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.map(role => chalk.magenta(role)).join(', ')
  }

  /**
   * Create a beautiful table with custom styling
   */
  createTable(headers: string[], rows: (string | number)[][]): string {
    const tableOptions: any = {
      head: headers.map(h => chalk.cyan.bold(h)),
      style: {
        head: [],
        border: ['grey'],
      },
      wordWrap: true,
    }

    // Only set colWidths if there are rows (cli-table3 crashes on empty rows with colWidths)
    if (rows.length > 0) {
      tableOptions.colWidths = this.calculateColumnWidths(headers, rows)
    }

    const table = new Table(tableOptions)

    for (const row of rows) {
      table.push(row)
    }

    return table.toString()
  }

  /**
   * Create a compact table (no borders)
   */
  createCompactTable(headers: string[], rows: (string | number)[][]): string {
    const table = new Table({
      head: headers.map(h => chalk.cyan.bold(h)),
      chars: {
        'bottom': '',
        'bottom-left': '',
        'bottom-mid': '',
        'bottom-right': '',
        'left': '',
        'left-mid': '',
        'mid': '',
        'mid-mid': '',
        'middle': ' ',
        'right': '',
        'right-mid': '',
        'top': '',
        'top-left': '',
        'top-mid': '',
        'top-right': '',
      },
      style: {
        head: [],
        'padding-left': 0,
        'padding-right': 2,
      },
    })

    for (const row of rows) {
      table.push(row)
    }

    return table.toString()
  }

  /**
   * Create a key-value table for single record display
   */
  createKeyValueTable(data: Record<string, unknown>): string {
    const table = new Table({
      colWidths: [30, 80],
      wordWrap: true,
      style: {
        border: ['grey'],
      },
    })

    for (const [key, value] of Object.entries(data)) {
      table.push([
        chalk.cyan.bold(key),
        this.formatValue(value),
      ])
    }

    return table.toString()
  }

  /**
   * Format a value based on its type
   */
  formatValue(value: unknown): string {
    if (value === null) return chalk.gray('null')
    if (value === undefined) return chalk.gray('undefined')
    if (typeof value === 'boolean') return value ? chalk.green('true') : chalk.red('false')
    if (typeof value === 'number') return chalk.yellow(String(value))
    if (typeof value === 'string') return value
    if (value instanceof Date) return chalk.blue(value.toISOString())
    if (typeof value === 'object') return JSON.stringify(value, null, 2)

    return String(value)
  }

  /**
   * Calculate optimal column widths
   */
  private calculateColumnWidths(headers: string[], rows: (string | number)[][]): number[] | undefined {
    // If no rows, use default widths
    if (rows.length === 0) return undefined

    const widths = headers.map((header, colIndex) => {
      // Start with header length
      let maxWidth = header.length

      // Check all rows for this column
      for (const row of rows) {
        if (row[colIndex] !== undefined) {
          const cellLength = String(row[colIndex]).length
          maxWidth = Math.max(maxWidth, cellLength)
        }
      }

      // Add padding and cap at reasonable maximum
      return Math.min(maxWidth + 4, 50)
    })

    return widths
  }

  /**
   * Format query result count with appropriate color
   */
  formatCount(count: number, threshold = 100): string {
    if (count === 0) return chalk.gray(`${count} rows`)
    if (count > threshold) return chalk.yellow(`${count} rows`)
    return chalk.green(`${count} rows`)
  }

  /**
   * Format duration for queries
   */
  formatDuration(ms: number): string {
    if (ms < 10) return chalk.green(`${ms.toFixed(2)}ms`)
    if (ms < 100) return chalk.yellow(`${ms.toFixed(2)}ms`)
    if (ms < 1000) return chalk.red(`${ms.toFixed(2)}ms`)
    return chalk.red.bold(`${(ms / 1000).toFixed(2)}s`)
  }

  /**
   * Format percentage with color coding
   */
  formatPercentage(value: number): string {
    const formatted = `${value.toFixed(1)}%`
    if (value > 90) return chalk.red(formatted)
    if (value > 75) return chalk.yellow(formatted)
    return chalk.green(formatted)
  }

  /**
   * Create a section header
   */
  sectionHeader(title: string): string {
    return chalk.bold.cyan(`\n▸ ${title}\n`)
  }

  /**
   * Create a subsection header
   */
  subsectionHeader(title: string): string {
    return chalk.bold.white(`  ${title}`)
  }
}

/**
 * Singleton instance for convenience
 */
export const formatter = new OutputFormatter()
