import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { Helper } from '../../helper'
import { getProject, runSecurityAudit } from '../../supabase'

export default class SecurityAudit extends BaseCommand {
  static description = 'Run a comprehensive security audit on your project'

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
    const { flags } = await this.parse(SecurityAudit)

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

      // Run security audit
      const audit = await this.spinner(
        'Running security audit...',
        async () => runSecurityAudit(projectRef),
        'Security audit completed',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Security Audit Report')
        this.info(`Project: ${project.name} (${project.ref})`)
        this.info(`Run at: ${audit.run_at}`)
        this.divider()
      }

      // Show score with color coding
      if (!flags.quiet) {
        const scorePercent = Math.round((audit.passed_checks / audit.total_checks) * 100)
        const scoreMessage = `Security Score: ${scorePercent}% (${audit.passed_checks}/${audit.total_checks} checks passed)`

        if (scorePercent >= 90) {
          Helper.success(scoreMessage)
        } else if (scorePercent >= 70) {
          Helper.warning(scoreMessage)
        } else {
          Helper.error(scoreMessage)
        }

        this.divider()
      }

      // Output findings
      if (audit.findings.length > 0) {
        if (flags.quiet) {
          // In quiet mode, just output the raw data
          this.output(audit)
        } else {
          this.warning(`Found ${audit.findings.length} security issue(s):`)
          this.divider()

          // Sort by severity
          const critical = audit.findings.filter((f) => f.severity === 'critical')
          const high = audit.findings.filter((f) => f.severity === 'high')
          const medium = audit.findings.filter((f) => f.severity === 'medium')
          const low = audit.findings.filter((f) => f.severity === 'low')
          const info = audit.findings.filter((f) => f.severity === 'info')

          if (critical.length > 0) {
            Helper.error(`\nCRITICAL (${critical.length}):`)
            for (const finding of critical) {
              this.log(`  - ${finding.title}`)
              this.log(`    ${finding.description}`)
              if (finding.recommendation) {
                this.log(`    Recommendation: ${finding.recommendation}`)
              }
            }
          }

          if (high.length > 0) {
            Helper.error(`\nHIGH (${high.length}):`)
            for (const finding of high) {
              this.log(`  - ${finding.title}`)
              this.log(`    ${finding.description}`)
            }
          }

          if (medium.length > 0) {
            Helper.warning(`\nMEDIUM (${medium.length}):`)
            for (const finding of medium) {
              this.log(`  - ${finding.title}`)
            }
          }

          if (low.length > 0) {
            Helper.info(`\nLOW (${low.length}):`)
            for (const finding of low) {
              this.log(`  - ${finding.title}`)
            }
          }

          if (info.length > 0) {
            Helper.info(`\nINFO (${info.length}):`)
            for (const finding of info) {
              this.log(`  - ${finding.title}`)
            }
          }
        }
      } else if (flags.quiet) {
        this.output(audit)
      } else {
        this.success('No security issues found!')
      }

      // Exit code based on severity
      const hasCritical = audit.findings.some((f) => f.severity === 'critical')
      const hasHigh = audit.findings.some((f) => f.severity === 'high')

      if (hasCritical) {
        this.warning('\nCritical security issues detected. Please address immediately.')
        process.exit(1)
      } else if (hasHigh) {
        this.warning('\nHigh-severity security issues detected. Please review.')
        process.exit(0)
      } else {
        process.exit(0)
      }
    } catch (error) {
      this.handleError(error)
    }
  }
}
