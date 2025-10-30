import { Flags } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { addNetworkRestriction, getProject } from '../../../supabase'

export default class SecurityRestrictionsAdd extends BaseCommand {
  static description = 'Add an IP restriction (whitelist) to a project'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project --cidr 192.168.1.0/24',
    '<%= config.bin %> <%= command.id %> --project my-project --cidr 10.0.0.1/32 --description "Office IP"',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
    cidr: Flags.string({
      description: 'CIDR notation for IP range (e.g., 192.168.1.0/24)',
      required: true,
    }),
    description: Flags.string({
      description: 'Optional description for this restriction',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(SecurityRestrictionsAdd)

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

      // Basic CIDR validation
      const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/
      if (!cidrRegex.test(flags.cidr)) {
        this.error(`Invalid CIDR notation: ${flags.cidr}. Expected format: 192.168.1.0/24`, {
          exit: 1,
        })
      }

      // Verify project exists
      const project = await this.spinner('Verifying project...', async () => getProject(projectRef))

      // Confirm action
      if (!flags.yes) {
        const confirmed = await this.confirm(
          `Are you sure you want to add IP restriction ${flags.cidr} to project ${project.name}?`,
          false,
        )

        if (!confirmed) {
          this.warning('Operation cancelled')
          process.exit(0)
        }
      }

      // Add network restriction
      const restriction = await this.spinner(
        'Adding network restriction...',
        async () => addNetworkRestriction(projectRef, flags.cidr, flags.description),
        'Network restriction added successfully',
      )

      // Output result
      if (flags.quiet) {
        this.output(restriction)
      } else {
        this.header('Network Restriction Added')
        this.divider()
        this.info(`ID: ${restriction.id}`)
        this.info(`CIDR: ${restriction.cidr}`)
        if (restriction.description) {
          this.info(`Description: ${restriction.description}`)
        }

        this.info(`Created: ${restriction.created_at}`)
        this.divider()
        this.success('IP restriction configured successfully!')
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
