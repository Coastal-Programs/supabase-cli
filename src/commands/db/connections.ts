import chalk from 'chalk'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { queryDatabase } from '../../supabase'
import { SQL_QUERIES } from '../../utils/sql-queries'
import { formatter } from '../../utils/formatters'

interface ConnectionResult {
  connections: number
  database: string
}

export default class DbConnections extends BaseCommand {
  static aliases = ['db:active-connections', 'connections']

  static description = 'Show active database connections and pool status'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --project my-project-ref',
    '<%= config.bin %> <%= command.id %> --format table',
    '<%= config.bin %> <%= command.id %> --format json',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(DbConnections)

    try {
      // Get project reference
      const projectRef = (flags.project || flags['project-ref']) || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(
          'Project reference required. Use --project flag or set SUPABASE_PROJECT_REF environment variable.',
          { exit: 1 },
        )
      }

      // Fetch active connections using SQL query
      const connections = await this.spinner(
        'Fetching active connections...',
        async () => queryDatabase(projectRef, SQL_QUERIES.activeConnections) as Promise<ConnectionResult[]>,
        'Connections fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Active Database Connections')
      }

      if (connections.length === 0) {
        if (!flags.quiet) {
          this.info('No active connections found')
        } else {
          this.output([])
        }
      } else {
        if (flags.format === 'table' && !flags.json) {
          // Enhanced table format with formatting
          const table = formatter.createTable(
            ['Database', 'Active Connections'],
            connections.map(conn => [
              chalk.bold(conn.database),
              formatter.formatCount(conn.connections, 50),
            ]),
          )
          this.log(table)
        } else {
          this.output(connections)
        }

        if (!flags.quiet) {
          this.divider()
          const totalConnections = connections.reduce((sum, conn) => sum + conn.connections, 0)
          this.info(`Total: ${totalConnections} active connection(s) across ${connections.length} database(s)`)

          // Warning if connection count is high
          if (totalConnections > 100) {
            this.warning('High connection count detected. Consider connection pooling optimization.')
          }
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
