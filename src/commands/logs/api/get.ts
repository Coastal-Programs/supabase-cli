import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { getAPILog } from '../../../supabase'

export default class LogsAPIGet extends BaseCommand {
  static aliases = ['logs:api:show']

  static args = {
    logId: Args.string({
      description: 'API log ID',
      required: true,
    }),
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'Get specific API request log with full details'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref log-id-123',
    '<%= config.bin %> <%= command.id %> my-project-ref abc-def-ghi --format json',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(LogsAPIGet)

    try {
      // Fetch API log
      const log = await this.spinner(
        `Fetching API log ${args.logId}...`,
        async () => getAPILog(args.ref, args.logId),
        'API log fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header(`API Log: ${log.method} ${log.endpoint}`)
      }

      this.output(log)

      if (!flags.quiet) {
        this.divider()
        this.info(`Method: ${log.method}`)
        this.info(`Endpoint: ${log.endpoint}`)
        this.info(`Status: ${log.status_code}`)
        this.info(`Response Time: ${log.response_time_ms}ms`)
        this.info(`Timestamp: ${new Date(log.timestamp).toLocaleString()}`)

        if (log.status_code >= 200 && log.status_code < 300) {
          this.success('Request successful')
        } else if (log.status_code >= 400) {
          this.warning('Request failed')
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
