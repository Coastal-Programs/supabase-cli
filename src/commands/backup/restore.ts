import { Args } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../base-flags'
import { getBackup, getProject, restoreFromBackup } from '../../supabase'

export default class BackupRestore extends BaseCommand {
  static args = {
    backupId: Args.string({
      description: 'The ID of the backup to restore from',
      required: true,
    }),
  }

  static description =
    'Restore a project from a backup (DESTRUCTIVE - requires strong confirmation)'

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
    const { args, flags } = await this.parse(BackupRestore)

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

      // Validate backup status
      if (backup.status !== 'completed') {
        this.error(
          `Cannot restore from backup with status '${backup.status}'. Only completed backups can be restored.`,
          {
            exit: 1,
          },
        )
      }

      // Strong confirmation required
      if (!flags.quiet) {
        this.header('Restore from Backup')
        this.warning('WARNING: This operation is EXTREMELY DESTRUCTIVE!')
        this.warning('All current data in your project will be PERMANENTLY DELETED.')
        this.warning('This operation CANNOT be undone.')
        this.divider()
        this.info(`Project: ${project.name} (${project.ref})`)
        this.info(`Backup ID: ${backup.id}`)
        this.info(`Backup Created: ${backup.created_at}`)
        this.info(`Backup Size: ${backup.size_formatted}`)
        if (backup.description) {
          this.info(`Description: ${backup.description}`)
        }

        this.divider()
      }

      // First confirmation
      const firstConfirm = await this.confirm(
        'Do you understand that ALL CURRENT DATA will be PERMANENTLY DELETED?',
        false,
      )

      if (!firstConfirm) {
        this.warning('Restore cancelled')
        process.exit(0)
      }

      // Second confirmation
      const secondConfirm = await this.confirm(
        `Type the backup ID (${args.backupId}) to confirm restoration:`,
        false,
      )

      if (!secondConfirm) {
        this.warning('Restore cancelled')
        process.exit(0)
      }

      // Restore from backup
      const restoreStatus = await this.spinner(
        'Initiating restore operation...',
        async () => restoreFromBackup(projectRef, args.backupId),
        'Restore operation initiated',
      )

      // Output results
      if (!flags.quiet) {
        this.divider()
      }

      this.output(restoreStatus)

      if (!flags.quiet) {
        this.success('Restore operation has been initiated')
        this.info(`Restore ID: ${restoreStatus.id}`)
        this.info(`Status: ${restoreStatus.status}`)
        this.warning('The restore process may take several minutes to complete.')
        this.warning('Your project will be unavailable during the restore.')
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
