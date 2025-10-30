import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { type StoragePolicy, getStoragePolicies } from '../../../supabase'

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
export default class StoragePoliciesList extends BaseCommand {
  static aliases = ['storage:policies:ls']

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

  static description = 'List storage bucket policies'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref avatars',
    '<%= config.bin %> <%= command.id %> my-project-ref images --format table',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(StoragePoliciesList)

    try {
      // Fetch bucket policies
      const policies = await this.spinner(
        `Fetching policies for bucket ${args.bucketId}...`,
        async () => getStoragePolicies(args.ref, args.bucketId),
        'Policies fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header(`Storage Policies: ${args.bucketId}`)
      }

      this.output(policies)

      if (!flags.quiet) {
        this.divider()
        this.info(`Total: ${policies.length} polic${policies.length === 1 ? 'y' : 'ies'}`)

        const actionCounts = policies.reduce(
          (acc: Record<string, number>, p: StoragePolicy) => {
            acc[p.action] = (acc[p.action] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )

        for (const [action, count] of Object.entries(actionCounts)) {
          this.info(`${action}: ${count}`)
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
