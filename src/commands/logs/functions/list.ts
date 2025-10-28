import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  OutputFormatFlags,
  ProjectFlags,
  TimeRangeFlags,
} from '../../../base-flags'
import { getFunctionLogs } from '../../../supabase'

export default class LogsFunctionsList extends BaseCommand {
  static aliases = ['logs:functions:ls']

  static args = {
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'List edge function execution logs'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref',
    '<%= config.bin %> <%= command.id %> my-project-ref --since 2024-01-01T00:00:00Z',
    '<%= config.bin %> <%= command.id %> my-project-ref --since 2024-01-01T00:00:00Z --until 2024-01-02T00:00:00Z --format table',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    ...TimeRangeFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(LogsFunctionsList)

    try {
      // Fetch function logs
      const logs = await this.spinner(
        'Fetching function logs...',
        async () =>
          getFunctionLogs(args.ref, {
            since: flags.since,
            until: flags.to,
          }),
        'Function logs fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Function Execution Logs')
      }

      // Add status indicator
      const logsWithStatus = logs.map((l) => ({
        ...l,
        status_indicator: l.status === 'success' ? '✓' : '✗',
      }))

      this.output(logsWithStatus)

      if (!flags.quiet) {
        this.divider()
        this.info(`Total: ${logs.length} log entr${logs.length === 1 ? 'y' : 'ies'}`)

        const successCount = logs.filter((l) => l.status === 'success').length
        const errorCount = logs.filter((l) => l.status === 'error').length

        if (successCount > 0) {
          this.success(`Success: ${successCount}`)
        }

        if (errorCount > 0) {
          this.warning(`Errors: ${errorCount}`)
        }

        if (logs.length > 0) {
          const avgDuration = logs.reduce((sum, l) => sum + l.execution_time_ms, 0) / logs.length
          this.info(`Avg execution time: ${avgDuration.toFixed(2)}ms`)
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
