import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { getProject, listSecurityPolicies } from '../../../supabase'

export default class SecurityPoliciesList extends BaseCommand {
  static description = 'List all security policies for a project'

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

      // Fetch security policies
      const policies = await this.spinner(
        'Fetching security policies...',
        async () => listSecurityPolicies(projectRef),
        'Security policies fetched',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Security Policies')
        this.divider()
      }

      if (policies.length === 0) {
        if (flags.quiet) {
          this.output([])
        } else {
          this.warning('No security policies configured.')
        }
      } else {
        if (!flags.quiet) {
          this.success(
            `Found ${policies.length} security polic${policies.length === 1 ? 'y' : 'ies'}`,
          )
          this.divider()

          // Group by enabled status
          const enabled = policies.filter((p) => p.enabled)
          const disabled = policies.filter((p) => !p.enabled)

          if (enabled.length > 0) {
            this.success(`\nENABLED (${enabled.length}):`)
            for (const policy of enabled) {
              this.log(`  - ${policy.name} (${policy.policy_type})`)
              if (policy.description) {
                this.log(`    ${policy.description}`)
              }
            }
          }

          if (disabled.length > 0) {
            this.warning(`\nDISABLED (${disabled.length}):`)
            for (const policy of disabled) {
              this.log(`  - ${policy.name} (${policy.policy_type})`)
              if (policy.description) {
                this.log(`    ${policy.description}`)
              }
            }
          }
        }

        // Always output full data for programmatic use
        if (flags.quiet || flags.format) {
          this.output(policies)
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
