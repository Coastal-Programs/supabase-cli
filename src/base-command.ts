import { Command, Flags } from '@oclif/core'

import { Envelope, ResponseEnvelope } from './envelope'
import { SupabaseError } from './errors'
import { Helper, OutputOptions } from './helper'

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
   * Divider
   */
  protected divider(): void {
    Helper.divider()
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
      spinner.succeed(successMessage ?? message)
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
   * Warning message
   */
  protected warning(message: string): void {
    Helper.warning(message)
  }
}
