import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { getStorageBucket } from '../../../supabase'

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
export default class StorageBucketsGet extends BaseCommand {
  static aliases = ['storage:buckets:show']

  static args = {
    bucketId: Args.string({
      description: 'Bucket ID or name',
      required: true,
    }),
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'Get details for a specific storage bucket'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref my-bucket',
    '<%= config.bin %> <%= command.id %> my-project-ref avatars --format table',
    '<%= config.bin %> <%= command.id %> my-project-ref images --format json',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(StorageBucketsGet)

    try {
      // Fetch bucket details
      const bucket = await this.spinner(
        `Fetching bucket ${args.bucketId}...`,
        async () => getStorageBucket(args.ref, args.bucketId),
        'Bucket details fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header(`Storage Bucket: ${bucket.name}`)
      }

      this.output(bucket)

      if (!flags.quiet) {
        this.divider()
        this.info(`ID: ${bucket.id}`)
        this.info(`Public: ${bucket.public ? 'Yes' : 'No'}`)
        this.info(`Created: ${new Date(bucket.created_at).toLocaleString()}`)

        if (bucket.file_size_limit) {
          const sizeMB = (bucket.file_size_limit / (1024 * 1024)).toFixed(2)
          this.info(`File Size Limit: ${sizeMB} MB`)
        }

        if (bucket.allowed_mime_types && bucket.allowed_mime_types.length > 0) {
          this.info(`Allowed MIME Types: ${bucket.allowed_mime_types.join(', ')}`)
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
