import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  OutputFormatFlags,
  ProjectFlags,
  TimeRangeFlags,
} from '../../../base-flags'
import { getAPILogs } from '../../../supabase'

export default class LogsAPIList extends BaseCommand {
  static aliases = ['logs:api:ls']

  static args = {
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'List API request logs'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref',
    '<%= config.bin %> <%= command.id %> my-project-ref --since 2024-01-01T00:00:00Z',
    '<%= config.bin %> <%= command.id %> my-project-ref --endpoint /auth/v1/token --format table',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    ...TimeRangeFlags,
    endpoint: Flags.string({
      description: 'Filter by endpoint pattern',
    }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(LogsAPIList)

    try {
      // Fetch API logs
      const logs = await this.spinner(
        'Fetching API logs...',
        async () =>
          getAPILogs(args.ref, {
            endpoint: flags.endpoint,
            since: flags.since,
          }),
        'API logs fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('API Request Logs')
      }

      // Add status indicator based on status code
      const logsWithStatus = logs.map((l) => {
        let statusIndicator = '🟢'
        if (l.status_code >= 400 && l.status_code < 500) {
          statusIndicator = '🟡'
        } else if (l.status_code >= 500) {
          statusIndicator = '🔴'
        }

        return {
          ...l,
          status_indicator: statusIndicator,
        }
      })

      this.output(logsWithStatus)

      if (!flags.quiet) {
        this.divider()
        this.info(`Total: ${logs.length} request${logs.length === 1 ? '' : 's'}`)

        const successCount = logs.filter((l) => l.status_code >= 200 && l.status_code < 300).length
        const clientErrorCount = logs.filter(
          (l) => l.status_code >= 400 && l.status_code < 500,
        ).length
        const serverErrorCount = logs.filter((l) => l.status_code >= 500).length

        if (successCount > 0) {
          this.success(`Success (2xx): ${successCount}`)
        }

        if (clientErrorCount > 0) {
          this.warning(`Client Errors (4xx): ${clientErrorCount}`)
        }

        if (serverErrorCount > 0) {
          this.warning(`Server Errors (5xx): ${serverErrorCount}`)
        }

        if (logs.length > 0) {
          const avgResponseTime = logs.reduce((sum, l) => sum + l.response_time_ms, 0) / logs.length
          this.info(`Avg response time: ${avgResponseTime.toFixed(2)}ms`)
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
