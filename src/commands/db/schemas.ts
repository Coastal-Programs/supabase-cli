import chalk from 'chalk'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { queryDatabase } from '../../supabase'
import { formatter } from '../../utils/formatters'
import { SQL_QUERIES } from '../../utils/sql-queries'

interface SchemaResult {
  schema_name: string
  schema_owner: string
}

export default class DbSchemas extends BaseCommand {
  static aliases = ['db:list-schemas', 'schemas']

  static description = 'List all database schemas'

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
    const { flags } = await this.parse(DbSchemas)

    try {
      // Get project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(
          'Project reference required. Use --project flag or set SUPABASE_PROJECT_REF environment variable.',
          { exit: 1 },
        )
      }

      // Fetch schemas using SQL query
      const schemas = await this.spinner(
        'Fetching database schemas...',
        async () => queryDatabase(projectRef, SQL_QUERIES.listSchemas) as Promise<SchemaResult[]>,
        'Schemas fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Database Schemas')
      }

      if (schemas.length === 0) {
        if (flags.quiet) {
          this.output([])
        } else {
          this.info('No schemas found')
        }
      } else {
        if (flags.format === 'table' && !flags.json) {
          // Enhanced table format with formatting
          const table = formatter.createTable(
            ['Schema Name', 'Owner'],
            schemas.map((schema) => [
              chalk.bold(schema.schema_name),
              formatter.formatOwner(schema.schema_owner),
            ]),
          )
          this.log(table)
        } else {
          this.output(schemas)
        }

        if (!flags.quiet) {
          this.divider()
          this.info(`Total: ${schemas.length} schema(s)`)
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
