import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../../base-flags'
import { deleteWebhook } from '../../../supabase'

export default class IntegrationsWebhooksDelete extends BaseCommand {
  static aliases = ['integrations:webhooks:remove', 'integrations:webhooks:rm', 'webhooks:delete']

  static args = {
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
    webhookId: Args.string({
      description: 'Webhook ID to delete',
      required: true,
    }),
  }

  static description = 'Delete a webhook'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref webhook-id-123 --yes',
    '<%= config.bin %> <%= command.id %> my-project-ref abc-def-ghi',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    ...ConfirmationFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(IntegrationsWebhooksDelete)

    try {
      // Confirm before deleting
      const confirmed = await this.confirm(
        `Delete webhook "${args.webhookId}"? This action cannot be undone.`,
        false,
      )

      if (!confirmed) {
        this.warning('Webhook deletion cancelled')
        process.exit(0)
      }

      // Delete webhook
      await this.spinner(
        `Deleting webhook ${args.webhookId}...`,
        async () => deleteWebhook(args.ref, args.webhookId),
        'Webhook deleted successfully',
      )

      // Output success
      if (!flags.quiet) {
        this.success(`Webhook "${args.webhookId}" deleted successfully`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
