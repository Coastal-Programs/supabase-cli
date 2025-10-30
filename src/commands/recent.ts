import { Flags } from '@oclif/core'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { BaseCommand } from '../base-command'
import { AutomationFlags, ConfirmationFlags, OutputFormatFlags } from '../base-flags'
import { clearRecentProjects, getRecentProjects } from '../utils/recent'

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime)

export default class Recent extends BaseCommand {
  static aliases = ['r', 'history']

  static description = 'Show recently used projects'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --format table',
    '<%= config.bin %> <%= command.id %> --clear',
    '',
    '# Use a recent project in other commands:',
    '<%= config.bin %> projects:get --recent 1',
    '<%= config.bin %> db:info -r 2',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ConfirmationFlags,
    clear: Flags.boolean({
      default: false,
      description: 'Clear recent projects history',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Recent)

    try {
      // Handle clear flag
      if (flags.clear) {
        const confirmed = await this.confirm('Are you sure you want to clear recent projects history?', false)

        if (!confirmed) {
          this.warning('Clear cancelled')
          process.exit(0)
        }

        clearRecentProjects()
        this.success('Recent projects history cleared')
        process.exit(0)
      }

      // Get recent projects
      const projects = getRecentProjects()

      if (projects.length === 0) {
        if (!flags.quiet) {
          this.info('No recent projects found')
          this.info('Projects will be tracked automatically as you use them')
        }

        this.output([])
        process.exit(0)
      }

      // For JSON/YAML output, just output the raw data
      if (flags.format === 'json' || flags.format === 'yaml') {
        this.output(projects)
        process.exit(0)
      }

      // For table/list format, format with human-readable timestamps
      if (!flags.quiet) {
        this.header('Recent Projects')
      }

      // Format projects with relative timestamps
      const formattedProjects = projects.map((project, index) => {
        const relativeTime = dayjs(project.timestamp).fromNow()

        return {
          command: project.lastCommand ?? 'N/A',
          index: index + 1,
          name: project.name,
          ref: project.ref,
          timestamp: relativeTime,
        }
      })

      // Display based on format
      if (flags.format === 'table') {
        this.output(formattedProjects)
      } else {
        // List format - more readable
        formattedProjects.forEach((project) => {
          this.log(`  ${project.index}. ${project.name} (${project.ref}) - ${project.timestamp}`)
          if (project.command !== 'N/A') {
            this.log(`     Last command: ${project.command}`)
          }
        })
      }

      if (!flags.quiet) {
        this.divider()
        this.info('Usage:')
        this.info('  supabase-cli projects:get --recent 1')
        this.info('  supabase-cli db:info -r 2')
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
