import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { getFunctionLog } from '../../../supabase'

export default class LogsFunctionsGet extends BaseCommand {
  static aliases = ['logs:functions:show']

  static args = {
    logId: Args.string({
      description: 'Function log ID',
      required: true,
    }),
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'Get specific function execution log'

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
    const { args, flags } = await this.parse(LogsFunctionsGet)

    try {
      // Fetch function log
      const log = await this.spinner(
        `Fetching function log ${args.logId}...`,
        async () => getFunctionLog(args.ref, args.logId),
        'Function log fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header(`Function Log: ${log.function_name}`)
      }

      this.output(log)

      if (!flags.quiet) {
        this.divider()
        this.info(`Function: ${log.function_name}`)
        this.info(`Status: ${log.status}`)
        this.info(`Execution Time: ${log.execution_time_ms}ms`)
        this.info(`Timestamp: ${new Date(log.timestamp).toLocaleString()}`)

        if (log.status === 'success') {
          this.success('Execution completed successfully')
        } else {
          this.warning('Execution failed')
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
