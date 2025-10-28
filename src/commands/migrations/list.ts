import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { Helper } from '../../helper'
import { listMigrations } from '../../supabase'

export default class MigrationsList extends BaseCommand {
  static aliases = ['migrations:ls', 'mig:list']

  static description = 'List all database migrations'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --project my-project-ref',
    '<%= config.bin %> <%= command.id %> --format table',
    '<%= config.bin %> <%= command.id %> --format yaml',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(MigrationsList)

    try {
      // Get project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(
          'Project reference required. Use --project flag or set SUPABASE_PROJECT_REF environment variable.',
          { exit: 1 },
        )
      }

      // Fetch migrations
      const migrations = await this.spinner(
        'Fetching migrations...',
        async () => listMigrations(projectRef),
        'Migrations fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Database Migrations')
      }

      // Enhance migration output with status indicators
      const enhancedMigrations = migrations.map((migration) => ({
        applied_at: migration.applied_at ? Helper.formatDate(migration.applied_at) : 'Not applied',
        name: migration.name,
        statements: migration.statements.length,
        status: migration.applied_at ? 'Applied' : 'Pending',
        version: migration.version,
      }))

      this.output(enhancedMigrations)

      if (!flags.quiet) {
        this.divider()

        const appliedCount = migrations.filter((m) => m.applied_at).length
        const pendingCount = migrations.length - appliedCount

        this.info(
          `Total: ${migrations.length} migration(s) (${appliedCount} applied, ${pendingCount} pending)`,
        )

        if (pendingCount > 0) {
          this.warning(
            `You have ${pendingCount} pending migration(s). Run 'migrations apply' to apply them.`,
          )
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
