import chalk from 'chalk'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as readline from 'readline'
import { promisify } from 'util'

const execAsync = promisify(require('child_process').exec)

export interface ReplOptions {
  /**
   * Custom prompt string
   */
  prompt?: string

  /**
   * Path to history file
   */
  historyFile?: string

  /**
   * Maximum history size
   */
  historySize?: number

  /**
   * Available commands for autocomplete
   */
  availableCommands?: string[]

  /**
   * Handler for command execution
   */
  onCommand?: (cmd: string) => Promise<void>

  /**
   * Handler for exit
   */
  onExit?: () => void

  /**
   * Binary name (for executing commands)
   */
  binaryName?: string

  /**
   * Enable debug mode
   */
  debug?: boolean
}

export interface ReplContext {
  projectRef?: string
  projectName?: string
  lastCommand?: string
  commandCount: number
  startTime: number
}

/**
 * Interactive REPL for Supabase CLI
 */
export class SupabaseRepl {
  private rl: readline.Interface
  private history: string[] = []
  private context: ReplContext
  private options: Required<ReplOptions>
  private isRunning = false

  constructor(options: ReplOptions = {}) {
    this.options = {
      availableCommands: options.availableCommands || [],
      binaryName: options.binaryName || 'supabase-cli',
      debug: options.debug || false,
      historyFile: options.historyFile || path.join(os.homedir(), '.supabase-cli', 'repl-history'),
      historySize: options.historySize || 1000,
      onCommand: options.onCommand || this.defaultCommandHandler.bind(this),
      onExit: options.onExit || this.defaultExitHandler.bind(this),
      prompt: options.prompt || '> ',
    }

    this.context = {
      commandCount: 0,
      startTime: Date.now(),
    }

    this.rl = readline.createInterface({
      completer: this.completer.bind(this),
      input: process.stdin,
      output: process.stdout,
      prompt: this.getPrompt(),
    })

    this.loadHistory()
    this.setupEventHandlers()
  }

  /**
   * Get current prompt string
   */
  public getPrompt(): string {
    if (this.context.projectRef && this.context.projectName) {
      return chalk.cyan(`[${this.context.projectName}]`) + ' > '
    }

    return chalk.gray(this.options.prompt)
  }

  /**
   * Set current project context
   */
  public setProject(ref: string, name?: string): void {
    this.context.projectRef = ref
    this.context.projectName = name || ref.slice(0, 8)
    this.rl.setPrompt(this.getPrompt())
  }

  /**
   * Clear current project context
   */
  public clearProject(): void {
    this.context.projectRef = undefined
    this.context.projectName = undefined
    this.rl.setPrompt(this.getPrompt())
  }

  /**
   * Start the REPL
   */
  public start(): void {
    if (this.isRunning) {
      console.log(chalk.yellow('REPL is already running'))
      return
    }

    this.isRunning = true
    this.showWelcome()
    this.rl.prompt()
  }

  /**
   * Stop the REPL
   */
  public stop(): void {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    this.saveHistory()
    this.rl.close()
    this.options.onExit()
  }

