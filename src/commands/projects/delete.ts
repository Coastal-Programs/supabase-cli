import { BaseCommand } from '../../base-command'
import { AutomationFlags, ConfirmationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { ErrorMessages, SuccessMessages, WarningMessages } from '../../error-messages'
import { deleteProject, getProject } from '../../supabase'

export default class ProjectsDelete extends BaseCommand {
  static aliases = ['projects:rm', 'proj:delete']

  static description = 'Delete a Supabase project'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project abcdefghijklmnop',
    '<%= config.bin %> <%= command.id %> --project my-project-ref --yes',
    '<%= config.bin %> <%= command.id %> -p my-project-ref --force',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ConfirmationFlags,
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(ProjectsDelete)

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
        this.header('Delete Project')
        this.warning('This action is irreversible!')
        this.info(`Project: ${project.name}`)
        this.info(`Reference: ${projectRef}`)
        this.divider()
      }

      // Confirm deletion
      if (!flags.yes && !flags.force && !flags['no-interactive']) {
        const confirmed = await this.confirm(
          ErrorMessages.CONFIRM_DELETE('project', project.name),
          false,
        )

        if (!confirmed) {
          this.warning(WarningMessages.OPERATION_CANCELLED())
          process.exit(0)
        }
      }

      // Delete project
      await this.spinner(
        `Deleting project ${projectRef}...`,
        async () => deleteProject(projectRef),
        'Project deleted successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.divider()
        this.success(SuccessMessages.RESOURCE_DELETED('Project', project.name))
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
