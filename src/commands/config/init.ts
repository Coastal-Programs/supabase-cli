import { Flags } from '@oclif/core'
import chalk from 'chalk'
import { existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { getAuthToken, initializeAuth, saveProfileMetadata, validateToken } from '../../auth'
import { BaseCommand } from '../../base-command'
import { AutomationFlags, ConfirmationFlags } from '../../base-flags'
import { SupabaseError, SupabaseErrorCode } from '../../errors'
import { listProjects } from '../../supabase'

export default class ConfigInit extends BaseCommand {
  static aliases = ['init', 'configure']

  static description = 'Initialize CLI configuration and validate credentials'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --profile production',
    '<%= config.bin %> <%= command.id %> --token sbp_your_token_here',
    '<%= config.bin %> <%= command.id %> --token sbp_your_token_here --yes',
    '<%= config.bin %> <%= command.id %> --yes',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...AutomationFlags,
    ...ConfirmationFlags,
    profile: Flags.string({
      char: 'p',
      default: 'default',
      description: 'Configuration profile name',
    }),
    token: Flags.string({
      char: 't',
      description: 'Supabase access token (or set SUPABASE_ACCESS_TOKEN)',
      env: 'SUPABASE_ACCESS_TOKEN',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(ConfigInit)

    try {
      // ASCII Art Banner
      if (!flags.quiet) {
        this.log('\n')
        this.log(
          '███████╗██╗   ██╗██████╗  █████╗ ██████╗  █████╗ ███████╗███████╗     ██████╗██╗     ██╗',
        )
        this.log(
          '██╔════╝██║   ██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔════╝    ██╔════╝██║     ██║',
        )
        this.log(
          '███████╗██║   ██║██████╔╝███████║██████╔╝███████║███████╗█████╗      ██║     ██║     ██║',
        )
        this.log(
          '╚════██║██║   ██║██╔═══╝ ██╔══██║██╔══██╗██╔══██║╚════██║██╔══╝      ██║     ██║     ██║',
        )
        this.log(
          '███████║╚██████╔╝██║     ██║  ██║██████╔╝██║  ██║███████║███████╗    ╚██████╗███████╗██║',
        )
        this.log(
          '╚══════╝ ╚═════╝ ╚═╝     ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝     ╚═════╝╚══════╝╚═╝',
        )
        this.log('\n')
        this.log(chalk.blue('Welcome to Supabase CLI Setup!'))
        this.log('\n')
        this.log('This wizard will help you set up your Supabase CLI in 3 steps:')
        this.log(`  ${chalk.dim('1.')} Configure your Supabase access token`)
        this.log(`  ${chalk.dim('2.')} Test the connection to Supabase API`)
        this.log(`  ${chalk.dim('3.')} Configure your workspace scope`)
        this.log('\n')
        this.log("Let's get started!")
        this.log('\n')
      }

      // Step 1: Token Setup
      if (!flags.quiet) {
        this.stepDivider()
        this.log('Step 1/3: Set your Supabase token')
        this.stepDivider()
        this.log('\n')
      }

      const existingToken = await getAuthToken()
      let token = flags.token || existingToken

      if (existingToken && !flags.quiet) {
        this.log('Found existing SUPABASE_ACCESS_TOKEN in environment.')
        this.log('\n')
      }

      if (!token) {
        // No token found - prompt interactively (unless in non-interactive mode)
        if (flags['no-interactive'] || flags.yes) {
          this.error(
            'No authentication token found.\\n\\n' +
              'To get started:\\n' +
              '1. Visit https://supabase.com/dashboard/account/tokens\\n' +
              '2. Generate a new Personal Access Token\\n' +
              '3. Set it using one of these methods:\\n\\n' +
              '   Option A: Pass directly to this command\\n' +
              '   $ supabase-cli init --token sbp_your_token_here\\n\\n' +
              '   Option B: Set environment variable\\n' +
              '   $ export SUPABASE_ACCESS_TOKEN="sbp_your_token_here"\\n' +
              '   $ supabase-cli init\\n\\n' +
              '   Option C (Windows PowerShell):\\n' +
              '   $ $env:SUPABASE_ACCESS_TOKEN="sbp_your_token_here"\\n' +
              '   $ supabase-cli init',
            { exit: 1 },
          )
        }

        // Show interactive instructions
        this.log('You need a Supabase access token to use this CLI.')
        this.log('Get one at: https://supabase.com/dashboard/account/tokens')
        this.log('\n')

        // Prompt for token
        const inquirer = await import('inquirer')
        const answers = await inquirer.default.prompt([
          {
            message: 'Enter your Supabase access token:',
            name: 'token',
            type: 'password',
            validate(input: string) {
              if (!input || input.trim().length === 0) {
                return 'Token cannot be empty'
              }

              if (!input.startsWith('sbp_')) {
                return 'Invalid token format. Token should start with "sbp_"'
              }

              if (input.length < 36) {
                return 'Token appears to be too short. Please check and try again.'
              }

              return true
            },
          },
        ])

        token = answers.token
      }

      // Ensure we have a token at this point
      if (!token) {
        this.error('No token provided', { exit: 1 })
      }

      if (!flags.quiet) {
        this.log('\n')
      }

      // Step 2: Test Connection
      if (!flags.quiet) {
        this.stepDivider()
        this.log('Step 2/3: Test the connection to Supabase API')
        this.stepDivider()
        this.log('\n')
      }

      const isValid = await this.spinner(
        'Connecting to Supabase API...',
        async () => validateToken(token),
        'Connected',
      )

      if (!isValid) {
        throw new SupabaseError(
          'Token is invalid or expired.\\n\\n' +
            'Please generate a new token from:\\n' +
            'https://supabase.com/dashboard/account/tokens',
          SupabaseErrorCode.INVALID_TOKEN,
          401,
        )
      }

      // Initialize auth (stores the token)
      if (!existingToken || flags.token) {
        await initializeAuth(token)
      }

      if (!flags.quiet) {
        this.log('\n')
      }

      // Step 3: Configuration scope
      if (!flags.quiet) {
        this.stepDivider()
        this.log('Step 3/3: Configure your workspace scope')
        this.stepDivider()
        this.log('\n')
      }

      // Security: Removed useless assignment (CodeQL warning)
      // setupType is only used if we enter interactive mode
      let scopeType = 'project'
      let selectedProject: any = null

      // Use simple setup if --yes flag is provided, otherwise prompt
      if (!flags['no-interactive'] && !flags.yes && !flags.quiet) {
        const inquirer = await import('inquirer')

        // Ask about setup type
        const setupAnswer = await inquirer.default.prompt([
          {
            choices: [
              { name: 'Simple setup (use all organizations and projects)', value: 'simple' },
              {
                name: 'Advanced setup (select specific organization or project)',
                value: 'advanced',
              },
            ],
            default: 'simple',
            message: 'How would you like to set up the CLI?',
            name: 'setupType',
            type: 'list',
          },
        ])

        const setupType = setupAnswer.setupType

        // If simple setup, use 'all' scope to skip project selection
        if (setupType === 'simple') {
          scopeType = 'all'
        } else if (setupType === 'advanced') {
          const scopeAnswer = await inquirer.default.prompt([
            {
              choices: [
                { name: 'Specific project (just one project)', value: 'project' },
                { name: 'Organization (all projects in an organization)', value: 'organization' },
                { name: 'All organizations and projects', value: 'all' },
              ],
              default: 'project',
              message: 'What would you like to scope to?',
              name: 'scopeType',
              type: 'list',
            },
          ])

          scopeType = scopeAnswer.scopeType
        }
      }

      // Fetch projects
      const projects = await this.spinner(
        'Fetching projects...',
        async () => listProjects(),
        'Projects fetched',
      )

      if (!flags.quiet) {
        this.log(`Found ${projects.length} project(s)`)
        this.log('\n')
      }

      // If scoping to specific project, let user select (unless --yes flag is set)
      if (
        scopeType === 'project' &&
        projects.length > 0 &&
        !flags['no-interactive'] &&
        !flags.yes &&
        !flags.quiet
      ) {
        const inquirer = await import('inquirer')

        const projectAnswer = await inquirer.default.prompt([
          {
            choices: projects.map((p: any) => ({
              name: `${p.name} (${p.region || 'unknown region'})`,
              value: p,
            })),
            message: 'Select a project:',
            name: 'project',
            type: 'list',
          },
        ])

        selectedProject = projectAnswer.project
        this.log('\n')
      }

      // Store configuration metadata
      const metadata: Record<string, unknown> = {
        scope:
          scopeType === 'project' && selectedProject
            ? 'Project'
            : scopeType === 'organization'
              ? 'Organization'
              : 'All',
      }

      if (selectedProject) {
        metadata.project_name = selectedProject.name
        metadata.project_ref = selectedProject.id
      }

      // Save metadata
      await saveProfileMetadata(metadata)

      // Ensure config directory exists
      const configDir = join(homedir(), '.supabase-cli')
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { mode: 0o700, recursive: true })
      }

      // Display setup summary
      if (!flags.quiet) {
        this.stepDivider()
        this.log(chalk.green('Setup Complete!'))
        this.stepDivider()
        this.log('\n')
        this.log('Your Supabase CLI is ready to use!')
        this.log('\n')
        this.log('Configuration:')
        this.log(`  Profile: ${flags.profile}`)
        this.log(`  Config path: ${configDir}`)
        this.log(`  Scope: ${metadata.scope}`)
        if (selectedProject) {
          this.log(`  Project: ${selectedProject.name}`)
        }

        this.log(`  Projects available: ${projects.length}`)
        this.log('\n')
        this.log('Next steps:')
        this.log('  * Try: supabase-cli projects:list')
        if (selectedProject) {
          this.log(`  * Try: supabase-cli db:query "SELECT NOW()" --project ${selectedProject.id}`)
        }

        this.log('  * Run "supabase-cli --help" for all commands')
        this.log('\n')
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }

  private stepDivider(): void {
    this.log('============================================================')
  }
}
