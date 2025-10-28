import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { getSSOProviders } from '../../../supabase'

export default class AuthSSOList extends BaseCommand {
  static aliases = ['auth:sso:ls']

  static args = {
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'List configured SSO providers'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref',
    '<%= config.bin %> <%= command.id %> my-project-ref --format table',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AuthSSOList)

    try {
      // Fetch SSO providers
      const providers = await this.spinner(
        'Fetching SSO providers...',
        async () => getSSOProviders(args.ref),
        'SSO providers fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('SSO Providers')
      }

      // Add status indicator to output
      const providersWithStatus = providers.map((p) => ({
        ...p,
        status_indicator: p.enabled ? '✓' : '✗',
      }))

      this.output(providersWithStatus)

      if (!flags.quiet) {
        this.divider()
        this.info(`Total: ${providers.length} provider${providers.length === 1 ? '' : 's'}`)

        const enabled = providers.filter((p) => p.enabled).length
        const disabled = providers.length - enabled

        if (enabled > 0) {
          this.success(`Enabled: ${enabled}`)
        }

        if (disabled > 0) {
          this.info(`Disabled: ${disabled}`)
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
