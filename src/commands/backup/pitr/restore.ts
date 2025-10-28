import { Flags } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../../base-flags'
import { ValidationError } from '../../../errors'
import { getProject, restoreToPointInTime } from '../../../supabase'

export default class BackupPitrRestore extends BaseCommand {
  static description = 'Restore a project to a specific point in time (DESTRUCTIVE)'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project --timestamp 2024-01-15T10:30:00Z',
    '<%= config.bin %> <%= command.id %> --project my-project --timestamp "2024-01-15T10:30:00Z" --yes',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ConfirmationFlags,
    ...ProjectFlags,
    timestamp: Flags.string({
      char: 't',
      description: 'Point-in-time to restore to (ISO 8601 format)',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(BackupPitrRestore)

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

      // Validate timestamp format (ISO 8601)
      const { timestamp } = flags
      const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3})?Z?$/
      if (!timestampRegex.test(timestamp)) {
        throw new ValidationError(
          'Timestamp must be in ISO 8601 format (e.g., 2024-01-15T10:30:00Z)',
        )
      }

      // Check if timestamp is not in the future
      const targetDate = new Date(timestamp)
      const now = new Date()
      if (targetDate > now) {
        throw new ValidationError('Cannot restore to a future timestamp')
      }

      // Verify project exists
      const project = await this.spinner('Verifying project...', async () => getProject(projectRef))

      // Strong confirmation required
      if (!flags.quiet) {
        this.header('Point-in-Time Restore')
        this.warning('WARNING: This operation is EXTREMELY DESTRUCTIVE!')
        this.warning('All current data in your project will be PERMANENTLY DELETED.')
        this.warning('This operation CANNOT be undone.')
        this.divider()
        this.info(`Project: ${project.name} (${project.ref})`)
        this.info(`Restore to: ${timestamp}`)
        this.info(`Current time: ${now.toISOString()}`)
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
        `Type the project reference (${projectRef}) to confirm point-in-time restoration:`,
        false,
      )

      if (!secondConfirm) {
        this.warning('Restore cancelled')
        process.exit(0)
      }

      // Restore to point in time
      const restoreStatus = await this.spinner(
        'Initiating point-in-time restore...',
        async () => restoreToPointInTime(projectRef, timestamp),
        'Point-in-time restore initiated',
      )

      // Output results
      if (!flags.quiet) {
        this.divider()
      }

      this.output(restoreStatus)

      if (!flags.quiet) {
        this.success('Point-in-time restore operation has been initiated')
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
