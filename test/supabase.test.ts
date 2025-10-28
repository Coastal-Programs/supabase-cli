import { expect } from 'chai'
import sinon from 'sinon'
import * as supabaseModule from '../src/supabase'
import * as authModule from '../src/auth'
import { SupabaseError, SupabaseErrorCode } from '../src/errors'
import { cache } from '../src/cache'
import { retry } from '../src/retry'

describe('Supabase API Wrapper (supabase.ts)', () => {
  let fetchStub: sinon.SinonStub
  let getAuthTokenStub: sinon.SinonStub

  beforeEach(() => {
    // Stub fetch
    fetchStub = sinon.stub(global, 'fetch')

    // Stub getAuthToken
    getAuthTokenStub = sinon.stub(authModule, 'getAuthToken')
    getAuthTokenStub.resolves('test-token-123')

    // Reset retry circuit breaker to prevent state leakage between tests
    retry.resetCircuitBreaker()
  })

  afterEach(() => {
    sinon.restore()
    cache.clear() // Clear cache to prevent test pollution
  })

  describe('Legacy SupabaseAPIWrapper class', () => {
    describe('constructor', () => {
      it('should create wrapper instance', () => {
        const wrapper = new supabaseModule.SupabaseAPIWrapper()
        expect(wrapper).to.be.instanceOf(supabaseModule.SupabaseAPIWrapper)
      })

      it('should accept access token in config', () => {
        const wrapper = new supabaseModule.SupabaseAPIWrapper({ accessToken: 'token' })
        expect(wrapper.hasAccessToken()).to.be.true
      })

      it('should use environment token if no config provided', () => {
        process.env.SUPABASE_ACCESS_TOKEN = 'env-token'
        const wrapper = new supabaseModule.SupabaseAPIWrapper()
        expect(wrapper.hasAccessToken()).to.be.true
        delete process.env.SUPABASE_ACCESS_TOKEN
      })

      it('should have no token without config or env', () => {
        delete process.env.SUPABASE_ACCESS_TOKEN
        const wrapper = new supabaseModule.SupabaseAPIWrapper()
        expect(wrapper.hasAccessToken()).to.be.false
      })
    })

    describe('setAccessToken()', () => {
      it('should set access token', () => {
        const wrapper = new supabaseModule.SupabaseAPIWrapper()
        expect(wrapper.hasAccessToken()).to.be.false

        wrapper.setAccessToken('new-token')
        expect(wrapper.hasAccessToken()).to.be.true
      })

      it('should update existing token', () => {
        const wrapper = new supabaseModule.SupabaseAPIWrapper({ accessToken: 'old-token' })
        expect(wrapper.hasAccessToken()).to.be.true

        wrapper.setAccessToken('new-token')
        expect(wrapper.hasAccessToken()).to.be.true
      })
    })

    describe('hasAccessToken()', () => {
      it('should return false when no token', () => {
        delete process.env.SUPABASE_ACCESS_TOKEN
        const wrapper = new supabaseModule.SupabaseAPIWrapper()
        expect(wrapper.hasAccessToken()).to.be.false
      })

      it('should return true when token set', () => {
        const wrapper = new supabaseModule.SupabaseAPIWrapper({ accessToken: 'token' })
        expect(wrapper.hasAccessToken()).to.be.true
      })
    })

    describe('deprecated methods', () => {
      it('should throw on initialize()', () => {
        const wrapper = new supabaseModule.SupabaseAPIWrapper()
        expect(() => wrapper.initialize()).to.throw(SupabaseError)
      })

      it('should throw on getClient()', () => {
        const wrapper = new supabaseModule.SupabaseAPIWrapper()
        expect(() => wrapper.getClient()).to.throw(SupabaseError)
      })

      it('should return false for isInitialized()', () => {
        const wrapper = new supabaseModule.SupabaseAPIWrapper()
        expect(wrapper.isInitialized()).to.be.false
      })
    })
  })

  describe('Project Operations', () => {
    describe('listProjects()', () => {
      it('should fetch and return projects', async () => {
        const mockProjects = [
          { id: '1', ref: 'abc', name: 'Project 1', organization_id: 'org1', region: 'us-east-1', created_at: '2024-01-01', database: { host: 'db.host', port: 5432, version: '15' }, status: 'ACTIVE_HEALTHY', inserted_at: '2024-01-01' },
          { id: '2', ref: 'def', name: 'Project 2', organization_id: 'org1', region: 'us-west-1', created_at: '2024-01-02', database: { host: 'db.host', port: 5432, version: '15' }, status: 'ACTIVE_HEALTHY', inserted_at: '2024-01-02' },
        ]

        fetchStub.resolves(
          new Response(JSON.stringify(mockProjects), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.listProjects()

        expect(result).to.be.an('array')
        expect(result).to.have.length(2)
        expect(result[0].name).to.equal('Project 1')
        expect(fetchStub.calledOnce).to.be.true
      })

      it('should return empty array when no projects', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.listProjects()
        expect(result).to.be.an('array')
        expect(result).to.have.length(0)
      })

      it('should throw on 401 unauthorized', async () => {
        fetchStub.resolves(
          new Response('Unauthorized', {
            status: 401,
          }),
        )

        try {
          await supabaseModule.listProjects()
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.code).to.equal(SupabaseErrorCode.UNAUTHORIZED)
        }
      })

      it('should include auth header', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        await supabaseModule.listProjects()

        const call = fetchStub.firstCall
        expect(call.args[1].headers.Authorization).to.equal('Bearer test-token-123')
      })
    })

    describe('getProject()', () => {
      it('should fetch specific project', async () => {
        const mockProject = {
          id: '1',
          ref: 'abc123',
          name: 'My Project',
          organization_id: 'org1',
          region: 'us-east-1',
          created_at: '2024-01-01',
          database: { host: 'db.host', port: 5432, version: '15' },
          status: 'ACTIVE_HEALTHY' as const,
          inserted_at: '2024-01-01',
        }

        fetchStub.resolves(
          new Response(JSON.stringify(mockProject), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.getProject('abc123')

        expect(result.name).to.equal('My Project')
        expect(result.ref).to.equal('abc123')
        expect(fetchStub.calledOnce).to.be.true
      })

      it('should throw 404 if project not found', async () => {
        fetchStub.resolves(
          new Response('Not Found', {
            status: 404,
          }),
        )

        try {
          await supabaseModule.getProject('nonexistent')
          expect.fail('Should have thrown')
        } catch (error: any) {
          expect(error).to.be.instanceOf(SupabaseError)
          expect(error.code).to.equal(SupabaseErrorCode.NOT_FOUND)
        }
      })

      it('should use correct API endpoint', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify({ id: '1', ref: 'abc', name: 'Project' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        await supabaseModule.getProject('test-ref')

        const call = fetchStub.firstCall
        expect(call.args[0]).to.include('/projects/test-ref')
      })
    })

    describe('createProject()', () => {
      it('should create new project', async () => {
        const mockProject = {
          id: 'new-id',
          ref: 'new-ref',
          name: 'New Project',
          organization_id: 'org1',
          region: 'us-east-1',
          created_at: '2024-01-01',
          database: { host: 'db.host', port: 5432, version: '15' },
          status: 'COMING_UP' as const,
          inserted_at: '2024-01-01',
        }

        fetchStub.resolves(
          new Response(JSON.stringify(mockProject), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const config = {
          organization_id: 'org1',
          name: 'New Project',
          region: 'us-east-1',
          db_pass: 'secure-password',
        }

        const result = await supabaseModule.createProject(config)

        expect(result.name).to.equal('New Project')
        expect(fetchStub.calledOnce).to.be.true
      })

      it('should use POST method', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify({ id: '1', ref: 'abc', name: 'Project' }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const config = {
          organization_id: 'org1',
          name: 'Test',
          region: 'us-east-1',
          db_pass: 'password',
        }

        await supabaseModule.createProject(config)

        const call = fetchStub.firstCall
        expect(call.args[1].method).to.equal('POST')
      })

      it('should include config in request body', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify({ id: '1', ref: 'abc', name: 'Project' }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const config = {
          organization_id: 'org1',
          name: 'Test Project',
          region: 'eu-west-1',
          db_pass: 'secure-password',
        }

        await supabaseModule.createProject(config)

        const call = fetchStub.firstCall
        const body = JSON.parse(call.args[1].body)
        expect(body.name).to.equal('Test Project')
        expect(body.region).to.equal('eu-west-1')
        expect(body.organization_id).to.equal('org1')
      })
    })

    describe('deleteProject()', () => {
      it('should delete project', async () => {
        fetchStub.resolves(
          new Response(null, {
            status: 204,
          }),
        )

        await supabaseModule.deleteProject('test-ref')

        expect(fetchStub.calledOnce).to.be.true
      })

      it('should use DELETE method', async () => {
        fetchStub.resolves(
          new Response(null, {
            status: 204,
          }),
        )

        await supabaseModule.deleteProject('test-ref')

        const call = fetchStub.firstCall
        expect(call.args[1].method).to.equal('DELETE')
      })

      it('should throw on error', async () => {
        fetchStub.resolves(
          new Response('Cannot delete project', {
            status: 400,
          }),
        )

        try {
          await supabaseModule.deleteProject('test-ref')
          expect.fail('Should have thrown')
        } catch (error) {
          expect(error).to.be.instanceOf(SupabaseError)
        }
      })
    })

    describe('pauseProject()', () => {
      it('should pause project', async () => {
        fetchStub.resolves(
          new Response(null, {
            status: 204,
          }),
        )

        await supabaseModule.pauseProject('test-ref')

        expect(fetchStub.calledOnce).to.be.true
      })

      it('should use POST method to pause endpoint', async () => {
        fetchStub.resolves(
          new Response(null, {
            status: 204,
          }),
        )

        await supabaseModule.pauseProject('test-ref')

        const call = fetchStub.firstCall
        expect(call.args[0]).to.include('/pause')
        expect(call.args[1].method).to.equal('POST')
      })
    })

    describe('restoreProject()', () => {
      it('should restore paused project', async () => {
        fetchStub.resolves(
          new Response(null, {
            status: 204,
          }),
        )

        await supabaseModule.restoreProject('test-ref')

        expect(fetchStub.calledOnce).to.be.true
      })

      it('should use POST method to restore endpoint', async () => {
        fetchStub.resolves(
          new Response(null, {
            status: 204,
          }),
        )

        await supabaseModule.restoreProject('test-ref')

        const call = fetchStub.firstCall
        expect(call.args[0]).to.include('/restore')
        expect(call.args[1].method).to.equal('POST')
      })
    })
  })

  describe('Database Operations', () => {
    describe('queryDatabase()', () => {
      it('should execute SQL query', async () => {
        const mockResponse = {
          rows: [
            { id: 1, name: 'John' },
            { id: 2, name: 'Jane' },
          ],
        }

        fetchStub.resolves(
          new Response(JSON.stringify(mockResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.queryDatabase('test-ref', 'SELECT * FROM users')

        expect(result).to.be.an('array')
        expect(result).to.have.length(2)
        expect(result[0]).to.deep.equal({ id: 1, name: 'John' })
      })

      it('should return empty array when no rows', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify({ rows: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.queryDatabase('test-ref', 'SELECT 1 WHERE FALSE')

        expect(result).to.be.an('array')
        expect(result).to.have.length(0)
      })

      it('should include SQL in request body', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify({ rows: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        await supabaseModule.queryDatabase('test-ref', 'SELECT * FROM users WHERE id = 1')

        const call = fetchStub.firstCall
        const body = JSON.parse(call.args[1].body)
        expect(body.query).to.equal('SELECT * FROM users WHERE id = 1')
      })

      it('should use POST method', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify({ rows: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        await supabaseModule.queryDatabase('test-ref', 'SELECT 1')

        const call = fetchStub.firstCall
        expect(call.args[1].method).to.equal('POST')
      })
    })

    describe('listTables()', () => {
      it('should list tables', async () => {
        const mockTables = [
          { id: '1', schema: 'public', name: 'users', rls_enabled: true, rls_forced: false, replica_identity: 'DEFAULT', bytes: 1024, size: '1KB', live_rows_estimate: 100, dead_rows_estimate: 0 },
          { id: '2', schema: 'public', name: 'posts', rls_enabled: true, rls_forced: false, replica_identity: 'DEFAULT', bytes: 2048, size: '2KB', live_rows_estimate: 200, dead_rows_estimate: 0 },
        ]

        fetchStub.resolves(
          new Response(JSON.stringify(mockTables), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.listTables('test-ref')

        expect(result).to.be.an('array')
        expect(result).to.have.length(2)
        expect(result[0].name).to.equal('users')
      })

      it('should support custom schema', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        await supabaseModule.listTables('test-ref', 'auth')

        const call = fetchStub.firstCall
        expect(call.args[0]).to.include('schemas=auth')
      })

      it('should default to public schema', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        await supabaseModule.listTables('test-ref')

        const call = fetchStub.firstCall
        expect(call.args[0]).to.include('schemas=public')
      })
    })

    describe('listExtensions()', () => {
      it('should list extensions', async () => {
        const mockExtensions = [
          { name: 'uuid-ossp', default_version: '1.1', installed_version: '1.1', comment: 'UUID generation' },
          { name: 'pgcrypto', default_version: '1.3', installed_version: '1.3', comment: 'Cryptographic functions' },
        ]

        fetchStub.resolves(
          new Response(JSON.stringify(mockExtensions), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.listExtensions('test-ref')

        expect(result).to.be.an('array')
        expect(result).to.have.length(2)
        expect(result[0].name).to.equal('uuid-ossp')
      })
    })
  })

  describe('Migration Operations', () => {
    describe('listMigrations()', () => {
      it('should list migrations', async () => {
        const mockMigrations = [
          { version: '001', name: 'init', statements: ['CREATE TABLE users (id UUID PRIMARY KEY)'], applied_at: '2024-01-01' },
          { version: '002', name: 'add_posts', statements: ['CREATE TABLE posts (id UUID PRIMARY KEY)'], applied_at: '2024-01-02' },
        ]

        fetchStub.resolves(
          new Response(JSON.stringify(mockMigrations), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.listMigrations('test-ref')

        expect(result).to.be.an('array')
        expect(result).to.have.length(2)
        expect(result[0].name).to.equal('init')
      })
    })

    describe('applyMigration()', () => {
      it('should apply migration', async () => {
        const mockMigration = {
          version: '003',
          name: 'add_column',
          statements: ['ALTER TABLE users ADD COLUMN email TEXT'],
          applied_at: '2024-01-03',
        }

        fetchStub.resolves(
          new Response(JSON.stringify(mockMigration), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.applyMigration(
          'test-ref',
          'add_column',
          'ALTER TABLE users ADD COLUMN email TEXT',
        )

        expect(result.name).to.equal('add_column')
        expect(fetchStub.calledOnce).to.be.true
      })

      it('should include name and SQL in body', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify({ version: '1', name: 'test', statements: [] }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        await supabaseModule.applyMigration('test-ref', 'my_migration', 'CREATE TABLE test (id UUID)')

        const call = fetchStub.firstCall
        const body = JSON.parse(call.args[1].body)
        expect(body.name).to.equal('my_migration')
        expect(body.query).to.equal('CREATE TABLE test (id UUID)')
      })
    })
  })

  describe('Edge Function Operations', () => {
    describe('listFunctions()', () => {
      it('should list edge functions', async () => {
        const mockFunctions = [
          { id: '1', slug: 'hello', name: 'Hello Function', status: 'ACTIVE' as const, version: 1, created_at: '2024-01-01', updated_at: '2024-01-01', verify_jwt: true, import_map: false },
          { id: '2', slug: 'goodbye', name: 'Goodbye Function', status: 'ACTIVE' as const, version: 1, created_at: '2024-01-02', updated_at: '2024-01-02', verify_jwt: true, import_map: false },
        ]

        fetchStub.resolves(
          new Response(JSON.stringify(mockFunctions), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.listFunctions('test-ref')

        expect(result).to.be.an('array')
        expect(result).to.have.length(2)
        expect(result[0].slug).to.equal('hello')
      })
    })

    describe('getFunction()', () => {
      it('should get specific function', async () => {
        const mockFunction = {
          id: '1',
          slug: 'hello',
          name: 'Hello Function',
          status: 'ACTIVE' as const,
          version: 1,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          verify_jwt: true,
          import_map: false,
        }

        fetchStub.resolves(
          new Response(JSON.stringify(mockFunction), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.getFunction('test-ref', 'hello')

        expect(result.slug).to.equal('hello')
        expect(result.name).to.equal('Hello Function')
      })
    })

    describe('deployFunction()', () => {
      it('should deploy function', async () => {
        const mockFunction = {
          id: '1',
          slug: 'hello',
          name: 'Hello Function',
          status: 'DEPLOYING' as const,
          version: 2,
          created_at: '2024-01-01',
          updated_at: '2024-01-03',
          verify_jwt: true,
          import_map: false,
        }

        fetchStub.resolves(
          new Response(JSON.stringify(mockFunction), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const config = {
          slug: 'hello',
          files: [{ name: 'index.ts', content: 'Deno.serve(() => new Response("Hello"))' }],
        }

        const result = await supabaseModule.deployFunction('test-ref', config)

        expect(result.slug).to.equal('hello')
        expect(result.version).to.equal(2)
      })

      it('should include files in request', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify({ id: '1', slug: 'test', name: 'Test', status: 'DEPLOYING', version: 1, created_at: '2024-01-01', updated_at: '2024-01-01', verify_jwt: true, import_map: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const config = {
          slug: 'test',
          files: [
            { name: 'index.ts', content: 'export default () => new Response("Test")' },
            { name: 'helper.ts', content: 'export const helper = () => "help"' },
          ],
        }

        await supabaseModule.deployFunction('test-ref', config)

        const call = fetchStub.firstCall
        const body = JSON.parse(call.args[1].body)
        expect(body.files).to.be.an('array')
        expect(body.files).to.have.length(2)
      })
    })

    describe('deleteFunction()', () => {
      it('should delete function', async () => {
        fetchStub.resolves(
          new Response(null, {
            status: 204,
          }),
        )

        await supabaseModule.deleteFunction('test-ref', 'hello')

        expect(fetchStub.calledOnce).to.be.true
      })

      it('should use DELETE method', async () => {
        fetchStub.resolves(
          new Response(null, {
            status: 204,
          }),
        )

        await supabaseModule.deleteFunction('test-ref', 'hello')

        const call = fetchStub.firstCall
        expect(call.args[1].method).to.equal('DELETE')
      })
    })
  })

  describe('Branch Operations', () => {
    describe('listBranches()', () => {
      it('should list branches', async () => {
        const mockBranches = [
          { id: '1', project_id: 'proj1', name: 'main', status: 'ACTIVE' as const, created_at: '2024-01-01', updated_at: '2024-01-01', project_ref: 'abc', persistent: true },
          { id: '2', project_id: 'proj1', name: 'develop', status: 'ACTIVE' as const, created_at: '2024-01-02', updated_at: '2024-01-02', project_ref: 'def', persistent: false },
        ]

        fetchStub.resolves(
          new Response(JSON.stringify(mockBranches), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.listBranches('test-ref')

        expect(result).to.be.an('array')
        expect(result).to.have.length(2)
        expect(result[0].name).to.equal('main')
      })
    })

    describe('createBranch()', () => {
      it('should create branch', async () => {
        const mockBranch = {
          id: 'new-branch-id',
          project_id: 'proj1',
          name: 'feature',
          status: 'CREATING' as const,
          created_at: '2024-01-03',
          updated_at: '2024-01-03',
          project_ref: 'ghi',
          persistent: false,
        }

        fetchStub.resolves(
          new Response(JSON.stringify(mockBranch), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.createBranch('test-ref', 'feature')

        expect(result.name).to.equal('feature')
        expect(result.status).to.equal('CREATING')
      })

      it('should include branch name in request', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify({ id: '1', project_id: 'p1', name: 'test', status: 'CREATING', created_at: '2024-01-01', updated_at: '2024-01-01', project_ref: 'abc', persistent: false }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        await supabaseModule.createBranch('test-ref', 'my-branch')

        const call = fetchStub.firstCall
        const body = JSON.parse(call.args[1].body)
        expect(body.branch_name).to.equal('my-branch')
      })
    })

    describe('deleteBranch()', () => {
      it('should delete branch', async () => {
        fetchStub.resolves(
          new Response(null, {
            status: 204,
          }),
        )

        await supabaseModule.deleteBranch('branch-id')

        expect(fetchStub.calledOnce).to.be.true
      })
    })

    describe('mergeBranch()', () => {
      it('should merge branch', async () => {
        fetchStub.resolves(
          new Response(null, {
            status: 204,
          }),
        )

        await supabaseModule.mergeBranch('branch-id')

        const call = fetchStub.firstCall
        expect(call.args[0]).to.include('/merge')
        expect(call.args[1].method).to.equal('POST')
      })
    })

    describe('resetBranch()', () => {
      it('should reset branch', async () => {
        fetchStub.resolves(
          new Response(null, {
            status: 204,
          }),
        )

        await supabaseModule.resetBranch('branch-id')

        const call = fetchStub.firstCall
        expect(call.args[0]).to.include('/reset')
        expect(call.args[1].method).to.equal('POST')
      })

      it('should include migration version if provided', async () => {
        fetchStub.resolves(
          new Response(null, {
            status: 204,
          }),
        )

        await supabaseModule.resetBranch('branch-id', '001')

        const call = fetchStub.firstCall
        const body = JSON.parse(call.args[1].body)
        expect(body.migration_version).to.equal('001')
      })
    })

    describe('rebaseBranch()', () => {
      it('should rebase branch', async () => {
        fetchStub.resolves(
          new Response(null, {
            status: 204,
          }),
        )

        await supabaseModule.rebaseBranch('branch-id')

        const call = fetchStub.firstCall
        expect(call.args[0]).to.include('/rebase')
        expect(call.args[1].method).to.equal('POST')
      })
    })
  })

  describe('Secret Operations', () => {
    describe('listSecrets()', () => {
      it('should list secrets', async () => {
        const mockSecrets = [
          { name: 'API_KEY', value: '***' },
          { name: 'DB_PASSWORD', value: '***' },
        ]

        fetchStub.resolves(
          new Response(JSON.stringify(mockSecrets), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.listSecrets('test-ref')

        expect(result).to.be.an('array')
        expect(result).to.have.length(2)
        expect(result[0].name).to.equal('API_KEY')
      })
    })

    describe('createSecret()', () => {
      it('should create secret', async () => {
        const mockSecret = { name: 'NEW_SECRET', value: 'secret-value' }

        fetchStub.resolves(
          new Response(JSON.stringify(mockSecret), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.createSecret('test-ref', 'NEW_SECRET', 'secret-value')

        expect(result.name).to.equal('NEW_SECRET')
      })

      it('should include secret in request', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify({ name: 'TEST', value: 'value' }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        await supabaseModule.createSecret('test-ref', 'TEST_KEY', 'test-value')

        const call = fetchStub.firstCall
        const body = JSON.parse(call.args[1].body)
        expect(body.secrets).to.be.an('array')
        expect(body.secrets[0].name).to.equal('TEST_KEY')
        expect(body.secrets[0].value).to.equal('test-value')
      })
    })

    describe('deleteSecret()', () => {
      it('should delete secret', async () => {
        fetchStub.resolves(
          new Response(null, {
            status: 204,
          }),
        )

        await supabaseModule.deleteSecret('test-ref', 'OLD_SECRET')

        expect(fetchStub.calledOnce).to.be.true
      })
    })
  })

  describe('Monitoring Operations', () => {
    describe('getLogs()', () => {
      it('should get logs for service', async () => {
        const mockLogs = {
          logs: [
            { timestamp: '2024-01-01T00:00:00Z', event_message: 'Request received' },
            { timestamp: '2024-01-01T00:00:01Z', event_message: 'Request processed' },
          ],
        }

        fetchStub.resolves(
          new Response(JSON.stringify(mockLogs), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.getLogs('test-ref', 'api')

        expect(result).to.be.an('array')
        expect(result).to.have.length(2)
        expect(result[0].event_message).to.equal('Request received')
      })

      it('should return empty array when no logs', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify({ logs: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.getLogs('test-ref', 'postgres')

        expect(result).to.be.an('array')
        expect(result).to.have.length(0)
      })
    })

    describe('getAdvisors()', () => {
      it('should get security advisors', async () => {
        const mockAdvisors = [
          { type: 'security', category: 'rls', level: 'WARNING' as const, title: 'RLS Not Enabled', description: 'Table users has no RLS policy', remediation_url: 'https://docs.supabase.com/rls' },
        ]

        fetchStub.resolves(
          new Response(JSON.stringify(mockAdvisors), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.getAdvisors('test-ref', 'security')

        expect(result).to.be.an('array')
        expect(result).to.have.length(1)
        expect(result[0].type).to.equal('security')
      })

      it('should get performance advisors', async () => {
        fetchStub.resolves(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        await supabaseModule.getAdvisors('test-ref', 'performance')

        const call = fetchStub.firstCall
        expect(call.args[0]).to.include('/advisors/performance')
      })
    })

    describe('getProjectStats()', () => {
      it('should aggregate project statistics', async () => {
        // Mock multiple API calls
        fetchStub.onCall(0).resolves(
          new Response(JSON.stringify([{ id: '1', schema: 'public', name: 'users', bytes: 1024, rls_enabled: true, rls_forced: false, replica_identity: 'DEFAULT', size: '1KB', live_rows_estimate: 100, dead_rows_estimate: 0 }]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
        fetchStub.onCall(1).resolves(
          new Response(JSON.stringify([{ id: '1', slug: 'hello', name: 'Hello', status: 'ACTIVE', version: 1, created_at: '2024-01-01', updated_at: '2024-01-01', verify_jwt: true, import_map: false }]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
        fetchStub.onCall(2).resolves(
          new Response(JSON.stringify([{ id: '1', project_id: 'p1', name: 'main', status: 'ACTIVE', created_at: '2024-01-01', updated_at: '2024-01-01', project_ref: 'abc', persistent: true }]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        const result = await supabaseModule.getProjectStats('test-ref')

        expect(result).to.have.property('database_size')
        expect(result).to.have.property('table_count')
        expect(result).to.have.property('function_count')
        expect(result).to.have.property('branch_count')
        expect(result.table_count).to.equal(1)
        expect(result.function_count).to.equal(1)
        expect(result.branch_count).to.equal(1)
      })
    })
  })

  describe('Error Handling', () => {
    it('should throw when no auth token', async () => {
      getAuthTokenStub.resolves(null)

      try {
        await supabaseModule.listProjects()
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error).to.be.instanceOf(SupabaseError)
        expect(error.code).to.equal(SupabaseErrorCode.UNAUTHORIZED)
      }
    })

    it('should include error details from API', async () => {
      fetchStub.resolves(
        new Response(JSON.stringify({ message: 'Custom error message', code: 'CUSTOM_CODE' }), {
          status: 400,
        }),
      )

      try {
        await supabaseModule.listProjects()
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.message).to.include('Custom error message')
      }
    })

    it('should handle network errors', async () => {
      fetchStub.rejects(new Error('Network error'))

      try {
        await supabaseModule.listProjects()
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).to.be.instanceOf(Error)
      }
    })
  })
})
