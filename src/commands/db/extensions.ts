import { Flags } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { ErrorMessages, InfoMessages } from '../../error-messages'
import { Extension, listExtensions } from '../../supabase'

export default class DbExtensions extends BaseCommand {
  static aliases = ['db:ext', 'extensions']

  static description = 'List database extensions'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project-ref',
    '<%= config.bin %> <%= command.id %> --project my-project-ref --enabled',
    '<%= config.bin %> <%= command.id %> -p my-project-ref --format table',
    '<%= config.bin %> <%= command.id %> -p my-project-ref --enabled --format list',
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
        this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
      }

      if (!flags.quiet) {
        const title = flags.enabled ? 'Enabled Database Extensions' : 'Database Extensions'
        this.header(title)
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

      // Check for empty results
      if (extensions.length === 0) {
        if (!flags.quiet) {
          this.warning(
            flags.enabled
              ? InfoMessages.NO_RESULTS('enabled extensions')
              : InfoMessages.NO_RESULTS('extensions'),
          )
        }

        this.output([])
        process.exit(0)
      }

      // Output results
      this.output(extensions)

      if (!flags.quiet) {
        this.divider()

        const enabledCount = allExtensions.filter(
          (ext: Extension) => ext.installed_version !== null,
        ).length
        const totalCount = allExtensions.length

        if (flags.enabled) {
          this.info(InfoMessages.RESULTS_COUNT(extensions.length, 'enabled extension'))
        } else {
          this.info(InfoMessages.RESULTS_COUNT(totalCount, 'extension'))
          this.info(`Enabled: ${enabledCount} | Available: ${totalCount - enabledCount}`)
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
