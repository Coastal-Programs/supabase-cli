import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { type StorageBucket, getStorageBuckets } from '../../../supabase'

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
export default class StorageBucketsList extends BaseCommand {
  static aliases = ['storage:buckets:ls']

  static args = {
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'List all storage buckets for a project'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref',
    '<%= config.bin %> <%= command.id %> my-project-ref --format table',
    '<%= config.bin %> <%= command.id %> my-project-ref --format json',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(StorageBucketsList)

    try {
      // Fetch storage buckets
      const buckets = await this.spinner(
        'Fetching storage buckets...',
        async () => getStorageBuckets(args.ref),
        'Storage buckets fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Storage Buckets')
      }

      this.output(buckets)

      if (!flags.quiet) {
        this.divider()
        this.info(`Total: ${buckets.length} bucket${buckets.length === 1 ? '' : 's'}`)

        const publicCount = buckets.filter((b: StorageBucket) => b.public).length
        const privateCount = buckets.length - publicCount

        if (publicCount > 0) {
          this.info(`Public: ${publicCount}`)
        }

        if (privateCount > 0) {
          this.info(`Private: ${privateCount}`)
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
