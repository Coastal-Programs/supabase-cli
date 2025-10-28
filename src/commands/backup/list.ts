import { Flags } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { getProject, listBackups } from '../../supabase'

export default class BackupList extends BaseCommand {
  static aliases = ['backup:ls']

  static description = 'List all backups for a project'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project',
    '<%= config.bin %> <%= command.id %> --project my-project --since 2024-01-01',
    '<%= config.bin %> <%= command.id %> --project my-project --format table',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    since: Flags.string({
      description: 'Filter backups created after this date (ISO 8601 format)',
    }),
    until: Flags.string({
      description: 'Filter backups created before this date (ISO 8601 format)',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(BackupList)

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
      await this.spinner('Verifying project...', async () => getProject(projectRef))

      // Fetch backups
      const backups = await this.spinner(
        'Fetching backups...',
        async () =>
          listBackups(projectRef, {
            since: flags.since,
            until: flags.until,
          }),
        'Backups fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Project Backups')
      }

      if (backups.length === 0) {
        this.warning('No backups found')
        process.exit(0)
      }

      this.output(backups)

      if (!flags.quiet) {
        this.divider()
        this.info(`Total: ${backups.length} backup(s)`)

        // Show summary statistics
        const completed = backups.filter((b) => b.status === 'completed').length
        const inProgress = backups.filter((b) => b.status === 'in_progress').length
        const failed = backups.filter((b) => b.status === 'failed').length

        if (completed > 0) this.info(`Completed: ${completed}`)
        if (inProgress > 0) this.warning(`In Progress: ${inProgress}`)
        if (failed > 0) this.error(`Failed: ${failed}`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
