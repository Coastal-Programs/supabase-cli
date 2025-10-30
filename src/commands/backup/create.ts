import { Flags } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { ErrorMessages } from '../../error-messages'
import { createBackup, getProject } from '../../supabase'

export default class BackupCreate extends BaseCommand {
  static description = 'Create an on-demand backup for a project'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project',
    '<%= config.bin %> <%= command.id %> --project my-project --description "Pre-deployment backup"',
    '<%= config.bin %> <%= command.id %> -p my-project --format table',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    description: Flags.string({
      description: 'Optional description for the backup',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(BackupCreate)

    try {
      // Validate project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
      }

      if (!flags.quiet) {
        this.header('Create Backup')
      }

      // Verify project exists
      await this.spinner('Verifying project...', async () => getProject(projectRef))

      // Create backup
      const backup = await this.spinner(
        'Creating backup...',
        async () => createBackup(projectRef, flags.description),
        'Backup created successfully',
      )

      // Output results
      this.output(backup)

      if (!flags.quiet) {
        this.divider()
        this.success(`Backup created with ID: ${backup.id}`)
        this.info(`Status: ${backup.status}`)
        if (backup.description) {
          this.info(`Description: ${backup.description}`)
        }

        if (backup.created_at) {
          this.info(`Created: ${backup.created_at}`)
        }

        this.divider()
        this.info('Monitor backup progress with:')
        this.info(`  supabase-cli backup:get ${backup.id} --project ${projectRef}`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
