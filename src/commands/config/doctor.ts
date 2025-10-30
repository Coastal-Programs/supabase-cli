import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { getAuthToken, validateToken } from '../../auth'
import { BaseCommand } from '../../base-command'
import { AutomationFlags } from '../../base-flags'
import { cache } from '../../cache'
import { retry } from '../../retry'
import { listProjects } from '../../supabase'
import { Platform } from '../../utils/platform'

interface HealthCheck {
  message?: string
  name: string
  status: 'error' | 'pass' | 'warning'
  value: string
}

export default class ConfigDoctor extends BaseCommand {
  static aliases = ['doctor', 'health']

  static description = 'Check CLI configuration and environment health'

  static examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> config:doctor']

  static flags = {
    ...BaseCommand.baseFlags,
    ...AutomationFlags,
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(ConfigDoctor)

    try {
      this.header('Supabase CLI Health Check')

      if (!flags.quiet) {
        this.info('Running diagnostic checks...\n')
      }

      const checks: HealthCheck[] = []

      // Check 1: Platform Information
      checks.push(
        {
          name: 'Platform',
          status: 'pass',
          value: `${Platform.displayName} ${Platform.osVersion}`,
        },
        {
          name: 'Architecture',
          status: 'pass',
          value: Platform.architecture,
        },
      )

      // Check 2: Node.js Version
      const nodeVersion = process.version
      const majorVersion = Number.parseInt(nodeVersion.slice(1).split('.')[0], 10)
      const nodeCheck: HealthCheck = {
        name: 'Node.js Version',
        status: majorVersion >= 22 ? 'pass' : 'warning',
        value: nodeVersion,
      }

      if (majorVersion < 22) {
        nodeCheck.message = 'Node.js 22+ recommended for optimal performance'
      }

      checks.push(nodeCheck)

      // Check 3: Access Token
      const token = await getAuthToken()
      const tokenCheck: HealthCheck = {
        name: 'Access Token',
        status: token ? 'pass' : 'error',
        value: token ? `${token.slice(0, 10)}...${token.slice(-4)}` : 'Not set',
      }

      if (!token) {
        tokenCheck.message = 'Run: supabase-cli init'
      }

      checks.push(tokenCheck)

      // Check 4 & 5: Run token validation and project listing in parallel
      if (token) {
        const [validationResult, projectsResult] = await Promise.all([
          // Token validation
          validateToken(token)
            .then((isValid) => ({ error: null, isValid }))
            .catch((error) => ({ error, isValid: false })),
          // Project listing
          (async () => {
            try {
              const startTime = Date.now()
              const projects = await listProjects()
              const duration = Date.now() - startTime
              return { duration, error: null, projects }
            } catch (error) {
              return { duration: 0, error, projects: null }
            }
          })(),
        ])

        // Process validation result
        if (validationResult.error) {
          checks.push({
            message: 'Network error or API unavailable',
            name: 'Token Validity',
            status: 'warning',
            value: 'Could not validate',
          })
        } else {
          const validityCheck: HealthCheck = {
            name: 'Token Validity',
            status: validationResult.isValid ? 'pass' : 'error',
            value: validationResult.isValid ? 'Valid' : 'Invalid/Expired',
          }

          if (!validationResult.isValid) {
            validityCheck.message =
              'Get new token from: https://supabase.com/dashboard/account/tokens'
          }

          checks.push(validityCheck)
        }

        // Process projects result
        if (projectsResult.error) {
          checks.push({
            message:
              projectsResult.error instanceof Error
                ? projectsResult.error.message
                : 'Unknown error',
            name: 'API Connectivity',
            status: 'error',
            value: 'Failed',
          })
        } else if (projectsResult.projects !== null) {
          checks.push(
            {
              name: 'API Connectivity',
              status: 'pass',
              value: `Connected (${projectsResult.duration}ms)`,
            },
            {
              message: projectsResult.projects.length === 0 ? 'No projects found' : undefined,
              name: 'Projects Accessible',
              status: projectsResult.projects.length > 0 ? 'pass' : 'warning',
              value: `${projectsResult.projects.length} project${projectsResult.projects.length === 1 ? '' : 's'}`,
            },
          )
        }
      } else {
        checks.push({
          message: 'No access token available',
          name: 'API Connectivity',
          status: 'error',
          value: 'Not tested',
        })
      }

      // Check 6: Config Directory
      const configDir = join(homedir(), '.supabase-cli')
      const configExists = existsSync(configDir)

      checks.push({
        message: configExists ? undefined : 'Will be created on first use',
        name: 'Config Directory',
        status: configExists ? 'pass' : 'warning',
        value: configExists ? configDir : 'Not found',
      })

      // Check 7: Cache System
      const cacheEnabled = process.env.CACHE_ENABLED !== 'false'
      checks.push({
        name: 'Cache System',
        status: 'pass',
        value: cacheEnabled ? 'Enabled' : 'Disabled',
      })

      if (cacheEnabled) {
        checks.push({
          name: 'Cache Stats',
          status: 'pass',
          value: `${cache.size()} items`,
        })
      }

      // Check 8: Retry Logic
      const retryEnabled = process.env.RETRY_ENABLED !== 'false'
      checks.push({
        name: 'Retry Logic',
        status: 'pass',
        value: retryEnabled ? 'Enabled' : 'Disabled',
      })

      if (retryEnabled) {
        checks.push({
          message: retry.isCircuitOpen()
            ? 'Too many failures detected, circuit breaker activated'
            : undefined,
          name: 'Circuit Breaker',
          status: retry.isCircuitOpen() ? 'warning' : 'pass',
          value: retry.isCircuitOpen() ? 'Open (service degraded)' : 'Closed (healthy)',
        })

        checks.push({
          name: 'Retry Attempts',
          status: 'pass',
          value: `Max ${retry.getMaxAttempts()} attempts`,
        })
      }

      // Check 9: Environment Variables
      const envVars = [
        'SUPABASE_ACCESS_TOKEN',
        'SUPABASE_PROJECT_REF',
        'DEBUG',
        'CACHE_TTL',
        'RETRY_MAX_ATTEMPTS',
      ]

      const setEnvVars = envVars.filter((v) => process.env[v])
      checks.push({
        name: 'Environment Variables',
        status: 'pass',
        value: `${setEnvVars.length}/${envVars.length} set`,
      })

      // Output results
      if (!flags.quiet) {
        this.divider()
      }

      // Format output based on format flag
      if (flags.format === 'json' || flags.format === 'yaml') {
        this.output(checks)
      } else {
        // Custom formatting for better readability
        for (const check of checks) {
          let icon = ''
          let color: 'error' | 'success' | 'warning' = 'success'

          switch (check.status) {
            case 'pass': {
              icon = '\u2713' // ✓
              color = 'success'
              break
            }

            case 'warning': {
              icon = '\u26A0' // ⚠
              color = 'warning'
              break
            }

            case 'error': {
              icon = '\u2717' // ✗
              color = 'error'
              break
            }
          }

          const statusText = `${icon} ${check.name.padEnd(25)} ${check.value}`

          if (color === 'success') {
            this.success(statusText)
          } else if (color === 'warning') {
            this.warning(statusText)
          } else {
            this.error(statusText, { exit: false })
          }

          if (check.message && !flags.quiet) {
            this.log(`  ${check.message}`)
          }
        }
      }

      if (!flags.quiet) {
        this.divider()
      }

      // Summary
      const passCount = checks.filter((c) => c.status === 'pass').length
      const warningCount = checks.filter((c) => c.status === 'warning').length
      const errorCount = checks.filter((c) => c.status === 'error').length

      if (!flags.quiet) {
        this.info(`Results: ${passCount} passed, ${warningCount} warnings, ${errorCount} errors`)
        this.divider()
      }

      if (errorCount > 0) {
        this.error('Some checks failed. Please address the errors above.', { exit: false })
        process.exit(1)
      } else if (warningCount > 0) {
        this.warning('Some checks have warnings. Consider addressing them.')
        process.exit(0)
      } else {
        this.success('All checks passed! Your CLI is properly configured.')
        process.exit(0)
      }
    } catch (error) {
      this.handleError(error)
    }
  }
}
