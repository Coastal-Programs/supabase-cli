import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { cache } from '../../cache'
import { applyMigration } from '../../supabase'

export default class MigrationsApply extends BaseCommand {
  static aliases = ['migrations:run', 'mig:apply']

  static args = {
    name: Args.string({
      description: 'Migration name (snake_case)',
      required: true,
    }),
    sql: Args.string({
      description: 'SQL statement to execute (or use --file)',
      required: false,
    }),
  }

  static description = 'Apply database migration'

  static examples = [
    '<%= config.bin %> <%= command.id %> add_users_table "CREATE TABLE users (id UUID PRIMARY KEY)"',
    '<%= config.bin %> <%= command.id %> add_profiles --file migration.sql',
    '<%= config.bin %> <%= command.id %> schema_update "ALTER TABLE users ADD COLUMN email TEXT" --force',
    '<%= config.bin %> <%= command.id %> test_migration "SELECT 1" --dry-run',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    'dry-run': Flags.boolean({
      default: false,
      description: 'Preview changes without applying',
    }),
    file: Flags.string({
      char: 'f',
      description: 'Path to SQL file',
    }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MigrationsApply)

    try {
      // Get project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(
          'Project reference required. Use --project flag or set SUPABASE_PROJECT_REF environment variable.',
          { exit: 1 },
        )
      }

      // Get SQL from args or file
      let sql = args.sql || ''

      if (flags.file) {
        const fs = await import('node:fs/promises')
        const path = await import('node:path')

        try {
          const filePath = path.resolve(flags.file)
          sql = await fs.readFile(filePath, 'utf8')
        } catch {
          this.error(`Failed to read file: ${flags.file}`, { exit: 1 })
        }
      }

      if (!sql || sql.trim().length === 0) {
        this.error('SQL statement required. Provide as argument or use --file flag.', { exit: 1 })
      }

      // Validate migration name (snake_case)
      if (!/^[\d_a-z]+$/.test(args.name)) {
        this.error(
          'Migration name must be in snake_case (lowercase letters, numbers, and underscores only)',
          { exit: 1 },
        )
      }

      // Dry run mode
      if (flags['dry-run']) {
        if (flags.quiet) {
          this.output({
            dryRun: true,
            name: args.name,
            sql,
          })
        } else {
          this.header('Migration Preview (Dry Run)')
          this.info(`Name: ${args.name}`)
          this.divider()
          this.log(sql)
          this.divider()
          this.warning('This is a dry run. No changes will be applied.')
        }

        process.exit(0)
        return
      }

      // Confirmation prompt (unless --force or --yes)
      if (!flags.force && !flags.yes) {
        if (!flags.quiet) {
          this.header('Migration Details')
          this.info(`Name: ${args.name}`)
          this.divider()
          this.log(sql)
          this.divider()
        }

        const confirmed = await this.confirm(
          `Are you sure you want to apply this migration to project '${projectRef}'?`,
          false,
        )

        if (!confirmed) {
          this.warning('Migration cancelled')
          process.exit(0)
          return
        }
      }

      // Apply migration - now using correct signature: (ref, name, sql)
      const result = await this.spinner(
        'Applying migration...',
        async () => applyMigration(projectRef, args.name, sql),
        'Migration applied successfully',
      )

      // Invalidate migrations cache
      cache.delete(`migrations:${projectRef}`)

      // Output result
      if (!flags.quiet) {
        this.header('Migration Applied')
      }

      this.output({
        applied_at: result.applied_at,
        name: result.name,
        statements: result.statements.length,
        version: result.version,
      })

      if (!flags.quiet) {
        this.divider()
        this.success(`Migration '${args.name}' applied successfully (version: ${result.version})`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
