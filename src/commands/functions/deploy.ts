import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, ConfirmationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { ErrorMessages, SuccessMessages, WarningMessages } from '../../error-messages'
import { cache } from '../../cache'
import { type DeployFunctionConfig, deployFunction } from '../../supabase'

export default class FunctionsDeploy extends BaseCommand {
  static aliases = ['functions:push', 'fn:deploy']

  static args = {
    slug: Args.string({
      description: 'Function slug/name',
      required: true,
    }),
  }

  static description = 'Deploy an Edge Function'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-function --file index.ts --project my-project',
    '<%= config.bin %> <%= command.id %> my-function --code "Deno.serve(() => new Response(\'Hello\'))" --project my-project',
    '<%= config.bin %> <%= command.id %> my-function --file index.ts --verify-jwt false -p my-project',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    ...ConfirmationFlags,
    code: Flags.string({
      char: 'c',
      description: 'TypeScript/JavaScript code inline',
      exclusive: ['file'],
    }),
    entrypoint: Flags.string({
      default: 'index.ts',
      description: 'Entrypoint file name',
    }),
    file: Flags.string({
      char: 'f',
      description: 'Path to function file',
      exclusive: ['code'],
    }),
    'import-map': Flags.string({
      description: 'Path to import map file',
    }),
    'verify-jwt': Flags.boolean({
      allowNo: true,
      default: true,
      description: 'Verify JWT tokens',
    }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(FunctionsDeploy)

    try {
      // Get project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
      }

      if (!flags.quiet) {
        this.header('Deploy Edge Function')
      }

      // Get function code from file or inline
      let code = flags.code || ''

      if (flags.file) {
        const fs = await import('node:fs/promises')
        const path = await import('node:path')

        try {
          const filePath = path.resolve(flags.file)
          code = await fs.readFile(filePath, 'utf8')
        } catch (error) {
          this.error(ErrorMessages.FILE_READ_ERROR(flags.file, String(error)), { exit: 1 })
        }
      }

      if (!code || code.trim().length === 0) {
        this.error(ErrorMessages.REQUIRED_FIELD('Function code (--code or --file)'), { exit: 1 })
      }

      // Build deployment config
      const config: DeployFunctionConfig = {
        entrypoint_path: flags.entrypoint,
        files: [
          {
            content: code,
            name: flags.entrypoint,
          },
        ],
        slug: args.slug,
        verify_jwt: flags['verify-jwt'],
      }

      // Add import map if provided
      if (flags['import-map']) {
        const fs = await import('node:fs/promises')
        const path = await import('node:path')

        try {
          const importMapPath = path.resolve(flags['import-map'])
          const importMapContent = await fs.readFile(importMapPath, 'utf8')
          config.import_map_path = 'import_map.json'
          config.files.push({
            content: importMapContent,
            name: 'import_map.json',
          })
        } catch (error) {
          this.error(ErrorMessages.FILE_READ_ERROR(flags['import-map'], String(error)), { exit: 1 })
        }
      }

      // Confirmation prompt
      if (!flags.yes && !flags.force && !flags['no-interactive']) {
        const confirmed = await this.confirm(
          `Deploy function '${args.slug}' to project '${projectRef}'?`,
          true,
        )

        if (!confirmed) {
          this.warning(WarningMessages.OPERATION_CANCELLED())
          process.exit(0)
        }
      }

      // Deploy function
      const result = await this.spinner(
        'Deploying function...',
        async () => deployFunction(projectRef, config),
        SuccessMessages.FUNCTION_DEPLOYED(args.slug),
      )

      // Invalidate functions cache
      cache.delete(`functions:${projectRef}`)

      // Output result
      this.output({
        id: result.id,
        name: result.name,
        slug: result.slug,
        status: result.status,
        verify_jwt: result.verify_jwt,
        version: result.version,
      })

      if (!flags.quiet) {
        this.divider()
        this.success(SuccessMessages.FUNCTION_DEPLOYED(args.slug))
        this.info(`Version: ${result.version}`)
      }

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
