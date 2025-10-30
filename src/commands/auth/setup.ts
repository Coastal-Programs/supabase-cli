import { Flags } from '@oclif/core'
import chalk from 'chalk'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

import { initializeAuth, validateToken } from '../../auth'
import { BaseCommand } from '../../base-command'
import { AutomationFlags } from '../../base-flags'
import { SupabaseError, SupabaseErrorCode } from '../../errors'

const execAsync = promisify(exec)

export default class AuthSetup extends BaseCommand {
  static aliases = ['auth:init', 'setup']

  static description = 'AI-assisted setup wizard for Supabase authentication'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --no-browser',
    '<%= config.bin %> <%= command.id %> --token sbp_your_token',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...AutomationFlags,
    'no-browser': Flags.boolean({
      default: false,
      description: 'Skip opening browser automatically',
    }),
    token: Flags.string({
      char: 't',
      description: 'Supabase access token (skip wizard)',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthSetup)

    try {
      // If token provided, skip wizard
      if (flags.token) {
        await this.quickSetup(flags.token)
        return
      }

      // Start AI wizard
      await this.runWizard(flags['no-browser'])

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }

  private async openBrowser(url: string): Promise<void> {
    try {
      let command: string

      switch (process.platform) {
      case 'darwin': {
        command = `open "${url}"`
        break
      }

      case 'win32': {
        command = `start "" "${url}"`
        break
      }

      default: {
        // Linux and others
        command = `xdg-open "${url}"`
      }
      }

      await execAsync(command)
    } catch {
      // Silently fail - user can manually open
      this.warning('Could not open browser automatically.')
      this.info(`Please open: ${url}`)
    }
  }

  private async promptToken(): Promise<string> {
    const inquirer = await import('inquirer')
    const answers = await inquirer.default.prompt([
      {
        message: 'Paste your token here (hidden):',
        name: 'token',
        type: 'password',
        validate(input: string) {
          if (!input || input.trim().length === 0) {
            return 'Token cannot be empty'
          }

          return true
        },
      },
    ])

    return answers.token.trim()
  }

  private async quickSetup(token: string): Promise<void> {
    const isValid = await this.spinner(
      'Validating token...',
      async () => validateToken(token),
      'Token validated!',
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

    await initializeAuth(token)
    this.success('Token saved securely!')
    this.log('\\nReady! Try: supabase-cli projects:list')
  }

  private async runWizard(noBrowser: boolean): Promise<void> {
    // Header
    this.log('\\n')
    this.log(chalk.blue.bold('🤖 AI Setup Assistant'))
    this.log('\\n')
    this.log("I'll help you get your Supabase token in 2 minutes.")
    this.log('\\n')

    // Step 1: Explain
    this.stepDivider()
    this.log(chalk.bold('Step 1/3: Access Tokens Page'))
    this.stepDivider()
    this.log('\\n')
    this.log('You need a Personal Access Token from Supabase.')
    this.log(chalk.dim('This lets the CLI access your Supabase projects.'))
    this.log('\\n')

    // Offer to open browser
    if (noBrowser) {
      this.info('Visit: https://supabase.com/dashboard/account/tokens')
      this.log('\\n')
    } else {
      const shouldOpen = await this.confirm('Open browser to get token?', true)

      if (shouldOpen) {
        await this.openBrowser('https://supabase.com/dashboard/account/tokens')
        this.log('\\n')
        this.info('✓ Browser opened!')
        this.log('\\n')
      } else {
        this.log('\\n')
        this.info('Visit: https://supabase.com/dashboard/account/tokens')
        this.log('\\n')
      }
    }

    // Step 2: Guide them
    this.stepDivider()
    this.log(chalk.bold('Step 2/3: Generate Token'))
    this.stepDivider()
    this.log('\\n')
    this.log('In your browser:')
    this.log('  1. Click ' + chalk.green('"Generate new token"'))
    this.log('  2. Give it a name (e.g., ' + chalk.cyan('"My CLI"') + ')')
    this.log('  3. Click ' + chalk.green('"Generate token"'))
    this.log('  4. Copy the token (starts with ' + chalk.yellow('"sbp_"') + ')')
    this.log('\\n')

    const hasToken = await this.confirm('Have you copied the token?', true)

    if (!hasToken) {
      this.warning('No problem! Come back when you have the token.')
      this.log('\\nRun: supabase-cli auth:setup')
      process.exit(0)
    }

    this.log('\\n')

    // Step 3: Get token
    this.stepDivider()
    this.log(chalk.bold('Step 3/3: Paste Token'))
    this.stepDivider()
    this.log('\\n')

    const token = await this.promptToken()
    this.log('\\n')

    // Validate format first (before API call)
    if (!token.startsWith('sbp_')) {
      this.error('Invalid token format. Token should start with "sbp_"', { exit: 1 })
    }

    if (token.length < 36) {
      this.error('Token appears to be too short. Please check and try again.', { exit: 1 })
    }

    // Validate with API
    const isValid = await this.spinner(
      'Validating with Supabase API...',
      async () => validateToken(token),
      'Token is valid!',
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

    // Save token
    await this.spinner(
      'Saving securely to keychain...',
      async () => initializeAuth(token),
      'Saved securely!',
    )

    this.log('\\n')

    // Success summary
    this.stepDivider()
    this.log(chalk.green.bold('🎉 Setup Complete!'))
    this.stepDivider()
    this.log('\\n')
    this.log("You're all set! Your token is stored securely in:")
    if (process.platform === 'win32') {
      this.log('  → Windows Credential Manager')
    } else if (process.platform === 'darwin') {
      this.log('  → macOS Keychain')
    } else {
      this.log('  → Linux libsecret/GNOME Keyring')
    }

    this.log('\\n')
    this.log('Try these commands:')
    this.log('  → ' + chalk.cyan('supabase-cli projects:list'))
    this.log('  → ' + chalk.cyan('supabase-cli config:doctor'))
    this.log('  → ' + chalk.cyan('supabase-cli --help'))
    this.log('\\n')
    this.log(chalk.dim('Need help? https://github.com/coastal-programs/supabase-cli/issues'))
    this.log('\\n')
  }

  private stepDivider(): void {
    this.log(chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  }
}
