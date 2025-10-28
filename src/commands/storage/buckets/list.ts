import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { getStorageBuckets } from '../../../supabase'

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

        const publicCount = buckets.filter((b) => b.public).length
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
