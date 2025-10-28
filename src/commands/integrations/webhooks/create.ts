import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../../base-flags'
import { ValidationError } from '../../../errors'
import { createWebhook } from '../../../supabase'

export default class IntegrationsWebhooksCreate extends BaseCommand {
  static aliases = ['integrations:webhooks:add', 'webhooks:create']

  static args = {
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'Create a new webhook'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref --url https://example.com/webhook --events db.insert,db.update',
    '<%= config.bin %> <%= command.id %> my-project-ref --url https://api.example.com/hook --events auth.user.created --name "User Created Hook" --yes',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    ...ConfirmationFlags,
    events: Flags.string({
      description: 'Comma-separated list of events',
      required: true,
    }),
    name: Flags.string({
      description: 'Webhook name',
    }),
    url: Flags.string({
      description: 'Webhook URL',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(IntegrationsWebhooksCreate)

    try {
      // Validate URL format
      try {
        new URL(flags.url)
      } catch {
        throw new ValidationError(`Invalid URL format: ${flags.url}`)
      }

      // Parse events
      const events = flags.events
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)

      if (events.length === 0) {
        throw new ValidationError('At least one event is required')
      }

      // Validate event names
      const validEvents = [
        'db.insert',
        'db.update',
        'db.delete',
        'auth.user.created',
        'auth.user.deleted',
        'auth.user.updated',
        'storage.object.created',
        'storage.object.deleted',
        'storage.object.updated',
      ]

      for (const event of events) {
        if (!validEvents.includes(event)) {
          throw new ValidationError(
            `Invalid event "${event}". Valid events: ${validEvents.join(', ')}`,
          )
        }
      }

      // Confirm before creating
      const confirmed = await this.confirm(
        `Create webhook for ${events.length} event${events.length === 1 ? '' : 's'} pointing to ${flags.url}?`,
        false,
      )

      if (!confirmed) {
        this.warning('Webhook creation cancelled')
        process.exit(0)
      }

      // Create webhook
      const webhook = await this.spinner(
        'Creating webhook...',
        async () => createWebhook(args.ref, flags.url, events, flags.name),
        'Webhook created successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header(`Webhook Created: ${webhook.name}`)
      }

      this.output(webhook)

      if (!flags.quiet) {
        this.divider()
        this.success(`Webhook "${webhook.name}" created successfully`)
        this.info(`ID: ${webhook.id}`)
        this.info(`URL: ${webhook.url}`)
        this.info(`Events: ${webhook.events.join(', ')}`)
        this.info(`Status: ${webhook.status}`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
