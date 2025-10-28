import { Flags } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../../base-flags'
import { ValidationError } from '../../../errors'
import { addNetworkRestriction, getProject } from '../../../supabase'

export default class SecurityRestrictionsAdd extends BaseCommand {
  static aliases = ['network:restrictions:add']

  static description = 'Add an IP address or CIDR block to the whitelist'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project --cidr 192.168.1.0/24',
    '<%= config.bin %> <%= command.id %> --project my-project --cidr 10.0.0.0/8 --description "Office Network"',
    '<%= config.bin %> <%= command.id %> --project my-project --cidr 203.0.113.5/32 --yes',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ConfirmationFlags,
    ...ProjectFlags,
    cidr: Flags.string({
      char: 'c',
      description: 'CIDR block (e.g., 192.168.1.0/24 or 203.0.113.5/32 for single IP)',
      required: true,
    }),
    description: Flags.string({
      char: 'd',
      description: 'Description for this restriction',
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

      // Validate CIDR format
      const cidrRegex =
        /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}\/(3[0-2]|[12]?\d)$/
      if (!cidrRegex.test(flags.cidr)) {
        throw new ValidationError(
          'Invalid CIDR format. Use format like 192.168.1.0/24 or 203.0.113.5/32',
        )
      }

      // Verify project exists
      const project = await this.spinner('Verifying project...', async () => getProject(projectRef))

      // Confirm restriction addition
      if (!flags.quiet) {
        this.header('Add Network Restriction')
        this.warning('Adding restrictions will block access from unlisted IPs.')
        this.info(`Project: ${project.name} (${project.ref})`)
        this.info(`CIDR: ${flags.cidr}`)
        if (flags.description) {
          this.info(`Description: ${flags.description}`)
        }

        this.divider()
      }

      const confirmed = await this.confirm(
        `Add IP restriction ${flags.cidr}? This will restrict access to your project.`,
        false,
      )

      if (!confirmed) {
        this.warning('Restriction addition cancelled')
        process.exit(0)
      }

      // Add restriction
      const restriction = await this.spinner(
        'Adding network restriction...',
        async () => addNetworkRestriction(projectRef, flags.cidr, flags.description),
        'Network restriction added successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.divider()
      }

      this.output(restriction)

      if (!flags.quiet) {
        this.success(`Restriction ID: ${restriction.id}`)
        this.info(`CIDR: ${restriction.cidr}`)
        this.warning('Only IPs matching your restrictions can now access the project.')
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
