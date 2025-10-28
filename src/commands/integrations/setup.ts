import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../base-flags'
import { ValidationError } from '../../errors'
import { setupIntegration } from '../../supabase'

export default class IntegrationsSetup extends BaseCommand {
  static aliases = ['integrations:enable']

  static args = {
    integrationName: Args.string({
      description: 'Integration name (e.g., slack, zapier, vercel)',
      required: true,
    }),
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'Setup a third-party integration'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref slack --config \'{"webhook_url":"https://hooks.slack.com/..."}\'',
    '<%= config.bin %> <%= command.id %> my-project-ref zapier --config \'{"api_key":"abc123"}\' --yes',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    ...ConfirmationFlags,
    config: Flags.string({
      description: 'Integration configuration (JSON string)',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(IntegrationsSetup)

    try {
      // Parse config JSON
      let config: Record<string, unknown>

      try {
        config = JSON.parse(flags.config)
      } catch {
        throw new ValidationError('Invalid JSON format for --config flag')
      }

      // Validate config is an object
      if (typeof config !== 'object' || config === null || Array.isArray(config)) {
        throw new ValidationError('Config must be a valid JSON object')
      }

      // Confirm before setup
      const confirmed = await this.confirm(
        `Setup integration "${args.integrationName}" with the provided configuration?`,
        false,
      )

      if (!confirmed) {
        this.warning('Integration setup cancelled')
        process.exit(0)
      }

      // Setup integration
      const integration = await this.spinner(
        `Setting up ${args.integrationName} integration...`,
        async () => setupIntegration(args.ref, args.integrationName, config),
        'Integration setup successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header(`Integration Setup: ${integration.name}`)
      }

      this.output(integration)

      if (!flags.quiet) {
        this.divider()
        this.success(`Integration "${integration.name}" setup successfully`)
        this.info(`Type: ${integration.type}`)
        this.info(`Enabled: ${integration.enabled ? 'Yes' : 'No'}`)

        if (integration.setup_url) {
          this.info(`Setup URL: ${integration.setup_url}`)
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
