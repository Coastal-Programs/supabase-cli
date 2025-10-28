import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { getJWTKey } from '../../../supabase'

export default class AuthJWTGet extends BaseCommand {
  static aliases = ['auth:jwt:show']

  static args = {
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'Get current JWT signing key'

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
    const { args, flags } = await this.parse(AuthJWTGet)

    try {
      // Fetch JWT key
      const jwtKey = await this.spinner(
        'Fetching JWT signing key...',
        async () => getJWTKey(args.ref),
        'JWT key fetched successfully',
      )

      // Mask the key for security
      const maskedKey = {
        ...jwtKey,
        key: jwtKey.key.slice(0, 10) + '...' + jwtKey.key.slice(-10),
      }

      // Output results
      if (!flags.quiet) {
        this.header('JWT Signing Key')
      }

      this.output(maskedKey)

      if (!flags.quiet) {
        this.divider()
        this.info(`Key ID: ${jwtKey.key_id}`)
        this.info(`Algorithm: ${jwtKey.algorithm}`)
        this.info(`Created: ${new Date(jwtKey.created_at).toLocaleString()}`)
        this.warning('Key is masked for security. Use the full response for actual key value.')
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
