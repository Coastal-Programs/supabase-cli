import { expect } from 'chai'
import { Envelope, ResponseEnvelope } from '../src/envelope'

describe('Envelope - Comprehensive', () => {
  describe('Success Envelope Creation', () => {
    it('should create success envelope with data', () => {
      const data = { id: 1, name: 'Test' }

      const envelope = Envelope.success(data)

      expect(envelope.success).to.be.true
      expect(envelope.data).to.deep.equal(data)
      expect(envelope.metadata).to.exist
      expect(envelope.metadata.timestamp).to.be.a('number')
    })

    it('should create success envelope with metadata', () => {
      const data = { test: 'value' }
      const metadata = { cached: true, source: 'cache' }

      const envelope = Envelope.success(data, metadata)

      expect(envelope.success).to.be.true
      expect(envelope.metadata.cached).to.be.true
      expect(envelope.metadata.source).to.equal('cache')
    })

    it('should include timestamp in metadata', () => {
      const before = Date.now()
      const envelope = Envelope.success({ test: 'data' })
      const after = Date.now()

      expect(envelope.metadata.timestamp).to.be.at.least(before)
      expect(envelope.metadata.timestamp).to.be.at.most(after)
    })

    it('should handle null data', () => {
      const envelope = Envelope.success(null)

      expect(envelope.success).to.be.true
      expect(envelope.data).to.be.null
    })

    it('should handle undefined data', () => {
      const envelope = Envelope.success(undefined)

      expect(envelope.success).to.be.true
      expect(envelope.data).to.be.undefined
    })

    it('should handle array data', () => {
      const data = [1, 2, 3, 4, 5]

      const envelope = Envelope.success(data)

      expect(envelope.success).to.be.true
      expect(envelope.data).to.deep.equal(data)
    })

    it('should handle string data', () => {
      const data = 'simple string'

      const envelope = Envelope.success(data)

      expect(envelope.success).to.be.true
      expect(envelope.data).to.equal(data)
    })

    it('should handle number data', () => {
      const data = 42

      const envelope = Envelope.success(data)

      expect(envelope.success).to.be.true
      expect(envelope.data).to.equal(data)
    })

    it('should handle boolean data', () => {
      const envelopeTrue = Envelope.success(true)
      const envelopeFalse = Envelope.success(false)

      expect(envelopeTrue.data).to.be.true
      expect(envelopeFalse.data).to.be.false
    })

    it('should preserve complex nested objects', () => {
      const data = {
        user: {
          id: 123,
          profile: {
            name: 'Test User',
            settings: { theme: 'dark' },
          },
        },
        projects: ['p1', 'p2'],
      }

      const envelope = Envelope.success(data)

      expect(envelope.data).to.deep.equal(data)
    })
  })

  describe('Error Envelope Creation', () => {
    it('should create error envelope with message', () => {
      const message = 'Something went wrong'

      const envelope = Envelope.error(message)

      expect(envelope.success).to.be.false
      expect(envelope.error.message).to.equal(message)
      expect(envelope.metadata.timestamp).to.be.a('number')
    })

    it('should create error envelope with code', () => {
      const message = 'Error occurred'
      const code = 'ERROR_CODE'

      const envelope = Envelope.error(message, code)

      expect(envelope.error.code).to.equal(code)
    })

    it('should create error envelope with status code', () => {
      const message = 'Not found'
      const code = 'NOT_FOUND'
      const statusCode = 404

      const envelope = Envelope.error(message, code, statusCode)

      expect(envelope.error.statusCode).to.equal(statusCode)
    })

    it('should create error envelope with details', () => {
      const message = 'Validation failed'
      const code = 'VALIDATION_ERROR'
      const statusCode = 400
      const details = { field: 'email', reason: 'invalid format' }

      const envelope = Envelope.error(message, code, statusCode, details)

      expect(envelope.error.details).to.deep.equal(details)
    })

    it('should create error envelope with metadata', () => {
      const message = 'Error'
      const metadata = { source: 'api', duration: 123 }

      const envelope = Envelope.error(message, undefined, undefined, undefined, metadata)

      expect(envelope.metadata.source).to.equal('api')
      expect(envelope.metadata.duration).to.equal(123)
    })

    it('should handle undefined optional parameters', () => {
      const envelope = Envelope.error('Error')

      expect(envelope.error.code).to.be.undefined
      expect(envelope.error.statusCode).to.be.undefined
      expect(envelope.error.details).to.be.undefined
    })

    it('should create error from Error object', () => {
      const error = new Error('Test error')

      const envelope = Envelope.fromError(error)

      expect(envelope.success).to.be.false
      expect(envelope.error.message).to.equal('Test error')
    })

    it('should extract code from Error object', () => {
      const error = new Error('Test error') as any
      error.code = 'CUSTOM_CODE'

      const envelope = Envelope.fromError(error)

      expect(envelope.error.code).to.equal('CUSTOM_CODE')
    })

    it('should extract statusCode from Error object', () => {
      const error = new Error('Test error') as any
      error.statusCode = 500

      const envelope = Envelope.fromError(error)

      expect(envelope.error.statusCode).to.equal(500)
    })

    it('should extract details from Error object', () => {
      const error = new Error('Test error') as any
      error.details = { extra: 'info' }

      const envelope = Envelope.fromError(error)

      expect(envelope.error.details).to.deep.equal({ extra: 'info' })
    })

    it('should include metadata when creating from Error', () => {
      const error = new Error('Test error')
      const metadata = { source: 'test' }

      const envelope = Envelope.fromError(error, metadata)

      expect(envelope.metadata.source).to.equal('test')
    })
  })

  describe('Type Guards', () => {
    it('should identify success envelopes', () => {
      const envelope = Envelope.success({ data: 'test' })

      expect(Envelope.isSuccess(envelope)).to.be.true
      expect(Envelope.isError(envelope)).to.be.false
    })

    it('should identify error envelopes', () => {
      const envelope = Envelope.error('Error message')

      expect(Envelope.isError(envelope)).to.be.true
      expect(Envelope.isSuccess(envelope)).to.be.false
    })

    it('should provide type narrowing for success', () => {
      const envelope: ResponseEnvelope<{ value: string }> = Envelope.success({ value: 'test' })

      if (Envelope.isSuccess(envelope)) {
        // TypeScript should know envelope.data exists here
        expect(envelope.data.value).to.equal('test')
      } else {
        expect.fail('Should be success')
      }
    })

    it('should provide type narrowing for error', () => {
      const envelope: ResponseEnvelope<string> = Envelope.error('Test error', 'ERROR_CODE')

      if (Envelope.isError(envelope)) {
        // TypeScript should know envelope.error exists here
        expect(envelope.error.code).to.equal('ERROR_CODE')
      } else {
        expect.fail('Should be error')
      }
    })
  })

  describe('Unwrap', () => {
    it('should unwrap success envelope and return data', () => {
      const data = { id: 123, name: 'Test' }
      const envelope = Envelope.success(data)

      const unwrapped = Envelope.unwrap(envelope)

      expect(unwrapped).to.deep.equal(data)
    })

    it('should throw error when unwrapping error envelope', () => {
      const envelope = Envelope.error('Test error', 'ERROR_CODE', 400)

      expect(() => Envelope.unwrap(envelope)).to.throw('Test error')
    })

    it('should throw error with code property', () => {
      const envelope = Envelope.error('Test error', 'CUSTOM_CODE')

      try {
        Envelope.unwrap(envelope)
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.code).to.equal('CUSTOM_CODE')
      }
    })

    it('should throw error with statusCode property', () => {
      const envelope = Envelope.error('Test error', 'ERROR', 404)

      try {
        Envelope.unwrap(envelope)
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.statusCode).to.equal(404)
      }
    })

    it('should throw error with details property', () => {
      const details = { field: 'email', reason: 'invalid' }
      const envelope = Envelope.error('Test error', 'VALIDATION', 400, details)

      try {
        Envelope.unwrap(envelope)
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.details).to.deep.equal(details)
      }
    })
  })

  describe('Map', () => {
    it('should transform success envelope data', () => {
      const envelope = Envelope.success(5)

      const mapped = Envelope.map(envelope, (n) => n * 2)

      expect(Envelope.isSuccess(mapped)).to.be.true
      if (Envelope.isSuccess(mapped)) {
        expect(mapped.data).to.equal(10)
      }
    })

    it('should preserve metadata when mapping', () => {
      const envelope = Envelope.success(5, { cached: true })

      const mapped = Envelope.map(envelope, (n) => n * 2)

      if (Envelope.isSuccess(mapped)) {
        expect(mapped.metadata.cached).to.be.true
      }
    })

    it('should not transform error envelopes', () => {
      const envelope = Envelope.error('Error message')

      const mapped = Envelope.map(envelope, (data: any) => data * 2)

      expect(Envelope.isError(mapped)).to.be.true
      if (Envelope.isError(mapped)) {
        expect(mapped.error.message).to.equal('Error message')
      }
    })

    it('should handle complex transformations', () => {
      const envelope = Envelope.success({ value: 10 })

      const mapped = Envelope.map(envelope, (data) => ({
        doubled: data.value * 2,
        original: data.value,
      }))

      if (Envelope.isSuccess(mapped)) {
        expect(mapped.data.doubled).to.equal(20)
        expect(mapped.data.original).to.equal(10)
      }
    })

    it('should handle array transformations', () => {
      const envelope = Envelope.success([1, 2, 3])

      const mapped = Envelope.map(envelope, (arr) => arr.map((n) => n * 2))

      if (Envelope.isSuccess(mapped)) {
        expect(mapped.data).to.deep.equal([2, 4, 6])
      }
    })
  })

  describe('Merge', () => {
    it('should merge multiple success envelopes', () => {
      const envelopes = [Envelope.success(1), Envelope.success(2), Envelope.success(3)]

      const merged = Envelope.merge(envelopes)

      expect(Envelope.isSuccess(merged)).to.be.true
      if (Envelope.isSuccess(merged)) {
        expect(merged.data).to.deep.equal([1, 2, 3])
      }
    })

    it('should return error if any envelope is error', () => {
      const envelopes = [
        Envelope.success(1),
        Envelope.error('Error occurred'),
        Envelope.success(3),
      ]

      const merged = Envelope.merge(envelopes)

      expect(Envelope.isError(merged)).to.be.true
    })

    it('should collect all error details when multiple errors', () => {
      const envelopes = [
        Envelope.error('Error 1', 'CODE1'),
        Envelope.error('Error 2', 'CODE2'),
        Envelope.success(3),
      ]

      const merged = Envelope.merge(envelopes)

      if (Envelope.isError(merged)) {
        expect(merged.error.code).to.equal('MULTIPLE_ERRORS')
        expect(merged.error.details).to.be.an('array').with.lengthOf(2)
      }
    })

    it('should set cached=true only if all are cached', () => {
      const envelopes = [
        Envelope.success(1, { cached: true }),
        Envelope.success(2, { cached: true }),
        Envelope.success(3, { cached: true }),
      ]

      const merged = Envelope.merge(envelopes)

      if (Envelope.isSuccess(merged)) {
        expect(merged.metadata.cached).to.be.true
      }
    })

    it('should set cached=false if any is not cached', () => {
      const envelopes = [
        Envelope.success(1, { cached: true }),
        Envelope.success(2, { cached: false }),
        Envelope.success(3, { cached: true }),
      ]

      const merged = Envelope.merge(envelopes)

      if (Envelope.isSuccess(merged)) {
        expect(merged.metadata.cached).to.be.false
      }
    })

    it('should handle empty array', () => {
      const merged = Envelope.merge([])

      expect(Envelope.isSuccess(merged)).to.be.true
      if (Envelope.isSuccess(merged)) {
        expect(merged.data).to.be.an('array').with.lengthOf(0)
      }
    })

    it('should handle single envelope', () => {
      const merged = Envelope.merge([Envelope.success(42)])

      expect(Envelope.isSuccess(merged)).to.be.true
      if (Envelope.isSuccess(merged)) {
        expect(merged.data).to.deep.equal([42])
      }
    })

    it('should preserve data types in merged array', () => {
      const envelopes = [
        Envelope.success({ id: 1 }),
        Envelope.success({ id: 2 }),
        Envelope.success({ id: 3 }),
      ]

      const merged = Envelope.merge(envelopes)

      if (Envelope.isSuccess(merged)) {
        expect(merged.data).to.deep.equal([{ id: 1 }, { id: 2 }, { id: 3 }])
      }
    })
  })

  describe('Metadata Handling', () => {
    it('should support custom metadata fields', () => {
      const envelope = Envelope.success('data', {
        version: '1.0',
        source: 'api',
        cached: true,
        duration: 123,
      })

      expect(envelope.metadata.version).to.equal('1.0')
      expect(envelope.metadata.source).to.equal('api')
      expect(envelope.metadata.cached).to.be.true
      expect(envelope.metadata.duration).to.equal(123)
    })

    it('should allow arbitrary metadata keys', () => {
      const envelope = Envelope.success('data', {
        customKey: 'customValue',
        anotherKey: 42,
      } as any)

      expect(envelope.metadata.customKey).to.equal('customValue')
      expect(envelope.metadata.anotherKey).to.equal(42)
    })

    it('should always include timestamp', () => {
      const envelope1 = Envelope.success('data')
      const envelope2 = Envelope.error('error')

      expect(envelope1.metadata.timestamp).to.be.a('number')
      expect(envelope2.metadata.timestamp).to.be.a('number')
    })

    it('should not override timestamp if provided', () => {
      const customTimestamp = 123456789
      const envelope = Envelope.success('data', { timestamp: customTimestamp })

      expect(envelope.metadata.timestamp).to.equal(customTimestamp)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large data', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => i)

      const envelope = Envelope.success(largeArray)

      expect(envelope.data).to.have.lengthOf(10000)
    })

    it('should handle deeply nested objects', () => {
      const deep: any = { level: 1 }
      let current = deep
      for (let i = 2; i <= 100; i++) {
        current.next = { level: i }
        current = current.next
      }

      const envelope = Envelope.success(deep)

      expect(envelope.data.level).to.equal(1)
    })

    it('should handle special characters in error messages', () => {
      const message = 'Error: "quotes" and \'apostrophes\' and \n newlines'

      const envelope = Envelope.error(message)

      expect(envelope.error.message).to.equal(message)
    })

    it('should handle unicode in messages', () => {
      const message = '错误: 🚀 测试'

      const envelope = Envelope.error(message)

      expect(envelope.error.message).to.equal(message)
    })

    it('should handle circular references in details', () => {
      const details: any = { name: 'test' }
      details.self = details

      // Should not throw when creating envelope
      expect(() => Envelope.error('Error', 'CODE', 400, details)).to.not.throw()
    })

    it('should handle Symbol keys in metadata', () => {
      const sym = Symbol('test')
      const metadata = { [sym]: 'value' } as any

      const envelope = Envelope.success('data', metadata)

      expect((envelope.metadata as any)[sym]).to.equal('value')
    })
  })

  describe('Integration Scenarios', () => {
    it('should work in try-catch pattern', () => {
      function riskyOperation(): ResponseEnvelope<string> {
        try {
          // Simulate operation
          return Envelope.success('result')
        } catch (error) {
          return Envelope.fromError(error as Error)
        }
      }

      const result = riskyOperation()
      expect(Envelope.isSuccess(result)).to.be.true
    })

    it('should work in async operations', async () => {
      async function asyncOperation(): Promise<ResponseEnvelope<number>> {
        // Simulate async work
        await new Promise((resolve) => setTimeout(resolve, 10))
        return Envelope.success(42)
      }

      const result = await asyncOperation()
      expect(Envelope.isSuccess(result)).to.be.true
    })

    it('should chain map operations', () => {
      const initial = Envelope.success(5)

      const result = Envelope.map(
        Envelope.map(
          Envelope.map(initial, (n) => n * 2),
          (n) => n + 10,
        ),
        (n) => n.toString(),
      )

      if (Envelope.isSuccess(result)) {
        expect(result.data).to.equal('20')
      }
    })

    it('should handle pipeline of operations', () => {
      const envelopes = [1, 2, 3, 4, 5].map((n) =>
        Envelope.success(n, { cached: n % 2 === 0 }),
      )

      const merged = Envelope.merge(envelopes)
      const doubled = Envelope.map(merged, (arr) => arr.map((n) => n * 2))

      if (Envelope.isSuccess(doubled)) {
        expect(doubled.data).to.deep.equal([2, 4, 6, 8, 10])
      }
    })
  })
})
