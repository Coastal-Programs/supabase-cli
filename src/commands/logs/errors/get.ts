import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { getErrorLog } from '../../../supabase'

export default class LogsErrorsGet extends BaseCommand {
  static aliases = ['logs:errors:show']

  static args = {
    errorId: Args.string({
      description: 'Error log ID',
      required: true,
    }),
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'Get specific error log with full stack trace'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref error-id-123',
    '<%= config.bin %> <%= command.id %> my-project-ref abc-def-ghi --format json',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(LogsErrorsGet)

    try {
      // Fetch error log
      const log = await this.spinner(
        `Fetching error log ${args.errorId}...`,
        async () => getErrorLog(args.ref, args.errorId),
        'Error log fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header(`Error Log: ${log.error_message}`)
      }

      this.output(log)

      if (!flags.quiet) {
        this.divider()
        this.info(`Service: ${log.service}`)
        this.info(`Severity: ${log.severity}`)
        this.info(`Timestamp: ${new Date(log.timestamp).toLocaleString()}`)

        if (log.error_code) {
          this.info(`Error Code: ${log.error_code}`)
        }

        if (log.function_name) {
          this.info(`Function: ${log.function_name}`)
        }

        if (log.stack_trace) {
          this.divider()
          this.warning('Stack Trace:')
          this.log(log.stack_trace)
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
