import { Flags } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { ErrorMessages, InfoMessages } from '../../error-messages'
import { getTableSchema, listTables } from '../../supabase'

export default class DbSchema extends BaseCommand {
  static aliases = ['db:tables', 'schema']

  static description = 'Show database schema information'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project-ref',
    '<%= config.bin %> <%= command.id %> --project my-project-ref --table users',
    '<%= config.bin %> <%= command.id %> -p my-project-ref --table users --format table',
    '<%= config.bin %> <%= command.id %> -p my-project-ref --schema auth --format yaml',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    schema: Flags.string({
      char: 's',
      default: 'public',
      description: 'Database schema to query',
    }),
    table: Flags.string({
      char: 't',
      description: 'Show schema for specific table',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(DbSchema)

    try {
      // Get project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
      }

      if (flags.table) {
        // Get specific table schema
        if (!flags.quiet) {
          this.header(`Table Schema: ${flags.table}`)
        }

        const tableSchema = await this.spinner(
          `Fetching schema for table '${flags.table}'...`,
          async () => getTableSchema(projectRef, flags.table!),
          'Table schema fetched successfully',
        )

        this.output(tableSchema)
      } else {
        // List all tables in schema
        if (!flags.quiet) {
          this.header(`Database Schema: ${flags.schema}`)
        }

        const tables = await this.spinner(
          `Fetching tables from schema '${flags.schema}'...`,
          async () => listTables(projectRef, flags.schema),
          'Tables fetched successfully',
        )

        // Check for empty results
        if (tables.length === 0) {
          if (!flags.quiet) {
            this.warning(InfoMessages.NO_RESULTS(`tables in schema '${flags.schema}'`))
          }

          this.output([])
          process.exit(0)
        }

        this.output(tables)

        if (!flags.quiet) {
          this.divider()
          this.info(InfoMessages.RESULTS_COUNT(tables.length, 'table'))

          // Show summary statistics
          const totalSize = tables.reduce((sum, t) => sum + t.bytes, 0)
          const totalRows = tables.reduce((sum, t) => sum + t.live_rows_estimate, 0)
          const rlsEnabled = tables.filter((t) => t.rls_enabled).length

          this.info(
            `Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB | Rows: ${totalRows} | RLS enabled: ${rlsEnabled}/${tables.length}`,
          )
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
