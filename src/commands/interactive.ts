import { Flags } from '@oclif/core'
import chalk from 'chalk'

import { BaseCommand } from '../base-command'
import { getProject } from '../supabase'
import { SupabaseRepl } from '../utils/repl'

export default class Interactive extends BaseCommand {
  static description = 'Start interactive REPL mode for running commands'

  static examples = [
    {
      command: '<%= config.bin %> <%= command.id %>',
      description: 'Start interactive mode',
    },
    {
      command: '<%= config.bin %> <%= command.id %> --project ygzhmowennlaehudyyey',
      description: 'Start with project context pre-set',
    },
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    project: Flags.string({
      char: 'p',
      description: 'Pre-set project context',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Interactive)

    try {
      // Get available commands for autocomplete
      const availableCommands = await this.getAvailableCommands()

      // Create REPL instance
      const repl = new SupabaseRepl({
        availableCommands,
        binaryName: this.config.bin,
        debug: flags.debug,
        onExit: () => {
          process.exit(0)
        },
      })

      // Set project context if provided
      if (flags.project) {
        try {
          // Fetch project info to get name
          const project = await getProject(flags.project)
          repl.setProject(flags.project, project.name)
        } catch {
          // If we can't fetch project info, just use the ref
          repl.setProject(flags.project)
        }
      }

      // Start REPL
      repl.start()
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Get list of available commands for autocomplete
   */
  private async getAvailableCommands(): Promise<string[]> {
    try {
      const commands: string[] = []

      // Get all commands from oclif
      const allCommands = this.config.commands

      for (const cmd of allCommands) {
        // Skip hidden commands
        if (cmd.hidden) {
          continue
        }

        // Skip the interactive command itself
        if (cmd.id === 'interactive') {
          continue
        }

        // Add command ID
        if (cmd.id) {
          commands.push(cmd.id)
        }

        // Add aliases if any
        if (cmd.aliases) {
          commands.push(...cmd.aliases)
        }
      }

      return commands.sort()
    } catch (error) {
      if (process.env.DEBUG === 'true') {
        console.error(chalk.yellow('Failed to load command list:'), error)
      }

      return []
    }
  }
}
