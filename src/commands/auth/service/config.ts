import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../../base-flags'
import { ValidationError } from '../../../errors'
import { setAuthServiceConfig } from '../../../supabase'

export default class AuthServiceConfig extends BaseCommand {
  static aliases = ['auth:service:set']

  static args = {
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'Configure auth service settings'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref --setting "enable_signup=true"',
    '<%= config.bin %> <%= command.id %> my-project-ref --setting "jwt_exp=3600" --setting "site_url=https://example.com" --yes',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    ...ConfirmationFlags,
    setting: Flags.string({
      description: 'Setting in key=value format (can be specified multiple times)',
      multiple: true,
      required: true,
    }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AuthServiceConfig)

    try {
      // Parse settings from key=value format
      const settings: Record<string, unknown> = {}

      for (const settingStr of flags.setting) {
        const [key, ...valueParts] = settingStr.split('=')
        if (!key || valueParts.length === 0) {
          throw new ValidationError(`Invalid setting format "${settingStr}". Expected "key=value"`)
        }

        const value = valueParts.join('=')

        // Try to parse as boolean or number
        let parsedValue: boolean | number | string = value

        if (value === 'true') {
          parsedValue = true
        } else if (value === 'false') {
          parsedValue = false
        } else if (!Number.isNaN(Number(value))) {
          parsedValue = Number(value)
        }

        settings[key] = parsedValue
      }

      // Validate setting keys
      const validKeys = [
        'enable_signup',
        'disable_signup',
        'enable_anonymous_sign_ins',
        'enable_confirmations',
        'auto_confirm',
        'external_email_enabled',
        'external_phone_enabled',
        'jwt_exp',
        'password_min_length',
        'password_required_characters',
        'site_url',
        'refresh_token_rotation_enabled',
        'mailer_autoconfirm',
        'mailer_secure_email_change_enabled',
        'security_refresh_token_reuse_interval',
      ]

      for (const key of Object.keys(settings)) {
        if (!validKeys.includes(key)) {
          throw new ValidationError(
            `Invalid setting key "${key}". Valid keys: ${validKeys.join(', ')}`,
          )
        }
      }

      // Confirm before applying
      const confirmed = await this.confirm(
        `Apply ${Object.keys(settings).length} setting${Object.keys(settings).length === 1 ? '' : 's'} to auth service?`,
        false,
      )

      if (!confirmed) {
        this.warning('Configuration update cancelled')
        process.exit(0)
      }

      // Set service config
      const config = await this.spinner(
        'Configuring auth service...',
        async () => setAuthServiceConfig(args.ref, settings),
        'Auth service configured successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Auth Service Configuration')
      }

      this.output(config)

      if (!flags.quiet) {
        this.divider()
        this.success('Auth service configured successfully')

        for (const [key, value] of Object.entries(settings)) {
          this.info(`${key}: ${value}`)
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
