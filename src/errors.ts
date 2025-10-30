export enum SupabaseErrorCode {
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  // API errors
  API_ERROR = 'API_ERROR',
  BUCKET_NOT_FOUND = 'BUCKET_NOT_FOUND',
  // Circuit breaker
  CIRCUIT_BREAKER_OPEN = 'CIRCUIT_BREAKER_OPEN',

  // Configuration errors
  CONFIG_ERROR = 'CONFIG_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',

  // Generic errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  INVALID_CONFIG = 'INVALID_CONFIG',
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_TOKEN = 'INVALID_TOKEN',

  MISSING_CONFIG = 'MISSING_CONFIG',
  MISSING_CREDENTIALS = 'MISSING_CREDENTIALS',
  NETWORK_ERROR = 'NETWORK_ERROR',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  PROJECT_CREATION_FAILED = 'PROJECT_CREATION_FAILED',
  PROJECT_DELETION_FAILED = 'PROJECT_DELETION_FAILED',

  // Project errors
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  QUERY_ERROR = 'QUERY_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',

  // Recent projects
  RECENT_NOT_FOUND = 'RECENT_NOT_FOUND',

  // Storage errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  TIMEOUT = 'TIMEOUT',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',

  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export class SupabaseError extends Error {
  public readonly code: SupabaseErrorCode
  public readonly details?: unknown
  public readonly statusCode?: number

  constructor(
    message: string,
    code: SupabaseErrorCode = SupabaseErrorCode.UNKNOWN_ERROR,
    statusCode?: number,
    details?: unknown,
  ) {
    super(message)
    this.name = 'SupabaseError'
    this.code = code
    this.statusCode = statusCode
    this.details = details

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SupabaseError)
    }
  }

  /**
   * Create error from HTTP response
   */
  static fromResponse(statusCode: number, message: string, details?: unknown): SupabaseError {
    let code: SupabaseErrorCode

    switch (statusCode) {
      case 401: {
        code = SupabaseErrorCode.UNAUTHORIZED
        break
      }

      case 403: {
        code = SupabaseErrorCode.UNAUTHORIZED
        break
      }

      case 404: {
        code = SupabaseErrorCode.NOT_FOUND
        break
      }

      case 409: {
        code = SupabaseErrorCode.ALREADY_EXISTS
        break
      }

      case 422: {
        code = SupabaseErrorCode.VALIDATION_ERROR
        break
      }

      case 429: {
        code = SupabaseErrorCode.RATE_LIMIT
        break
      }

      case 500: {
        code = SupabaseErrorCode.INTERNAL_ERROR
        break
      }

      case 503: {
        code = SupabaseErrorCode.API_ERROR
        break
      }

      default: {
        code = SupabaseErrorCode.API_ERROR
      }
    }

    return new SupabaseError(message, code, statusCode, details)
  }

  /**
   * Create error from unknown error
   */
  static fromUnknown(error: unknown): SupabaseError {
    if (error instanceof SupabaseError) {
      return error
    }

    if (error instanceof Error) {
      return new SupabaseError(error.message, SupabaseErrorCode.UNKNOWN_ERROR)
    }

    return new SupabaseError(String(error), SupabaseErrorCode.UNKNOWN_ERROR)
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return [
      SupabaseErrorCode.INTERNAL_ERROR,
      SupabaseErrorCode.NETWORK_ERROR,
      SupabaseErrorCode.RATE_LIMIT,
      SupabaseErrorCode.TIMEOUT,
    ].includes(this.code)
  }

  /**
   * Convert error to JSON
   */
  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      details: this.details,
      message: this.message,
      name: this.name,
      stack: this.stack,
      statusCode: this.statusCode,
    }
  }
}

export class AuthenticationError extends SupabaseError {
  constructor(message: string, details?: unknown) {
    super(message, SupabaseErrorCode.UNAUTHORIZED, 401, details)
    this.name = 'AuthenticationError'
  }
}

export class ValidationError extends SupabaseError {
  constructor(message: string, details?: unknown) {
    super(message, SupabaseErrorCode.VALIDATION_ERROR, 422, details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends SupabaseError {
  constructor(resource: string, identifier?: string) {
    const message =
      identifier !== undefined && identifier !== null
        ? `${resource} with identifier '${identifier}' not found`
        : `${resource} not found`
    super(message, SupabaseErrorCode.NOT_FOUND, 404)
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends SupabaseError {
  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, SupabaseErrorCode.RATE_LIMIT, 429, { retryAfter })
    this.name = 'RateLimitError'
  }
}

export class ConfigurationError extends SupabaseError {
  constructor(message: string, details?: unknown) {
    super(message, SupabaseErrorCode.CONFIG_ERROR, undefined, details)
    this.name = 'ConfigurationError'
  }
}
