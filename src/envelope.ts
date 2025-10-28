export interface ResponseMetadata {
  [key: string]: unknown
  cached?: boolean
  duration?: number
  source?: string
  timestamp: number
  version?: string
}

export interface SuccessEnvelope<T> {
  data: T
  metadata: ResponseMetadata
  success: true
}

export interface ErrorEnvelope {
  error: {
    code?: string
    details?: unknown
    message: string
    statusCode?: number
  }
  metadata: ResponseMetadata
  success: false
}

export type ResponseEnvelope<T> = ErrorEnvelope | SuccessEnvelope<T>

export const Envelope = {
  /**
   * Create an error response envelope
   */
  error(
    message: string,
    code?: string,
    statusCode?: number,
    details?: unknown,
    metadata: Partial<ResponseMetadata> = {},
  ): ErrorEnvelope {
    return {
      error: {
        code,
        details,
        message,
        statusCode,
      },
      metadata: {
        timestamp: Date.now(),
        ...metadata,
      },
      success: false,
    }
  },

  /**
   * Create error envelope from Error object
   */
  fromError(error: Error, metadata: Partial<ResponseMetadata> = {}): ErrorEnvelope {
    const errorObj = error as {
      code?: string
      details?: unknown
      statusCode?: number
    } & Error

    return Envelope.error(
      error.message,
      errorObj.code,
      errorObj.statusCode,
      errorObj.details,
      metadata,
    )
  },

  /**
   * Check if envelope is an error response
   */
  isError<T>(envelope: ResponseEnvelope<T>): envelope is ErrorEnvelope {
    return envelope.success === false
  },

  /**
   * Check if envelope is a success response
   */
  isSuccess<T>(envelope: ResponseEnvelope<T>): envelope is SuccessEnvelope<T> {
    return envelope.success === true
  },

  /**
   * Transform envelope data
   */
  map<T, U>(envelope: ResponseEnvelope<T>, fn: (data: T) => U): ResponseEnvelope<U> {
    if (Envelope.isSuccess(envelope)) {
      return Envelope.success(fn(envelope.data), envelope.metadata)
    }

    return envelope
  },

  /**
   * Merge multiple envelopes
   */
  merge<T>(envelopes: Array<ResponseEnvelope<T>>): ResponseEnvelope<T[]> {
    const errors: ErrorEnvelope[] = []
    const successes: SuccessEnvelope<T>[] = []

    for (const envelope of envelopes) {
      if (Envelope.isSuccess(envelope)) {
        successes.push(envelope)
      } else {
        errors.push(envelope)
      }
    }

    if (errors.length > 0) {
      return Envelope.error(
        `${errors.length} error(s) occurred`,
        'MULTIPLE_ERRORS',
        undefined,
        errors.map((e) => e.error),
      )
    }

    return Envelope.success(
      successes.map((s) => s.data),
      {
        cached: successes.every((s) => s.metadata.cached),
      },
    )
  },

  /**
   * Create a success response envelope
   */
  success<T>(data: T, metadata: Partial<ResponseMetadata> = {}): SuccessEnvelope<T> {
    return {
      data,
      metadata: {
        timestamp: Date.now(),
        ...metadata,
      },
      success: true,
    }
  },

  /**
   * Unwrap envelope data or throw error
   */
  unwrap<T>(envelope: ResponseEnvelope<T>): T {
    if (Envelope.isSuccess(envelope)) {
      return envelope.data
    }

    const error = new Error(envelope.error.message)
    Object.assign(error, {
      code: envelope.error.code,
      details: envelope.error.details,
      statusCode: envelope.error.statusCode,
    })
    throw error
  },
}
