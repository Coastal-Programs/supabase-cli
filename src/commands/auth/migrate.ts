import { Flags } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import {
  getMigrationSummary,
  isMigrationNeeded,
  migrateLegacyCredentials,
} from '../../utils/migrate-credentials'

export default class AuthMigrate extends BaseCommand {
  static aliases = ['auth:mig', 'migrate']

  static description = 'Migrate legacy credentials to secure storage'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --dry-run',
    '<%= config.bin %> <%= command.id %> --yes',
    '<%= config.bin %> <%= command.id %> --backup-only',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    'backup-only': Flags.boolean({
      default: false,
      description: 'Create backups without deleting legacy files',
    }),
    'dry-run': Flags.boolean({
      default: false,
      description: 'Show what would be migrated without making changes',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthMigrate)

    try {
      this.header('Credential Migration')

      // Check if migration is needed
      if (!isMigrationNeeded()) {
        this.info('No legacy credentials detected.')
        this.success('Migration not needed.')
        process.exit(0)
      }

      // Show migration summary
      const summary = await getMigrationSummary()
      this.log(summary)
      this.divider()

      // Dry run mode
      if (flags['dry-run']) {
        this.info('Dry run mode - no changes will be made.')
        const result = await migrateLegacyCredentials({ dryRun: true })

        if (result.success) {
          this.success(
            `Would migrate ${result.migratedCount} credential(s) from ${result.processedFiles.length} file(s)`,
          )
        }

        if (result.errors.length > 0) {
          this.warning('Warnings detected:')
          for (const error of result.errors) {
            this.log(`  - ${error}`)
          }
        }

        process.exit(0)
      }

      // Confirm migration (unless --yes flag)
      const confirmed = await this.confirm(
        'Do you want to migrate these credentials to secure storage?',
        false,
      )

      if (!confirmed) {
        this.warning('Migration cancelled.')
        process.exit(0)
      }

      // Perform migration
      this.info('Starting migration...')

      const result = await this.spinner(
        'Migrating credentials...',
        async () =>
          migrateLegacyCredentials({
            backupOnly: flags['backup-only'],
            skipConsent: flags.yes,
          }),
        'Migration completed',
      )

      // Show results
      this.divider()

      if (result.success) {
        this.success(
          `Successfully migrated ${result.migratedCount} credential(s) from ${result.processedFiles.length} file(s)`,
        )

        if (result.backupPath) {
          this.info(`Backup created: ${result.backupPath}`)
        }

        if (flags['backup-only']) {
          this.info('Legacy files were backed up but not deleted (backup-only mode)')
        } else {
          this.info('Legacy plaintext files have been removed')
        }
      } else {
        this.error('Migration failed')

        if (result.rolledBack) {
          this.warning('Changes were rolled back from backup')
        }
      }

      // Show any errors
      if (result.errors.length > 0) {
        this.warning('Errors occurred during migration:')
        for (const error of result.errors) {
          this.log(`  - ${error}`)
        }
      }

      process.exit(result.success ? 0 : 1)
    } catch (error) {
      this.handleError(error)
    }
  }
}
