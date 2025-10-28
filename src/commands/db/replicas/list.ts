import { BaseCommand } from '../../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../../base-flags'
import { getProject, listDatabaseReplicas } from '../../../supabase'

export default class DbReplicasList extends BaseCommand {
  static aliases = ['db:replicas:ls']

  static description = 'List read replicas for a database'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-project',
    '<%= config.bin %> <%= command.id %> --project my-project --format table',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ProjectFlags,
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(DbReplicasList)

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
      await this.spinner('Verifying project...', async () => getProject(projectRef))

      // Fetch replicas
      const replicas = await this.spinner(
        'Fetching database replicas...',
        async () => listDatabaseReplicas(projectRef),
        'Database replicas fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Database Replicas')
      }

      if (replicas.length === 0) {
        this.warning('No database replicas found')
        process.exit(0)
      }

      this.output(replicas)

      if (!flags.quiet) {
        this.divider()
        this.info(`Total: ${replicas.length} replica(s)`)

        // Show summary by status
        const active = replicas.filter((r) => r.status === 'active').length
        const creating = replicas.filter((r) => r.status === 'creating').length
        const error = replicas.filter((r) => r.status === 'error').length

        if (active > 0) this.success(`Active: ${active}`)
        if (creating > 0) this.info(`Creating: ${creating}`)
        if (error > 0) this.error(`Error: ${error}`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
