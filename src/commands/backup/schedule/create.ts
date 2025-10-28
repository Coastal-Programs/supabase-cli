import { Flags } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../../base-flags'
import { ValidationError } from '../../../errors'
import { createBackupSchedule, getProject } from '../../../supabase'

export default class BackupScheduleCreate extends BaseCommand {
  static description = 'Create an automated backup schedule'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project --frequency daily --retention 7',
    '<%= config.bin %> <%= command.id %> --project my-project --frequency weekly --retention 30 --name "Weekly Backup"',
    '<%= config.bin %> <%= command.id %> --project my-project --frequency monthly --retention 90 --yes',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ConfirmationFlags,
    ...ProjectFlags,
    frequency: Flags.string({
      char: 'f',
      description: 'Backup frequency',
      options: ['daily', 'weekly', 'monthly'],
      required: true,
    }),
    name: Flags.string({
      char: 'n',
      description: 'Name for the schedule',
    }),
    retention: Flags.integer({
      char: 'r',
      description: 'Retention period in days',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(BackupScheduleCreate)

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

      // Validate frequency
      if (!['daily', 'monthly', 'weekly'].includes(flags.frequency)) {
        throw new ValidationError('Frequency must be one of: daily, weekly, monthly')
      }

      // Validate retention
      if (flags.retention < 1) {
        throw new ValidationError('Retention period must be at least 1 day')
      }

      if (flags.retention > 365) {
        throw new ValidationError('Retention period cannot exceed 365 days')
      }

      // Verify project exists
      const project = await this.spinner('Verifying project...', async () => getProject(projectRef))

      // Confirm schedule creation
      if (!flags.quiet) {
        this.header('Create Backup Schedule')
        this.info(`Project: ${project.name} (${project.ref})`)
        this.info(`Frequency: ${flags.frequency}`)
        this.info(`Retention: ${flags.retention} days`)
        if (flags.name) {
          this.info(`Name: ${flags.name}`)
        }

        this.divider()
      }

      const confirmed = await this.confirm(
        `Create ${flags.frequency} backup schedule with ${flags.retention}-day retention?`,
        false,
      )

      if (!confirmed) {
        this.warning('Schedule creation cancelled')
        process.exit(0)
      }

      // Create schedule
      const schedule = await this.spinner(
        'Creating backup schedule...',
        async () =>
          createBackupSchedule(
            projectRef,
            flags.frequency as 'daily' | 'monthly' | 'weekly',
            flags.retention,
            flags.name,
          ),
        'Backup schedule created successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.divider()
      }

      this.output(schedule)

      if (!flags.quiet) {
        this.success(`Schedule ID: ${schedule.id}`)
        this.info(`Status: ${schedule.enabled ? 'Enabled' : 'Disabled'}`)
        this.info(`Next backup will run according to ${flags.frequency} schedule`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
