import { Args } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../base-flags'
import { deleteBackup, getBackup, getProject } from '../../supabase'

export default class BackupDelete extends BaseCommand {
  static args = {
    backupId: Args.string({
      description: 'The ID of the backup to delete',
      required: true,
    }),
  }

  static description = 'Delete a backup (DESTRUCTIVE)'

  static examples = [
    '<%= config.bin %> <%= command.id %> backup-123 --project my-project',
    '<%= config.bin %> <%= command.id %> backup-123 --project my-project --yes',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ConfirmationFlags,
    ...ProjectFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(BackupDelete)

    try {
      // Validate project reference
      const projectRef = flags.project || flags['project-ref']
      if (!projectRef) {
        this.error(
          'Project reference is required. Use --project flag or set SUPABASE_PROJECT_ID.',
          {
            exit: 1,
          },
        )
      }

      // Verify project exists
      const project = await this.spinner('Verifying project...', async () => getProject(projectRef))

      // Fetch backup details
      const backup = await this.spinner('Fetching backup details...', async () =>
        getBackup(projectRef, args.backupId),
      )

      // Confirm deletion
      if (!flags.quiet) {
        this.header('Delete Backup')
        this.warning('This operation is DESTRUCTIVE and cannot be undone.')
        this.info(`Project: ${project.name} (${project.ref})`)
        this.info(`Backup ID: ${backup.id}`)
        this.info(`Created: ${backup.created_at}`)
        this.info(`Size: ${backup.size_formatted}`)
        this.divider()
      }

      const confirmed = await this.confirm(
        `Are you sure you want to delete backup ${args.backupId}? This cannot be undone.`,
        false,
      )

      if (!confirmed) {
        this.warning('Deletion cancelled')
        process.exit(0)
      }

      // Delete backup
      await this.spinner(
        'Deleting backup...',
        async () => deleteBackup(projectRef, args.backupId),
        'Backup deleted successfully',
      )

      if (!flags.quiet) {
        this.success(`Backup ${args.backupId} has been deleted`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
