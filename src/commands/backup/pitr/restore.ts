import { Flags } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { ErrorMessages, InfoMessages, WarningMessages } from '../../../error-messages'
import { getProject, restoreToPointInTime } from '../../../supabase'

export default class BackupPitrRestore extends BaseCommand {
  static description = 'Restore project to a specific point in time (PITR - destructive operation)'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project --timestamp "2024-01-15T10:30:00Z"',
    '<%= config.bin %> <%= command.id %> -p my-project -t "2024-01-15T10:30:00Z" --yes',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    timestamp: Flags.string({
      char: 't',
      description: 'Timestamp to restore to (ISO 8601 format)',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(BackupPitrRestore)

    try {
      // Validate project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
      }

      // Validate timestamp format
      try {
        new Date(flags.timestamp)
      } catch {
        this.error('Invalid timestamp format. Use ISO 8601 format (e.g., 2024-01-15T10:30:00Z)', {
          exit: 1,
        })
      }

      if (!flags.quiet) {
        this.header('Point-in-Time Restore')
      }

      // Verify project exists
      await this.spinner('Verifying project...', async () => getProject(projectRef))

      // Confirm restoration
      if (!flags.quiet) {
        this.warning(WarningMessages.DESTRUCTIVE_OPERATION())
        this.warning('This will replace ALL current data with data from the specified time.')
        this.info(`Restore to: ${flags.timestamp}`)
        this.warning(
          'Note: PITR is only available for projects with point-in-time recovery enabled.',
        )
      }

      const confirmed = await this.confirm(
        `Are you sure you want to restore to ${flags.timestamp}? This will overwrite all current data.`,
        false,
      )

      if (!confirmed) {
        if (!flags.quiet) {
          this.warning('Operation cancelled')
        }

        process.exit(0)
      }

      // Restore to point in time
      const restoreStatus = await this.spinner(
        'Starting point-in-time restore...',
        async () => restoreToPointInTime(projectRef, flags.timestamp),
        'Point-in-time restore initiated',
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
