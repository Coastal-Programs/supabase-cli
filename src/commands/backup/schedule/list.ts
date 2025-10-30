import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { ErrorMessages, InfoMessages } from '../../../error-messages'
import { getProject, listBackupSchedules } from '../../../supabase'

export default class BackupScheduleList extends BaseCommand {
  static aliases = ['backup:schedule:ls']

  static description = 'List all backup schedules for a project'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project',
    '<%= config.bin %> <%= command.id %> --project my-project --format table',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(BackupScheduleList)

    try {
      // Validate project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
      }

      if (!flags.quiet) {
        this.header('Backup Schedules')
      }

      // Verify project exists
      await this.spinner('Verifying project...', async () => getProject(projectRef))

      // Fetch backup schedules
      const schedules = await this.spinner(
        'Fetching backup schedules...',
        async () => listBackupSchedules(projectRef),
        'Backup schedules fetched successfully',
      )

      // Check for empty results
      if (schedules.length === 0) {
        if (!flags.quiet) {
          this.warning(InfoMessages.NO_RESULTS('backup schedules'))
          this.info(
            'Create a backup schedule with: supabase-cli backup:schedule:create --project ' +
              projectRef,
          )
        }

        this.output([])
        process.exit(0)
      }

      // Output results
      this.output(schedules)

      if (!flags.quiet) {
        this.divider()
        this.info(InfoMessages.RESULTS_COUNT(schedules.length, 'backup schedule'))

        // Show summary statistics
        const enabled = schedules.filter((s) => s.enabled).length
        const disabled = schedules.filter((s) => !s.enabled).length

        if (enabled > 0) this.success(`Enabled: ${enabled}`)
        if (disabled > 0) this.warning(`Disabled: ${disabled}`)

        // Show frequency breakdown
        const daily = schedules.filter((s) => s.frequency === 'daily').length
        const weekly = schedules.filter((s) => s.frequency === 'weekly').length
        const monthly = schedules.filter((s) => s.frequency === 'monthly').length

        this.divider()
        this.info('Frequency breakdown:')
        if (daily > 0) this.info(`  Daily: ${daily}`)
        if (weekly > 0) this.info(`  Weekly: ${weekly}`)
        if (monthly > 0) this.info(`  Monthly: ${monthly}`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
