import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import { AutomationFlags, ProjectFlags } from '../../../base-flags'
import { getProject, removeNetworkRestriction } from '../../../supabase'

export default class SecurityRestrictionsRemove extends BaseCommand {
  static args = {
    restrictionId: Args.string({
      description: 'ID of the network restriction to remove',
      required: true,
    }),
  }

  static description = 'Remove an IP restriction from a project'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project restriction-123',
    '<%= config.bin %> <%= command.id %> --project my-project restriction-123 --yes',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...AutomationFlags,
    ...ProjectFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(SecurityRestrictionsRemove)

    try {
      // Validate project reference
      const projectRef = flags.project || flags['project-ref']
      if (!projectRef) {
        this.error(
          'Project reference is required. Use --project flag or set SUPABASE_PROJECT_ID.',
          {
            exit: 1,
          },
        )
      }

      // Verify project exists
      const project = await this.spinner('Verifying project...', async () => getProject(projectRef))

      // Confirm action
      if (!flags.yes) {
        const confirmed = await this.confirm(
          `Are you sure you want to remove network restriction ${args.restrictionId} from project ${project.name}?\nThis will allow previously blocked IPs to access your project.`,
          false,
        )

        if (!confirmed) {
          this.warning('Operation cancelled')
          process.exit(0)
        }
      }

      // Remove network restriction
      await this.spinner(
        'Removing network restriction...',
        async () => removeNetworkRestriction(projectRef, args.restrictionId),
        'Network restriction removed successfully',
      )

      if (!flags.quiet) {
        this.success('IP restriction removed successfully!')
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
