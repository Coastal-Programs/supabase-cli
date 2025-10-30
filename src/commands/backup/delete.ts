import { Args } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { ErrorMessages, InfoMessages, WarningMessages } from '../../error-messages'
import { deleteBackup, getBackup, getProject } from '../../supabase'

export default class BackupDelete extends BaseCommand {
  static args = {
    backupId: Args.string({
      description: 'The ID of the backup to delete',
      required: true,
    }),
  }

  static description = 'Delete a backup (destructive operation)'

  static examples = [
    '<%= config.bin %> <%= command.id %> backup-123 --project my-project',
    '<%= config.bin %> <%= command.id %> backup-123 --project my-project --yes',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(BackupDelete)

    try {
      // Validate project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
      }

      if (!flags.quiet) {
        this.header('Delete Backup')
      }

      // Verify project exists
      await this.spinner('Verifying project...', async () => getProject(projectRef))

      // Verify backup exists
      const backup = await this.spinner(`Verifying backup ${args.backupId}...`, async () =>
        getBackup(projectRef, args.backupId),
      )

      // Confirm deletion
      if (!flags.quiet) {
        this.warning(WarningMessages.DESTRUCTIVE_OPERATION())
        this.info(`Backup ID: ${backup.id}`)
        this.info(`Created: ${backup.created_at}`)
        this.info(`Size: ${backup.size_formatted}`)
        if (backup.description) {
          this.info(`Description: ${backup.description}`)
        }
      }

      const confirmed = await this.confirm(
        `Are you sure you want to delete backup ${args.backupId}?`,
        false,
      )

      if (!confirmed) {
        if (!flags.quiet) {
          this.warning('Operation cancelled')
        }

        process.exit(0)
      }

      // Delete backup
      await this.spinner(
        'Deleting backup...',
        async () => deleteBackup(projectRef, args.backupId),
        'Backup deleted successfully',
      )

      if (!flags.quiet) {
        this.success(InfoMessages.DELETED('Backup', args.backupId))
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
