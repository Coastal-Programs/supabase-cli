import { Args } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { ErrorMessages } from '../../error-messages'
import { getBackup, getProject } from '../../supabase'

export default class BackupGet extends BaseCommand {
  static args = {
    backupId: Args.string({
      description: 'The ID of the backup to retrieve',
      required: true,
    }),
  }

  static description = 'Get details for a specific backup'

  static examples = [
    '<%= config.bin %> <%= command.id %> backup-123 --project my-project',
    '<%= config.bin %> <%= command.id %> backup-123 --project my-project --format table',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(BackupGet)

    try {
      // Validate project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
      }

      if (!flags.quiet) {
        this.header('Backup Details')
      }

      // Verify project exists
      await this.spinner('Verifying project...', async () => getProject(projectRef))

      // Fetch backup details
      const backup = await this.spinner(
        `Fetching backup ${args.backupId}...`,
        async () => getBackup(projectRef, args.backupId),
        'Backup details fetched successfully',
      )

      // Output results
      this.output(backup)

      if (!flags.quiet) {
        this.divider()
        this.info(`Backup ID: ${backup.id}`)
        this.info(`Status: ${backup.status}`)
        this.info(`Size: ${backup.size_formatted}`)
        if (backup.created_at) {
          this.info(`Created: ${backup.created_at}`)
        }
        if (backup.expires_at) {
          this.info(`Expires: ${backup.expires_at}`)
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
