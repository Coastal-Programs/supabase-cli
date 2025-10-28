import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, PaginationFlags } from '../../base-flags'
import { listProjects } from '../../supabase'

export default class ProjectsList extends BaseCommand {
  static aliases = ['projects:ls', 'proj:list']

  static description = 'List all Supabase projects'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --format table',
    '<%= config.bin %> <%= command.id %> --limit 50',
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

      // Output results
      if (!flags.quiet) {
        this.header('Supabase Projects')
      }

      this.output(projects)

      if (!flags.quiet) {
        this.divider()
        this.info(`Total: ${projects.length} of ${allProjects.length} projects`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
