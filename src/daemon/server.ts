import * as fs from 'fs'
import * as net from 'net'
import * as os from 'os'
import * as path from 'path'

import { SupabaseError, SupabaseErrorCode } from '../errors'

export interface DaemonCommand {
  command: string
  args: string[]
  flags: Record<string, unknown>
  cwd: string
}

export interface DaemonResponse {
  success: boolean
  output?: string
  error?: string
  exitCode: number
  duration: number
}

export interface DaemonServerOptions {
  inactivityTimeout?: number // milliseconds, default 30 minutes
  logFile?: string
  socketPath?: string
}

export class DaemonServer {
  private server: net.Server | null = null
  private lastActivity: number = Date.now()
  private inactivityTimer: NodeJS.Timeout | null = null
  private readonly inactivityTimeout: number
  private readonly logFile: string
  private readonly socketPath: string
  private readonly pidFile: string
  private isShuttingDown = false

  constructor(options: DaemonServerOptions = {}) {
    const configDir = this.getConfigDir()

    this.inactivityTimeout = options.inactivityTimeout ?? 30 * 60 * 1000 // 30 minutes
    this.logFile = options.logFile ?? path.join(configDir, 'daemon.log')
    this.socketPath = options.socketPath ?? this.getSocketPath(configDir)
    this.pidFile = path.join(configDir, 'daemon.pid')

    // Ensure config directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }
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
   * Log message to file
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}\n`

    try {
      fs.appendFileSync(this.logFile, logMessage)
    } catch (error) {
      console.error('Failed to write to log file:', error)
    }
  }

  /**
   * Reset inactivity timer
   */
  private resetInactivityTimer(): void {
    this.lastActivity = Date.now()

    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
    }

    this.inactivityTimer = setTimeout(() => {
      this.log('Inactivity timeout reached. Shutting down daemon.')
      this.shutdown()
    }, this.inactivityTimeout)
  }

  /**
   * Write PID file
   */
  private writePidFile(): void {
    fs.writeFileSync(this.pidFile, process.pid.toString())
  }

  /**
   * Remove PID file
   */
  private removePidFile(): void {
    if (fs.existsSync(this.pidFile)) {
      fs.unlinkSync(this.pidFile)
    }
  }

  /**
   * Handle incoming command
   */
  private async handleCommand(command: DaemonCommand): Promise<DaemonResponse> {
    const startTime = Date.now()
    this.resetInactivityTimer()

    this.log(`Executing command: ${command.command} ${command.args.join(' ')}`)

    try {
      // Capture stdout and stderr
      const originalStdoutWrite = process.stdout.write.bind(process.stdout)
      const originalStderrWrite = process.stderr.write.bind(process.stderr)
      let output = ''
      let errorOutput = ''

      // Override stdout.write
      process.stdout.write = ((chunk: any, encoding?: any, callback?: any): boolean => {
        output += chunk.toString()
        return originalStdoutWrite(chunk, encoding, callback)
      }) as typeof process.stdout.write

      // Override stderr.write
      process.stderr.write = ((chunk: any, encoding?: any, callback?: any): boolean => {
        errorOutput += chunk.toString()
        return originalStderrWrite(chunk, encoding, callback)
      }) as typeof process.stderr.write

      try {
        // Change working directory to match client
        const originalCwd = process.cwd()
        if (command.cwd) {
          process.chdir(command.cwd)
        }

        // Execute command using oclif
        const { run } = await import('@oclif/core')

        // Build argv array
        const argv = [command.command, ...command.args]

        // Convert flags to command line arguments
        for (const [key, value] of Object.entries(command.flags)) {
          if (typeof value === 'boolean') {
            if (value) {
              argv.push(`--${key}`)
            }
          } else if (value !== undefined && value !== null) {
            argv.push(`--${key}`, String(value))
          }
        }

        await run(argv)

        // Restore working directory
        process.chdir(originalCwd)

        // Restore stdout and stderr
        process.stdout.write = originalStdoutWrite
        process.stderr.write = originalStderrWrite

        const duration = Date.now() - startTime
        this.log(`Command completed successfully in ${duration}ms`)

        return {
          duration,
          exitCode: 0,
          output: output || errorOutput,
          success: true,
        }
      } catch (error) {
        // Restore stdout and stderr
        process.stdout.write = originalStdoutWrite
        process.stderr.write = originalStderrWrite

        const duration = Date.now() - startTime
        const errorMessage = error instanceof Error ? error.message : String(error)
        this.log(`Command failed in ${duration}ms: ${errorMessage}`)

        return {
          duration,
          error: errorOutput || errorMessage,
          exitCode: 1,
          success: false,
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.log(`Command execution error: ${errorMessage}`)

      return {
        duration,
        error: errorMessage,
        exitCode: 1,
        success: false,
      }
    }
  }

  /**
   * Start the daemon server
   */
  async start(): Promise<void> {
    // Check if daemon is already running
    if (this.isRunning()) {
      throw new SupabaseError(
        'Daemon is already running',
        SupabaseErrorCode.CONFIGURATION_ERROR,
        400,
      )
    }

    // Remove stale socket file on Unix
    if (os.platform() !== 'win32' && fs.existsSync(this.socketPath)) {
      fs.unlinkSync(this.socketPath)
    }

    // Create server
    this.server = net.createServer((socket) => {
      this.log('Client connected')

      let buffer = ''

      socket.on('data', async (data) => {
        buffer += data.toString()

        // Check if we have a complete message (ended with newline)
        if (buffer.includes('\n')) {
          const messages = buffer.split('\n')
          buffer = messages.pop() || '' // Keep incomplete message in buffer

          for (const message of messages) {
            if (!message.trim()) continue

            try {
              const command: DaemonCommand = JSON.parse(message)
              const response = await this.handleCommand(command)

              // Send response back to client
              socket.write(JSON.stringify(response) + '\n')
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error)
              this.log(`Error parsing command: ${errorMessage}`)

              socket.write(
                JSON.stringify({
                  duration: 0,
                  error: errorMessage,
                  exitCode: 1,
                  success: false,
                } as DaemonResponse) + '\n',
              )
            }
          }
        }
      })

      socket.on('end', () => {
        this.log('Client disconnected')
      })

      socket.on('error', (error) => {
        this.log(`Socket error: ${error.message}`)
      })
    })

    // Start listening
    return new Promise((resolve, reject) => {
      this.server!.listen(this.socketPath, () => {
        this.log(`Daemon server started on ${this.socketPath}`)
        this.writePidFile()
        this.resetInactivityTimer()

        // Setup signal handlers
        this.setupSignalHandlers()

        resolve()
      })

      this.server!.on('error', (error) => {
        this.log(`Server error: ${error.message}`)
        reject(error)
      })
    })
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    const shutdown = () => {
      if (!this.isShuttingDown) {
        this.log('Received shutdown signal')
        this.shutdown()
      }
    }

    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)

    // Windows doesn't support SIGTERM/SIGINT properly, so we use other events
    if (os.platform() === 'win32') {
      process.on('SIGBREAK', shutdown)
    }
  }

  /**
   * Check if daemon is running
   */
  isRunning(): boolean {
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
        this.removePidFile()
        return false
      }
    } catch {
      return false
    }
  }

  /**
   * Get daemon status
   */
  getStatus(): {
    running: boolean
    pid?: number
    uptime?: number
    lastActivity?: number
  } {
    if (!this.isRunning()) {
      return { running: false }
    }

    const pid = parseInt(fs.readFileSync(this.pidFile, 'utf-8').trim(), 10)
    const uptime = Date.now() - this.lastActivity

    return {
      lastActivity: this.lastActivity,
      pid,
      running: true,
      uptime,
    }
  }

  /**
   * Shutdown the daemon server
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return
    }

    this.isShuttingDown = true
    this.log('Shutting down daemon server')

    // Clear inactivity timer
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
    }

    // Close server
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => {
          this.log('Server closed')
          resolve()
        })
      })
    }

    // Remove socket file on Unix
    if (os.platform() !== 'win32' && fs.existsSync(this.socketPath)) {
      fs.unlinkSync(this.socketPath)
    }

    // Remove PID file
    this.removePidFile()

    this.log('Daemon shutdown complete')

    // Exit process
    process.exit(0)
  }
}
