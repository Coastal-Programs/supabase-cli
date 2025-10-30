import { Args } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { ErrorMessages, InfoMessages, WarningMessages } from '../../error-messages'
import { getBackup, getProject, restoreFromBackup } from '../../supabase'

export default class BackupRestore extends BaseCommand {
  static args = {
    backupId: Args.string({
      description: 'The ID of the backup to restore from',
      required: true,
    }),
  }

  static description = 'Restore a project from a backup (destructive operation)'

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
    const { args, flags } = await this.parse(BackupRestore)

    try {
      // Validate project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
      }

      if (!flags.quiet) {
        this.header('Restore from Backup')
      }

      // Verify project exists
      await this.spinner('Verifying project...', async () => getProject(projectRef))

      // Verify backup exists
      const backup = await this.spinner(`Verifying backup ${args.backupId}...`, async () =>
        getBackup(projectRef, args.backupId),
      )

      // Verify backup is completed
      if (backup.status !== 'completed') {
        this.error(
          `Cannot restore from backup with status: ${backup.status}. Only completed backups can be restored.`,
          { exit: 1 },
        )
      }

      // Confirm restoration
      if (!flags.quiet) {
        this.warning(WarningMessages.DESTRUCTIVE_OPERATION())
        this.warning('This will replace ALL current data with the backup data.')
        this.info(`Backup ID: ${backup.id}`)
        this.info(`Created: ${backup.created_at}`)
        this.info(`Size: ${backup.size_formatted}`)
        if (backup.description) {
          this.info(`Description: ${backup.description}`)
        }
      }

      const confirmed = await this.confirm(
        `Are you sure you want to restore from backup ${args.backupId}? This will overwrite all current data.`,
        false,
      )

      if (!confirmed) {
        if (!flags.quiet) {
          this.warning('Operation cancelled')
        }

        process.exit(0)
      }

      // Restore from backup
      const restoreStatus = await this.spinner(
        'Starting restore operation...',
        async () => restoreFromBackup(projectRef, args.backupId),
        'Restore operation initiated',
      )

      // Output results
      this.output(restoreStatus)

      if (!flags.quiet) {
        this.divider()
        this.success(InfoMessages.CREATED('Restore operation', restoreStatus.id))
        this.info(`Status: ${restoreStatus.status}`)
        this.info(`Progress: ${restoreStatus.progress}%`)
        this.info(`Started: ${restoreStatus.started_at}`)
        this.warning(
          'Restore is in progress. Your project may be unavailable during the restore operation.',
        )
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
