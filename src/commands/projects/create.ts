import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags } from '../../base-flags'
import { CreateProjectConfig, createProject } from '../../supabase'

export default class ProjectsCreate extends BaseCommand {
  static aliases = ['projects:new', 'proj:create']

  static args = {
    name: Args.string({
      description: 'Project name',
      required: true,
    }),
  }

  static description = 'Create a new Supabase project'

  static examples = [
    '<%= config.bin %> <%= command.id %> "My Project" --region us-east-1 --org org_abc123',
    '<%= config.bin %> <%= command.id %> "Production App" --region eu-west-1 --org org_abc123 --plan pro',
    '<%= config.bin %> <%= command.id %> "Test DB" --region us-west-2 --org org_abc123 --db-pass "SecurePass123!"',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    'db-pass': Flags.string({
      description: 'Database password (min 6 characters)',
      required: false,
    }),
    'db-pricing-tier': Flags.string({
      default: 'micro',
      description: 'Database compute size',
      options: ['micro', 'small', 'medium', 'large', 'xlarge'],
    }),
    'db-region': Flags.string({
      description: 'Database region (defaults to project region)',
      required: false,
    }),
    org: Flags.string({
      description: 'Organization ID',
      required: true,
    }),
    plan: Flags.string({
      default: 'free',
      description: 'Subscription plan',
      options: ['free', 'pro', 'team', 'enterprise'],
    }),
    region: Flags.string({
      char: 'r',
      description: 'AWS region for the project',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProjectsCreate)

    try {
      // Generate a default password if not provided
      const dbPassword = flags['db-pass'] || this.generateDefaultPassword()

      if (!flags['db-pass'] && !flags.quiet) {
        this.warning('No database password provided. Using generated password.')
        this.info(`Generated password: ${dbPassword}`)
      }

      // Confirm action
      if (!flags.yes && !flags.force && !flags['no-interactive']) {
        const confirmed = await this.confirm(
          `Create new project "${args.name}" in ${flags.region}?`,
          false,
        )

        if (!confirmed) {
          this.info('Project creation cancelled')
          process.exit(0)
        }
      }

      // Build configuration
      const config: CreateProjectConfig = {
        db_pass: dbPassword,
        db_pricing_tier_id: flags['db-pricing-tier'],
        db_region: flags['db-region'],
        name: args.name,
        organization_id: flags.org,
        plan: flags.plan as 'enterprise' | 'free' | 'pro' | 'team',
        region: flags.region,
      }

      // Create project
      const project = await this.spinner(
        `Creating project "${args.name}"...`,
        async () => createProject(config),
        'Project created successfully',
      )

      // Output results
      if (!flags.quiet) {
        this.header('Project Created')
      }

      this.output(project)

      if (!flags.quiet) {
        this.divider()
        this.success(`Project ${project.name} created successfully!`)
        this.info(`Project ID: ${project.id}`)
        this.info(`Project Ref: ${project.ref}`)
        this.info(`Region: ${project.region}`)
        this.info(`Status: ${project.status}`)
        this.warning('Note: Project provisioning may take 3-5 minutes to complete.')
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Generate a secure default password
   */
  private generateDefaultPassword(): string {
    const length = 16
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length)
      password += charset[randomIndex]
    }

    return password
  }
}
