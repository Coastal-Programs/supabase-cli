import { Flags } from '@oclif/core'
import { existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { getAuthToken, initializeAuth, validateToken } from '../../auth'
import { BaseCommand } from '../../base-command'
import { AutomationFlags } from '../../base-flags'
import { SupabaseError, SupabaseErrorCode } from '../../errors'
import { listProjects } from '../../supabase'

export default class ConfigInit extends BaseCommand {
  static description = 'Initialize CLI configuration and validate credentials'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --profile production',
    '<%= config.bin %> <%= command.id %> --token sbp_your_token_here',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...AutomationFlags,
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
      this.header('Initialize Supabase CLI Configuration')

      // Step 1: Check for existing token
      const existingToken = await getAuthToken()
      const token = flags.token || existingToken

      if (!token) {
        // No token found - provide instructions
        this.error(
          'No authentication token found.\n\n' +
            'To get started:\n' +
            '1. Visit https://supabase.com/dashboard/account/tokens\n' +
            '2. Generate a new Personal Access Token\n' +
            '3. Set it using one of these methods:\n\n' +
            '   Option A: Pass directly to this command\n' +
            '   $ supabase-cli init --token sbp_your_token_here\n\n' +
            '   Option B: Set environment variable\n' +
            '   $ export SUPABASE_ACCESS_TOKEN="sbp_your_token_here"\n' +
            '   $ supabase-cli init\n\n' +
            '   Option C (Windows PowerShell):\n' +
            '   $ $env:SUPABASE_ACCESS_TOKEN="sbp_your_token_here"\n' +
            '   $ supabase-cli init',
          { exit: 1 },
        )
      }

      // Step 2: Validate token format
      if (!flags.quiet) {
        this.info(`Initializing profile: ${flags.profile}`)
      }

      // Step 3: Validate token works
      const isValid = await this.spinner(
        'Validating credentials...',
        async () => validateToken(token!),
        'Credentials validated',
      )

      if (!isValid) {
        throw new SupabaseError(
          'Token is invalid or expired.\n\n' +
            'Please generate a new token from:\n' +
            'https://supabase.com/dashboard/account/tokens',
          SupabaseErrorCode.INVALID_TOKEN,
          401,
        )
      }

      // Step 4: Initialize auth (stores the token)
      if (!existingToken || flags.token) {
        await initializeAuth(token)
      }

      // Step 5: Test API access by fetching projects
      let projectCount = 0
      let organizationInfo = 'Unknown'

      try {
        const projects = await this.spinner(
          'Testing API access...',
          async () => listProjects(),
          'API access confirmed',
        )

        projectCount = projects.length

        if (projects.length > 0) {
          organizationInfo = projects[0].organization_id
        }
      } catch {
        // Non-fatal - token is valid but maybe no projects yet
        if (!flags.quiet) {
          this.warning('Could not fetch projects (you may not have any projects yet)')
        }
      }

      // Step 6: Ensure config directory exists
      const configDir = join(homedir(), '.supabase-cli')
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { mode: 0o700, recursive: true })
      }

      // Step 7: Display setup summary
      if (!flags.quiet) {
        this.divider()
        this.header('Configuration Summary')

        const summary = {
          config_path: configDir,
          organization: organizationInfo,
          profile: flags.profile,
          projects: projectCount,
          status: 'READY',
          token: `${token.slice(0, 10)}...${token.slice(-4)}`,
        }

        this.output(summary)
        this.divider()
      }

      this.success('Configuration initialized successfully!')

      if (!flags.quiet && projectCount === 0) {
        this.info(
          "\nYou don't have any projects yet. Create one with:\n" +
            '$ supabase-cli projects create',
        )
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
