export interface RetryOptions {
  backoffMultiplier?: number
  enabled?: boolean
  initialDelay?: number
  maxAttempts?: number
  maxDelay?: number
  onRetry?: (error: Error, attempt: number) => void
}

export interface CircuitBreakerOptions {
  enabled?: boolean
  threshold?: number // Number of failures before opening circuit
  timeout?: number // Time to wait before attempting to close circuit (ms)
}

export class CircuitBreaker {
  private readonly enabled: boolean
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'half-open' | 'open' = 'closed'
  private readonly threshold: number
  private readonly timeout: number

  constructor(options: CircuitBreakerOptions = {}) {
    this.enabled = options.enabled ?? true
    this.threshold = options.threshold ?? 5
    this.timeout = options.timeout ?? 30_000 // 30 seconds default
  }

  /**
   * Check if the circuit breaker allows the request
   */
  allowRequest(): boolean {
    if (!this.enabled) return true

    if (this.state === 'closed') {
      return true
    }

    if (this.state === 'open') {
      const now = Date.now()
      if (now - this.lastFailureTime >= this.timeout) {
        this.state = 'half-open'
        return true
      }

      return false
    }

    // half-open state
    return true
  }

  /**
   * Get current circuit breaker state
   */
  getState(): 'closed' | 'half-open' | 'open' {
    return this.state
  }

  /**
   * Check if circuit breaker is open
   */
  isOpen(): boolean {
    return this.state === 'open'
  }

  /**
   * Record a failed request
   */
  recordFailure(): void {
    if (!this.enabled) return

    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.threshold) {
      this.state = 'open'
    }
  }

  /**
   * Record a successful request
   */
  recordSuccess(): void {
    if (!this.enabled) return

    this.failures = 0
    if (this.state === 'half-open') {
      this.state = 'closed'
    }
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.failures = 0
    this.lastFailureTime = 0
    this.state = 'closed'
  }
}

export class RetryHandler {
  private circuitBreaker: CircuitBreaker
  private options: Required<RetryOptions>

  constructor(options: RetryOptions = {}, circuitBreakerOptions?: CircuitBreakerOptions) {
    this.options = {
      backoffMultiplier: options.backoffMultiplier ?? 2,
      enabled: options.enabled ?? true,
      initialDelay: options.initialDelay ?? 1000,
      maxAttempts: options.maxAttempts ?? 3,
      maxDelay: options.maxDelay ?? 10_000,
      onRetry: options.onRetry ?? (() => {}),
    }

    this.circuitBreaker = new CircuitBreaker(circuitBreakerOptions)
  }

  /**
   * Execute a function with retry logic
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.options.enabled) {
      return fn()
    }

    let lastError: Error | undefined
    let delay = this.options.initialDelay

    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
      try {
        // Check circuit breaker
        if (!this.circuitBreaker.allowRequest()) {
          throw new Error('Circuit breaker is open')
        }

        const result = await fn()
        this.circuitBreaker.recordSuccess()
        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        this.circuitBreaker.recordFailure()

        // Don't retry on last attempt
        if (attempt === this.options.maxAttempts) {
          break
        }

        // Check if error is retryable
        if (!this.isRetryable(lastError)) {
          throw lastError
        }

        // Call onRetry callback
        this.options.onRetry(lastError, attempt)

        // Wait before retrying with exponential backoff
        await this.sleep(delay)
        delay = Math.min(delay * this.options.backoffMultiplier, this.options.maxDelay)
      }
    }

    throw lastError
  }

  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState(): 'closed' | 'half-open' | 'open' {
    return this.circuitBreaker.getState()
  }

  /**
   * Get max attempts configured
   */
  getMaxAttempts(): number {
    return this.options.maxAttempts
  }

  /**
   * Check if circuit breaker is open
   */
  isCircuitOpen(): boolean {
    return this.circuitBreaker.isOpen()
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset()
  }

  /**
   * Check if an error is retryable
   */
  private isRetryable(error: Error): boolean {
    // Network errors are retryable
    if (error.message.includes('ECONNREFUSED')) return true
    if (error.message.includes('ENOTFOUND')) return true
    if (error.message.includes('ETIMEDOUT')) return true
    if (error.message.includes('ECONNRESET')) return true

    // Rate limit errors are retryable
    if (error.message.includes('429')) return true
    if (error.message.includes('rate limit')) return true

    // Server errors are retryable
    if (error.message.includes('500')) return true
    if (error.message.includes('502')) return true
    if (error.message.includes('503')) return true
    if (error.message.includes('504')) return true

    // Circuit breaker is not retryable
    if (error.message.includes('Circuit breaker')) return false

    return false
  }

  /**
   * Sleep for a given duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const retry = new RetryHandler(
  {
    backoffMultiplier: process.env.RETRY_BACKOFF_MULTIPLIER
      ? Number.parseFloat(process.env.RETRY_BACKOFF_MULTIPLIER)
      : undefined,
    enabled: process.env.RETRY_ENABLED !== 'false',
    initialDelay: process.env.RETRY_INITIAL_DELAY
      ? Number.parseInt(process.env.RETRY_INITIAL_DELAY, 10)
      : undefined,
    maxAttempts: process.env.RETRY_MAX_ATTEMPTS
      ? Number.parseInt(process.env.RETRY_MAX_ATTEMPTS, 10)
      : undefined,
    maxDelay: process.env.RETRY_MAX_DELAY
      ? Number.parseInt(process.env.RETRY_MAX_DELAY, 10)
      : undefined,
  },
  {
    enabled: process.env.CIRCUIT_BREAKER_ENABLED !== 'false',
    threshold: process.env.CIRCUIT_BREAKER_THRESHOLD
      ? Number.parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD, 10)
      : undefined,
    timeout: process.env.CIRCUIT_BREAKER_TIMEOUT
      ? Number.parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT, 10)
      : undefined,
  },
)
