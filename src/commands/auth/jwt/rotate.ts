import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../../base-flags'
import { rotateJWTKey } from '../../../supabase'

export default class AuthJWTRotate extends BaseCommand {
  static aliases = ['auth:jwt:regenerate']

  static args = {
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'Rotate JWT signing key'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref --yes',
    '<%= config.bin %> <%= command.id %> my-project-ref',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    ...ConfirmationFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AuthJWTRotate)

    try {
      // Confirm before rotating
      const confirmed = await this.confirm(
        'Rotate JWT signing key? This will invalidate all existing tokens and users will need to sign in again.',
        false,
      )

      if (!confirmed) {
        this.warning('JWT key rotation cancelled')
        process.exit(0)
      }

      // Rotate key
      const newKey = await this.spinner(
        'Rotating JWT signing key...',
        async () => rotateJWTKey(args.ref),
        'JWT key rotated successfully',
      )

      // Mask the key for security
      const maskedKey = {
        ...newKey,
        key: newKey.key.slice(0, 10) + '...' + newKey.key.slice(-10),
      }

      // Output results
      if (!flags.quiet) {
        this.header('New JWT Signing Key')
      }

      this.output(maskedKey)

      if (!flags.quiet) {
        this.divider()
        this.success('JWT signing key rotated successfully')
        this.info(`New Key ID: ${newKey.key_id}`)
        this.info(`Algorithm: ${newKey.algorithm}`)
        this.warning('All existing user sessions have been invalidated')
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
