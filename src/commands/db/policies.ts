import { Flags } from '@oclif/core'
import chalk from 'chalk'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { queryDatabase } from '../../supabase'
import { formatter } from '../../utils/formatters'
import { SQL_QUERIES } from '../../utils/sql-queries'

interface PolicyResult {
  cmd: string
  permissive: string
  policyname: string
  qual: null | string
  roles: string
  schemaname: string
  tablename: string
  with_check: null | string
}

export default class DbPolicies extends BaseCommand {
  static aliases = ['db:list-policies', 'policies']

  static description = 'List Row Level Security (RLS) policies'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --project my-project-ref',
    '<%= config.bin %> <%= command.id %> --schema public',
    '<%= config.bin %> <%= command.id %> --table users',
    '<%= config.bin %> <%= command.id %> --format table',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    schema: Flags.string({
      char: 's',
      description: 'Filter policies by schema name',
    }),
    table: Flags.string({
      char: 't',
      description: 'Filter policies by table name',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(DbPolicies)

    try {
      // Get project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(
          'Project reference required. Use --project flag or set SUPABASE_PROJECT_REF environment variable.',
          { exit: 1 },
        )
      }

      // Fetch policies using SQL query
      let policies = await this.spinner(
        'Fetching RLS policies...',
        async () => queryDatabase(projectRef, SQL_QUERIES.listPolicies) as Promise<PolicyResult[]>,
        'Policies fetched successfully',
      )

      // Filter by schema if specified
      if (flags.schema) {
        policies = policies.filter((policy) => policy.schemaname === flags.schema)
      }

      // Filter by table if specified
      if (flags.table) {
        policies = policies.filter((policy) => policy.tablename === flags.table)
      }

      // Output results
      if (!flags.quiet) {
        const titleParts = ['Row Level Security Policies']
        if (flags.schema) titleParts.push(`- Schema: ${flags.schema}`)
        if (flags.table) titleParts.push(`- Table: ${flags.table}`)
        this.header(titleParts.join(' '))
      }

      if (policies.length === 0) {
        if (flags.quiet) {
          this.output([])
        } else {
          const message =
            flags.schema || flags.table
              ? 'No policies found matching filters'
              : 'No RLS policies found'
          this.info(message)
        }
      } else {
        if (flags.format === 'table' && !flags.json) {
          // Enhanced table format with formatting
          const table = formatter.createTable(
            ['Schema', 'Table', 'Policy Name', 'Command', 'Type', 'Roles'],
            policies.map((policy) => [
              policy.schemaname,
              policy.tablename,
              chalk.bold(policy.policyname),
              formatter.formatCommandType(policy.cmd),
              formatter.formatPolicyEnforcement(policy.permissive),
              formatter.formatRoles(policy.roles),
            ]),
          )
          this.log(table)
        } else {
          this.output(policies)
        }

        if (!flags.quiet) {
          this.divider()
          this.info(`Total: ${policies.length} policy(ies)`)

          // Show summary statistics
          const schemaCount = new Set(policies.map((p) => p.schemaname)).size
          const tableCount = new Set(policies.map((p) => `${p.schemaname}.${p.tablename}`)).size
          this.info(`Covering ${tableCount} table(s) across ${schemaCount} schema(s)`)
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
