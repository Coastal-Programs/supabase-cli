import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags, WatchFlags } from '../../base-flags'
import { ErrorMessages } from '../../error-messages'
import { queryDatabase } from '../../supabase'
import { formatter } from '../../utils/formatters'
import { SQL_QUERIES } from '../../utils/sql-queries'

interface DatabaseInfo {
  database: string
  postgres_version: string
  size: string
}

export default class DbInfo extends BaseCommand {
  static aliases = ['db:database-info', 'info']

  static description = 'Get database information (version, size, settings)'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project-ref',
    '<%= config.bin %> <%= command.id %> --project my-project-ref --format table',
    '<%= config.bin %> <%= command.id %> -p my-project-ref --format json',
    '<%= config.bin %> <%= command.id %> --project my-project-ref --watch',
    '<%= config.bin %> <%= command.id %> --project my-project-ref --watch --interval 30',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...WatchFlags,
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(DbInfo)

    // Get project reference
    const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

    if (!projectRef) {
      this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
    }

    // Run with watch mode support
    await this.runWithWatch(
      async () => {
        try {
          if (!flags.quiet) {
            this.header('Database Information')
          }

          // Fetch database info using SQL query
          let result: DatabaseInfo[]
          if (flags.quiet || flags.watch) {
            // No spinner in quiet mode or watch mode
            result = (await queryDatabase(projectRef, SQL_QUERIES.databaseInfo)) as DatabaseInfo[]
          } else {
            // Show spinner in normal mode
            result = await this.spinner(
              'Fetching database information...',
              async () =>
                queryDatabase(projectRef, SQL_QUERIES.databaseInfo) as Promise<DatabaseInfo[]>,
              'Database information fetched successfully',
            )
          }

          const info = result[0]

          if (!info) {
            this.error('Failed to retrieve database information', { exit: 1 })
          }

          // Output results
          if (flags.format === 'table' && !flags.json) {
            // Enhanced table format with formatting
            const table = formatter.createKeyValueTable({
              Database: info.database,
              'Database Size': formatter.formatSize(info.size),
              'PostgreSQL Version': formatter.formatVersion(info.postgres_version),
            })
            this.log(table)
          } else {
            this.output(info)
          }

          if (!flags.quiet) {
            this.divider()
            this.success('Database information retrieved successfully')
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
