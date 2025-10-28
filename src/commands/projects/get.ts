import { Args } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags } from '../../base-flags'
import { getProject } from '../../supabase'

export default class ProjectsGet extends BaseCommand {
  static aliases = ['projects:show', 'proj:get']

  static args = {
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'Get details for a specific Supabase project'

  static examples = [
    '<%= config.bin %> <%= command.id %> abcdefghijklmnop',
    '<%= config.bin %> <%= command.id %> abcdefghijklmnop --format table',
    '<%= config.bin %> <%= command.id %> my-project-ref --format yaml',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProjectsGet)

    try {
      // Fetch project details from Supabase API
      const project = await this.spinner(
        `Fetching project ${args.ref}...`,
        async () => getProject(args.ref),
        'Project details fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header(`Project: ${project.name}`)
      }

      this.output(project)

      if (!flags.quiet) {
        this.divider()
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
