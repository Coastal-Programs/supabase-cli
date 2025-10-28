import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { getProject, listBackupSchedules } from '../../../supabase'

export default class BackupScheduleList extends BaseCommand {
  static aliases = ['backup:schedule:ls']

  static description = 'List automated backup schedules for a project'

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
      await this.spinner('Verifying project...', async () => getProject(projectRef))

      // Fetch schedules
      const schedules = await this.spinner(
        'Fetching backup schedules...',
        async () => listBackupSchedules(projectRef),
        'Backup schedules fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Backup Schedules')
      }

      if (schedules.length === 0) {
        this.warning('No backup schedules found')
        process.exit(0)
      }

      this.output(schedules)

      if (!flags.quiet) {
        this.divider()
        this.info(`Total: ${schedules.length} schedule(s)`)

        // Show summary
        const enabled = schedules.filter((s) => s.enabled).length
        const disabled = schedules.filter((s) => !s.enabled).length

        if (enabled > 0) this.info(`Enabled: ${enabled}`)
        if (disabled > 0) this.warning(`Disabled: ${disabled}`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
