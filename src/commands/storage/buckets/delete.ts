import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../../base-flags'
import { deleteStorageBucket } from '../../../supabase'

/**
 * Storage Authentication Limitation
 *
 * The Supabase Storage API (`https://{ref}.supabase.co/storage/v1`) requires
 * a service_role key for authentication, but this CLI uses the Management API
 * (`https://api.supabase.com/v1`) which uses Personal Access Token (PAT).
 *
 * These are DIFFERENT authentication mechanisms:
 * - Management API (this CLI): Uses PAT from https://supabase.com/dashboard/account/tokens
 * - Storage API: Requires service_role key from project settings
 *
 * Current Implementation: This command uses the Management API endpoint which has
 * limited storage bucket information. For full storage operations (file uploads,
 * advanced RLS policies), use the Storage API directly via the Supabase SDK.
 *
 * See: docs/STORAGE_AUTHENTICATION_LIMITATION.md
 */
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
