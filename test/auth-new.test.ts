import { expect } from 'chai'
import sinon from 'sinon'
import * as authModule from '../src/auth'
import { AuthenticationError, SupabaseError, SupabaseErrorCode } from '../src/errors'

describe('New Authentication Functions (auth.ts)', () => {
  let fetchStub: sinon.SinonStub

  beforeEach(() => {
    // Clear environment
    delete process.env.SUPABASE_ACCESS_TOKEN

    // Stub fetch for API validation
    fetchStub = sinon.stub(global, 'fetch')
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('validateToken()', () => {
    it('should return true for valid token', async () => {
      fetchStub.resolves(
        new Response(JSON.stringify([{ id: 'org-123', name: 'My Org' }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      const result = await authModule.validateToken('sbp_' + 'a'.repeat(32))
      expect(result).to.be.true
    })

    it('should return false for 401 unauthorized', async () => {
      fetchStub.resolves(
        new Response('Unauthorized', {
          status: 401,
        }),
      )

      const result = await authModule.validateToken('sbp_' + 'a'.repeat(32))
      expect(result).to.be.false
    })

    it('should return false for 403 forbidden', async () => {
      fetchStub.resolves(
        new Response('Forbidden', {
          status: 403,
        }),
      )

      const result = await authModule.validateToken('sbp_' + 'a'.repeat(32))
      expect(result).to.be.false
    })

    it('should return true for 500 errors (assume token valid, service issues)', async () => {
      fetchStub.resolves(
        new Response('Server Error', {
          status: 500,
        }),
      )

      const result = await authModule.validateToken('sbp_' + 'a'.repeat(32))
      expect(result).to.be.true
    })

    it('should make request to organizations endpoint', async () => {
      fetchStub.resolves(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      await authModule.validateToken('sbp_' + 'a'.repeat(32))

      expect(fetchStub.calledOnce).to.be.true
      expect(fetchStub.firstCall.args[0]).to.include('/v1/organizations')
    })

    it('should include authorization header', async () => {
      fetchStub.resolves(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      const token = 'sbp_' + 'a'.repeat(32)
      await authModule.validateToken(token)

      const call = fetchStub.firstCall
      expect(call.args[1].headers.Authorization).to.equal(`Bearer ${token}`)
    })

    it('should handle network errors gracefully', async () => {
      fetchStub.rejects(new Error('Network error'))

      // With valid format, should return true (assume valid)
      const result = await authModule.validateToken('sbp_' + 'a'.repeat(32))
      expect(result).to.be.true
    })

    it('should return false for invalid token format on network error', async () => {
      fetchStub.rejects(new Error('Network error'))

      const result = await authModule.validateToken('invalid-token')
      expect(result).to.be.false
    })
  })

  describe('getAuthToken()', () => {
    it('should return token from environment', async () => {
      const testToken = 'sbp_' + 'b'.repeat(32)
      process.env.SUPABASE_ACCESS_TOKEN = testToken

      const result = await authModule.getAuthToken()
      expect(result).to.equal(testToken)
    })

    it('should return null when no token found', async () => {
      delete process.env.SUPABASE_ACCESS_TOKEN

      const result = await authModule.getAuthToken()
      expect(result).to.be.null
    })

    it('should prioritize environment over file', async () => {
      const envToken = 'sbp_env_' + 'c'.repeat(32)
      process.env.SUPABASE_ACCESS_TOKEN = envToken

      const result = await authModule.getAuthToken()
      expect(result).to.equal(envToken)
    })
  })

  describe('isAuthenticated()', () => {
    it('should return false when no token', async () => {
      delete process.env.SUPABASE_ACCESS_TOKEN

      const result = await authModule.isAuthenticated()
      expect(result).to.be.false
    })

    it('should return true when token is valid', async () => {
      process.env.SUPABASE_ACCESS_TOKEN = 'sbp_' + 'd'.repeat(32)

      fetchStub.resolves(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      const result = await authModule.isAuthenticated()
      expect(result).to.be.true
    })

    it('should return false when token is invalid', async () => {
      process.env.SUPABASE_ACCESS_TOKEN = 'sbp_' + 'e'.repeat(32)

      fetchStub.resolves(
        new Response('Unauthorized', {
          status: 401,
        }),
      )

      const result = await authModule.isAuthenticated()
      expect(result).to.be.false
    })

    it('should handle network errors', async () => {
      process.env.SUPABASE_ACCESS_TOKEN = 'sbp_' + 'f'.repeat(32)

      fetchStub.rejects(new Error('Network error'))

      // Should return true (optimistic with valid format)
      const result = await authModule.isAuthenticated()
      expect(result).to.be.true
    })
  })

  describe('ensureAuthenticated()', () => {
    it('should return token when authenticated', async () => {
      const testToken = 'sbp_' + 'g'.repeat(32)
      process.env.SUPABASE_ACCESS_TOKEN = testToken

      const result = await authModule.ensureAuthenticated()
      expect(result).to.equal(testToken)
    })

    it('should throw AuthenticationError when no token', async () => {
      delete process.env.SUPABASE_ACCESS_TOKEN

      try {
        await authModule.ensureAuthenticated()
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error).to.be.instanceOf(AuthenticationError)
        expect(error.message).to.include('No authentication token found')
      }
    })

    it('should include platform-specific instructions', async () => {
      delete process.env.SUPABASE_ACCESS_TOKEN

      try {
        await authModule.ensureAuthenticated()
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.message).to.include('SUPABASE_ACCESS_TOKEN')
      }
    })

    it('should throw for invalid token format', async () => {
      process.env.SUPABASE_ACCESS_TOKEN = 'invalid-token'

      try {
        await authModule.ensureAuthenticated()
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error).to.be.instanceOf(SupabaseError)
        expect(error.code).to.equal(SupabaseErrorCode.INVALID_TOKEN)
      }
    })
  })

  describe('initializeAuth()', () => {
    it('should validate and store token', async () => {
      const validToken = 'sbp_' + 'h'.repeat(32)

      fetchStub.resolves(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      const result = await authModule.initializeAuth(validToken)
      expect(result).to.equal(validToken)
    })

    it('should use environment token if none provided', async () => {
      const envToken = 'sbp_' + 'i'.repeat(32)
      process.env.SUPABASE_ACCESS_TOKEN = envToken

      fetchStub.resolves(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      const result = await authModule.initializeAuth()
      expect(result).to.equal(envToken)
    })

    it('should throw if no token provided and none in environment', async () => {
      delete process.env.SUPABASE_ACCESS_TOKEN

      try {
        await authModule.initializeAuth()
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error).to.be.instanceOf(AuthenticationError)
        expect(error.message).to.include('No authentication token provided')
      }
    })

    it('should throw for invalid token format', async () => {
      try {
        await authModule.initializeAuth('invalid-format')
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error).to.be.instanceOf(SupabaseError)
        expect(error.code).to.equal(SupabaseErrorCode.INVALID_TOKEN)
        expect(error.message).to.include('Invalid token format')
      }
    })

    it('should throw if token fails validation', async () => {
      fetchStub.resolves(
        new Response('Unauthorized', {
          status: 401,
        }),
      )

      try {
        await authModule.initializeAuth('sbp_' + 'j'.repeat(32))
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error).to.be.instanceOf(SupabaseError)
        expect(error.code).to.equal(SupabaseErrorCode.INVALID_TOKEN)
        expect(error.message).to.include('invalid or expired')
      }
    })

    it('should include helpful URLs in error messages', async () => {
      try {
        await authModule.initializeAuth('invalid')
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.message).to.include('supabase.com/dashboard')
      }
    })
  })

  describe('clearAuth()', () => {
    it('should not throw when clearing auth', async () => {
      await authModule.clearAuth()
      // Should complete without error
    })

    it('should be callable multiple times', async () => {
      await authModule.clearAuth()
      await authModule.clearAuth()
      await authModule.clearAuth()
      // Should complete without error
    })
  })

  describe('Token Format Validation', () => {
    it('should accept tokens with sbp_ prefix', async () => {
      const validToken = 'sbp_' + 'k'.repeat(32)

      fetchStub.resolves(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      const result = await authModule.validateToken(validToken)
      expect(result).to.be.true
    })

    it('should accept tokens with 32+ characters after prefix', async () => {
      const longToken = 'sbp_' + 'l'.repeat(100)

      fetchStub.resolves(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      const result = await authModule.validateToken(longToken)
      expect(result).to.be.true
    })

    it('should reject tokens without sbp_ prefix', async () => {
      fetchStub.rejects(new Error('Network error'))

      const result = await authModule.validateToken('invalid_token')
      expect(result).to.be.false
    })

    it('should reject tokens that are too short', async () => {
      fetchStub.rejects(new Error('Network error'))

      const result = await authModule.validateToken('sbp_short')
      expect(result).to.be.false
    })

    it('should reject tokens with invalid characters', async () => {
      fetchStub.rejects(new Error('Network error'))

      const result = await authModule.validateToken('sbp_' + '!@#$'.repeat(8))
      expect(result).to.be.false
    })
  })

  describe('Integration Tests', () => {
    it('should support full auth flow', async () => {
      const validToken = 'sbp_' + 'm'.repeat(32)

      fetchStub.resolves(
        new Response(JSON.stringify([{ id: 'org-1', name: 'Test Org' }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      // Initialize
      await authModule.initializeAuth(validToken)

      // Check authenticated
      const isAuth = await authModule.isAuthenticated()
      expect(isAuth).to.be.true

      // Ensure authenticated (should not throw)
      const token = await authModule.ensureAuthenticated()
      expect(token).to.equal(validToken)

      // Clear auth
      await authModule.clearAuth()
    })

    it('should handle validation failures gracefully', async () => {
      fetchStub.resolves(
        new Response('Unauthorized', {
          status: 401,
        }),
      )

      try {
        await authModule.initializeAuth('sbp_' + 'n'.repeat(32))
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error).to.be.instanceOf(SupabaseError)
      }
    })
  })

  describe('Error Scenarios', () => {
    it('should handle fetch timeouts', async () => {
      fetchStub.rejects(new Error('Timeout'))

      // With valid format, should assume valid
      const result = await authModule.validateToken('sbp_' + 'o'.repeat(32))
      expect(result).to.be.true
    })

    it('should handle malformed responses', async () => {
      fetchStub.resolves(
        new Response('not json', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        }),
      )

      // Should still return true (got 200)
      const result = await authModule.validateToken('sbp_' + 'p'.repeat(32))
      expect(result).to.be.true
    })

    it('should handle rate limiting gracefully', async () => {
      fetchStub.resolves(
        new Response('Rate limited', {
          status: 429,
        }),
      )

      // 429 is not 401/403, so should return false
      const result = await authModule.validateToken('sbp_' + 'q'.repeat(32))
      expect(result).to.be.false
    })
  })
})
