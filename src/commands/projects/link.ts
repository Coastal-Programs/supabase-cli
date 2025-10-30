import { Args } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags } from '../../base-flags'
import { ErrorMessages, SuccessMessages } from '../../error-messages'
import { getProject } from '../../supabase'
import { saveProjectContext } from '../../utils/project-context'

export default class ProjectsLink extends BaseCommand {
  static aliases = ['project:link', 'link']

  static args = {
    'project-ref': Args.string({
      description: 'Supabase project reference ID',
      required: true,
    }),
  }

  static description = 'Link a Supabase project to the current directory'

  static examples = [
    '<%= config.bin %> <%= command.id %> abcdefghij1234567890',
    '<%= config.bin %> <%= command.id %> my-project-ref',
    '<%= config.bin %> link my-project-ref',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProjectsLink)

    try {
      const projectRef = args['project-ref']

      if (!flags.quiet) {
        this.header('Link Supabase Project')
      }

      // Validate project exists by fetching it
      const project = await this.spinner(
        `Verifying project ${projectRef}...`,
        async () => {
          try {
            return await getProject(projectRef)
          } catch {
            throw new Error(ErrorMessages.PROJECT_NOT_FOUND(projectRef))
          }
        },
        'Project verified successfully',
      )

      // Save project context to .supabase/config.json
      await this.spinner(
        'Saving project context...',
        async () => {
          try {
            await saveProjectContext(projectRef, project.name)
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            throw new Error(ErrorMessages.CONFIG_WRITE_FAILED(errorMessage))
          }
        },
        'Project context saved successfully',
      )

      if (!flags.quiet) {
        this.divider()
        this.success(SuccessMessages.RESOURCE_CREATED('.supabase/config.json', projectRef))
        this.info(`Project: ${project.name}`)
        this.info(`Reference: ${project.ref}`)
        this.info(`Region: ${project.region}`)
        this.divider()
        this.info('Project linked successfully!')
        this.info(
          'You can now run commands without the --project flag (e.g., supabase-cli projects:get)',
        )
      }

      // Output the project config for scripting purposes
      this.output({
        config_path: '.supabase/config.json',
        project_id: projectRef,
        project_name: project.name,
        region: project.region,
        status: project.status,
      })

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
