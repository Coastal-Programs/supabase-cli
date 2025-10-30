import { BaseCommand } from '../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../base-flags'
import { ErrorMessages, SuccessMessages, WarningMessages } from '../../error-messages'
import { getProject, pauseProject } from '../../supabase'

export default class ProjectsPause extends BaseCommand {
  static aliases = ['projects:stop', 'proj:pause']

  static description = 'Pause a Supabase project'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project abcdefghijklmnop',
    '<%= config.bin %> <%= command.id %> --project my-project-ref --yes',
    '<%= config.bin %> <%= command.id %> -p my-project-ref --format json',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ConfirmationFlags,
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(ProjectsPause)

    try {
      // Get project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
      }

      // Get project details for confirmation
      const project = await this.spinner(
        `Fetching project ${projectRef}...`,
        async () => getProject(projectRef),
        'Project details fetched',
      )

      if (!flags.quiet) {
        this.header('Pause Project')
        this.info(`Project: ${project.name}`)
        this.info(`Reference: ${projectRef}`)
        this.info(`Current Status: ${project.status}`)
        this.divider()
      }

      // Confirm pause
      if (!flags.yes && !flags.force && !flags['no-interactive']) {
        const confirmed = await this.confirm(ErrorMessages.CONFIRM_PAUSE(project.name), false)

        if (!confirmed) {
          this.warning(WarningMessages.OPERATION_CANCELLED())
          process.exit(0)
        }
      }

      // Pause project
      await this.spinner(
        `Pausing project ${projectRef}...`,
        async () => pauseProject(projectRef),
        'Project paused successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.divider()
        this.success(SuccessMessages.PROJECT_PAUSED(project.name))
        this.info(
          `To restore the project, use: supabase-cli projects:restore --project ${projectRef}`,
        )
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
