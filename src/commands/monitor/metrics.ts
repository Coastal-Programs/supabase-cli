import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { getMetrics } from '../../supabase'

export default class MonitorMetrics extends BaseCommand {
  static aliases = ['metrics']

  static args = {
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'View performance metrics'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref',
    '<%= config.bin %> <%= command.id %> my-project-ref --period 24h',
    '<%= config.bin %> <%= command.id %> my-project-ref --period 7d --format table',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    period: Flags.string({
      default: '1h',
      description: 'Time period (1h, 24h, 7d, 30d)',
      options: ['1h', '24h', '7d', '30d'],
    }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MonitorMetrics)

    try {
      // Fetch metrics
      const metrics = await this.spinner(
        `Fetching metrics for period ${flags.period}...`,
        async () => getMetrics(args.ref, flags.period),
        'Metrics fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header(`Performance Metrics (${flags.period})`)
      }

      this.output(metrics)

      if (!flags.quiet) {
        this.divider()
        this.info('API Response Time:')
        this.info(`  Average: ${metrics.api_response_time_avg.toFixed(2)}ms`)
        this.info(`  P95: ${metrics.api_response_time_p95.toFixed(2)}ms`)
        this.info(`  P99: ${metrics.api_response_time_p99.toFixed(2)}ms`)

        this.divider()
        this.info('Database Query Time:')
        this.info(`  Average: ${metrics.database_query_time_avg.toFixed(2)}ms`)
        this.info(`  P95: ${metrics.database_query_time_p95.toFixed(2)}ms`)
        this.info(`  P99: ${metrics.database_query_time_p99.toFixed(2)}ms`)

        this.divider()
        this.info('Function Execution Time:')
        this.info(`  Average: ${metrics.function_execution_time_avg.toFixed(2)}ms`)
        this.info(`  P95: ${metrics.function_execution_time_p95.toFixed(2)}ms`)
        this.info(`  P99: ${metrics.function_execution_time_p99.toFixed(2)}ms`)

        this.divider()
        const storageGB = (metrics.storage_usage_bytes / 1024 ** 3).toFixed(2)
        this.info(`Storage Usage: ${storageGB} GB`)
        this.info(`Period: ${metrics.period}`)
        this.info(`Timestamp: ${new Date(metrics.timestamp).toLocaleString()}`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
