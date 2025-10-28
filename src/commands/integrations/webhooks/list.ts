import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { getWebhooks } from '../../../supabase'

export default class IntegrationsWebhooksList extends BaseCommand {
  static aliases = ['integrations:webhooks:ls', 'webhooks:list']

  static args = {
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'List all configured webhooks'

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
    const { args, flags } = await this.parse(IntegrationsWebhooksList)

    try {
      // Fetch webhooks
      const webhooks = await this.spinner(
        'Fetching webhooks...',
        async () => getWebhooks(args.ref),
        'Webhooks fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Webhooks')
      }

      // Add status indicator
      const webhooksWithStatus = webhooks.map((w) => ({
        ...w,
        status_indicator: w.status === 'active' ? '✓' : w.status === 'failed' ? '✗' : '-',
      }))

      this.output(webhooksWithStatus)

      if (!flags.quiet) {
        this.divider()
        this.info(`Total: ${webhooks.length} webhook${webhooks.length === 1 ? '' : 's'}`)

        const activeCount = webhooks.filter((w) => w.status === 'active').length
        const failedCount = webhooks.filter((w) => w.status === 'failed').length
        const inactiveCount = webhooks.filter((w) => w.status === 'inactive').length

        if (activeCount > 0) {
          this.success(`Active: ${activeCount}`)
        }

        if (failedCount > 0) {
          this.warning(`Failed: ${failedCount}`)
        }

        if (inactiveCount > 0) {
          this.info(`Inactive: ${inactiveCount}`)
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
