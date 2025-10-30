import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { ErrorMessages } from '../../error-messages'
import { getProject } from '../../supabase'

export default class ProjectsGet extends BaseCommand {
  static aliases = ['projects:show', 'proj:get']

  static description = 'Get details for a specific Supabase project'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project abcdefghijklmnop',
    '<%= config.bin %> <%= command.id %> --project my-project-ref --format table',
    '<%= config.bin %> <%= command.id %> -p my-project-ref --format yaml',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(ProjectsGet)

    try {
      // Get project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
      }

      // Fetch project details from Supabase API
      const project = await this.spinner(
        `Fetching project ${projectRef}...`,
        async () => getProject(projectRef),
        'Project details fetched successfully',
      )

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
