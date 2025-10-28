import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { getProject, listSecurityPolicies } from '../../../supabase'

export default class SecurityPoliciesList extends BaseCommand {
  static aliases = ['security:policies:ls']

  static description = 'List security policies for a project'

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
    const { flags } = await this.parse(SecurityPoliciesList)

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

      // Fetch policies
      const policies = await this.spinner(
        'Fetching security policies...',
        async () => listSecurityPolicies(projectRef),
        'Security policies fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Security Policies')
      }

      if (policies.length === 0) {
        this.warning('No security policies found')
        process.exit(0)
      }

      this.output(policies)

      if (!flags.quiet) {
        this.divider()
        this.info(`Total: ${policies.length} policy/policies`)

        // Show summary
        const enabled = policies.filter((p) => p.enabled).length
        const disabled = policies.filter((p) => !p.enabled).length

        if (enabled > 0) this.success(`Enabled: ${enabled}`)
        if (disabled > 0) this.warning(`Disabled: ${disabled}`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
