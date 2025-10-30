import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { ErrorMessages } from '../../error-messages'
import { formatter } from '../../utils/formatters'
import { SQL_QUERIES } from '../../utils/sql-queries'
import { queryDatabase } from '../../supabase'

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
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(DbInfo)

    try {
      // Get project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
      }

      if (!flags.quiet) {
        this.header('Database Information')
      }

      // Fetch database info using SQL query
      const result = await this.spinner(
        'Fetching database information...',
        async () => queryDatabase(projectRef, SQL_QUERIES.databaseInfo) as Promise<DatabaseInfo[]>,
        'Database information fetched successfully',
      )

      const info = result[0]

      if (!info) {
        this.error('Failed to retrieve database information', { exit: 1 })
      }

      // Output results
      if (flags.format === 'table' && !flags.json) {
        // Enhanced table format with formatting
        const table = formatter.createKeyValueTable({
          'Database': info.database,
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

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
