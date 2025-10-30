import { BaseCommand } from '../../base-command'
import {
  AutomationFlags,
  OutputFormatFlags,
  PaginationFlags,
  WatchFlags,
} from '../../base-flags'
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
    '<%= config.bin %> <%= command.id %> --watch',
    '<%= config.bin %> <%= command.id %> --watch --interval 30',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...PaginationFlags,
    ...WatchFlags,
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(ProjectsList)

    // Run with watch mode support
    await this.runWithWatch(
      async () => {
        try {
          if (!flags.quiet) {
            this.header('Supabase Projects')
          }

          // Fetch all projects from Supabase API
          let allProjects
          if (flags.quiet || flags.watch) {
            // No spinner in quiet mode or watch mode
            allProjects = await listProjects()
          } else {
            // Show spinner in normal mode
            allProjects = await this.spinner(
              'Fetching projects...',
              async () => listProjects(),
              'Projects fetched successfully',
            )
          }

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

            // Only exit if not in watch mode
            if (!flags.watch) {
              process.exit(0)
            }

            return
          }

          // Output results
          this.output(projects)

          if (!flags.quiet) {
            this.divider()
            this.info(InfoMessages.RESULTS_COUNT(projects.length, 'project'))
            if (allProjects.length > projects.length) {
              this.info(
                `Showing ${offset + 1}-${offset + projects.length} of ${allProjects.length} total`,
              )
            }
          }

          // Only exit if not in watch mode
          if (!flags.watch) {
            process.exit(0)
          }
        } catch (error) {
          // In watch mode, errors are handled by runWithWatch
          // In normal mode, propagate to handleError
          if (!flags.watch) {
            this.handleError(error)
          } else {
            throw error
          }
        }
      },
      flags.interval * 1000,
      flags.watch,
    )
  }
}
