import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { getAuthProviders } from '../../../supabase'

export default class AuthProvidersList extends BaseCommand {
  static aliases = ['auth:providers:ls']

  static args = {
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'List available auth providers'

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
    const { args, flags } = await this.parse(AuthProvidersList)

    try {
      // Fetch auth providers
      const providers = await this.spinner(
        'Fetching auth providers...',
        async () => getAuthProviders(args.ref),
        'Auth providers fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Auth Providers')
      }

      // Add status indicator
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
