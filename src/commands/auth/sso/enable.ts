import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../../base-flags'
import { ValidationError } from '../../../errors'
import { enableSSOProvider } from '../../../supabase'

export default class AuthSSOEnable extends BaseCommand {
  static aliases = ['auth:sso:activate']

  static args = {
    providerId: Args.string({
      description: 'SSO provider ID (e.g., okta, azure, google-workspace)',
      required: true,
    }),
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'Enable SSO provider'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref okta --config \'{"domain":"company.okta.com","clientId":"abc123"}\'',
    '<%= config.bin %> <%= command.id %> my-project-ref azure --config \'{"tenantId":"xyz","clientId":"123"}\' --yes',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    ...ConfirmationFlags,
    config: Flags.string({
      description: 'Provider configuration (JSON string)',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AuthSSOEnable)

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

      // Confirm before enabling
      const confirmed = await this.confirm(
        `Enable SSO provider "${args.providerId}" with the provided configuration?`,
        false,
      )

      if (!confirmed) {
        this.warning('SSO provider enable cancelled')
        process.exit(0)
      }

      // Enable provider
      const provider = await this.spinner(
        `Enabling SSO provider ${args.providerId}...`,
        async () => enableSSOProvider(args.ref, args.providerId, config),
        'SSO provider enabled successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header(`SSO Provider Enabled: ${provider.name}`)
      }

      this.output(provider)

      if (!flags.quiet) {
        this.divider()
        this.success(`SSO provider "${provider.name}" enabled successfully`)
        this.info(`Provider: ${provider.provider}`)
        this.info(`Status: ${provider.enabled ? 'Enabled' : 'Disabled'}`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