  /**
   * Show welcome banner
   */
  private showWelcome(): void {
    console.log(chalk.bold.cyan('\n╔══════════════════════════════════════╗'))
    console.log(chalk.bold.cyan('║   Supabase CLI Interactive Mode      ║'))
    console.log(chalk.bold.cyan('╚══════════════════════════════════════╝\n'))

    console.log(chalk.gray("Type commands without 'supabase-cli' prefix"))
    console.log(chalk.gray('Special commands: help, clear, exit, history, .commands\n'))

    if (this.context.projectRef) {
      console.log(
        chalk.green(
          `Current project: ${this.context.projectName} (${this.context.projectRef})`,
        ) + '\n',
      )
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Handle line input
    this.rl.on('line', async (input: string) => {
      const trimmed = input.trim()

      if (!trimmed) {
        this.rl.prompt()
        return
      }

      // Add to history
      this.addToHistory(trimmed)

      // Handle special commands
      if (this.handleSpecialCommands(trimmed)) {
        this.rl.prompt()
        return
      }

      // Execute command
      try {
        this.context.lastCommand = trimmed
        this.context.commandCount++
        await this.options.onCommand(trimmed)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(chalk.red('Error:'), errorMessage)
      }

      this.rl.prompt()
    })

    // Handle Ctrl+C
    this.rl.on('SIGINT', () => {
      console.log(chalk.yellow('\nPress Ctrl+D or type "exit" to quit'))
      this.rl.prompt()
    })

    // Handle close
    this.rl.on('close', () => {
      if (this.isRunning) {
        this.stop()
      }
    })
  }

  /**
   * Handle special commands (returns true if handled)
   */
  private handleSpecialCommands(cmd: string): boolean {
    const lower = cmd.toLowerCase()

    // Exit commands
    if (['exit', 'quit', 'q'].includes(lower)) {
      console.log(chalk.cyan('\nGoodbye!'))
      this.stop()
      return true
    }

    // Help command
    if (lower === 'help' || lower === '?') {
      this.showHelp()
      return true
    }

    // Clear screen
    if (lower === 'clear' || lower === 'cls') {
      console.clear()
      this.showWelcome()
      return true
    }

    // Show history
    if (lower === 'history') {
      this.showHistory()
      return true
    }

    // List all available commands
    if (lower === '.commands') {
      this.showCommands()
      return true
    }

    // Show context
    if (lower === '.context' || lower === 'context') {
      this.showContext()
      return true
    }

    // Use project context
    if (lower.startsWith('use ')) {
      const projectRef = cmd.slice(4).trim()
      if (projectRef) {
        this.setProject(projectRef)
        console.log(chalk.green(`Switched to project: ${projectRef}`))
      } else {
        console.log(chalk.red('Usage: use <project-ref>'))
      }

      return true
    }

    // Clear project context
    if (lower === 'unuse' || lower === 'clear-context') {
      this.clearProject()
      console.log(chalk.green('Cleared project context'))
      return true
    }

    // Show stats
    if (lower === '.stats' || lower === 'stats') {
      this.showStats()
      return true
    }

    return false
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log(chalk.bold('\nInteractive Mode Help:'))
    console.log(chalk.cyan('\nSpecial Commands:'))
    console.log(
      '  ' + chalk.yellow('help, ?') + '              - Show this help message',
    )
    console.log(
      '  ' + chalk.yellow('clear, cls') + '           - Clear screen',
    )
    console.log(
      '  ' + chalk.yellow('exit, quit, q') + '        - Exit interactive mode',
    )
    console.log(
      '  ' + chalk.yellow('history') + '              - Show command history',
    )
    console.log(
      '  ' + chalk.yellow('.commands') + '            - List all available commands',
    )
    console.log(
      '  ' + chalk.yellow('.context, context') + '    - Show current context',
    )
    console.log(
      '  ' + chalk.yellow('.stats, stats') + '        - Show session statistics',
    )
    console.log(
      '  ' + chalk.yellow('use <project-ref>') + '    - Set project context',
    )
    console.log(
      '  ' + chalk.yellow('unuse, clear-context') + ' - Clear project context',
    )

    console.log(chalk.cyan('\nContext Management:'))
    console.log(
      '  When a project is set via "use", you can omit --project flag',
    )
    console.log('  Example:')
    console.log(chalk.gray('    > use ygzhmowennlaehudyyey'))
    console.log(chalk.gray('    > db:info              # Uses set project'))
    console.log(chalk.gray('    > unuse'))

    console.log(chalk.cyan('\nKeyboard Shortcuts:'))
    console.log('  ' + chalk.yellow('Ctrl+C') + '               - Cancel current input')
    console.log('  ' + chalk.yellow('Ctrl+D') + '               - Exit interactive mode')
    console.log('  ' + chalk.yellow('Up/Down Arrow') + '        - Navigate history')
    console.log('  ' + chalk.yellow('Tab') + '                  - Autocomplete commands')

    console.log(chalk.cyan('\nExamples:'))
    console.log(chalk.gray('  > projects:list'))
    console.log(chalk.gray('  > projects:get --project ygzhmowennlaehudyyey'))
    console.log(chalk.gray('  > use ygzhmowennlaehudyyey'))
    console.log(chalk.gray('  > db:info'))
    console.log(chalk.gray('  > functions:list --format table'))
    console.log('')
  }

  /**
   * Show command history
   */
  private showHistory(): void {
    if (this.history.length === 0) {
      console.log(chalk.gray('No command history'))
      return
    }

    console.log(chalk.bold('\nCommand History:'))
    const recentHistory = this.history.slice(-20) // Show last 20
    recentHistory.forEach((cmd, index) => {
      const lineNum = this.history.length - recentHistory.length + index + 1
      console.log(chalk.gray(`  ${lineNum.toString().padStart(4)}: `) + cmd)
    })

    if (this.history.length > 20) {
      console.log(
        chalk.gray(
          `\n  ... and ${this.history.length - 20} more. History saved to: ${this.options.historyFile}`,
        ),
      )
    }

    console.log('')
  }

  /**
   * Show available commands
   */
  private showCommands(): void {
    if (this.options.availableCommands.length === 0) {
      console.log(chalk.yellow('\nNo commands available. Try running "help" for more info.'))
      return
    }

    console.log(chalk.bold('\nAvailable Commands:'))

    // Group commands by topic
    const grouped: Record<string, string[]> = {}
    for (const cmd of this.options.availableCommands) {
      const [topic] = cmd.split(':')
      if (!grouped[topic]) {
        grouped[topic] = []
      }

      grouped[topic].push(cmd)
    }

    // Display grouped commands
    const sortedTopics = Object.keys(grouped).sort()
    for (const topic of sortedTopics) {
      console.log(chalk.cyan(`\n${topic}:`))
      for (const cmd of grouped[topic].sort()) {
        console.log('  ' + chalk.gray(cmd))
      }
    }

    console.log('')
  }

  /**
   * Show current context
   */
  private showContext(): void {
    console.log(chalk.bold('\nCurrent Context:'))

    if (this.context.projectRef) {
      console.log(
        chalk.green(
          `  Project: ${this.context.projectName} (${this.context.projectRef})`,
        ),
      )
    } else {
      console.log(chalk.gray('  Project: Not set (use "use <project-ref>" to set)'))
    }

    if (this.context.lastCommand) {
      console.log(chalk.gray(`  Last command: ${this.context.lastCommand}`))
    }

    console.log('')
  }

  /**
   * Show session statistics
   */
  private showStats(): void {
    const uptime = Math.floor((Date.now() - this.context.startTime) / 1000)
    const minutes = Math.floor(uptime / 60)
    const seconds = uptime % 60

    console.log(chalk.bold('\nSession Statistics:'))
    console.log(
      chalk.gray(`  Commands executed: ${this.context.commandCount}`),
    )
    console.log(
      chalk.gray(`  Session uptime: ${minutes}m ${seconds}s`),
    )
    console.log(
      chalk.gray(`  History size: ${this.history.length} commands`),
    )

    if (this.context.projectRef) {
      console.log(
        chalk.gray(`  Active project: ${this.context.projectName}`),
      )
    }

    console.log('')
  }

  /**
   * Autocomplete function
   */
  private completer(line: string): [string[], string] {
    const completions = [
      ...this.options.availableCommands,
      'help',
      'clear',
      'exit',
      'quit',
      'history',
      '.commands',
      '.context',
      '.stats',
      'use',
      'unuse',
    ]

    const hits = completions.filter((c) => c.startsWith(line))
    return [hits.length > 0 ? hits : completions, line]
  }

  /**
   * Add command to history
   */
  private addToHistory(cmd: string): void {
    // Don't add duplicates of the last command
    if (this.history.length > 0 && this.history[this.history.length - 1] === cmd) {
      return
    }

    this.history.push(cmd)

    // Trim history to max size
    if (this.history.length > this.options.historySize) {
      this.history = this.history.slice(-this.options.historySize)
    }
  }

  /**
   * Load history from file
   */
  private loadHistory(): void {
    try {
      if (fs.existsSync(this.options.historyFile)) {
        const content = fs.readFileSync(this.options.historyFile, 'utf-8')
        this.history = content
          .split('\n')
          .filter((line) => line.trim())
          .slice(-this.options.historySize)

        if (this.options.debug) {
          console.log(chalk.gray(`Loaded ${this.history.length} commands from history`))
        }
      }
    } catch (error) {
      if (this.options.debug) {
        console.error(chalk.yellow('Failed to load history:'), error)
      }
    }
  }

  /**
   * Save history to file
   */
  private saveHistory(): void {
    try {
      const dir = path.dirname(this.options.historyFile)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      fs.writeFileSync(this.options.historyFile, this.history.join('\n') + '\n')

      if (this.options.debug) {
        console.log(chalk.gray(`Saved ${this.history.length} commands to history`))
      }
    } catch (error) {
      if (this.options.debug) {
        console.error(chalk.yellow('Failed to save history:'), error)
      }
    }
  }

  /**
   * Default command handler - executes via CLI
   */
  private async defaultCommandHandler(cmd: string): Promise<void> {
    try {
      // Build full command
      let fullCommand = `${this.options.binaryName} ${cmd}`

      // Inject project context if available and not already specified
      if (this.context.projectRef && !cmd.includes('--project')) {
        fullCommand += ` --project ${this.context.projectRef}`
      }

      if (this.options.debug) {
        console.log(chalk.gray(`Executing: ${fullCommand}`))
      }

      // Execute command
      const { stdout, stderr } = await execAsync(fullCommand, {
        cwd: process.cwd(),
        env: {
          ...process.env,
          // Disable daemon mode in REPL to avoid recursion
          SUPABASE_CLI_DAEMON: 'false',
        },
        maxBuffer: 10 * 1024 * 1024, // 10MB
      })

      if (stdout) {
        console.log(stdout.trimEnd())
      }

      if (stderr) {
        console.error(chalk.yellow(stderr.trimEnd()))
      }
    } catch (error: unknown) {
      const err = error as { stderr?: string; stdout?: string }
      if (err.stderr) {
        console.error(chalk.red(err.stderr.trimEnd()))
      } else if (err.stdout) {
        console.log(err.stdout.trimEnd())
      } else {
        throw error
      }
    }
  }

  /**
   * Default exit handler
   */
  private defaultExitHandler(): void {
    // Can be overridden by options
  }
}
