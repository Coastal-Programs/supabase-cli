import { Flags } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { DaemonLifecycle } from '../../daemon/lifecycle'

export default class DaemonStart extends BaseCommand {
  static aliases = ['d:start']
  static description = 'Start the Supabase CLI daemon for faster command execution'

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
    const { flags } = await this.parse(DaemonStart)

    try {
      this.header('Supabase CLI Daemon')

      const lifecycle = new DaemonLifecycle()

      // Check if already running
      const status = await lifecycle.status()
      if (status.running) {
        this.warning(`Daemon is already running (PID: ${status.pid})`)
        this.info(`Socket: ${status.socketPath}`)
        process.exit(0)
      }

      // Start daemon
      await this.spinner(
        'Starting daemon...',
        async () => {
          await lifecycle.start({ detached: !flags.foreground })
        },
        'Daemon started successfully',
      )

      // Get status
      const newStatus = await lifecycle.status()
      this.info(`PID: ${newStatus.pid}`)
      this.info(`Socket: ${newStatus.socketPath}`)

      this.divider()
      this.success('Daemon is now running in the background')
      this.info('Commands will now execute 10x faster!')
      this.info('')
      this.info('To enable daemon mode globally, add this to your shell profile:')
      this.info('  export SUPABASE_CLI_DAEMON=true')
      this.info('')
      this.info('To stop the daemon:')
      this.info('  supabase-cli daemon stop')

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
