import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { getProject, listNetworkRestrictions } from '../../../supabase'

export default class SecurityRestrictionsList extends BaseCommand {
  static description = 'List all IP restrictions for a project'

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

      // Fetch network restrictions
      const restrictions = await this.spinner(
        'Fetching network restrictions...',
        async () => listNetworkRestrictions(projectRef),
        'Network restrictions fetched',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Network Restrictions (IP Whitelist)')
        this.divider()
      }

      if (restrictions.length === 0) {
        if (flags.quiet) {
          this.output([])
        } else {
          this.warning('No network restrictions configured.')
          this.info('Your project is accessible from any IP address.')
        }
      } else {
        if (!flags.quiet) {
          this.success(`Found ${restrictions.length} network restriction(s)`)
          this.divider()
        }

        this.output(restrictions)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
