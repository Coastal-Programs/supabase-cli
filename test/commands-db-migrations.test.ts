import { expect } from 'chai'
import sinon from 'sinon'
import * as supabaseModule from '../src/supabase'
import * as authModule from '../src/auth'
import { cache } from '../src/cache'
import { retry } from '../src/retry'
import { SupabaseError, SupabaseErrorCode } from '../src/errors'

describe('Database and Migration Commands (commands-db-migrations.test.ts)', () => {
  let fetchStub: sinon.SinonStub
  let getAuthTokenStub: sinon.SinonStub
  let cacheDeleteStub: sinon.SinonStub
  let cacheGetStub: sinon.SinonStub
  let cacheSetStub: sinon.SinonStub

  beforeEach(() => {
    // Stub fetch
    fetchStub = sinon.stub(global, 'fetch')

    // Stub getAuthToken
    getAuthTokenStub = sinon.stub(authModule, 'getAuthToken')
    getAuthTokenStub.resolves('test-token-123')

    // Stub cache methods
    cacheGetStub = sinon.stub(cache, 'get')
    cacheSetStub = sinon.stub(cache, 'set')
    cacheDeleteStub = sinon.stub(cache, 'delete')

    // By default, cache returns null (cache miss)
    cacheGetStub.returns(null)

    // Reset circuit breaker to prevent test interference
    retry.resetCircuitBreaker()
  })

  afterEach(() => {
    sinon.restore()
  })

  // ============================================================================
  // DATABASE QUERY OPERATIONS - queryDatabase()
  // ============================================================================

  describe('queryDatabase()', () => {
    describe('Happy Path Tests', () => {
      it('should execute SQL query and return results', async () => {
        const mockResults = [
          { id: 1, name: 'Alice', email: 'alice@example.com' },
          { id: 2, name: 'Bob', email: 'bob@example.com' },
        ]

        fetchStub.resolves(
          new Response(JSON.stringify({ rows: mockResults }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const results = await supabaseModule.queryDatabase('test-ref', 'SELECT * FROM users')

        expect(results).to.be.an('array')
        expect(results).to.have.lengthOf(2)
        expect(results[0]).to.deep.equal({ id: 1, name: 'Alice', email: 'alice@example.com' })
        expect((results[1] as any).name).to.equal('Bob')
      })

      it('should handle empty result sets', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify({ rows: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const results = await supabaseModule.queryDatabase(
          'test-ref',
          'SELECT * FROM nonexistent WHERE false',
        )

        expect(results).to.be.an('array').that.is.empty
      })

      it('should include SQL query in request body', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify({ rows: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const sql = 'SELECT * FROM users WHERE id = 1'
        await supabaseModule.queryDatabase('test-ref', sql)

        const call = fetchStub.firstCall
        const body = JSON.parse(call.args[1].body)
        expect(body.query).to.equal(sql)
      })

      it('should use correct API endpoint and method', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify({ rows: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        await supabaseModule.queryDatabase('my-project', 'SELECT 1')

        const call = fetchStub.firstCall
        expect(call.args[0]).to.include('/projects/my-project/database/query')
        expect(call.args[1].method).to.equal('POST')
      })

      it('should handle complex data types in results', async () => {
        const mockResults = [
          {
            id: 1,
            metadata: { key: 'value' },
            created_at: '2024-01-01T00:00:00Z',
            is_active: true,
            count: 42,
          },
        ]

        fetchStub.resolves(
          new Response(JSON.stringify({ rows: mockResults }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const results = await supabaseModule.queryDatabase('test-ref', 'SELECT * FROM complex')

        expect(results).to.have.lengthOf(1)
        expect((results[0] as any).metadata).to.deep.equal({ key: 'value' })
        expect((results[0] as any).is_active).to.be.true
        expect((results[0] as any).count).to.equal(42)
      })
    })

    describe('Error Handling Tests', () => {
      it('should handle SQL syntax errors', async () => {
        fetchStub.resolves(
          new Response(
            JSON.stringify({
              message: 'syntax error at or near "INVALID"',
              code: 'SYNTAX_ERROR',
            }),
            { status: 400 },
          ),
        )

        try {
          await supabaseModule.queryDatabase('test-ref', 'INVALID SQL STATEMENT')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.message).to.include('syntax error')
        }
      })

      it('should handle 401 unauthorized', async () => {
        fetchStub.resolves(new Response('Unauthorized', { status: 401 }))

        try {
          await supabaseModule.queryDatabase('test-ref', 'SELECT 1')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.code).to.equal(SupabaseErrorCode.UNAUTHORIZED)
        }
      })

      it('should handle 404 not found (project not found)', async () => {
        fetchStub.resolves(new Response('Project not found', { status: 404 }))

        try {
          await supabaseModule.queryDatabase('nonexistent-ref', 'SELECT 1')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.code).to.equal(SupabaseErrorCode.NOT_FOUND)
        }
      })

      it('should handle 429 rate limited', async () => {
        fetchStub.resolves(new Response('Rate limit exceeded', { status: 429 }))

        try {
          await supabaseModule.queryDatabase('test-ref', 'SELECT 1')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.code).to.equal(SupabaseErrorCode.RATE_LIMIT)
        }
      })

      it('should handle 500 server error', async () => {
        fetchStub.resolves(new Response('Internal Server Error', { status: 500 }))

        try {
          await supabaseModule.queryDatabase('test-ref', 'SELECT 1')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.code).to.equal(SupabaseErrorCode.INTERNAL_ERROR)
        }
      })

      it('should handle network errors', async () => {
        fetchStub.rejects(new Error('Network connection failed'))

        try {
          await supabaseModule.queryDatabase('test-ref', 'SELECT 1')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error.message).to.include('Network connection failed')
        }
      })

      it('should throw when no auth token available', async () => {
        getAuthTokenStub.resolves(null)

        try {
          await supabaseModule.queryDatabase('test-ref', 'SELECT 1')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.code).to.equal(SupabaseErrorCode.UNAUTHORIZED)
        }
      })
    })

    describe('Special Cases', () => {
      it('should handle queries returning NULL values', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify({ rows: [{ id: 1, value: null }] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const results = await supabaseModule.queryDatabase(
          'test-ref',
          'SELECT id, NULL as value FROM test',
        )

        expect(results).to.have.lengthOf(1)
        expect((results[0] as any).value).to.be.null
      })

      it('should handle large result sets', async () => {
        const largeResults = Array.from({ length: 1000 }, (_, i) => ({ id: i, data: `row-${i}` }))

        fetchStub.resolves(
          new Response(JSON.stringify({ rows: largeResults }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const results = await supabaseModule.queryDatabase('test-ref', 'SELECT * FROM large_table')

        expect(results).to.have.lengthOf(1000)
        expect((results[999] as any).data).to.equal('row-999')
      })

      it('should handle response without rows field gracefully', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify({}), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const results = await supabaseModule.queryDatabase('test-ref', 'SELECT 1')

        expect(results).to.be.an('array').that.is.empty
      })
    })
  })

  // ============================================================================
  // DATABASE SCHEMA OPERATIONS - getTableSchema()
  // ============================================================================

  describe('getTableSchema()', () => {
    describe('Happy Path Tests', () => {
      it('should get schema for specific table', async () => {
        const mockSchema = {
          name: 'users',
          schema: 'public',
          columns: [
            { name: 'id', data_type: 'uuid', is_nullable: false },
            { name: 'email', data_type: 'text', is_nullable: false },
            { name: 'created_at', data_type: 'timestamp', is_nullable: true },
          ],
          primary_key: ['id'],
          indexes: [
            { name: 'users_pkey', columns: ['id'], is_unique: true },
            { name: 'users_email_idx', columns: ['email'], is_unique: true },
          ],
        }

        fetchStub.resolves(
          new Response(JSON.stringify(mockSchema), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const schema = await supabaseModule.getTableSchema('test-ref', 'users')

        expect(schema).to.be.an('object')
        expect((schema as any).name).to.equal('users')
        expect((schema as any).columns).to.be.an('array')
        expect((schema as any).columns).to.have.lengthOf(3)
      })

      it('should use correct API endpoint', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify({ name: 'posts' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        await supabaseModule.getTableSchema('my-project', 'posts')

        const call = fetchStub.firstCall
        expect(call.args[0]).to.include('/projects/my-project/database/tables/posts')
        expect(call.args[1].method).to.equal('GET')
      })

      it('should include auth header', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify({ name: 'test' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        await supabaseModule.getTableSchema('test-ref', 'test')

        const call = fetchStub.firstCall
        expect(call.args[1].headers.Authorization).to.equal('Bearer test-token-123')
      })
    })

    describe('Error Handling Tests', () => {
      it('should handle 404 when table does not exist', async () => {
        fetchStub.resolves(new Response('Table not found', { status: 404 }))

        try {
          await supabaseModule.getTableSchema('test-ref', 'nonexistent_table')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.code).to.equal(SupabaseErrorCode.NOT_FOUND)
        }
      })

      it('should handle 401 unauthorized', async () => {
        fetchStub.resolves(new Response('Unauthorized', { status: 401 }))

        try {
          await supabaseModule.getTableSchema('test-ref', 'users')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.code).to.equal(SupabaseErrorCode.UNAUTHORIZED)
        }
      })

      it('should handle 500 server error', async () => {
        fetchStub.resolves(new Response('Internal Server Error', { status: 500 }))

        try {
          await supabaseModule.getTableSchema('test-ref', 'users')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.code).to.equal(SupabaseErrorCode.INTERNAL_ERROR)
        }
      })
    })

    describe('Complex Schema Cases', () => {
      it('should handle table with foreign keys', async () => {
        const mockSchema = {
          name: 'posts',
          columns: [
            { name: 'id', data_type: 'uuid' },
            { name: 'author_id', data_type: 'uuid' },
          ],
          foreign_keys: [
            {
              column: 'author_id',
              referenced_table: 'users',
              referenced_column: 'id',
            },
          ],
        }

        fetchStub.resolves(
          new Response(JSON.stringify(mockSchema), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const schema = await supabaseModule.getTableSchema('test-ref', 'posts')

        expect((schema as any).foreign_keys).to.be.an('array')
        expect((schema as any).foreign_keys[0].referenced_table).to.equal('users')
      })

      it('should handle table with constraints and defaults', async () => {
        const mockSchema = {
          name: 'users',
          columns: [
            {
              name: 'id',
              data_type: 'uuid',
              default_value: 'gen_random_uuid()',
              is_nullable: false,
            },
            {
              name: 'status',
              data_type: 'text',
              default_value: "'active'",
              check_constraint: "status IN ('active', 'inactive')",
            },
          ],
        }

        fetchStub.resolves(
          new Response(JSON.stringify(mockSchema), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const schema = await supabaseModule.getTableSchema('test-ref', 'users')

        expect((schema as any).columns[0].default_value).to.include('gen_random_uuid')
        expect((schema as any).columns[1].check_constraint).to.include('active')
      })
    })
  })

  // ============================================================================
  // DATABASE EXTENSIONS - listExtensions()
  // ============================================================================

  describe('listExtensions()', () => {
    describe('Happy Path Tests', () => {
      it('should list all extensions', async () => {
        const mockExtensions = [
          {
            name: 'uuid-ossp',
            default_version: '1.1',
            installed_version: '1.1',
            comment: 'generate universally unique identifiers (UUIDs)',
          },
          {
            name: 'pgcrypto',
            default_version: '1.3',
            installed_version: '1.3',
            comment: 'cryptographic functions',
          },
          {
            name: 'postgis',
            default_version: '3.3.2',
            installed_version: '3.3.2',
            comment: 'PostGIS geometry and geography spatial types and functions',
          },
        ]

        fetchStub.resolves(
          new Response(JSON.stringify(mockExtensions), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const extensions = await supabaseModule.listExtensions('test-ref')

        expect(extensions).to.be.an('array')
        expect(extensions).to.have.lengthOf(3)
        expect(extensions[0].name).to.equal('uuid-ossp')
        expect(extensions[1].name).to.equal('pgcrypto')
        expect(extensions[2].comment).to.include('PostGIS')
      })

      it('should return empty array when no extensions installed', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const extensions = await supabaseModule.listExtensions('test-ref')

        expect(extensions).to.be.an('array').that.is.empty
      })

      it('should use correct API endpoint', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify({ rows: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        await supabaseModule.listExtensions('my-project')

        const call = fetchStub.firstCall
        expect(call.args[0]).to.include('/projects/my-project/database/query')
        expect(call.args[1].method).to.equal('POST')
      })
    })

    describe('Caching Tests', () => {
      it('should cache extensions list', async () => {
        const mockExtensions = [
          { name: 'uuid-ossp', default_version: '1.1', installed_version: '1.1', comment: 'UUIDs' },
        ]

        const mockQueryResponse = {
          rows: [
            {
              name: 'uuid-ossp',
              default_version: '1.1',
              installed_version: '1.1',
              comment: 'UUIDs',
            },
          ],
        }

        fetchStub.resolves(
          new Response(JSON.stringify(mockQueryResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        // First call - cache miss
        await supabaseModule.listExtensions('test-ref')
        expect(cacheSetStub.calledOnce).to.be.true
        expect(cacheSetStub.firstCall.args[0]).to.include('extensions:test-ref')

        // Second call - should use cache
        cacheGetStub.returns(mockExtensions)
        const cachedResult = await supabaseModule.listExtensions('test-ref')

        expect(cachedResult).to.deep.equal(mockExtensions)
      })
    })

    describe('Error Handling Tests', () => {
      it('should handle 401 unauthorized', async () => {
        fetchStub.resolves(new Response('Unauthorized', { status: 401 }))

        try {
          await supabaseModule.listExtensions('test-ref')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.code).to.equal(SupabaseErrorCode.UNAUTHORIZED)
        }
      })

      it('should handle 404 project not found', async () => {
        fetchStub.resolves(new Response('Project not found', { status: 404 }))

        try {
          await supabaseModule.listExtensions('nonexistent')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.code).to.equal(SupabaseErrorCode.NOT_FOUND)
        }
      })

      it('should handle 500 server error', async () => {
        fetchStub.resolves(new Response('Internal Server Error', { status: 500 }))

        try {
          await supabaseModule.listExtensions('test-ref')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.code).to.equal(SupabaseErrorCode.INTERNAL_ERROR)
        }
      })
    })

    describe('Extension Version Tests', () => {
      it('should show extension versions correctly', async () => {
        const mockExtensions = [
          {
            name: 'postgis',
            default_version: '3.3.2',
            installed_version: '3.2.0',
            comment: 'Older version installed',
          },
        ]

        fetchStub.resolves(
          new Response(JSON.stringify(mockExtensions), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const extensions = await supabaseModule.listExtensions('test-ref')

        expect(extensions[0].default_version).to.equal('3.3.2')
        expect(extensions[0].installed_version).to.equal('3.2.0')
      })

      it('should handle extensions with null installed version', async () => {
        const mockExtensions = [
          {
            name: 'pg_stat_statements',
            default_version: '1.9',
            installed_version: '',
            comment: 'Not installed',
          },
        ]

        fetchStub.resolves(
          new Response(JSON.stringify(mockExtensions), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const extensions = await supabaseModule.listExtensions('test-ref')

        expect(extensions[0].installed_version).to.equal('')
      })
    })
  })

  // ============================================================================
  // MIGRATIONS - listMigrations()
  // ============================================================================

  describe('listMigrations()', () => {
    describe('Happy Path Tests', () => {
      it('should list all migrations', async () => {
        const mockMigrations = [
          {
            version: '20240101000000',
            name: 'initial_schema',
            statements: ['CREATE TABLE users (id UUID PRIMARY KEY)'],
            applied_at: '2024-01-01T00:00:00Z',
          },
          {
            version: '20240102000000',
            name: 'add_posts_table',
            statements: ['CREATE TABLE posts (id UUID PRIMARY KEY)'],
            applied_at: '2024-01-02T00:00:00Z',
          },
        ]

        fetchStub.resolves(
          new Response(JSON.stringify(mockMigrations), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const migrations = await supabaseModule.listMigrations('test-ref')

        expect(migrations).to.be.an('array')
        expect(migrations).to.have.lengthOf(2)
        expect(migrations[0].name).to.equal('initial_schema')
        expect(migrations[0].applied_at).to.equal('2024-01-01T00:00:00Z')
      })

      it('should return empty array when no migrations', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const migrations = await supabaseModule.listMigrations('test-ref')

        expect(migrations).to.be.an('array').that.is.empty
      })

      it('should use correct API endpoint', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        await supabaseModule.listMigrations('my-project')

        const call = fetchStub.firstCall
        expect(call.args[0]).to.include('/projects/my-project/database/migrations')
        expect(call.args[1].method).to.equal('GET')
      })

      it('should handle pending migrations (no applied_at)', async () => {
        const mockMigrations = [
          {
            version: '20240101000000',
            name: 'applied_migration',
            statements: ['SELECT 1'],
            applied_at: '2024-01-01T00:00:00Z',
          },
          {
            version: '20240102000000',
            name: 'pending_migration',
            statements: ['SELECT 2'],
          },
        ]

        fetchStub.resolves(
          new Response(JSON.stringify(mockMigrations), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const migrations = await supabaseModule.listMigrations('test-ref')

        expect(migrations[0].applied_at).to.exist
        expect(migrations[1].applied_at).to.be.undefined
      })
    })

    describe('Caching Tests', () => {
      it('should cache migrations list', async () => {
        const mockMigrations = [
          { version: '001', name: 'test', statements: [], applied_at: '2024-01-01' },
        ]

        fetchStub.resolves(
          new Response(JSON.stringify(mockMigrations), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        await supabaseModule.listMigrations('test-ref')

        expect(cacheSetStub.calledOnce).to.be.true
        expect(cacheSetStub.firstCall.args[0]).to.include('migrations:test-ref')
      })
    })

    describe('Error Handling Tests', () => {
      it('should handle 401 unauthorized', async () => {
        fetchStub.resolves(new Response('Unauthorized', { status: 401 }))

        try {
          await supabaseModule.listMigrations('test-ref')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.code).to.equal(SupabaseErrorCode.UNAUTHORIZED)
        }
      })

      it('should handle 404 project not found', async () => {
        fetchStub.resolves(new Response('Project not found', { status: 404 }))

        try {
          await supabaseModule.listMigrations('nonexistent')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.code).to.equal(SupabaseErrorCode.NOT_FOUND)
        }
      })

      it('should handle 500 server error', async () => {
        fetchStub.resolves(new Response('Internal Server Error', { status: 500 }))

        try {
          await supabaseModule.listMigrations('test-ref')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.code).to.equal(SupabaseErrorCode.INTERNAL_ERROR)
        }
      })
    })

    describe('Migration Data Integrity Tests', () => {
      it('should preserve migration statements array', async () => {
        const mockMigrations = [
          {
            version: '001',
            name: 'multi_statement',
            statements: [
              'CREATE TABLE users (id UUID)',
              'CREATE INDEX idx_users_id ON users(id)',
              'ALTER TABLE users ADD COLUMN email TEXT',
            ],
            applied_at: '2024-01-01',
          },
        ]

        fetchStub.resolves(
          new Response(JSON.stringify(mockMigrations), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const migrations = await supabaseModule.listMigrations('test-ref')

        expect(migrations[0].statements).to.be.an('array')
        expect(migrations[0].statements).to.have.lengthOf(3)
      })
    })
  })

  // ============================================================================
  // MIGRATIONS - applyMigration()
  // ============================================================================

  describe('applyMigration()', () => {
    describe('Happy Path Tests', () => {
      it('should apply migration successfully', async () => {
        const mockMigration = {
          version: '20240103000000',
          name: 'add_email_column',
          statements: ['ALTER TABLE users ADD COLUMN email TEXT'],
          applied_at: '2024-01-03T00:00:00Z',
        }

        fetchStub.resolves(
          new Response(JSON.stringify(mockMigration), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.applyMigration(
          'test-ref',
          'add_email_column',
          'ALTER TABLE users ADD COLUMN email TEXT',
        )

        expect(result.name).to.equal('add_email_column')
        expect(result.version).to.equal('20240103000000')
        expect(result.applied_at).to.exist
      })

      it('should use correct API endpoint and method', async () => {
        fetchStub.resolves(
          new Response(
            JSON.stringify({
              version: '1',
              name: 'test',
              statements: [],
              applied_at: '2024-01-01',
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } },
          ),
        )

        await supabaseModule.applyMigration(
          'my-project',
          'my_migration',
          'CREATE TABLE test (id UUID)',
        )

        const call = fetchStub.firstCall
        expect(call.args[0]).to.include('/projects/my-project/database/migrations')
        expect(call.args[1].method).to.equal('POST')
      })

      it('should include name and SQL in request body', async () => {
        fetchStub.resolves(
          new Response(
            JSON.stringify({
              version: '1',
              name: 'test',
              statements: [],
              applied_at: '2024-01-01',
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } },
          ),
        )

        const sql = 'CREATE TABLE posts (id UUID PRIMARY KEY, title TEXT)'
        await supabaseModule.applyMigration('test-ref', 'create_posts', sql)

        const call = fetchStub.firstCall
        const body = JSON.parse(call.args[1].body)
        expect(body.name).to.equal('create_posts')
        expect(body.query).to.equal(sql)
      })
    })

    describe('Cache Invalidation Tests', () => {
      it('should invalidate migrations cache after applying', async () => {
        fetchStub.resolves(
          new Response(
            JSON.stringify({
              version: '1',
              name: 'test',
              statements: [],
              applied_at: '2024-01-01',
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } },
          ),
        )

        await supabaseModule.applyMigration('test-ref', 'new_migration', 'SELECT 1')

        // Check that cache delete was called for migrations
        expect(cacheDeleteStub.called).to.be.true
      })

      it('should invalidate tables cache after applying migration', async () => {
        fetchStub.resolves(
          new Response(
            JSON.stringify({
              version: '1',
              name: 'test',
              statements: [],
              applied_at: '2024-01-01',
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } },
          ),
        )

        await supabaseModule.applyMigration(
          'test-ref',
          'create_table',
          'CREATE TABLE new_table (id UUID)',
        )

        // Cache invalidation for both migrations and tables should be called
        expect(cacheDeleteStub.called).to.be.true
      })
    })

    describe('Error Handling Tests', () => {
      it('should handle SQL syntax errors in migration', async () => {
        fetchStub.resolves(
          new Response(
            JSON.stringify({
              message: 'syntax error at or near "INVALID"',
              code: 'SYNTAX_ERROR',
            }),
            { status: 400 },
          ),
        )

        try {
          await supabaseModule.applyMigration('test-ref', 'bad_migration', 'INVALID SQL')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.message).to.include('syntax error')
        }
      })

      it('should handle 401 unauthorized', async () => {
        fetchStub.resolves(new Response('Unauthorized', { status: 401 }))

        try {
          await supabaseModule.applyMigration('test-ref', 'test', 'SELECT 1')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.code).to.equal(SupabaseErrorCode.UNAUTHORIZED)
        }
      })

      it('should handle 404 project not found', async () => {
        fetchStub.resolves(new Response('Project not found', { status: 404 }))

        try {
          await supabaseModule.applyMigration('nonexistent', 'test', 'SELECT 1')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.code).to.equal(SupabaseErrorCode.NOT_FOUND)
        }
      })

      it('should handle 429 rate limited', async () => {
        fetchStub.resolves(new Response('Rate limit exceeded', { status: 429 }))

        try {
          await supabaseModule.applyMigration('test-ref', 'test', 'SELECT 1')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.code).to.equal(SupabaseErrorCode.RATE_LIMIT)
        }
      })

      it('should handle 500 server error', async () => {
        fetchStub.resolves(new Response('Internal Server Error', { status: 500 }))

        try {
          await supabaseModule.applyMigration('test-ref', 'test', 'SELECT 1')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.code).to.equal(SupabaseErrorCode.INTERNAL_ERROR)
        }
      })

      it('should handle migration conflicts', async () => {
        fetchStub.resolves(
          new Response(
            JSON.stringify({
              message: 'Migration version already exists',
              code: 'MIGRATION_CONFLICT',
            }),
            { status: 409 },
          ),
        )

        try {
          await supabaseModule.applyMigration('test-ref', 'duplicate', 'SELECT 1')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.message).to.include('already exists')
        }
      })
    })

    describe('Complex Migration Tests', () => {
      it('should handle multi-statement migrations', async () => {
        const complexSQL = `
          CREATE TABLE posts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            content TEXT,
            author_id UUID REFERENCES users(id),
            created_at TIMESTAMP DEFAULT NOW()
          );

          CREATE INDEX idx_posts_author ON posts(author_id);
          CREATE INDEX idx_posts_created ON posts(created_at DESC);
        `

        const mockMigration = {
          version: '20240104000000',
          name: 'create_posts',
          statements: [
            'CREATE TABLE posts (...)',
            'CREATE INDEX idx_posts_author ON posts(author_id)',
            'CREATE INDEX idx_posts_created ON posts(created_at DESC)',
          ],
          applied_at: '2024-01-04T00:00:00Z',
        }

        fetchStub.resolves(
          new Response(JSON.stringify(mockMigration), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.applyMigration('test-ref', 'create_posts', complexSQL)

        expect(result.statements).to.be.an('array')
        expect(result.statements.length).to.be.greaterThan(0)
      })

      it('should handle migrations with transaction control', async () => {
        const transactionalSQL = `
          BEGIN;
          ALTER TABLE users ADD COLUMN verified BOOLEAN DEFAULT false;
          UPDATE users SET verified = true WHERE email IS NOT NULL;
          COMMIT;
        `

        fetchStub.resolves(
          new Response(
            JSON.stringify({
              version: '005',
              name: 'add_verified',
              statements: [transactionalSQL],
              applied_at: '2024-01-05',
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } },
          ),
        )

        const result = await supabaseModule.applyMigration(
          'test-ref',
          'add_verified',
          transactionalSQL,
        )

        expect(result.name).to.equal('add_verified')
      })
    })
  })

  // ============================================================================
  // INTEGRATION TESTS - Testing Combined Operations
  // ============================================================================

  describe('Integration Tests', () => {
    describe('Database Query + Schema Workflow', () => {
      it('should query database and then get schema', async () => {
        // First query to check if table exists
        fetchStub.onCall(0).resolves(
          new Response(JSON.stringify({ rows: [{ exists: true }] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        // Then get schema
        fetchStub
          .onCall(1)
          .resolves(
            new Response(
              JSON.stringify({ name: 'users', columns: [{ name: 'id', data_type: 'uuid' }] }),
              { status: 200, headers: { 'Content-Type': 'application/json' } },
            ),
          )

        const exists = await supabaseModule.queryDatabase(
          'test-ref',
          "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')",
        )
        const schema = await supabaseModule.getTableSchema('test-ref', 'users')

        expect(exists).to.have.lengthOf(1)
        expect((schema as any).name).to.equal('users')
      })
    })

    describe('Migration + Verification Workflow', () => {
      it('should apply migration and verify it appears in list', async () => {
        // Apply migration
        fetchStub.onCall(0).resolves(
          new Response(
            JSON.stringify({
              version: '006',
              name: 'test_migration',
              statements: ['SELECT 1'],
              applied_at: '2024-01-06',
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } },
          ),
        )

        // List migrations (cache miss due to invalidation)
        cacheGetStub.returns(null)
        fetchStub.onCall(1).resolves(
          new Response(
            JSON.stringify([
              { version: '005', name: 'old', statements: [], applied_at: '2024-01-05' },
              {
                version: '006',
                name: 'test_migration',
                statements: ['SELECT 1'],
                applied_at: '2024-01-06',
              },
            ]),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        )

        await supabaseModule.applyMigration('test-ref', 'test_migration', 'SELECT 1')
        const migrations = await supabaseModule.listMigrations('test-ref')

        expect(migrations).to.have.lengthOf(2)
        expect(migrations[1].name).to.equal('test_migration')
      })
    })
  })
})
