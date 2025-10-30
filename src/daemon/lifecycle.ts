import { spawn } from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import { SupabaseError, SupabaseErrorCode } from '../errors'

import { DaemonClient } from './client'

export interface StartDaemonOptions {
  detached?: boolean
  logFile?: string
}

export class DaemonLifecycle {
  private client: DaemonClient

  constructor() {
    this.client = new DaemonClient()
  }

  /**
   * Get configuration directory
   */
  private getConfigDir(): string {
    const homeDir = os.homedir()
    return path.join(homeDir, '.supabase')
  }

  /**
   * Get the path to the CLI binary
   */
  private getCliBinaryPath(): string {
    // Get the path to the bin/run file
    const binPath = path.join(__dirname, '..', '..', 'bin', 'run')

    // Check if it exists
    if (fs.existsSync(binPath)) {
      return binPath
    }

    // Fallback to node_modules/.bin if installed as dependency
    const npmBinPath = path.join(__dirname, '..', '..', '..', '.bin', 'supabase-cli')
    if (fs.existsSync(npmBinPath)) {
      return npmBinPath
    }

    throw new SupabaseError(
      'Could not find CLI binary',
      SupabaseErrorCode.CONFIGURATION_ERROR,
      500,
    )
  }

  /**
   * Start daemon process
   */
  async start(options: StartDaemonOptions = {}): Promise<void> {
    // Check if already running
    if (await this.client.isRunning()) {
      throw new SupabaseError(
        'Daemon is already running',
        SupabaseErrorCode.CONFIGURATION_ERROR,
        400,
      )
    }

    const configDir = this.getConfigDir()
    const logFile = options.logFile ?? path.join(configDir, 'daemon.log')

    // Ensure config directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }

    // Clear old log file
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile)
    }

    // Get CLI binary path
    const binPath = this.getCliBinaryPath()

    // Spawn daemon process
    const detached = options.detached !== false

    const daemonProcess = spawn(
      process.execPath, // Use current Node.js executable
      [binPath, 'daemon:server'],
      {
        detached,
        stdio: detached ? ['ignore', 'ignore', 'ignore'] : ['ignore', 'pipe', 'pipe'],
      },
    )

    if (detached) {
      // Detach from parent process
      daemonProcess.unref()
    } else {
      // Capture output for non-detached mode
      if (daemonProcess.stdout) {
        daemonProcess.stdout.on('data', (data) => {
          fs.appendFileSync(logFile, data.toString())
        })
      }

      if (daemonProcess.stderr) {
        daemonProcess.stderr.on('data', (data) => {
          fs.appendFileSync(logFile, data.toString())
        })
      }
    }

    // Wait for daemon to be ready (max 5 seconds)
    for (let i = 0; i < 50; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100))

      if (await this.client.isRunning()) {
        return
      }
    }

    throw new SupabaseError(
      'Failed to start daemon: timeout waiting for daemon to be ready',
      SupabaseErrorCode.CONFIGURATION_ERROR,
      500,
    )
  }

  /**
   * Stop daemon process
   */
  async stop(): Promise<void> {
    await this.client.stop()
  }

  /**
   * Restart daemon process
   */
  async restart(options: StartDaemonOptions = {}): Promise<void> {
    // Stop if running
    if (await this.client.isRunning()) {
      await this.stop()
    }

    // Start daemon
    await this.start(options)
  }

  /**
   * Get daemon status
   */
  async status(): Promise<{
    running: boolean
    pid?: number
    socketPath?: string
  }> {
    return this.client.getStatus()
  }

  /**
   * Auto-start daemon if not running
   */
  async autoStart(): Promise<boolean> {
    if (await this.client.isRunning()) {
      return false
    }

    await this.start({ detached: true })
    return true
  }

  /**
   * Check if daemon mode is enabled
   */
  isDaemonModeEnabled(): boolean {
    return (
      process.env.SUPABASE_CLI_DAEMON === 'true' ||
      process.env.SUPABASE_CLI_DAEMON === '1'
    )
  }

  /**
   * Execute command via daemon (with auto-start)
   */
  async executeCommand(
    command: string,
    args: string[],
    flags: Record<string, unknown> = {},
  ): Promise<void> {
    // Auto-start daemon if not running
    if (!(await this.client.isRunning())) {
      await this.autoStart()
    }

    // Execute command
    const response = await this.client.execute(command, args, flags)

    // Output result
    if (response.output) {
      process.stdout.write(response.output)
    }

    if (response.error) {
      process.stderr.write(response.error)
    }

    // Exit with same code
    process.exit(response.exitCode)
  }
}
