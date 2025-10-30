import { BaseCommand } from '../../base-command'
import { DaemonLifecycle } from '../../daemon/lifecycle'

export default class DaemonStop extends BaseCommand {
  static description = 'Stop the Supabase CLI daemon'

  static aliases = ['d:stop']
  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    ...BaseCommand.baseFlags,
  }

  async run(): Promise<void> {
    try {
      this.header('Supabase CLI Daemon')

      const lifecycle = new DaemonLifecycle()

      // Check if running
      const status = await lifecycle.status()
      if (!status.running) {
        this.warning('Daemon is not running')
        process.exit(0)
      }

      // Stop daemon
      await this.spinner(
        `Stopping daemon (PID: ${status.pid})...`,
        async () => {
          await lifecycle.stop()
        },
        'Daemon stopped successfully',
      )

      this.divider()
      this.success('Daemon has been stopped')

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
