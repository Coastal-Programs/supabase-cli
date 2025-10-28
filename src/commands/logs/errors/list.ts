import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  OutputFormatFlags,
  ProjectFlags,
  TimeRangeFlags,
} from '../../../base-flags'
import { getErrorLogs } from '../../../supabase'

export default class LogsErrorsList extends BaseCommand {
  static aliases = ['logs:errors:ls']

  static args = {
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'List error logs'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref',
    '<%= config.bin %> <%= command.id %> my-project-ref --since 2024-01-01T00:00:00Z',
    '<%= config.bin %> <%= command.id %> my-project-ref --since 2024-01-01T00:00:00Z --format table',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    ...TimeRangeFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(LogsErrorsList)

    try {
      // Fetch error logs
      const logs = await this.spinner(
        'Fetching error logs...',
        async () =>
          getErrorLogs(args.ref, {
            since: flags.since,
          }),
        'Error logs fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Error Logs')
      }

      // Add severity indicator
      const logsWithIndicator = logs.map((l) => ({
        ...l,
        severity_indicator: l.severity === 'critical' ? '🔴' : l.severity === 'error' ? '🟡' : '⚪',
      }))

      this.output(logsWithIndicator)

      if (!flags.quiet) {
        this.divider()
        this.info(`Total: ${logs.length} error${logs.length === 1 ? '' : 's'}`)

        const criticalCount = logs.filter((l) => l.severity === 'critical').length
        const errorCount = logs.filter((l) => l.severity === 'error').length
        const warningCount = logs.filter((l) => l.severity === 'warning').length

        if (criticalCount > 0) {
          this.warning(`Critical: ${criticalCount}`)
        }

        if (errorCount > 0) {
          this.warning(`Error: ${errorCount}`)
        }

        if (warningCount > 0) {
          this.info(`Warning: ${warningCount}`)
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
