import { Flags } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { ErrorMessages, InfoMessages } from '../../../error-messages'
import { createBackupSchedule, getProject } from '../../../supabase'

export default class BackupScheduleCreate extends BaseCommand {
  static description = 'Create a backup schedule for automated backups'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project --frequency daily --retention 7',
    '<%= config.bin %> <%= command.id %> -p my-project -f weekly -r 30 -n "Weekly backups"',
    '<%= config.bin %> <%= command.id %> --project my-project --frequency monthly --retention 365',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    frequency: Flags.string({
      char: 'f',
      description: 'Backup frequency',
      options: ['daily', 'weekly', 'monthly'],
      required: true,
    }),
    name: Flags.string({
      char: 'n',
      description: 'Name for the backup schedule',
    }),
    retention: Flags.integer({
      char: 'r',
      description: 'Number of days to retain backups',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(BackupScheduleCreate)

    try {
      // Validate project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
      }

      // Validate frequency
      const frequency = flags.frequency as 'daily' | 'monthly' | 'weekly'
      if (!['daily', 'monthly', 'weekly'].includes(frequency)) {
        this.error('Invalid frequency. Must be one of: daily, weekly, monthly', { exit: 1 })
      }

      // Validate retention
      if (flags.retention < 1) {
        this.error('Retention days must be at least 1', { exit: 1 })
      }

      if (!flags.quiet) {
        this.header('Create Backup Schedule')
      }

      // Verify project exists
      await this.spinner('Verifying project...', async () => getProject(projectRef))

      // Create backup schedule
      const schedule = await this.spinner(
        'Creating backup schedule...',
        async () => createBackupSchedule(projectRef, frequency, flags.retention, flags.name),
        'Backup schedule created successfully',
      )

      // Output results
      this.output(schedule)

      if (!flags.quiet) {
        this.divider()
        this.success(InfoMessages.CREATED('Backup schedule', schedule.id))
        this.info(`Name: ${schedule.name}`)
        this.info(`Frequency: ${schedule.frequency}`)
        this.info(`Retention: ${schedule.retention_days} days`)
        this.info(`Enabled: ${schedule.enabled}`)
        this.info(`Created: ${schedule.created_at}`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
