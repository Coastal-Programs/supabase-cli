import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { getProject, listNetworkRestrictions } from '../../../supabase'

export default class SecurityRestrictionsList extends BaseCommand {
  static aliases = ['security:restrictions:ls', 'network:restrictions:list']

  static description = 'List network IP restrictions (IP whitelist)'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project',
    '<%= config.bin %> <%= command.id %> --project my-project --format table',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(SecurityRestrictionsList)

    try {
      // Validate project reference
      const projectRef = flags.project || flags['project-ref']
      if (!projectRef) {
        this.error(
          'Project reference is required. Use --project flag or set SUPABASE_PROJECT_ID.',
          {
            exit: 1,
          },
        )
      }

      // Verify project exists
      await this.spinner('Verifying project...', async () => getProject(projectRef))

      // Fetch restrictions
      const restrictions = await this.spinner(
        'Fetching network restrictions...',
        async () => listNetworkRestrictions(projectRef),
        'Network restrictions fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Network IP Restrictions')
      }

      if (restrictions.length === 0) {
        this.warning('No network restrictions found. All IPs are currently allowed.')
        process.exit(0)
      }

      this.output(restrictions)

      if (!flags.quiet) {
        this.divider()
        this.info(`Total: ${restrictions.length} restriction(s)`)
        this.info('Only IPs matching these CIDR blocks can access your project.')
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
