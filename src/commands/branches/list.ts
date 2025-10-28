import { Flags } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, PaginationFlags, ProjectFlags } from '../../base-flags'
import { listBranches } from '../../supabase'

export default class BranchesList extends BaseCommand {
  static aliases = ['branches:ls', 'branch:list']

  static description = 'List development branches for a project'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project-ref',
    '<%= config.bin %> <%= command.id %> -p my-project-ref --format table',
    '<%= config.bin %> <%= command.id %> --project my-project-ref --status ACTIVE',
    '<%= config.bin %> branch:list --project my-project-ref --status CREATING',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...PaginationFlags,
    parent: Flags.string({
      description: 'Filter by parent branch name',
    }),
    status: Flags.string({
      description: 'Filter by branch status',
      options: ['ACTIVE', 'CREATING', 'DELETING', 'ERROR', 'MERGING', 'UPGRADING'],
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(BranchesList)

    try {
      // Get project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(
          'Project reference required. Use --project flag or set SUPABASE_PROJECT_REF environment variable.',
          { exit: 1 },
        )
      }

      // Fetch branches - projectRef is guaranteed to be string here
      const allBranches = await this.spinner(
        'Fetching branches...',
        async () => listBranches(projectRef as string),
        'Branches fetched successfully',
      )

      // Apply filters
      let branches = allBranches

      if (flags.status) {
        branches = branches.filter((b) => b.status === flags.status)
      }

      if (flags.parent) {
        const parentName = flags.parent
        branches = branches.filter((b) => b.name.startsWith(parentName))
      }

      // Apply pagination
      const offset = flags.offset || 0
      const limit = flags.limit || 100
      const paginatedBranches = branches.slice(offset, offset + limit)

      // Add status indicators for non-JSON output
      const formattedBranches = paginatedBranches.map((branch) => {
        let statusIcon = ''
        switch (branch.status) {
          case 'ACTIVE': {
          statusIcon = '\u{1F7E2}' // 🟢
          break
        }

          case 'CREATING': {
          statusIcon = '\u{1F7E1}' // 🟡
          break
        }

          case 'ERROR': {
          statusIcon = '\u{1F534}' // 🔴
          break
        }

          default: {
          statusIcon = '\u{1F535}'
        } // 🔵
        }

        return {
          ...branch,
          status_display: `${statusIcon} ${branch.status}`,
        }
      })

      // Output results
      if (!flags.quiet) {
        this.header(`Development Branches for ${projectRef}`)
      }

      // Output with formatted status if table format, otherwise raw data
      if (flags.format === 'table') {
        this.output(formattedBranches)
      } else {
        this.output(paginatedBranches)
      }

      if (!flags.quiet) {
        this.divider()
        this.info(
          `Showing ${paginatedBranches.length} of ${branches.length} branch${branches.length === 1 ? '' : 'es'}`,
        )

        if (flags.status || flags.parent) {
          this.info('Filters applied:')
          if (flags.status) {
            this.info(`  - Status: ${flags.status}`)
          }

          if (flags.parent) {
            this.info(`  - Parent: ${flags.parent}`)
          }
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
