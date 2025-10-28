import { Args } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { type ServiceHealth, getHealthCheck } from '../../supabase'

export default class MonitorHealth extends BaseCommand {
  static aliases = ['health', 'status']

  static args = {
    ref: Args.string({
      description: 'Project reference ID',
      required: true,
    }),
  }

  static description = 'System health check'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-project-ref',
    '<%= config.bin %> <%= command.id %> my-project-ref --format table',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MonitorHealth)

    try {
      // Fetch health check
      const health = await this.spinner(
        'Checking system health...',
        async () => getHealthCheck(args.ref),
        'Health check completed',
      )

      // Helper to get status indicator
      const getStatusIndicator = (service: ServiceHealth): string => {
        if (service.status === 'healthy') return '✓'
        if (service.status === 'degraded') return '⚠'
        return '✗'
      }

      // Add status indicators
      const healthWithIndicators = {
        api: {
          ...health.api,
          status_indicator: getStatusIndicator(health.api),
        },
        auth: {
          ...health.auth,
          status_indicator: getStatusIndicator(health.auth),
        },
        database: {
          ...health.database,
          status_indicator: getStatusIndicator(health.database),
        },
        functions: {
          ...health.functions,
          status_indicator: getStatusIndicator(health.functions),
        },
        storage: {
          ...health.storage,
          status_indicator: getStatusIndicator(health.storage),
        },
      }

      // Output results
      if (!flags.quiet) {
        this.header('System Health Check')
      }

      this.output(healthWithIndicators)

      if (!flags.quiet) {
        this.divider()

        // Display each service status
        const services = [
          { health: health.api, name: 'API' },
          { health: health.auth, name: 'Auth' },
          { health: health.database, name: 'Database' },
          { health: health.functions, name: 'Functions' },
          { health: health.storage, name: 'Storage' },
        ]

        for (const service of services) {
          const indicator = getStatusIndicator(service.health)
          const status = service.health.status.toUpperCase()
          const responseTime = `${service.health.response_time_ms}ms`

          if (service.health.status === 'healthy') {
            this.success(`${indicator} ${service.name}: ${status} (${responseTime})`)
          } else if (service.health.status === 'degraded') {
            this.warning(`${indicator} ${service.name}: ${status} (${responseTime})`)
          } else {
            this.warning(`${indicator} ${service.name}: ${status} (${responseTime})`)
          }

          if (service.health.message) {
            this.info(`   ${service.health.message}`)
          }
        }

        this.divider()

        // Overall status
        const allHealthy = services.every((s) => s.health.status === 'healthy')
        const anyDown = services.some((s) => s.health.status === 'down')

        if (allHealthy) {
          this.success('All systems operational')
        } else if (anyDown) {
          this.warning('One or more systems are down')
        } else {
          this.warning('Some systems are degraded')
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
