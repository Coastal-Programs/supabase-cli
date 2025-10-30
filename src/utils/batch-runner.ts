import { spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Result from executing a single command
 */
export interface CommandResult {
  command: string
  exitCode: number | null
  stdout: string
  stderr: string
  success: boolean
  duration: number
  id?: string
  error?: string
  timedOut?: boolean
}

/**
 * Batch execution options
 */
export interface BatchOptions {
  parallel?: number
  continueOnError?: boolean
  timeout?: number
  dryRun?: boolean
  verbose?: boolean
  quiet?: boolean
}

/**
 * Command definition from file
 */
export interface CommandDefinition {
  command: string
  args?: string[]
  id?: string
  timeout?: number
}

/**
 * Parse batch file and extract commands
 * Supports both simple text format and JSON format
 */
export function parseBatchFile(filepath: string): CommandDefinition[] {
  // Check if file exists
  if (!fs.existsSync(filepath)) {
    throw new Error(`Batch file not found: ${filepath}`)
  }

  // Read file
  const content = fs.readFileSync(filepath, 'utf-8')

  // Try to parse as JSON first
  try {
    const json = JSON.parse(content)
    if (Array.isArray(json)) {
      return json.map((item, index) => {
        if (typeof item === 'string') {
          return parseCommandString(item, index)
        }

        // Validate JSON command definition
        if (!item.command) {
          throw new Error(`Command at index ${index} missing 'command' field`)
        }

        return {
          command: item.command,
          args: item.args || [],
          id: item.id || `cmd-${index + 1}`,
          timeout: item.timeout,
        }
      })
    }
  } catch {
    // Not JSON, treat as simple text format
  }

  // Parse as simple text format (one command per line)
  const lines = content.split('\n')
  const commands: CommandDefinition[] = []

  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim()

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      continue
    }

    commands.push(parseCommandString(trimmed, index))
  }

  return commands
}

/**
 * Parse a command string into a CommandDefinition
 */
function parseCommandString(commandString: string, index: number): CommandDefinition {
  const parts = commandString.split(/\s+/)
  const command = parts[0]
  const args = parts.slice(1)

  return {
    command,
    args,
    id: `cmd-${index + 1}`,
  }
}

/**
 * Execute a single command
 */
export async function executeCommand(
  definition: CommandDefinition,
  options: BatchOptions = {},
): Promise<CommandResult> {
  const startTime = Date.now()

  // Build full command string for display
  const fullCommand = [definition.command, ...(definition.args || [])].join(' ')

  // Handle dry run
  if (options.dryRun) {
    return {
      command: fullCommand,
      exitCode: 0,
      stdout: '[DRY RUN] Command would be executed',
      stderr: '',
      success: true,
      duration: 0,
      id: definition.id,
    }
  }

  return new Promise((resolve) => {
    // Determine the binary to use
    let binary: string
    let args: string[] = []

    // Check if this is a supabase-cli command
    if (definition.command === 'supabase-cli' || definition.command.includes('supabase-cli')) {
      // Use the bin/run script directly
      const binPath = path.join(__dirname, '..', '..', 'bin', 'run')
      binary = process.execPath // Node.js executable
      args = [binPath, ...(definition.args || [])]
    } else {
      // Use the command as-is
      binary = definition.command
      args = definition.args || []
    }

    let stdout = ''
    let stderr = ''
    let timedOut = false

    const child = spawn(binary, args, {
      env: { ...process.env },
      shell: true,
    })

    // Set up timeout if specified
    let timeoutHandle: NodeJS.Timeout | undefined
    const timeoutMs = definition.timeout || options.timeout
    if (timeoutMs) {
      timeoutHandle = setTimeout(() => {
        timedOut = true
        child.kill('SIGTERM')

        // Force kill after 5 seconds if still running
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL')
          }
        }, 5000)
      }, timeoutMs * 1000)
    }

    // Capture stdout
    if (child.stdout) {
      child.stdout.on('data', (data) => {
        const text = data.toString()
        stdout += text
        if (options.verbose) {
          process.stdout.write(text)
        }
      })
    }

    // Capture stderr
    if (child.stderr) {
      child.stderr.on('data', (data) => {
        const text = data.toString()
        stderr += text
        if (options.verbose) {
          process.stderr.write(text)
        }
      })
    }

    // Handle completion
    child.on('close', (code) => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle)
      }

      const duration = Date.now() - startTime

      resolve({
        command: fullCommand,
        exitCode: code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        success: code === 0 && !timedOut,
        duration,
        id: definition.id,
        timedOut,
        error: timedOut ? 'Command timed out' : code !== 0 ? 'Command failed' : undefined,
      })
    })

    // Handle spawn errors
    child.on('error', (error) => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle)
      }

      const duration = Date.now() - startTime

      resolve({
        command: fullCommand,
        exitCode: -1,
        stdout: stdout.trim(),
        stderr: error.message,
        success: false,
        duration,
        id: definition.id,
        error: error.message,
      })
    })
  })
}

/**
 * Execute multiple commands with concurrency control
 */
export async function executeCommandBatch(
  commands: CommandDefinition[],
  options: BatchOptions = {},
): Promise<CommandResult[]> {
  const results: CommandResult[] = []
  const parallel = options.parallel || 5

  // Create a queue of commands
  const queue = [...commands]
  const executing = new Set<Promise<void>>()

  // Process queue with concurrency limit
  while (queue.length > 0 || executing.size > 0) {
    // Start new commands if we have capacity
    while (queue.length > 0 && executing.size < parallel) {
      const definition = queue.shift()!

      const promise = executeCommand(definition, options)
        .then((result) => {
          results.push(result)

          // Stop execution if command failed and continueOnError is false
          if (!result.success && !options.continueOnError) {
            // Clear the queue to stop processing
            queue.length = 0
          }
        })
        .finally(() => {
          executing.delete(promise)
        })

      executing.add(promise)
    }

    // Wait for at least one command to complete
    if (executing.size > 0) {
      await Promise.race(executing)
    }
  }

  // Sort results to match original command order
  return results.sort((a, b) => {
    const aIndex = commands.findIndex((cmd) => cmd.id === a.id)
    const bIndex = commands.findIndex((cmd) => cmd.id === b.id)
    return aIndex - bIndex
  })
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }

  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`
  }

  const minutes = Math.floor(ms / 60000)
  const seconds = ((ms % 60000) / 1000).toFixed(0)
  return `${minutes}m ${seconds}s`
}

/**
 * Calculate batch statistics
 */
export interface BatchStatistics {
  total: number
  successful: number
  failed: number
  timedOut: number
  totalDuration: number
  averageDuration: number
  successRate: number
}

export function calculateStatistics(results: CommandResult[]): BatchStatistics {
  const total = results.length
  const successful = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length
  const timedOut = results.filter((r) => r.timedOut).length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
  const averageDuration = total > 0 ? totalDuration / total : 0
  const successRate = total > 0 ? (successful / total) * 100 : 0

  return {
    total,
    successful,
    failed,
    timedOut,
    totalDuration,
    averageDuration,
    successRate,
  }
}

/**
 * Save results to JSON file
 */
export function saveResults(filepath: string, results: CommandResult[]): void {
  const statistics = calculateStatistics(results)

  const output = {
    timestamp: new Date().toISOString(),
    statistics,
    results,
  }

  fs.writeFileSync(filepath, JSON.stringify(output, null, 2), 'utf-8')
}
