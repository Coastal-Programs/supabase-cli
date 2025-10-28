import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../../base-flags'
import { disableSSOProvider } from '../../../supabase'

export default class AuthSSODisable extends BaseCommand {
  static aliases = ['auth:sso:deactivate']

  static args = {
    providerId: Args.string({
      description: 'SSO provider ID to disable',
      required: true,
    }),
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'Disable SSO provider'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref okta --yes',
    '<%= config.bin %> <%= command.id %> my-project-ref azure',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    ...ConfirmationFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AuthSSODisable)

    try {
      // Confirm before disabling
      const confirmed = await this.confirm(
        `Disable SSO provider "${args.providerId}"? Users will no longer be able to sign in using this provider.`,
        false,
      )

      if (!confirmed) {
        this.warning('SSO provider disable cancelled')
        process.exit(0)
      }

      // Disable provider
      await this.spinner(
        `Disabling SSO provider ${args.providerId}...`,
        async () => disableSSOProvider(args.ref, args.providerId),
        'SSO provider disabled successfully',
      )

      // Output success
      if (!flags.quiet) {
        this.success(`SSO provider "${args.providerId}" disabled successfully`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
