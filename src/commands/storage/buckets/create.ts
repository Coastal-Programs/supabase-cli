import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../../base-flags'
import { ValidationError } from '../../../errors'
import { createStorageBucket } from '../../../supabase'

export default class StorageBucketsCreate extends BaseCommand {
  static aliases = ['storage:buckets:add']

  static args = {
    name: Args.string({
      description: 'Bucket name',
      required: true,
    }),
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'Create a new storage bucket'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref avatars',
    '<%= config.bin %> <%= command.id %> my-project-ref images --public',
    '<%= config.bin %> <%= command.id %> my-project-ref files --public --yes',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    ...ConfirmationFlags,
    public: Flags.boolean({
      default: false,
      description: 'Make the bucket publicly accessible',
    }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(StorageBucketsCreate)

    try {
      // Validate bucket name
      if (!args.name || args.name.length < 3) {
        throw new ValidationError('Bucket name must be at least 3 characters long')
      }

      if (!/^[\da-z][\da-z-]*[\da-z]$/.test(args.name)) {
        throw new ValidationError(
          'Bucket name must start and end with a letter or number, and can only contain lowercase letters, numbers, and hyphens',
        )
      }

      // Confirm before creating
      const confirmed = await this.confirm(
        `Create ${flags.public ? 'public' : 'private'} bucket "${args.name}"?`,
        false,
      )

      if (!confirmed) {
        this.warning('Bucket creation cancelled')
        process.exit(0)
      }

      // Create bucket
      const bucket = await this.spinner(
        `Creating bucket ${args.name}...`,
        async () => createStorageBucket(args.ref, args.name, flags.public),
        'Bucket created successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header(`Storage Bucket Created: ${bucket.name}`)
      }

      this.output(bucket)

      if (!flags.quiet) {
        this.divider()
        this.success(`Bucket "${bucket.name}" created successfully`)
        this.info(`ID: ${bucket.id}`)
        this.info(`Public: ${bucket.public ? 'Yes' : 'No'}`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
