import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, PaginationFlags, ProjectFlags } from '../../base-flags'
import { ErrorMessages, InfoMessages } from '../../error-messages'
import { listFunctions } from '../../supabase'

export default class FunctionsList extends BaseCommand {
  static aliases = ['functions:ls', 'fn:list']

  static description = 'List all Edge Functions'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project',
    '<%= config.bin %> <%= command.id %> --project my-project --format table',
    '<%= config.bin %> <%= command.id %> -p my-project --limit 20',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...PaginationFlags,
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(FunctionsList)

    try {
      // Get project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
      }

      if (!flags.quiet) {
        this.header('Edge Functions')
      }

      // Fetch all functions from Supabase API
      const allFunctions = await this.spinner(
        'Fetching Edge Functions...',
        async () => listFunctions(projectRef),
        'Edge Functions fetched successfully',
      )

      // Apply pagination
      const offset = flags.offset || 0
      const limit = flags.limit || 100
      const functions = allFunctions.slice(offset, offset + limit)

      // Check for empty results
      if (functions.length === 0) {
        if (!flags.quiet) {
          this.warning(InfoMessages.NO_RESULTS('Edge Functions'))
          this.info('Deploy a function with: supabase-cli functions:deploy')
        }

        this.output([])
        process.exit(0)
      }

      // Output results
      this.output(functions)

      if (!flags.quiet) {
        this.divider()
        this.info(InfoMessages.RESULTS_COUNT(functions.length, 'function'))
        if (allFunctions.length > functions.length) {
          this.info(`Showing ${offset + 1}-${offset + functions.length} of ${allFunctions.length} total`)
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
