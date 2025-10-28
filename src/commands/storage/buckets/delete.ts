import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../../base-flags'
import { deleteStorageBucket } from '../../../supabase'

export default class StorageBucketsDelete extends BaseCommand {
  static aliases = ['storage:buckets:remove', 'storage:buckets:rm']

  static args = {
    bucketId: Args.string({
      description: 'Bucket ID or name to delete',
      required: true,
    }),
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'Delete a storage bucket'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref my-bucket --yes',
    '<%= config.bin %> <%= command.id %> my-project-ref old-bucket',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    ...ConfirmationFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(StorageBucketsDelete)

    try {
      // Confirm before deleting
      const confirmed = await this.confirm(
        `Delete bucket "${args.bucketId}"? This action cannot be undone and will delete all files in the bucket.`,
        false,
      )

      if (!confirmed) {
        this.warning('Bucket deletion cancelled')
        process.exit(0)
      }

      // Delete bucket
      await this.spinner(
        `Deleting bucket ${args.bucketId}...`,
        async () => deleteStorageBucket(args.ref, args.bucketId),
        'Bucket deleted successfully',
      )

      // Output success
      if (!flags.quiet) {
        this.success(`Bucket "${args.bucketId}" deleted successfully`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
