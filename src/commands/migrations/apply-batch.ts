import { Flags } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { cache } from '../../cache'
import { ErrorMessages, InfoMessages, SuccessMessages } from '../../error-messages'
import { applyMigration, listMigrations } from '../../supabase'

export default class MigrationsApplyBatch extends BaseCommand {
  static aliases = ['migrations:batch', 'mig:batch']

  static description =
    'Apply multiple pending migrations with progress tracking (demonstration of progress bars)'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project',
    '<%= config.bin %> <%= command.id %> --project my-project --limit 5',
    '<%= config.bin %> <%= command.id %> --project my-project --yes',
    '<%= config.bin %> <%= command.id %> -p my-project --format table',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    limit: Flags.integer({
      default: 10,
      description: 'Maximum number of migrations to apply in this batch',
      min: 1,
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(MigrationsApplyBatch)

    try {
      // Get project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
      }

      if (!flags.quiet) {
        this.header('Batch Apply Migrations')
      }

      // Fetch all migrations
      const allMigrations = await this.spinner(
        'Fetching migrations...',
        async () => listMigrations(projectRef),
        'Migrations fetched successfully',
      )

      // Filter pending migrations
      const pendingMigrations = allMigrations.filter((m) => !m.applied_at).slice(0, flags.limit)

      if (pendingMigrations.length === 0) {
        if (!flags.quiet) {
          this.info(InfoMessages.NO_RESULTS('pending migrations'))
          this.info('All migrations are already applied.')
        }

        this.output({ applied: 0, pending: 0, total: allMigrations.length })
        process.exit(0)
      }

      if (!flags.quiet) {
        this.info(`Found ${pendingMigrations.length} pending migration(s)`)
        this.divider()

        // Show migrations that will be applied
        pendingMigrations.forEach((m, i) => {
          this.log(`  ${i + 1}. ${m.name} (${m.statements.length} statement(s))`)
        })
        this.divider()
      }

      // Confirmation prompt
      const confirmed = await this.confirm(
        `Apply ${pendingMigrations.length} migration(s) to project '${projectRef}'?`,
        false,
      )

      if (!confirmed) {
        if (!flags.quiet) {
          this.warning('Operation cancelled')
        }

        process.exit(0)
      }

      // Apply migrations with progress bar
      const results = await this.withProgressBar(
        pendingMigrations.length,
        async (update) => {
          const appliedResults = []

          for (let i = 0; i < pendingMigrations.length; i++) {
            const migration = pendingMigrations[i]

            // Update progress with current migration
            update(i, {
              task: `Applying ${migration.name}... (${i}/${pendingMigrations.length})`,
            })

            try {
              // Convert statements array to SQL string
              const sql = migration.statements.join('\n')

              // Apply the migration
              const result = await applyMigration(projectRef, migration.name, sql)

              appliedResults.push({
                error: null,
                name: migration.name,
                status: 'success',
                version: result.version,
              })

              // Update progress after successful application
              update(i + 1, {
                task: `Applied ${migration.name} ✓ (${i + 1}/${pendingMigrations.length})`,
              })
            } catch (error) {
              // Record error but continue with other migrations
              appliedResults.push({
                error: error instanceof Error ? error.message : 'Unknown error',
                name: migration.name,
                status: 'failed',
                version: null,
              })

              // Update progress with error indicator
              update(i + 1, {
                task: `Failed ${migration.name} ✗ (${i + 1}/${pendingMigrations.length})`,
              })
            }
          }

          return appliedResults
        },
      )

      // Invalidate migrations cache
      cache.delete(`migrations:${projectRef}`)

      // Calculate statistics
      const successCount = results.filter((r) => r.status === 'success').length
      const failedCount = results.filter((r) => r.status === 'failed').length

      // Output results
      if (!flags.quiet) {
        this.divider()
        this.header('Migration Results')
      }

      this.output({
        failed: failedCount,
        migrations: results,
        success: successCount,
        total: results.length,
      })

      if (!flags.quiet) {
        this.divider()

        if (successCount > 0) {
          this.success(SuccessMessages.BATCH_OPERATION_COMPLETE(successCount, 'migration'))
        }

        if (failedCount > 0) {
          this.warning(`${failedCount} migration(s) failed`)

          // Show failed migrations
          const failed = results.filter((r) => r.status === 'failed')
          failed.forEach((r) => {
            this.error(`  - ${r.name}: ${r.error}`, { exit: false } as never)
          })
        }

        this.info(`Total: ${successCount}/${results.length} migrations applied successfully`)
      }

      // Exit with error code if any migrations failed
      process.exit(failedCount > 0 ? 1 : 0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
