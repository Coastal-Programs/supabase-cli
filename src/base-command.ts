import { Command, Flags } from '@oclif/core'
import chalk from 'chalk'
import cliProgress from 'cli-progress'

import { Envelope, ResponseEnvelope } from './envelope'
import { SupabaseError, SupabaseErrorCode } from './errors'
import { Helper, OutputOptions } from './helper'
import { getProjectContext } from './utils/project-context'
import { addRecentProject, getRecentProjectByIndex } from './utils/recent'

export abstract class BaseCommand extends Command {
  /**
   * Common flags for all commands
   */
  static baseFlags = {
    color: Flags.boolean({
      allowNo: true,
      default: true,
      description: 'Enable color output',
    }),
    debug: Flags.boolean({
      default: false,
      description: 'Enable debug output',
    }),
    force: Flags.boolean({
      default: false,
      description: 'Force operation without confirmation',
    }),
    format: Flags.string({
      char: 'f',
      default: 'json',
      description: 'Output format',
      options: ['json', 'table', 'list', 'yaml'],
    }),
    'no-interactive': Flags.boolean({
      default: false,
      description: 'Disable interactive prompts',
    }),
    pretty: Flags.boolean({
      allowNo: true,
      default: true,
      description: 'Pretty print output',
    }),
    quiet: Flags.boolean({
      char: 'q',
      default: false,
      description: 'Suppress non-essential output',
    }),
    verbose: Flags.boolean({
      char: 'v',
      default: false,
      description: 'Enable verbose output',
    }),
    yes: Flags.boolean({
      char: 'y',
      default: false,
      description: 'Skip confirmation prompts',
    }),
  }

  protected outputOptions: OutputOptions = {}

  /**
   * Confirm action
   */
  protected async confirm(message: string, defaultValue = false): Promise<boolean> {
    const { flags } = await this.parse(this.constructor as typeof BaseCommand)

    // Skip confirmation if --yes or --force flag is set
    if (flags.yes || flags.force) {
      return true
    }

    // Skip confirmation if non-interactive mode
    if (flags['no-interactive']) {
      return defaultValue
    }

    // Use inquirer for interactive confirmation
    const inquirer = await import('inquirer')
    const { confirmed } = await inquirer.default.prompt([
      {
        default: defaultValue,
        message,
        name: 'confirmed',
        type: 'confirm',
      },
    ])

    return confirmed
  }

  /**
   * Create a multi-progress bar for parallel operations
   * Use when processing multiple items concurrently
   *
   * @returns MultiBar instance for managing multiple progress bars
   *
   * @example
   * ```typescript
   * const multiBar = this.createMultiBar()
   * const bar1 = multiBar.create(100, 0, { filename: 'file1.sql' })
   * const bar2 = multiBar.create(100, 0, { filename: 'file2.sql' })
   *
   * // Update progress
   * bar1.update(50)
   * bar2.update(75)
   *
   * // Stop all bars
   * multiBar.stop()
   * ```
   */
  protected createMultiBar(): cliProgress.MultiBar {
    return new cliProgress.MultiBar(
      {
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        clearOnComplete: false,
        format: '{bar} {percentage}% | {filename}',
        hideCursor: true,
        stopOnComplete: true,
      },
      cliProgress.Presets.shades_grey,
    )
  }

  /**
   * Create a single progress bar for operations with known steps
   * Use when the total number of steps is known in advance
   *
   * @param total - Total number of steps
   * @param initialValue - Initial progress value (default: 0)
   * @param format - Custom format string (optional)
   * @returns SingleBar instance
   *
   * @example
   * ```typescript
   * const progressBar = this.createProgressBar(migrations.length)
   *
   * for (let i = 0; i < migrations.length; i++) {
   *   progressBar.update(i, { task: `Applying ${migrations[i].name}...` })
   *   await this.applyMigration(migrations[i])
   * }
   *
   * progressBar.stop()
   * ```
   */
  protected createProgressBar(
    total: number,
    initialValue = 0,
    format?: string,
  ): cliProgress.SingleBar {
    const bar = new cliProgress.SingleBar(
      {
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        format: format || '{bar} {percentage}% | {value}/{total} | {task}',
        hideCursor: true,
      },
      cliProgress.Presets.shades_classic,
    )

    bar.start(total, initialValue, { task: 'Processing...' })
    return bar
  }

