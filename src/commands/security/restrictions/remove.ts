import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../../base-flags'
import { getProject, removeNetworkRestriction } from '../../../supabase'

export default class SecurityRestrictionsRemove extends BaseCommand {
  static aliases = ['network:restrictions:remove']

  static args = {
    restrictionId: Args.string({
      description: 'The ID of the restriction to remove',
      required: true,
    }),
  }

  static description = 'Remove an IP restriction from the whitelist'

  static examples = [
    '<%= config.bin %> <%= command.id %> restriction-123 --project my-project',
    '<%= config.bin %> <%= command.id %> restriction-123 --project my-project --yes',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ConfirmationFlags,
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

      // Confirm removal
      if (!flags.quiet) {
        this.header('Remove Network Restriction')
        this.warning('Removing this restriction may allow broader access to your project.')
        this.info(`Project: ${project.name} (${project.ref})`)
        this.info(`Restriction ID: ${args.restrictionId}`)
        this.divider()
      }

      const confirmed = await this.confirm(
        `Are you sure you want to remove restriction ${args.restrictionId}?`,
        false,
      )

      if (!confirmed) {
        this.warning('Removal cancelled')
        process.exit(0)
      }

      // Remove restriction
      await this.spinner(
        'Removing network restriction...',
        async () => removeNetworkRestriction(projectRef, args.restrictionId),
        'Network restriction removed successfully',
      )

      if (!flags.quiet) {
        this.success(`Restriction ${args.restrictionId} has been removed`)
        this.warning('Access from this IP range is no longer restricted.')
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
