import * as fs from 'fs'
import * as net from 'net'
import * as os from 'os'
import * as path from 'path'

import { SupabaseError, SupabaseErrorCode } from '../errors'

import { DaemonCommand, DaemonResponse } from './server'

export interface DaemonClientOptions {
  socketPath?: string
  timeout?: number // milliseconds, default 60 seconds
}

export class DaemonClient {
  private readonly socketPath: string
  private readonly timeout: number
  private readonly pidFile: string

  constructor(options: DaemonClientOptions = {}) {
    const configDir = this.getConfigDir()

    this.socketPath = options.socketPath ?? this.getSocketPath(configDir)
    this.timeout = options.timeout ?? 60000 // 60 seconds
    this.pidFile = path.join(configDir, 'daemon.pid')
  }

  /**
   * Get configuration directory based on platform
   */
  private getConfigDir(): string {
    const homeDir = os.homedir()

    switch (os.platform()) {
      case 'win32':
        return path.join(homeDir, '.supabase')
      case 'darwin':
        return path.join(homeDir, '.supabase')
      default: // Linux and others
        return path.join(homeDir, '.supabase')
    }
  }

  /**
   * Get socket path based on platform
   */
  private getSocketPath(configDir: string): string {
    if (os.platform() === 'win32') {
      // Windows uses named pipes
      return '\\\\.\\pipe\\supabase-cli-daemon'
    }

    // Unix-like systems use Unix sockets
    return path.join(configDir, 'daemon.sock')
  }

  /**
   * Check if daemon is running
   */
  async isRunning(): Promise<boolean> {
    if (!fs.existsSync(this.pidFile)) {
      return false
    }

    try {
      const pid = parseInt(fs.readFileSync(this.pidFile, 'utf-8').trim(), 10)

      // Check if process is running
      try {
        process.kill(pid, 0) // Signal 0 checks if process exists
        return true
      } catch {
        // Process doesn't exist, clean up stale PID file
        if (fs.existsSync(this.pidFile)) {
          fs.unlinkSync(this.pidFile)
        }
        return false
      }
    } catch {
      return false
    }
  }

  /**
   * Get daemon PID
   */
  getPid(): number | null {
    if (!fs.existsSync(this.pidFile)) {
      return null
    }

    try {
      return parseInt(fs.readFileSync(this.pidFile, 'utf-8').trim(), 10)
    } catch {
      return null
    }
  }

  /**
   * Execute command via daemon
   */
  async execute(command: string, args: string[], flags: Record<string, unknown> = {}): Promise<DaemonResponse> {
    // Check if daemon is running
    if (!(await this.isRunning())) {
      throw new SupabaseError(
        'Daemon is not running. Start it with: supabase-cli daemon start',
        SupabaseErrorCode.CONFIGURATION_ERROR,
        400,
      )
    }

    return new Promise((resolve, reject) => {
      const socket = net.connect(this.socketPath)
      let responseBuffer = ''
      let timeoutHandle: NodeJS.Timeout

      // Set timeout
      timeoutHandle = setTimeout(() => {
        socket.destroy()
        reject(
          new SupabaseError(
            `Command execution timed out after ${this.timeout}ms`,
            SupabaseErrorCode.CONFIGURATION_ERROR,
            408,
          ),
        )
      }, this.timeout)

      socket.on('connect', () => {
        // Send command to daemon
        const daemonCommand: DaemonCommand = {
          args,
          command,
          cwd: process.cwd(),
          flags,
        }

        socket.write(JSON.stringify(daemonCommand) + '\n')
      })

      socket.on('data', (data) => {
        responseBuffer += data.toString()

        // Check if we have a complete response (ended with newline)
        if (responseBuffer.includes('\n')) {
          clearTimeout(timeoutHandle)

          try {
            const response: DaemonResponse = JSON.parse(responseBuffer.trim())
            socket.end()
            resolve(response)
          } catch (error) {
            socket.destroy()
            reject(
              new SupabaseError(
                `Failed to parse daemon response: ${error instanceof Error ? error.message : String(error)}`,
                SupabaseErrorCode.CONFIGURATION_ERROR,
                500,
              ),
            )
          }
        }
      })

      socket.on('error', (error) => {
        clearTimeout(timeoutHandle)
        reject(
          new SupabaseError(
            `Failed to connect to daemon: ${error.message}`,
            SupabaseErrorCode.CONFIGURATION_ERROR,
            500,
          ),
        )
      })

      socket.on('end', () => {
        clearTimeout(timeoutHandle)

        // If we haven't received a response yet, reject
        if (!responseBuffer.includes('\n')) {
          reject(
            new SupabaseError(
              'Connection closed before receiving response',
              SupabaseErrorCode.CONFIGURATION_ERROR,
              500,
            ),
          )
        }
      })
    })
  }

  /**
   * Stop the daemon
   */
  async stop(): Promise<void> {
    const pid = this.getPid()

    if (pid === null) {
      throw new SupabaseError(
        'Daemon is not running',
        SupabaseErrorCode.CONFIGURATION_ERROR,
        400,
      )
    }

    try {
      // Send SIGTERM to daemon process
      process.kill(pid, 'SIGTERM')

      // Wait for process to exit (max 5 seconds)
      for (let i = 0; i < 50; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100))

        try {
          process.kill(pid, 0) // Check if process still exists
        } catch {
          // Process has exited
          return
        }
      }

      // If still running, force kill
      try {
        process.kill(pid, 'SIGKILL')
      } catch {
        // Process already exited
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ESRCH') {
        // Process doesn't exist, clean up PID file
        if (fs.existsSync(this.pidFile)) {
          fs.unlinkSync(this.pidFile)
        }
        return
      }

      throw new SupabaseError(
        `Failed to stop daemon: ${error instanceof Error ? error.message : String(error)}`,
        SupabaseErrorCode.CONFIGURATION_ERROR,
        500,
      )
    }
  }

  /**
   * Get daemon status
   */
  async getStatus(): Promise<{
    running: boolean
    pid?: number
    socketPath?: string
  }> {
    const running = await this.isRunning()
    const pid = this.getPid()

    return {
      pid: pid ?? undefined,
      running,
      socketPath: running ? this.socketPath : undefined,
    }
  }
}