  /**
   * Divider
   */
  protected divider(): void {
    Helper.divider()
  }

  /**
   * Get project reference from flags, context, or environment
   * Priority order:
   * 1. --project or --project-ref flags
   * 2. --recent flag (lookup recent project by index)
   * 3. .supabase/config.json (project context)
   * 4. SUPABASE_PROJECT_REF environment variable
   * 5. Returns null if none found
   */
  protected async getProjectRef(flags: {
    project?: string
    'project-ref'?: string
    recent?: number
  }): Promise<{
    name?: string
    projectRef: null | string
    source: 'context' | 'env' | 'flag' | 'recent' | null
  }> {
    // 1. Check flags first
    const flagRef = flags.project || flags['project-ref']
    if (flagRef) {
      return { projectRef: flagRef, source: 'flag' }
    }

    // 2. Check recent flag
    if (flags.recent !== undefined) {
      const recentProject = getRecentProjectByIndex(flags.recent)
      if (recentProject) {
        // Show info message about using recent project
        const { flags: parsedFlags } = await this.parse(this.constructor as typeof BaseCommand)
        if (!parsedFlags.quiet) {
          this.info(`Using recent project: ${recentProject.name} (${recentProject.ref})`)
        }

        return {
          name: recentProject.name,
          projectRef: recentProject.ref,
          source: 'recent',
        }
      }

      // Recent index was provided but not found
      throw new SupabaseError(
        `No recent project found at index ${flags.recent}`,
        SupabaseErrorCode.RECENT_NOT_FOUND,
        404,
      )
    }

    // 3. Check project context (.supabase/config.json)
    const contextRef = await getProjectContext()
    if (contextRef) {
      return { projectRef: contextRef, source: 'context' }
    }

    // 4. Check environment variable
    const envRef = process.env.SUPABASE_PROJECT_REF
    if (envRef) {
      return { projectRef: envRef, source: 'env' }
    }

    // 5. None found
    return { projectRef: null, source: null }
  }

  /**
   * Handle error and output
   */
  protected handleError(error: unknown): never {
    const supabaseError = error instanceof SupabaseError ? error : SupabaseError.fromUnknown(error)

    Helper.error(supabaseError.message)

    if (supabaseError.details && process.env.DEBUG === 'true') {
      this.logDebug(JSON.stringify(supabaseError.details, null, 2))
    }

    this.error(supabaseError.message, {
      exit: supabaseError.statusCode ?? 1,
    })
  }

  /**
   * Header
   */
  protected header(title: string): void {
    Helper.header(title)
  }

  /**
   * Info message
   */
  protected info(message: string): void {
    Helper.info(message)
  }

  /**
   * Initialize command
   */
  async init(): Promise<void> {
    await super.init()

    // Set output options from flags
    const { flags } = await this.parse(this.constructor as typeof BaseCommand)
    this.outputOptions = {
      color: flags.color !== false,
      format: (flags.format as 'json' | 'list' | 'table' | 'yaml') ?? 'json',
      pretty: flags.pretty !== false,
    }

    // Set debug mode
    if (flags.debug) {
      process.env.DEBUG = 'true'
    }
  }

  /**
   * Debug message (renamed to avoid conflict with oclif's debug)
   */
  protected logDebug(message: string): void {
    Helper.debug(message)
  }

  /**
   * Format and output data
   */
  protected output(data: unknown): void {
    const formatted = Helper.formatOutput(data, this.outputOptions)
    this.log(formatted)
  }

