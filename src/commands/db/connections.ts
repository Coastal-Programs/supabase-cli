import chalk from 'chalk'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags, WatchFlags } from '../../base-flags'
import { queryDatabase } from '../../supabase'
import { formatter } from '../../utils/formatters'
import { SQL_QUERIES } from '../../utils/sql-queries'

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
    '<%= config.bin %> <%= command.id %> --project my-project-ref --watch',
    '<%= config.bin %> <%= command.id %> --project my-project-ref --watch --interval 10',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...WatchFlags,
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(DbConnections)

    // Get project reference
    const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

    if (!projectRef) {
      this.error(
        'Project reference required. Use --project flag or set SUPABASE_PROJECT_REF environment variable.',
        { exit: 1 },
      )
    }

    // Run with watch mode support
    await this.runWithWatch(
      async () => {
        try {
          // Fetch active connections using SQL query
          let connections: ConnectionResult[]
          if (flags.quiet || flags.watch) {
            // No spinner in quiet mode or watch mode
            connections = (await queryDatabase(
              projectRef,
              SQL_QUERIES.activeConnections,
            )) as ConnectionResult[]
          } else {
            // Show spinner in normal mode
            connections = await this.spinner(
              'Fetching active connections...',
              async () =>
                queryDatabase(projectRef, SQL_QUERIES.activeConnections) as Promise<
                  ConnectionResult[]
                >,
              'Connections fetched successfully',
            )
          }

          // Output results
          if (!flags.quiet) {
            this.header('Active Database Connections')
          }

          if (connections.length === 0) {
            if (flags.quiet) {
              this.output([])
            } else {
              this.info('No active connections found')
            }
          } else {
            if (flags.format === 'table' && !flags.json) {
              // Enhanced table format with formatting
              const table = formatter.createTable(
                ['Database', 'Active Connections'],
                connections.map((conn) => [
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
              this.info(
                `Total: ${totalConnections} active connection(s) across ${connections.length} database(s)`,
              )

              // Warning if connection count is high
              if (totalConnections > 100) {
                this.warning(
                  'High connection count detected. Consider connection pooling optimization.',
                )
              }
            }
          }

          // Only exit if not in watch mode
          if (!flags.watch) {
            process.exit(0)
          }
        } catch (error) {
          // In watch mode, errors are handled by runWithWatch
          // In normal mode, propagate to handleError
          if (!flags.watch) {
            this.handleError(error)
          } else {
            throw error
          }
        }
      },
      flags.interval * 1000,
      flags.watch,
    )
  }
}
