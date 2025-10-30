import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, PaginationFlags } from '../../base-flags'
import { InfoMessages } from '../../error-messages'
import { listProjects } from '../../supabase'

export default class ProjectsList extends BaseCommand {
  static aliases = ['projects:ls', 'proj:list']

  static description = 'List all Supabase projects'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --format table',
    '<%= config.bin %> <%= command.id %> --limit 50',
    '<%= config.bin %> <%= command.id %> --format yaml --quiet',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...PaginationFlags,
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(ProjectsList)

    try {
      if (!flags.quiet) {
        this.header('Supabase Projects')
      }

      // Fetch all projects from Supabase API
      const allProjects = await this.spinner(
        'Fetching projects...',
        async () => listProjects(),
        'Projects fetched successfully',
      )

      // Apply pagination
      const offset = flags.offset || 0
      const limit = flags.limit || 100
      const projects = allProjects.slice(offset, offset + limit)

      // Check for empty results
      if (projects.length === 0) {
        if (!flags.quiet) {
          this.warning(InfoMessages.NO_RESULTS('projects'))
          this.info('Create a new project with: supabase-cli projects:create')
        }

        this.output([])
        process.exit(0)
      }

      // Output results
      this.output(projects)

      if (!flags.quiet) {
        this.divider()
        this.info(InfoMessages.RESULTS_COUNT(projects.length, 'project'))
        if (allProjects.length > projects.length) {
          this.info(`Showing ${offset + 1}-${offset + projects.length} of ${allProjects.length} total`)
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
