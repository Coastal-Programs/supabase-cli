import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../../base-flags'
import { ValidationError } from '../../../errors'
import { setAuthProviderConfig } from '../../../supabase'

export default class AuthProvidersConfig extends BaseCommand {
  static aliases = ['auth:providers:set']

  static args = {
    provider: Args.string({
      description: 'Provider name (e.g., google, github, discord)',
      required: true,
    }),
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'Configure auth provider settings'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref google --key client_id --value abc123',
    '<%= config.bin %> <%= command.id %> my-project-ref github --key client_secret --value xyz789 --yes',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    ...ConfirmationFlags,
    key: Flags.string({
      description: 'Configuration key (e.g., client_id, client_secret)',
      required: true,
    }),
    value: Flags.string({
      description: 'Configuration value',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AuthProvidersConfig)

    try {
      // Validate key name
      const validKeys = ['client_id', 'client_secret', 'redirect_uri', 'enabled']
      if (!validKeys.includes(flags.key)) {
        throw new ValidationError(
          `Invalid config key "${flags.key}". Valid keys: ${validKeys.join(', ')}`,
        )
      }

      // Confirm before setting secret values
      const isSecret = flags.key.includes('secret')
      if (isSecret) {
        const confirmed = await this.confirm(
          `Set ${flags.key} for "${args.provider}" provider? This will update sensitive credentials.`,
          false,
        )

        if (!confirmed) {
          this.warning('Configuration update cancelled')
          process.exit(0)
        }
      }

      // Set provider config
      const config = await this.spinner(
        `Configuring ${args.provider} provider...`,
        async () => setAuthProviderConfig(args.ref, args.provider, flags.key, flags.value),
        'Provider configured successfully',
      )

      // Mask secret values in output
      const safeConfig = { ...config }
      if (safeConfig.client_secret) {
        safeConfig.client_secret = '***MASKED***'
      }

      // Output results
      if (!flags.quiet) {
        this.header(`Auth Provider Configured: ${args.provider}`)
      }

      this.output(safeConfig)

      if (!flags.quiet) {
        this.divider()
        this.success(`Provider "${args.provider}" configured successfully`)
        this.info(`${flags.key}: ${isSecret ? '***MASKED***' : flags.value}`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
