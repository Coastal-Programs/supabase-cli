import chalk from 'chalk'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { queryDatabase } from '../../supabase'
import { SQL_QUERIES } from '../../utils/sql-queries'
import { formatter } from '../../utils/formatters'

interface UserInfoResult {
  can_create_db: boolean
  is_superuser: boolean
  password_expires: string | null
  username: string
}

export default class DbUserInfo extends BaseCommand {
  static aliases = ['db:users', 'user-info']

  static description = 'Show database user information and permissions'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --project my-project-ref',
    '<%= config.bin %> <%= command.id %> --format table',
    '<%= config.bin %> <%= command.id %> --format json',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(DbUserInfo)

    try {
      // Get project reference
      const projectRef = (flags.project || flags['project-ref']) || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(
          'Project reference required. Use --project flag or set SUPABASE_PROJECT_REF environment variable.',
          { exit: 1 },
        )
      }

      // Fetch user info using SQL query
      const users = await this.spinner(
        'Fetching database user information...',
        async () => queryDatabase(projectRef, SQL_QUERIES.userInfo) as Promise<UserInfoResult[]>,
        'User information fetched successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Database Users')
      }

      if (users.length === 0) {
        if (!flags.quiet) {
          this.info('No users found')
        } else {
          this.output([])
        }
      } else {
        if (flags.format === 'table' && !flags.json) {
          // Enhanced table format with formatting
          const table = formatter.createTable(
            ['Username', 'Can Create DB', 'Is Superuser', 'Password Expires'],
            users.map(user => [
              formatter.formatOwner(user.username),
              formatter.formatStatus(user.can_create_db),
              formatter.formatStatus(user.is_superuser),
              user.password_expires ? chalk.yellow(user.password_expires) : chalk.gray('Never'),
            ]),
          )
          this.log(table)
        } else {
          this.output(users)
        }

        if (!flags.quiet) {
          this.divider()
          this.info(`Total: ${users.length} user(s)`)

          // Show summary statistics
          const superusers = users.filter(u => u.is_superuser).length
          const canCreateDb = users.filter(u => u.can_create_db).length
          this.info(`Superusers: ${superusers}, Can Create DB: ${canCreateDb}`)
        }
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
