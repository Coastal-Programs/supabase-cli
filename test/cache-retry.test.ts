import { expect } from 'chai'
import { Cache } from '../src/cache'
import { RetryHandler, CircuitBreaker } from '../src/retry'

describe('Cache', () => {
  let cache: Cache

  beforeEach(() => {
    cache = new Cache({ enabled: true, ttl: 1000, maxSize: 10 })
  })

  afterEach(() => {
    cache.clear()
  })

  it('should store and retrieve values', () => {
    cache.set('key1', 'value1')
    expect(cache.get('key1')).to.equal('value1')
  })

  it('should return undefined for non-existent keys', () => {
    expect(cache.get('nonexistent')).to.be.undefined
  })

  it('should respect TTL', async () => {
    cache.set('key1', 'value1', 100)
    expect(cache.get('key1')).to.equal('value1')

    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(cache.get('key1')).to.be.undefined
  })

  it('should check if key exists', () => {
    cache.set('key1', 'value1')
    expect(cache.has('key1')).to.be.true
    expect(cache.has('nonexistent')).to.be.false
  })

  it('should delete keys', () => {
    cache.set('key1', 'value1')
    cache.delete('key1')
    expect(cache.has('key1')).to.be.false
  })

  it('should clear all entries', () => {
    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    cache.clear()
    expect(cache.size()).to.equal(0)
  })

  it('should be disabled when enabled is false', () => {
    cache.setEnabled(false)
    cache.set('key1', 'value1')
    expect(cache.get('key1')).to.be.undefined
  })
})

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker

  beforeEach(() => {
    breaker = new CircuitBreaker({ enabled: true, threshold: 3, timeout: 1000 })
  })

  it('should start in closed state', () => {
    expect(breaker.getState()).to.equal('closed')
  })

  it('should allow requests in closed state', () => {
    expect(breaker.allowRequest()).to.be.true
  })

  it('should open after threshold failures', () => {
    for (let i = 0; i < 3; i++) {
      breaker.recordFailure()
    }

    expect(breaker.getState()).to.equal('open')
  })

  it('should not allow requests in open state', () => {
    for (let i = 0; i < 3; i++) {
      breaker.recordFailure()
    }

    expect(breaker.allowRequest()).to.be.false
  })

  it('should transition to half-open after timeout', async () => {
    for (let i = 0; i < 3; i++) {
      breaker.recordFailure()
    }

    expect(breaker.getState()).to.equal('open')

    await new Promise((resolve) => setTimeout(resolve, 1100))
    breaker.allowRequest() // This triggers state check

    expect(breaker.getState()).to.equal('half-open')
  })

  it('should close after success in half-open state', async () => {
    for (let i = 0; i < 3; i++) {
      breaker.recordFailure()
    }

    await new Promise((resolve) => setTimeout(resolve, 1100))
    breaker.allowRequest()
    breaker.recordSuccess()

    expect(breaker.getState()).to.equal('closed')
  })

  it('should reset state', () => {
    for (let i = 0; i < 3; i++) {
      breaker.recordFailure()
    }

    breaker.reset()
    expect(breaker.getState()).to.equal('closed')
  })
})

describe('RetryHandler', () => {
  let retry: RetryHandler

  beforeEach(() => {
    retry = new RetryHandler(
      { enabled: true, maxAttempts: 3, initialDelay: 10, maxDelay: 100, backoffMultiplier: 2 },
      { enabled: false },
    )
  })

  it('should execute function successfully', async () => {
    const result = await retry.execute(async () => 'success')
    expect(result).to.equal('success')
  })

  it('should retry on failure', async () => {
    let attempts = 0
    const fn = async () => {
      attempts++
      if (attempts < 3) {
        // Use a retryable error message
        throw new Error('ECONNREFUSED: Connection refused')
      }

      return 'success'
    }

    const result = await retry.execute(fn)
    expect(result).to.equal('success')
    expect(attempts).to.equal(3)
  })

  it('should throw error after max attempts', async () => {
    const fn = async () => {
      throw new Error('Permanent error')
    }

    try {
      await retry.execute(fn)
      expect.fail('Should have thrown error')
    } catch (error) {
      expect((error as Error).message).to.equal('Permanent error')
    }
  })

  it('should call onRetry callback', async () => {
    let retryCount = 0
    const retryWithCallback = new RetryHandler(
      {
        enabled: true,
        maxAttempts: 3,
        initialDelay: 10,
        onRetry: () => {
          retryCount++
        },
      },
      { enabled: false },
    )

    let attempts = 0
    const fn = async () => {
      attempts++
      if (attempts < 3) {
        throw new Error('ECONNREFUSED')
      }

      return 'success'
    }

    await retryWithCallback.execute(fn)
    expect(retryCount).to.equal(2) // Retried twice before success
  })
})
