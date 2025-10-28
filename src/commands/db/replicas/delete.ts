import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command'
import {
  AutomationFlags,
  ConfirmationFlags,
  OutputFormatFlags,
  ProjectFlags,
} from '../../../base-flags'
import { deleteDatabaseReplica, getProject } from '../../../supabase'

export default class DbReplicasDelete extends BaseCommand {
  static args = {
    replicaId: Args.string({
      description: 'The ID of the replica to delete',
      required: true,
    }),
  }

  static description = 'Delete a database read replica'

  static examples = [
    '<%= config.bin %> <%= command.id %> replica-123 --project my-project',
    '<%= config.bin %> <%= command.id %> replica-123 --project my-project --yes',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ConfirmationFlags,
    ...ProjectFlags,
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DbReplicasDelete)

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

      // Confirm deletion
      if (!flags.quiet) {
        this.header('Delete Database Replica')
        this.warning('This operation will permanently delete the replica.')
        this.info(`Project: ${project.name} (${project.ref})`)
        this.info(`Replica ID: ${args.replicaId}`)
        this.divider()
      }

      const confirmed = await this.confirm(
        `Are you sure you want to delete replica ${args.replicaId}?`,
        false,
      )

      if (!confirmed) {
        this.warning('Deletion cancelled')
        process.exit(0)
      }

      // Delete replica
      await this.spinner(
        'Deleting database replica...',
        async () => deleteDatabaseReplica(projectRef, args.replicaId),
        'Database replica deleted successfully',
      )

      if (!flags.quiet) {
        this.success(`Replica ${args.replicaId} has been deleted`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
