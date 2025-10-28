import { Flags } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { Extension, listExtensions } from '../../supabase'

export default class DbExtensions extends BaseCommand {
  static aliases = ['db:ext', 'extensions']

  static description = 'List database extensions'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --project my-project-ref',
    '<%= config.bin %> <%= command.id %> --enabled',
    '<%= config.bin %> <%= command.id %> --format table',
    '<%= config.bin %> <%= command.id %> --enabled --format list',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    enabled: Flags.boolean({
      char: 'e',
      default: false,
      description: 'Show only enabled extensions',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(DbExtensions)

    try {
      // Get project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(
          'Project reference required. Use --project flag or set SUPABASE_PROJECT_REF environment variable.',
          { exit: 1 },
        )
      }

      // Fetch extensions
      const allExtensions = await this.spinner(
        'Fetching database extensions...',
        async () => listExtensions(projectRef),
        'Extensions fetched successfully',
      )

      // Filter extensions if --enabled flag is set
      let extensions = allExtensions
      if (flags.enabled) {
        extensions = allExtensions.filter((ext: Extension) => ext.installed_version !== null)
      }

      // Output results
      if (!flags.quiet) {
        const title = flags.enabled ? 'Enabled Database Extensions' : 'Database Extensions'
        this.header(title)
      }

      this.output(extensions)

      if (!flags.quiet) {
        this.divider()

        const enabledCount = allExtensions.filter(
          (ext: Extension) => ext.installed_version !== null,
        ).length
        const totalCount = allExtensions.length

        if (flags.enabled) {
          this.info(`Total: ${extensions.length} enabled extension(s)`)
        } else {
          this.info(
            `Total: ${totalCount} extension(s) (${enabledCount} enabled, ${totalCount - enabledCount} available)`,
          )
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
