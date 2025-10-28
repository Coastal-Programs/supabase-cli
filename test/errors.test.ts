import { expect } from 'chai'
import {
  SupabaseError,
  SupabaseErrorCode,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
} from '../src/errors'

describe('SupabaseError', () => {
  it('should create error with message and code', () => {
    const error = new SupabaseError('Test error', SupabaseErrorCode.API_ERROR)
    expect(error.message).to.equal('Test error')
    expect(error.code).to.equal(SupabaseErrorCode.API_ERROR)
    expect(error.name).to.equal('SupabaseError')
  })

  it('should create error from HTTP response', () => {
    const error = SupabaseError.fromResponse(404, 'Not found')
    expect(error.code).to.equal(SupabaseErrorCode.NOT_FOUND)
    expect(error.statusCode).to.equal(404)
  })

  it('should create error from unknown error', () => {
    const error = SupabaseError.fromUnknown(new Error('Unknown'))
    expect(error.message).to.equal('Unknown')
    expect(error.code).to.equal(SupabaseErrorCode.UNKNOWN_ERROR)
  })

  it('should check if error is retryable', () => {
    const retryable = new SupabaseError('Error', SupabaseErrorCode.RATE_LIMIT)
    const notRetryable = new SupabaseError('Error', SupabaseErrorCode.INVALID_INPUT)
    expect(retryable.isRetryable()).to.be.true
    expect(notRetryable.isRetryable()).to.be.false
  })

  it('should convert to JSON', () => {
    const error = new SupabaseError('Test', SupabaseErrorCode.API_ERROR, 500)
    const json = error.toJSON()
    expect(json.message).to.equal('Test')
    expect(json.code).to.equal(SupabaseErrorCode.API_ERROR)
    expect(json.statusCode).to.equal(500)
  })
})

describe('AuthenticationError', () => {
  it('should create authentication error', () => {
    const error = new AuthenticationError('Invalid token')
    expect(error.message).to.equal('Invalid token')
    expect(error.code).to.equal(SupabaseErrorCode.UNAUTHORIZED)
    expect(error.statusCode).to.equal(401)
  })
})

describe('ValidationError', () => {
  it('should create validation error', () => {
    const error = new ValidationError('Invalid input')
    expect(error.message).to.equal('Invalid input')
    expect(error.code).to.equal(SupabaseErrorCode.VALIDATION_ERROR)
    expect(error.statusCode).to.equal(422)
  })
})

describe('NotFoundError', () => {
  it('should create not found error', () => {
    const error = new NotFoundError('Project', 'abc123')
    expect(error.message).to.equal("Project with identifier 'abc123' not found")
    expect(error.code).to.equal(SupabaseErrorCode.NOT_FOUND)
    expect(error.statusCode).to.equal(404)
  })
})

describe('RateLimitError', () => {
  it('should create rate limit error', () => {
    const error = new RateLimitError('Too many requests', 60)
    expect(error.message).to.equal('Too many requests')
    expect(error.code).to.equal(SupabaseErrorCode.RATE_LIMIT)
    expect(error.statusCode).to.equal(429)
  })
})
