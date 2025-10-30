import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags, RecentFlags } from '../../base-flags'
import { ErrorMessages } from '../../error-messages'
import { getProject } from '../../supabase'

export default class ProjectsGet extends BaseCommand {
  static aliases = ['projects:show', 'proj:get']

  static description = 'Get details for a specific Supabase project'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project abcdefghijklmnop',
    '<%= config.bin %> <%= command.id %> --project my-project-ref --format table',
    '<%= config.bin %> <%= command.id %> -p my-project-ref --format yaml',
    '<%= config.bin %> <%= command.id %> --recent 1',
    '<%= config.bin %> <%= command.id %> -r 2',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
    ...RecentFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(ProjectsGet)

    try {
      // Get project reference using the new helper method
      const { projectRef, source } = await this.getProjectRef(flags)

      if (!projectRef) {
        this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
      }

      // Show info message if using project from context
      if (!flags.quiet && source === 'context') {
        this.info('Using project from .supabase/config.json')
      }

      // Fetch project details from Supabase API
      const project = await this.spinner(
        `Fetching project ${projectRef}...`,
        async () => getProject(projectRef),
        'Project details fetched successfully',
      )

      // Track this project in recent history
      this.trackRecentProject(project.ref, project.name, 'projects:get')

      // Output results
      if (!flags.quiet) {
        this.header(`Project: ${project.name}`)
      }

      this.output(project)

      if (!flags.quiet) {
        this.divider()
        this.info(`Reference: ${project.ref}`)
        this.info(`Status: ${project.status}`)
        this.info(`Region: ${project.region}`)
        this.info(`Database Version: ${project.database.version}`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
