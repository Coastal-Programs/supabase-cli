import { Args } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, ConfirmationFlags, OutputFormatFlags } from '../../base-flags'
import { pauseProject } from '../../supabase'

export default class ProjectsPause extends BaseCommand {
  static aliases = ['projects:stop', 'proj:pause']

  static args = {
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'Pause a Supabase project'

  static examples = [
    '<%= config.bin %> <%= command.id %> abcdefghijklmnop',
    '<%= config.bin %> <%= command.id %> my-project-ref --yes',
    '<%= config.bin %> <%= command.id %> my-project-ref --format json',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ConfirmationFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProjectsPause)

    try {
      // Confirm pause
      if (!flags.yes && !flags.force && !flags['no-interactive']) {
        const confirmed = await this.confirm(
          `Pause project ${args.ref}? The project will be inaccessible until restored.`,
          false,
        )

        if (!confirmed) {
          this.info('Project pause cancelled')
          process.exit(0)
        }
      }

      // Pause project
      await this.spinner(
        `Pausing project ${args.ref}...`,
        async () => pauseProject(args.ref),
        'Project paused successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Project Paused')
        this.success(`Project ${args.ref} has been paused successfully`)
        this.info('To restore the project, use: projects restore ' + args.ref)
        this.divider()
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
