import { Flags } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../base-flags'
import { createBackup, getProject } from '../../supabase'

export default class BackupCreate extends BaseCommand {
  static description = 'Create an on-demand backup for a project'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project',
    '<%= config.bin %> <%= command.id %> --project my-project --description "Pre-migration backup"',
    '<%= config.bin %> <%= command.id %> --project my-project --yes',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ConfirmationFlags,
    ...ProjectFlags,
    description: Flags.string({
      char: 'd',
      description: 'Description for the backup',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(BackupCreate)

    try {
      // Validate project reference
      const projectRef = flags.project || flags['project-ref']
      if (!projectRef) {
        this.error(
          'Project reference is required. Use --project flag or set SUPABASE_PROJECT_ID.',
          {
            exit: 1,
          },
        )
      }

      // Verify project exists
      const project = await this.spinner('Verifying project...', async () => getProject(projectRef))

      // Confirm backup creation
      if (!flags.quiet) {
        this.header('Create Backup')
        this.info(`Project: ${project.name} (${project.ref})`)
        if (flags.description) {
          this.info(`Description: ${flags.description}`)
        }

        this.divider()
      }

      const confirmed = await this.confirm(
        'Are you sure you want to create a backup? This operation may take several minutes.',
        false,
      )

      if (!confirmed) {
        this.warning('Backup creation cancelled')
        process.exit(0)
      }

      // Create backup
      const backup = await this.spinner(
        'Creating backup...',
        async () => createBackup(projectRef, flags.description),
        'Backup created successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.divider()
      }

      this.output(backup)

      if (!flags.quiet) {
        this.success(`Backup ID: ${backup.id}`)
        this.info(`Status: ${backup.status}`)
        this.info('The backup process has been initiated. It may take several minutes to complete.')
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
