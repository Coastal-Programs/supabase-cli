import { Args } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, ConfirmationFlags, OutputFormatFlags } from '../../base-flags'
import { deleteProject } from '../../supabase'

export default class ProjectsDelete extends BaseCommand {
  static aliases = ['projects:rm', 'proj:delete']

  static args = {
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'Delete a Supabase project'

  static examples = [
    '<%= config.bin %> <%= command.id %> abcdefghijklmnop',
    '<%= config.bin %> <%= command.id %> my-project-ref --yes',
    '<%= config.bin %> <%= command.id %> my-project-ref --force',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ConfirmationFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProjectsDelete)

    try {
      // Confirm deletion
      if (!flags.yes && !flags.force && !flags['no-interactive']) {
        this.warning('This action is irreversible!')
        const confirmed = await this.confirm(
          `Are you sure you want to delete project ${args.ref}?`,
          false,
        )

        if (!confirmed) {
          this.info('Project deletion cancelled')
          process.exit(0)
        }
      }

      // Delete project
      await this.spinner(
        `Deleting project ${args.ref}...`,
        async () => deleteProject(args.ref),
        'Project deleted successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Project Deleted')
        this.success(`Project ${args.ref} has been deleted successfully`)
        this.divider()
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
