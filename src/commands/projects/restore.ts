import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, ConfirmationFlags, OutputFormatFlags } from '../../base-flags'
import { ErrorMessages, SuccessMessages, WarningMessages } from '../../error-messages'
import { getProject, restoreProject } from '../../supabase'

export default class ProjectsRestore extends BaseCommand {
  static aliases = ['projects:resume', 'proj:restore']

  static args = {
    ref: Args.string({
      description: 'Project reference ID to restore',
      required: false,
    }),
  }

  static description = 'restore a paused Supabase project'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project abcdefghijklmnop',
    '<%= config.bin %> <%= command.id %> --project my-project-ref --yes',
    '<%= config.bin %> <%= command.id %> -p my-project-ref --quiet',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ConfirmationFlags,
    format: Flags.string({
      char: 'f',
      default: 'json',
      description: 'Output format',
      options: ['json', 'table', 'yaml'],
    }),
    project: Flags.string({
      char: 'p',
      description: 'Supabase project ID or reference',
      env: 'SUPABASE_PROJECT_ID',
    }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProjectsRestore)

    try {
      // Get project reference from args or flags
      const projectRef = args.ref || flags.project || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
      }

      // Get current project status
      const project = await this.spinner(
        `Fetching project ${projectRef}...`,
        async () => getProject(projectRef),
        'Project details fetched',
      )

      // Check if project is actually paused
      if (project.status !== 'PAUSED') {
        this.warning(`Project ${project.name} is not paused (status: ${project.status})`)
        this.info('Only paused projects can be restored.')
        process.exit(0)
      }

      // Confirm action
      if (!flags.quiet) {
        this.header(`Restore Project: ${project.name}`)
        this.info(`Reference: ${projectRef}`)
        this.info(`Current Status: ${project.status}`)
        this.divider()
      }

      if (!flags.yes && !flags.force && !flags['no-interactive']) {
        const confirmed = await this.confirm(
          `Are you sure you want to restore project "${project.name}" (${projectRef})?`,
          false,
        )

        if (!confirmed) {
          this.warning(WarningMessages.OPERATION_CANCELLED())
          process.exit(0)
        }
      }

      // Restore project
      await this.spinner(
        `Restoring project ${projectRef}...`,
        async () => restoreProject(projectRef),
        'Project restore initiated',
      )

      // Fetch updated project status
      const updatedProject = await this.spinner(
        'Fetching updated project status...',
        async () => getProject(projectRef),
        'Status updated',
      )

      // Output results
      if (!flags.quiet) {
        this.divider()
        this.success(SuccessMessages.RESOURCE_UPDATED('Project', project.name))
        this.info(`New Status: ${updatedProject.status}`)
        this.info(`Region: ${updatedProject.region}`)
        this.info(`Database Version: ${updatedProject.database.version}`)
        this.divider()
        this.info('Note: It may take a few minutes for the project to become fully active.')
      }

      // Output full project details
      this.output(updatedProject)

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
