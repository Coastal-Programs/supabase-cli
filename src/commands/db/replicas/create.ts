import { Flags } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../../base-flags'
import { ValidationError } from '../../../errors'
import { createDatabaseReplica, getProject } from '../../../supabase'

export default class DbReplicasCreate extends BaseCommand {
  static description = 'Create a read replica for a database'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project --location us-west-1',
    '<%= config.bin %> <%= command.id %> --project my-project --location eu-west-1 --name "EU Replica"',
    '<%= config.bin %> <%= command.id %> --project my-project --location ap-southeast-1 --yes',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ConfirmationFlags,
    ...ProjectFlags,
    location: Flags.string({
      char: 'l',
      description: 'AWS region for the replica (e.g., us-west-1, eu-west-1)',
      required: true,
    }),
    name: Flags.string({
      char: 'n',
      description: 'Name for the replica',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(DbReplicasCreate)

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

      // Validate location format (basic check)
      const locationRegex = /^[a-z]{2}-[a-z]+-\d+$/
      if (!locationRegex.test(flags.location)) {
        throw new ValidationError(
          'Location must be a valid AWS region (e.g., us-west-1, eu-west-1, ap-southeast-1)',
        )
      }

      // Verify project exists
      const project = await this.spinner('Verifying project...', async () => getProject(projectRef))

      // Confirm replica creation
      if (!flags.quiet) {
        this.header('Create Database Replica')
        this.info(`Project: ${project.name} (${project.ref})`)
        this.info(`Location: ${flags.location}`)
        if (flags.name) {
          this.info(`Name: ${flags.name}`)
        }

        this.warning('Note: Creating a replica may incur additional costs.')
        this.divider()
      }

      const confirmed = await this.confirm(
        `Create read replica in ${flags.location}? This may incur additional costs.`,
        false,
      )

      if (!confirmed) {
        this.warning('Replica creation cancelled')
        process.exit(0)
      }

      // Create replica
      const replica = await this.spinner(
        'Creating database replica...',
        async () => createDatabaseReplica(projectRef, flags.location, flags.name),
        'Database replica creation initiated',
      )

      // Output results
      if (!flags.quiet) {
        this.divider()
      }

      this.output(replica)

      if (!flags.quiet) {
        this.success(`Replica ID: ${replica.id}`)
        this.info(`Status: ${replica.status}`)
        this.info(`Location: ${replica.location}`)
        this.warning('The replica may take several minutes to become active.')
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
