import { expect } from 'chai'
import sinon from 'sinon'
import * as supabaseModule from '../src/supabase'
import * as authModule from '../src/auth'
import { cache } from '../src/cache'
import { retry } from '../src/retry'
import { SupabaseError, SupabaseErrorCode } from '../src/errors'

describe('Database Info Command (commands-db-info.test.ts)', () => {
  let fetchStub: sinon.SinonStub
  let getAuthTokenStub: sinon.SinonStub
  let cacheGetStub: sinon.SinonStub

  beforeEach(() => {
    // Stub fetch
    fetchStub = sinon.stub(global, 'fetch')

    // Stub getAuthToken
    getAuthTokenStub = sinon.stub(authModule, 'getAuthToken')
    getAuthTokenStub.resolves('test-token-123')

    // Stub cache methods
    cacheGetStub = sinon.stub(cache, 'get')
    sinon.stub(cache, 'set')
    sinon.stub(cache, 'delete')

    // By default, cache returns null (cache miss)
    cacheGetStub.returns(null)

    // Reset circuit breaker to prevent test interference
    retry.resetCircuitBreaker()
  })

  afterEach(() => {
    sinon.restore()
  })

  // ============================================================================
  // DATABASE INFO - Happy Path Tests
  // ============================================================================

  describe('Database Info - Happy Path', () => {
    it('should retrieve database information successfully', async () => {
      const mockDbInfo = [
        {
          database: 'postgres',
          postgres_version:
            'PostgreSQL 17.6 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 13.2.0, 64-bit',
          size: '10035 kB',
        },
      ]

      fetchStub.resolves(
        new Response(JSON.stringify(mockDbInfo), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      const result = await supabaseModule.queryDatabase(
        'test-ref',
        `
        SELECT
          current_database() AS database,
          version() AS postgres_version,
          pg_size_pretty(pg_database_size(current_database())) AS size;
      `,
      )

      expect(result).to.be.an('array')
      expect(result).to.have.lengthOf(1)
      expect((result[0] as any).database).to.equal('postgres')
      expect((result[0] as any).postgres_version).to.include('PostgreSQL')
      expect((result[0] as any).size).to.match(/\d+\s+(kB|MB|GB)/)
    })

    it('should format database size correctly', async () => {
      const mockDbInfo = [
        {
          database: 'postgres',
          postgres_version: 'PostgreSQL 17.6',
          size: '1024 MB',
        },
      ]

      fetchStub.resolves(
        new Response(JSON.stringify(mockDbInfo), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      const result = await supabaseModule.queryDatabase('test-ref', 'SELECT ...')

      expect((result[0] as any).size).to.equal('1024 MB')
    })

    it('should handle different PostgreSQL versions', async () => {
      const versions = [
        'PostgreSQL 15.0',
        'PostgreSQL 16.2',
        'PostgreSQL 17.6 on x86_64-pc-linux-gnu',
      ]

      for (const version of versions) {
        fetchStub.resolves(
          new Response(
            JSON.stringify([
              {
                database: 'postgres',
                postgres_version: version,
                size: '100 MB',
              },
            ]),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          ),
        )

        const result = await supabaseModule.queryDatabase('test-ref', 'SELECT ...')
        expect((result[0] as any).postgres_version).to.include('PostgreSQL')
      }
    })

    it('should use correct API endpoint', async () => {
      fetchStub.resolves(
        new Response(
          JSON.stringify([{ database: 'postgres', postgres_version: 'v17', size: '10 MB' }]),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )

      await supabaseModule.queryDatabase('my-project', 'SELECT ...')

      const call = fetchStub.firstCall
      expect(call.args[0]).to.include('/projects/my-project/database/query')
      expect(call.args[1].method).to.equal('POST')
    })

    it('should include auth header', async () => {
      fetchStub.resolves(
        new Response(JSON.stringify([{ database: 'postgres', postgres_version: 'v17', size: '10 MB' }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      await supabaseModule.queryDatabase('test-ref', 'SELECT ...')

      const call = fetchStub.firstCall
      expect(call.args[1].headers.Authorization).to.equal('Bearer test-token-123')
    })
  })

  // ============================================================================
  // DATABASE INFO - Error Handling Tests
  // ============================================================================

  describe('Database Info - Error Handling', () => {
    it('should handle 401 unauthorized', async () => {
      fetchStub.resolves(new Response('Unauthorized', { status: 401 }))

      try {
        await supabaseModule.queryDatabase('test-ref', 'SELECT ...')
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error).to.be.instanceOf(SupabaseError)
        expect(error.code).to.equal(SupabaseErrorCode.UNAUTHORIZED)
      }
    })

    it('should handle 404 project not found', async () => {
      fetchStub.resolves(
        new Response('Project reference in URL is not valid', { status: 404 }),
      )

      try {
        await supabaseModule.queryDatabase('invalid-ref', 'SELECT ...')
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error).to.be.instanceOf(SupabaseError)
        expect(error.code).to.equal(SupabaseErrorCode.NOT_FOUND)
        expect(error.message).to.include('not valid')
      }
    })

    it('should handle 429 rate limited', async () => {
      fetchStub.resolves(new Response('Rate limit exceeded', { status: 429 }))

      try {
        await supabaseModule.queryDatabase('test-ref', 'SELECT ...')
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error).to.be.instanceOf(SupabaseError)
        expect(error.code).to.equal(SupabaseErrorCode.RATE_LIMIT)
      }
    })

    it('should handle 500 server error', async () => {
      fetchStub.resolves(new Response('Internal Server Error', { status: 500 }))

      try {
        await supabaseModule.queryDatabase('test-ref', 'SELECT ...')
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error).to.be.instanceOf(SupabaseError)
        expect(error.code).to.equal(SupabaseErrorCode.INTERNAL_ERROR)
      }
    })

    it('should handle network errors', async () => {
      fetchStub.rejects(new Error('Network connection failed'))

      try {
        await supabaseModule.queryDatabase('test-ref', 'SELECT ...')
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.message).to.include('Network connection failed')
      }
    })

    it('should throw when no auth token available', async () => {
      getAuthTokenStub.resolves(null)

      try {
        await supabaseModule.queryDatabase('test-ref', 'SELECT ...')
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error).to.be.instanceOf(SupabaseError)
        expect(error.code).to.equal(SupabaseErrorCode.UNAUTHORIZED)
      }
    })

    it('should handle SQL query timeout', async () => {
      fetchStub.resolves(
        new Response('Query execution timeout', { status: 408 }),
      )

      try {
        await supabaseModule.queryDatabase('test-ref', 'SELECT ...')
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error).to.be.instanceOf(SupabaseError)
      }
    })
  })

  // ============================================================================
  // DATABASE INFO - Edge Cases
  // ============================================================================

  describe('Database Info - Edge Cases', () => {
    it('should handle very large database sizes', async () => {
      const mockDbInfo = [
        {
          database: 'postgres',
          postgres_version: 'PostgreSQL 17.6',
          size: '999 GB',
        },
      ]

      fetchStub.resolves(
        new Response(JSON.stringify(mockDbInfo), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      const result = await supabaseModule.queryDatabase('test-ref', 'SELECT ...')

      expect((result[0] as any).size).to.equal('999 GB')
    })

    it('should handle very small database sizes', async () => {
      const mockDbInfo = [
        {
          database: 'postgres',
          postgres_version: 'PostgreSQL 17.6',
          size: '8192 bytes',
        },
      ]

      fetchStub.resolves(
        new Response(JSON.stringify(mockDbInfo), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      const result = await supabaseModule.queryDatabase('test-ref', 'SELECT ...')

      expect((result[0] as any).size).to.equal('8192 bytes')
    })

    it('should handle custom database names', async () => {
      const mockDbInfo = [
        {
          database: 'my_custom_db',
          postgres_version: 'PostgreSQL 17.6',
          size: '100 MB',
        },
      ]

      fetchStub.resolves(
        new Response(JSON.stringify(mockDbInfo), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      const result = await supabaseModule.queryDatabase('test-ref', 'SELECT ...')

      expect((result[0] as any).database).to.equal('my_custom_db')
    })

    it('should handle empty result set gracefully', async () => {
      fetchStub.resolves(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      const result = await supabaseModule.queryDatabase('test-ref', 'SELECT ...')

      expect(result).to.be.an('array').that.is.empty
    })

    it('should handle response without expected fields', async () => {
      const mockDbInfo = [
        {
          database: 'postgres',
          // Missing postgres_version and size
        },
      ]

      fetchStub.resolves(
        new Response(JSON.stringify(mockDbInfo), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      const result = await supabaseModule.queryDatabase('test-ref', 'SELECT ...')

      expect(result).to.have.lengthOf(1)
      expect((result[0] as any).database).to.equal('postgres')
      expect((result[0] as any).postgres_version).to.be.undefined
    })
  })

  // ============================================================================
  // DATABASE INFO - Version Parsing Tests
  // ============================================================================

  describe('Database Info - Version Parsing', () => {
    const testCases = [
      {
        version: 'PostgreSQL 15.0 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 11.2.0, 64-bit',
        expected: 'PostgreSQL 15.0',
      },
      {
        version: 'PostgreSQL 16.2 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 13.2.0, 64-bit',
        expected: 'PostgreSQL 16.2',
      },
      {
        version: 'PostgreSQL 17.6',
        expected: 'PostgreSQL 17.6',
      },
      {
        version: 'PostgreSQL 14.8 (Ubuntu 14.8-1.pgdg20.04+1) on x86_64-pc-linux-gnu',
        expected: 'PostgreSQL 14.8',
      },
    ]

    testCases.forEach(({ version, expected }) => {
      it(`should parse version: ${expected}`, async () => {
        fetchStub.resolves(
          new Response(
            JSON.stringify([
              {
                database: 'postgres',
                postgres_version: version,
                size: '100 MB',
              },
            ]),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          ),
        )

        const result = await supabaseModule.queryDatabase('test-ref', 'SELECT ...')

        expect((result[0] as any).postgres_version).to.include(expected)
      })
    })
  })

  // ============================================================================
  // DATABASE INFO - Size Format Tests
  // ============================================================================

  describe('Database Info - Size Format', () => {
    const sizeFormats = [
      '8192 bytes',
      '1024 kB',
      '10035 kB',
      '512 MB',
      '2 GB',
      '999 GB',
      '1 TB',
    ]

    sizeFormats.forEach((size) => {
      it(`should handle size format: ${size}`, async () => {
        fetchStub.resolves(
          new Response(
            JSON.stringify([
              {
                database: 'postgres',
                postgres_version: 'PostgreSQL 17.6',
                size,
              },
            ]),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          ),
        )

        const result = await supabaseModule.queryDatabase('test-ref', 'SELECT ...')

        expect((result[0] as any).size).to.equal(size)
      })
    })
  })

  // ============================================================================
  // DATABASE INFO - Performance Tests
  // ============================================================================

  describe('Database Info - Performance', () => {
    it('should complete query within reasonable time', async () => {
      fetchStub.resolves(
        new Response(
          JSON.stringify([
            {
              database: 'postgres',
              postgres_version: 'PostgreSQL 17.6',
              size: '100 MB',
            },
          ]),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )

      const startTime = Date.now()
      await supabaseModule.queryDatabase('test-ref', 'SELECT ...')
      const duration = Date.now() - startTime

      // Should complete in less than 5 seconds (generous for network latency)
      expect(duration).to.be.lessThan(5000)
    })

    it('should handle concurrent requests', async () => {
      fetchStub.resolves(
        new Response(
          JSON.stringify([
            {
              database: 'postgres',
              postgres_version: 'PostgreSQL 17.6',
              size: '100 MB',
            },
          ]),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )

      const promises = Array.from({ length: 5 }, () =>
        supabaseModule.queryDatabase('test-ref', 'SELECT ...'),
      )

      const results = await Promise.all(promises)

      expect(results).to.have.lengthOf(5)
      results.forEach((result) => {
        expect(result).to.be.an('array')
        expect(result).to.have.lengthOf(1)
      })
    })
  })

  // ============================================================================
  // DATABASE INFO - Retry Logic Tests
  // ============================================================================

  describe('Database Info - Retry Logic', () => {
    it('should retry on transient network errors', async () => {
      // First call fails, second succeeds
      fetchStub.onFirstCall().rejects(new Error('Network timeout'))
      fetchStub.onSecondCall().resolves(
        new Response(
          JSON.stringify([
            {
              database: 'postgres',
              postgres_version: 'PostgreSQL 17.6',
              size: '100 MB',
            },
          ]),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )

      const result = await supabaseModule.queryDatabase('test-ref', 'SELECT ...')

      expect(result).to.be.an('array')
      expect(result).to.have.lengthOf(1)
      expect(fetchStub.callCount).to.equal(2)
    })

    it('should not retry on 4xx client errors', async () => {
      fetchStub.resolves(new Response('Bad Request', { status: 400 }))

      try {
        await supabaseModule.queryDatabase('test-ref', 'INVALID SQL')
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error).to.be.instanceOf(SupabaseError)
        expect(fetchStub.callCount).to.equal(1) // Only one attempt
      }
    })
  })
})
