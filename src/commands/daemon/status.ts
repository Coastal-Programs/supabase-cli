import { BaseCommand } from '../../base-command'
import { DaemonLifecycle } from '../../daemon/lifecycle'

export default class DaemonStatus extends BaseCommand {
  static description = 'Check the status of the Supabase CLI daemon'

  static aliases = ['d:status', 'ds']
  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    ...BaseCommand.baseFlags,
  }

  async run(): Promise<void> {
    try {
      this.header('Supabase CLI Daemon Status')

      const lifecycle = new DaemonLifecycle()
      const status = await lifecycle.status()

      if (status.running) {
        this.success('Daemon is running')
        this.info(`PID: ${status.pid}`)
        this.info(`Socket: ${status.socketPath}`)

        this.divider()

        const daemonModeEnabled = lifecycle.isDaemonModeEnabled()
        if (daemonModeEnabled) {
          this.success('Daemon mode is ENABLED (SUPABASE_CLI_DAEMON=true)')
          this.info('All commands will use daemon for faster execution')
        } else {
          this.warning('Daemon mode is DISABLED')
          this.info('To enable daemon mode, set: export SUPABASE_CLI_DAEMON=true')
        }
      } else {
        this.warning('Daemon is not running')
        this.info('Start the daemon with: supabase-cli daemon start')
      }

      this.divider()

      // Output JSON if requested
      if (this.outputOptions.format === 'json') {
        this.output({
          daemonModeEnabled: lifecycle.isDaemonModeEnabled(),
          ...status,
        })
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