  /**
   * Format and output envelope response
   */
  protected outputEnvelope<T>(envelope: ResponseEnvelope<T>): void {
    if (Envelope.isSuccess(envelope)) {
      this.output(envelope.data)
    } else {
      this.error(envelope.error.message, {
        exit: envelope.error.statusCode ?? 1,
      })
    }
  }

  /**
   * Run command with watch mode support
   *
   * @param fn - Function to execute
   * @param interval - Refresh interval in milliseconds (default 5000ms)
   * @param watchEnabled - Whether watch mode is enabled
   */
  protected async runWithWatch(
    fn: () => Promise<void>,
    interval: number = 5000,
    watchEnabled: boolean = false,
  ): Promise<void> {
    if (!watchEnabled) {
      return fn()
    }

    // Watch mode enabled
    let iteration = 0
    while (true) {
      iteration++

      // Clear screen (cross-platform)
      console.clear()

      // Show watch header
      const timestamp = new Date().toLocaleTimeString()
      this.log(
        chalk.cyan(`Watch mode: refreshing every ${interval / 1000}s`) +
          chalk.gray(` (Press Ctrl+C to stop)`),
      )
      this.log(chalk.gray(`Last update: ${timestamp} | Iteration: ${iteration}`))
      this.log('')

      try {
        await fn()
      } catch (error) {
        // Show error but keep watching
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred during watch'
        Helper.error(errorMessage)

        // Show debug info if available
        if (error instanceof SupabaseError && error.details && process.env.DEBUG === 'true') {
          this.logDebug(JSON.stringify(error.details, null, 2))
        }
      }

      // Wait for interval
      await new Promise((resolve) => setTimeout(resolve, interval))
    }
  }

  /**
   * Show spinner
   */
  protected async spinner<T>(
    message: string,
    fn: () => Promise<T>,
    successMessage?: string,
  ): Promise<T> {
    const ora = (await import('ora')).default
    const spinner = ora(message).start()

    try {
      const result = await fn()
      // Add space after checkmark for better readability
      const finalMessage = successMessage ?? message
      spinner.succeed(` ${finalMessage}`)
      return result
    } catch (error) {
      spinner.fail()
      throw error
    }
  }

  /**
   * Success message
   */
  protected success(message: string): void {
    Helper.success(message)
  }

  /**
   * Track recent project usage
   * Call this after successful command execution with project data
   */
  protected trackRecentProject(ref: string, name: string, commandId?: string): void {
    try {
      addRecentProject(ref, name, commandId)
    } catch {
      // Silently fail - don't block command execution
    }
  }

  /**
   * Warning message
   */
  protected warning(message: string): void {
    Helper.warning(message)
  }

  /**
   * Execute a function with a progress bar for operations with known steps
   * Automatically handles quiet mode and error cases
   *
   * @param total - Total number of steps
   * @param fn - Function that receives progress updater callback
   * @param options - Optional configuration
   * @returns Result from the function
   *
   * @example
   * ```typescript
   * const results = await this.withProgressBar(
   *   migrations.length,
   *   async (update) => {
   *     const results = []
   *     for (let i = 0; i < migrations.length; i++) {
   *       update(i, { task: `Applying ${migrations[i].name}...` })
   *       const result = await applyMigration(migrations[i])
   *       results.push(result)
   *     }
   *     return results
   *   }
   * )
   * ```
   */
  protected async withProgressBar<T>(
    total: number,
    fn: (update: (current: number, payload?: Record<string, unknown>) => void) => Promise<T>,
    options?: {
      format?: string
      initialMessage?: string
    },
  ): Promise<T> {
    const { flags } = await this.parse(this.constructor as typeof BaseCommand)

    // In quiet mode, skip progress bar and use simple execution
    if (flags.quiet) {
      return fn(() => {
        /* no-op */
      })
    }

    const progressBar = this.createProgressBar(total, 0, options?.format)

    try {
      const result = await fn((current: number, payload?: Record<string, unknown>) => {
        progressBar.update(current, payload || { task: 'Processing...' })
      })

      progressBar.stop()
      return result
    } catch (error) {
      progressBar.stop()
      throw error
    }
  }
}
