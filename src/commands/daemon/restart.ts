import { Flags } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { DaemonLifecycle } from '../../daemon/lifecycle'

export default class DaemonRestart extends BaseCommand {
  static aliases = ['d:restart']
  static description = 'Restart the Supabase CLI daemon'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --foreground',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    foreground: Flags.boolean({
      default: false,
      description: 'Run daemon in foreground (for debugging)',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(DaemonRestart)

    try {
      this.header('Supabase CLI Daemon')

      const lifecycle = new DaemonLifecycle()

      // Restart daemon
      await this.spinner(
        'Restarting daemon...',
        async () => {
          await lifecycle.restart({ detached: !flags.foreground })
        },
        'Daemon restarted successfully',
      )

      // Get status
      const status = await lifecycle.status()
      this.info(`PID: ${status.pid}`)
      this.info(`Socket: ${status.socketPath}`)

      this.divider()
      this.success('Daemon has been restarted')

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
