import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags, ProjectFlags } from '../../base-flags'
import { ErrorMessages, SuccessMessages } from '../../error-messages'
import { SupabaseError, SupabaseErrorCode } from '../../errors'
import { invokeFunction } from '../../supabase'

export default class FunctionsInvoke extends BaseCommand {
  static aliases = ['fn:invoke']

  static args = {
    name: Args.string({
      description: 'Function name/slug',
      required: true,
    }),
  }

  static description = 'Invoke an Edge Function with arguments'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-function --project my-project-ref',
    '<%= config.bin %> <%= command.id %> hello-world -p my-project-ref --body \'{"name":"World"}\'',
    '<%= config.bin %> fn:invoke my-function --project my-project-ref --method GET',
    '<%= config.bin %> <%= command.id %> my-function -p my-project-ref --body \'{"id":123}\' --method POST',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...ProjectFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    body: Flags.string({
      char: 'b',
      description: 'JSON request body',
      required: false,
    }),
    method: Flags.string({
      char: 'm',
      default: 'POST',
      description: 'HTTP method',
      options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    }),
    timeout: Flags.integer({
      char: 't',
      default: 30_000,
      description: 'Timeout in milliseconds',
      max: 300_000,
      min: 0,
    }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(FunctionsInvoke)

    try {
      // Get project reference
      const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
      }

      const functionName = args.name
      const method = (flags.method || 'POST') as 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'

      // Parse request body if provided
      let body: unknown
      if (flags.body) {
        try {
          body = JSON.parse(flags.body)
        } catch {
          throw new SupabaseError(
            ErrorMessages.INVALID_JSON(flags.body),
            SupabaseErrorCode.INVALID_INPUT,
            400,
          )
        }
      }

      if (!flags.quiet) {
        this.header('Invoke Edge Function')
        this.info(`Function: ${functionName}`)
        this.info(`Method: ${method}`)
        this.divider()
      }

      // Invoke function with timing
      const startTime = Date.now()
      const result = await this.spinner(
        `Invoking function ${functionName}...`,
        async () => {
          // Set timeout using AbortController
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), flags.timeout)

          try {
            return await invokeFunction(projectRef, functionName, {
              body,
              method,
            })
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              throw new SupabaseError(
                ErrorMessages.TIMEOUT('Function invocation', flags.timeout),
                SupabaseErrorCode.TIMEOUT,
                408,
              )
            }

            throw error
          } finally {
            clearTimeout(timeoutId)
          }
        },
        SuccessMessages.FUNCTION_INVOKED(functionName),
      )

      const executionTime = Date.now() - startTime

      // Format output
      const output = {
        executionTime,
        result: result.data,
        statusCode: result.status,
      }

      this.output(output)

      if (!flags.quiet) {
        this.divider()
        this.info(`Execution time: ${executionTime}ms`)
        this.info(`Status code: ${result.status}`)

        if (result.status >= 200 && result.status < 300) {
          this.success(`Function invoked successfully in ${executionTime}ms`)
        } else {
          this.warning(`Function returned status ${result.status}`)
        }
      }

      // Exit with status code indicating success/failure
      process.exit(result.status >= 200 && result.status < 300 ? 0 : 1)
    } catch (error) {
      this.handleError(error)
    }
  }
}
