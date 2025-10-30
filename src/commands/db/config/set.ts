import { Flags } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../../base-flags'
import { ValidationError } from '../../../errors'
import { getProject, setDatabaseConfig } from '../../../supabase'

export default class DbConfigSet extends BaseCommand {
  static aliases = ['db:cfg:set', 'dbset']

  static description = 'Set database configuration parameter'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project --setting max_connections --value 100',
    '<%= config.bin %> <%= command.id %> --project my-project --setting shared_buffers --value "256MB" --yes',
    '<%= config.bin %> <%= command.id %> --project my-project --setting work_mem --value "4MB"',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ConfirmationFlags,
    ...ProjectFlags,
    setting: Flags.string({
      char: 's',
      description: 'Configuration parameter name',
      required: true,
    }),
    value: Flags.string({
      char: 'v',
      description: 'Configuration parameter value',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(DbConfigSet)

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

      // Validate setting name
      const validSettings = [
        'max_connections',
        'shared_buffers',
        'effective_cache_size',
        'maintenance_work_mem',
        'checkpoint_completion_target',
        'wal_buffers',
        'default_statistics_target',
        'random_page_cost',
        'effective_io_concurrency',
        'work_mem',
        'min_wal_size',
        'max_wal_size',
      ]

      if (!validSettings.includes(flags.setting)) {
        throw new ValidationError(
          `Invalid setting '${flags.setting}'. Valid settings: ${validSettings.join(', ')}`,
        )
      }

      // Verify project exists
      const project = await this.spinner('Verifying project...', async () => getProject(projectRef))

      // Confirm configuration change
      if (!flags.quiet) {
        this.header('Set Database Configuration')
        this.warning('Changing database configuration may require a restart.')
        this.info(`Project: ${project.name} (${project.ref})`)
        this.info(`Setting: ${flags.setting}`)
        this.info(`Value: ${flags.value}`)
        this.divider()
      }

      const confirmed = await this.confirm(
        `Set ${flags.setting} to ${flags.value}? This may require a database restart.`,
        false,
      )

      if (!confirmed) {
        this.warning('Configuration change cancelled')
        process.exit(0)
      }

      // Set configuration
      const config = await this.spinner(
        'Updating database configuration...',
        async () => setDatabaseConfig(projectRef, flags.setting, flags.value),
        'Database configuration updated successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.divider()
      }

      this.output(config)

      if (!flags.quiet) {
        this.success(`Configuration updated: ${config.key} = ${config.value}`)
        this.warning('Database may restart to apply configuration changes.')
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
