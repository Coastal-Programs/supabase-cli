import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags } from '../../base-flags'
import { createBranch } from '../../supabase'

export default class BranchesCreate extends BaseCommand {
  static aliases = ['branches:create', 'branch:create']

  static args = {
    name: Args.string({
      description: 'Branch name',
      required: true,
    }),
  }

  static description = 'Create development branch'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-branch --project my-project-ref',
    '<%= config.bin %> <%= command.id %> feature-xyz -p my-project-ref --parent main',
    '<%= config.bin %> branch:create dev-branch --project my-project-ref --force',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    parent: Flags.string({
      description: 'Parent branch (default: main)',
      required: false,
    }),
    project: Flags.string({
      char: 'p',
      description: 'Project reference (or set SUPABASE_PROJECT_REF)',
      env: 'SUPABASE_PROJECT_REF',
    }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(BranchesCreate)

    try {
      // Validate project reference
      const projectRef = flags.project
      if (!projectRef) {
        this.error('Project reference required: use --project or SUPABASE_PROJECT_REF', {
          exit: 1,
        })
      }

      const branchName = args.name
      const parentBranch = flags.parent || 'main'

      // Confirmation prompt unless --force or --yes
      if (!flags.force && !flags.yes) {
        const confirmed = await this.confirm(
          `Create branch "${branchName}" from "${parentBranch}"? This may incur costs.`,
          false,
        )

        if (!confirmed) {
          this.info('Branch creation cancelled')
          process.exit(0)
        }
      }

      // Create branch
      const result = await this.spinner(
        `Creating branch ${branchName}...`,
        async () => createBranch(projectRef, branchName),
        `Branch ${branchName} created successfully`,
      )

      // Output results
      if (!flags.quiet) {
        this.header('Branch Created')
        this.success(`Branch: ${result.name}`)
        this.info(`Status: ${result.status}`)
        this.info(`Project Ref: ${result.project_ref}`)
        this.info(`Created: ${result.created_at}`)

        if (result.status === 'CREATING') {
          this.warning('Branch is being provisioned. This may take a few minutes.')
          this.info(`Check status with: supabase branches list --project ${projectRef}`)
        }
      }

      this.output(result)

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
