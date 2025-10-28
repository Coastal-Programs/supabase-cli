import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, PaginationFlags, ProjectFlags } from '../../base-flags'
import { listFunctions } from '../../supabase'

export default class FunctionsList extends BaseCommand {
  static aliases = ['functions:ls', 'fn:list']

  static description = 'List all Edge Functions'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project',
    '<%= config.bin %> <%= command.id %> --format table',
    '<%= config.bin %> <%= command.id %> --limit 20',
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
        this.error(
          'Project reference required. Use --project flag or set SUPABASE_PROJECT_REF environment variable.',
          { exit: 1 },
        )
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

      // Output results
      if (!flags.quiet) {
        this.header('Edge Functions')
      }

      this.output(functions)

      if (!flags.quiet) {
        this.divider()
        this.info(`Total: ${functions.length} of ${allFunctions.length} functions`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
