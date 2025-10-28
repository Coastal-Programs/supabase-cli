import { Args } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { queryDatabase } from '../../supabase'

export default class DbQuery extends BaseCommand {
  static aliases = ['db:sql', 'query']

  static args = {
    sql: Args.string({
      description: 'SQL query to execute',
      required: true,
    }),
  }

  static description = 'Execute SQL query against database'

  static examples = [
    '<%= config.bin %> <%= command.id %> "SELECT * FROM users LIMIT 10"',
    '<%= config.bin %> <%= command.id %> "SELECT * FROM users" --project my-project-ref',
    '<%= config.bin %> <%= command.id %> "SELECT COUNT(*) FROM orders" --format table',
    '<%= config.bin %> <%= command.id %> "SHOW TABLES" --format yaml',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DbQuery)

    try {
      // Get project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(
          'Project reference required. Use --project flag or set SUPABASE_PROJECT_REF environment variable.',
          { exit: 1 },
        )
      }

      // Execute query
      const results = await this.spinner(
        'Executing query...',
        async () => queryDatabase(projectRef, args.sql),
        'Query executed successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Query Results')
      }

      if (Array.isArray(results) && results.length > 0) {
        this.output(results)

        if (!flags.quiet) {
          this.divider()
          this.info(`Returned ${results.length} row(s)`)
        }
      } else if (Array.isArray(results) && results.length === 0) {
        if (flags.quiet) {
          this.output([])
        } else {
          this.info('Query returned no results')
        }
      } else {
        this.output(results)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
