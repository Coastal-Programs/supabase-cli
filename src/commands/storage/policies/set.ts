import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../../base-flags'
import { ValidationError } from '../../../errors'
import { type StoragePolicy, setStoragePolicies } from '../../../supabase'

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
export default class StoragePoliciesSet extends BaseCommand {
  static aliases = ['storage:policies:update']

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

  static description = 'Set storage bucket policies'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref avatars --policy \'{"name":"Public Read","action":"SELECT","definition":"true"}\'',
    '<%= config.bin %> <%= command.id %> my-project-ref images --policy \'[{"name":"Auth Upload","action":"INSERT","definition":"auth.uid() IS NOT NULL"}]\' --yes',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    ...ConfirmationFlags,
    policy: Flags.string({
      description: 'Policy configuration (JSON string or array)',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(StoragePoliciesSet)

    try {
      // Parse policy JSON
      let policies: Partial<StoragePolicy>[]

      try {
        const parsed = JSON.parse(flags.policy)
        policies = Array.isArray(parsed) ? parsed : [parsed]
      } catch {
        throw new ValidationError('Invalid JSON format for --policy flag')
      }

      // Validate policy structure
      for (const policy of policies) {
        if (!policy.name || !policy.action || !policy.definition) {
          throw new ValidationError('Each policy must have name, action, and definition properties')
        }

        const validActions = ['SELECT', 'INSERT', 'UPDATE', 'DELETE']
        if (!validActions.includes(policy.action as string)) {
          throw new ValidationError(
            `Invalid action "${policy.action}". Must be one of: ${validActions.join(', ')}`,
          )
        }
      }

      // Confirm before applying
      const confirmed = await this.confirm(
        `Apply ${policies.length} polic${policies.length === 1 ? 'y' : 'ies'} to bucket "${args.bucketId}"?`,
        false,
      )

      if (!confirmed) {
        this.warning('Policy update cancelled')
        process.exit(0)
      }

      // Set policies
      const appliedPolicies = await this.spinner(
        `Setting policies for bucket ${args.bucketId}...`,
        async () => setStoragePolicies(args.ref, args.bucketId, policies),
        'Policies set successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header(`Storage Policies Applied: ${args.bucketId}`)
      }

      this.output(appliedPolicies)

      if (!flags.quiet) {
        this.divider()
        this.success(
          `${appliedPolicies.length} polic${appliedPolicies.length === 1 ? 'y' : 'ies'} applied successfully`,
        )
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
