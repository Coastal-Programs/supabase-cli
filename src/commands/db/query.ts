import { Args } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { ErrorMessages, InfoMessages, SuccessMessages } from '../../error-messages'
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
    '<%= config.bin %> <%= command.id %> "SELECT * FROM users LIMIT 10" --project my-project-ref',
    '<%= config.bin %> <%= command.id %> "SELECT COUNT(*) FROM orders" --project my-project-ref --format table',
    '<%= config.bin %> <%= command.id %> "SHOW TABLES" -p my-project-ref --format yaml',
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
        this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
      }

      if (!flags.quiet) {
        this.header('Execute SQL Query')
        this.info(`Project: ${projectRef}`)
        this.divider()
      }

      // Execute query
      const results = await this.spinner(
        'Executing query...',
        async () => queryDatabase(projectRef, args.sql),
        SuccessMessages.QUERY_EXECUTED(),
      )

      // Output results
      if (Array.isArray(results) && results.length > 0) {
        this.output(results)

        if (!flags.quiet) {
          this.divider()
          this.info(InfoMessages.RESULTS_COUNT(results.length, 'row'))
        }
      } else if (Array.isArray(results) && results.length === 0) {
        if (!flags.quiet) {
          this.warning(InfoMessages.NO_RESULTS('rows'))
        }

        this.output([])
      } else {
        this.output(results)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
