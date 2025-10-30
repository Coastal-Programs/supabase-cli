import { Command } from '@oclif/core'

import { DaemonServer } from '../../daemon/server'

/**
 * Internal command to run the daemon server
  static aliases = ['daemon:srv', 'dsrv']
 * This should not be called directly by users
 */
export default class DaemonServerCommand extends Command {
  static description = 'Run the daemon server (internal use only)'

  static hidden = true

  async run(): Promise<void> {
    const server = new DaemonServer()

    try {
      await server.start()

      // Keep process running
      process.on('SIGTERM', async () => {
        await server.shutdown()
      })

      process.on('SIGINT', async () => {
        await server.shutdown()
      })
    } catch (error) {
      console.error('Failed to start daemon server:', error)
      process.exit(1)
    }
  }
}
