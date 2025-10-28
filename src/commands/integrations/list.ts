import { Args } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { getAvailableIntegrations } from '../../supabase'

export default class IntegrationsList extends BaseCommand {
  static aliases = ['integrations:ls']

  static args = {
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'List available integrations'

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
    const { args, flags } = await this.parse(IntegrationsList)

    try {
      // Fetch available integrations
      const integrations = await this.spinner(
        'Fetching available integrations...',
        async () => getAvailableIntegrations(args.ref),
        'Integrations fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Available Integrations')
      }

      // Add status indicator
      const integrationsWithStatus = integrations.map((i) => ({
        ...i,
        status_indicator: i.enabled ? '✓' : i.available ? '○' : '✗',
      }))

      this.output(integrationsWithStatus)

      if (!flags.quiet) {
        this.divider()
        this.info(
          `Total: ${integrations.length} integration${integrations.length === 1 ? '' : 's'}`,
        )

        const enabled = integrations.filter((i) => i.enabled).length
        const available = integrations.filter((i) => i.available && !i.enabled).length
        const unavailable = integrations.filter((i) => !i.available).length

        if (enabled > 0) {
          this.success(`Enabled: ${enabled}`)
        }

        if (available > 0) {
          this.info(`Available: ${available}`)
        }

        if (unavailable > 0) {
          this.warning(`Unavailable: ${unavailable}`)
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
