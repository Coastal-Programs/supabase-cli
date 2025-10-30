import chalk from 'chalk'
import { Flags } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { queryDatabase } from '../../supabase'
import { SQL_QUERIES } from '../../utils/sql-queries'
import { formatter } from '../../utils/formatters'

interface TableSizeResult {
  schemaname: string
  size: string
  size_bytes: number
  tablename: string
}

export default class DbTableSizes extends BaseCommand {
  static aliases = ['db:sizes', 'table-sizes']

  static description = 'Show table sizes and storage usage'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --project my-project-ref',
    '<%= config.bin %> <%= command.id %> --schema public',
    '<%= config.bin %> <%= command.id %> --limit 20',
    '<%= config.bin %> <%= command.id %> --format table',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    limit: Flags.integer({
      char: 'l',
      default: 50,
      description: 'Limit number of results',
    }),
    schema: Flags.string({
      char: 's',
      description: 'Filter tables by schema name',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(DbTableSizes)

    try {
      // Get project reference
      const projectRef = (flags.project || flags['project-ref']) || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(
          'Project reference required. Use --project flag or set SUPABASE_PROJECT_REF environment variable.',
          { exit: 1 },
        )
      }

      // Fetch table sizes using SQL query
      let tableSizes = await this.spinner(
        'Fetching table sizes...',
        async () => queryDatabase(projectRef, SQL_QUERIES.tableSizes) as Promise<TableSizeResult[]>,
        'Table sizes fetched successfully',
      )

      // Filter by schema if specified
      if (flags.schema) {
        tableSizes = tableSizes.filter(table => table.schemaname === flags.schema)
      }

      // Apply limit
      if (flags.limit && tableSizes.length > flags.limit) {
        tableSizes = tableSizes.slice(0, flags.limit)
      }

      // Output results
      if (!flags.quiet) {
        const title = flags.schema
          ? `Table Sizes - Schema: ${flags.schema}`
          : 'Table Sizes (Largest First)'
        this.header(title)
      }

      if (tableSizes.length === 0) {
        if (!flags.quiet) {
          const message = flags.schema
            ? `No tables found in schema '${flags.schema}'`
            : 'No tables found'
          this.info(message)
        } else {
          this.output([])
        }
      } else {
        if (flags.format === 'table' && !flags.json) {
          // Enhanced table format with formatting
          const table = formatter.createTable(
            ['Schema', 'Table', 'Size'],
            tableSizes.map(table => [
              table.schemaname,
              chalk.bold(table.tablename),
              formatter.formatSize(table.size),
            ]),
          )
          this.log(table)
        } else {
          this.output(tableSizes)
        }

        if (!flags.quiet) {
          this.divider()
          const totalBytes = tableSizes.reduce((sum, table) => sum + table.size_bytes, 0)
          this.info(`Total: ${tableSizes.length} table(s)`)
          this.info(`Combined size: ${formatter.formatBytes(totalBytes)}`)

          // Find largest table
          const largest = tableSizes[0]
          if (largest) {
            this.info(`Largest table: ${largest.schemaname}.${largest.tablename} (${largest.size})`)
          }
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
