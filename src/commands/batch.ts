import { Flags } from '@oclif/core'
import chalk from 'chalk'
import cliProgress from 'cli-progress'

import { BaseCommand } from '../base-command'
import { AutomationFlags, FileFlags } from '../base-flags'
import {
  BatchOptions,
  calculateStatistics,
  CommandResult,
  executeCommandBatch,
  formatDuration,
  parseBatchFile,
  saveResults,
} from '../utils/batch-runner'

export default class Batch extends BaseCommand {
  static description = 'Execute multiple CLI commands from a file in parallel'

  static examples = [
    '<%= config.bin %> <%= command.id %> --file commands.txt',
    '<%= config.bin %> <%= command.id %> --file commands.json --parallel 10',
    '<%= config.bin %> <%= command.id %> --file commands.txt --dry-run',
    '<%= config.bin %> <%= command.id %> --file commands.txt --continue-on-error --output results.json',
    '<%= config.bin %> <%= command.id %> --file commands.txt --timeout 30',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...AutomationFlags,
    ...FileFlags,
    file: Flags.string({
      char: 'f',
      description: 'Path to file containing commands',
      required: true,
    }),
    parallel: Flags.integer({
      char: 'p',
      default: 5,
      description: 'Maximum number of concurrent commands',
    }),
    'dry-run': Flags.boolean({
      default: false,
      description: 'Show what would be executed without running',
    }),
    'continue-on-error': Flags.boolean({
      default: false,
      description: 'Continue executing even if commands fail',
    }),
    timeout: Flags.integer({
      char: 't',
      description: 'Timeout per command in seconds',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Batch)

    try {
      // Parse batch file
      this.header('Batch Execution')

      if (!flags.quiet) {
        this.info(`Reading commands from: ${flags.file}`)
      }

      const commands = parseBatchFile(flags.file)

      if (commands.length === 0) {
        this.warning('No commands found in batch file')
        process.exit(0)
      }

      if (!flags.quiet) {
        this.info(`Found ${commands.length} command(s)`)
        this.divider()
      }

      // Show commands if dry-run or verbose
      if (flags['dry-run'] || flags.verbose) {
        this.log(chalk.bold('\nCommands to execute:'))
        for (const cmd of commands) {
          const fullCommand = [cmd.command, ...(cmd.args || [])].join(' ')
          this.log(`  ${chalk.cyan(cmd.id || 'N/A')}: ${fullCommand}`)
        }
        this.divider()
      }

      if (flags['dry-run']) {
        this.success('Dry run completed. No commands were executed.')
        process.exit(0)
      }

      // Prepare batch options
      const batchOptions: BatchOptions = {
        parallel: flags.parallel,
        continueOnError: flags['continue-on-error'],
        timeout: flags.timeout,
        dryRun: false,
        verbose: flags.verbose,
        quiet: flags.quiet,
      }

      // Execute with progress tracking
      const results = await this.executeWithProgress(commands, batchOptions)

      // Calculate statistics
      const stats = calculateStatistics(results)

      // Display results
      this.displayResults(results, stats, flags.quiet)

      // Save results to file if requested
      if (flags.output) {
        saveResults(flags.output, results)
        if (!flags.quiet) {
          this.info(`Results saved to: ${flags.output}`)
        }
      }

      // Exit with appropriate code
      if (stats.failed > 0) {
        process.exit(1)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Execute commands with progress tracking
   */
  private async executeWithProgress(
    commands: { args?: string[]; command: string; id?: string; timeout?: number }[],
    options: BatchOptions,
  ): Promise<CommandResult[]> {
    const { flags } = await this.parse(Batch)

    // Skip progress bars in quiet mode
    if (flags.quiet) {
      return executeCommandBatch(commands, options)
    }

    // Create multi-bar for tracking
    const multiBar = this.createMultiBar()

    // Create progress bars for active commands
    const bars = new Map<string, cliProgress.SingleBar>()
    const completed = new Set<string>()
    const results: CommandResult[] = []

    // Modify batch options to track progress
    const parallel = options.parallel || 5
    const queue = [...commands]
    const executing = new Set<Promise<void>>()

    // Process queue with concurrency and progress tracking
    while (queue.length > 0 || executing.size > 0) {
      // Start new commands if we have capacity
      while (queue.length > 0 && executing.size < parallel) {
        const definition = queue.shift()!
        const cmdId = definition.id || 'unknown'

        // Create progress bar for this command
        const bar = multiBar.create(100, 0, {
          filename: this.truncateCommand([definition.command, ...(definition.args || [])].join(' ')),
          status: 'Running',
        })
        bars.set(cmdId, bar)

        // Import executeCommand locally
        const { executeCommand } = await import('../utils/batch-runner')

        const promise = executeCommand(definition, options)
          .then((result) => {
            results.push(result)

            // Update progress bar
            const resultBar = bars.get(cmdId)
            if (resultBar) {
              resultBar.update(100, {
                filename: this.truncateCommand(result.command),
                status: result.success ? chalk.green('Success') : chalk.red('Failed'),
              })
            }

            completed.add(cmdId)

            // Stop execution if command failed and continueOnError is false
            if (!result.success && !options.continueOnError) {
              // Clear the queue to stop processing
              queue.length = 0
            }
          })
          .catch((error) => {
            // Handle unexpected errors
            const resultBar = bars.get(cmdId)
            if (resultBar) {
              resultBar.update(100, {
                filename: this.truncateCommand([definition.command, ...(definition.args || [])].join(' ')),
                status: chalk.red('Error'),
              })
            }

            results.push({
              command: [definition.command, ...(definition.args || [])].join(' '),
              exitCode: -1,
              stdout: '',
              stderr: error.message,
              success: false,
              duration: 0,
              id: cmdId,
              error: error.message,
            })

            completed.add(cmdId)

            if (!options.continueOnError) {
              queue.length = 0
            }
          })
          .finally(() => {
            executing.delete(promise)
          })

        executing.add(promise)

        // Update bar to show it started
        bar.update(10, {
          filename: this.truncateCommand([definition.command, ...(definition.args || [])].join(' ')),
          status: 'Running',
        })
      }

      // Wait for at least one command to complete
      if (executing.size > 0) {
        await Promise.race(executing)
      }
    }

    // Stop all bars
    multiBar.stop()

    // Sort results to match original command order
    return results.sort((a, b) => {
      const aIndex = commands.findIndex((cmd) => cmd.id === a.id)
      const bIndex = commands.findIndex((cmd) => cmd.id === b.id)
      return aIndex - bIndex
    })
  }

  /**
   * Truncate command for display
   */
  private truncateCommand(command: string, maxLength = 50): string {
    if (command.length <= maxLength) {
      return command
    }

    return command.slice(0, maxLength - 3) + '...'
  }

  /**
   * Display execution results
   */
  private displayResults(
    results: CommandResult[],
    stats: { averageDuration: number; failed: number; successRate: number; successful: number; timedOut: number; total: number; totalDuration: number },
    quiet: boolean,
  ): void {
    if (quiet) {
      return
    }

    this.divider()
    this.header('Execution Results')

    // Summary statistics
    this.log(chalk.bold('\nSummary:'))
    this.log(`  Total commands:    ${stats.total}`)
    this.log(`  Successful:        ${chalk.green(stats.successful.toString())}`)
    this.log(`  Failed:            ${stats.failed > 0 ? chalk.red(stats.failed.toString()) : stats.failed}`)
    if (stats.timedOut > 0) {
      this.log(`  Timed out:         ${chalk.yellow(stats.timedOut.toString())}`)
    }
    this.log(`  Success rate:      ${stats.successRate.toFixed(1)}%`)
    this.log(`  Total duration:    ${formatDuration(stats.totalDuration)}`)
    this.log(`  Average duration:  ${formatDuration(stats.averageDuration)}`)

    // Failed commands details
    const failedCommands = results.filter((r) => !r.success)
    if (failedCommands.length > 0) {
      this.log(chalk.bold('\nFailed Commands:'))
      for (const result of failedCommands) {
        this.log(`\n  ${chalk.red('✗')} ${result.id}: ${result.command}`)
        if (result.error) {
          this.log(`    Error: ${chalk.red(result.error)}`)
        }
        if (result.stderr) {
          this.log(`    ${chalk.gray(result.stderr.split('\n')[0])}`) // First line only
        }
      }
    }

    // Successful commands summary
    const successfulCommands = results.filter((r) => r.success)
    if (successfulCommands.length > 0) {
      this.log(chalk.bold('\nSuccessful Commands:'))
      for (const result of successfulCommands) {
        this.log(`  ${chalk.green('✓')} ${result.id}: ${result.command} (${formatDuration(result.duration)})`)
      }
    }
  }
}
