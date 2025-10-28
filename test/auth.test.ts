import { expect } from 'chai'
import sinon from 'sinon'
import { homedir } from 'os'
import { join } from 'path'
import { AuthManager } from '../src/auth'
import { AuthenticationError } from '../src/errors'

describe('Authentication Module (auth.ts)', () => {
  let auth: AuthManager
  let existsSyncStub: sinon.SinonStub
  let readFileSyncStub: sinon.SinonStub

  beforeEach(() => {
    auth = new AuthManager()
    // Save original env
    delete process.env.SUPABASE_ACCESS_TOKEN
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('constructor', () => {
    it('should create auth manager instance', () => {
      expect(auth).to.be.instanceOf(AuthManager)
    })

    it('should initialize config paths', () => {
      expect(auth).to.have.property('configDir')
      expect(auth).to.have.property('credentialsFile')
    })
  })

  describe('getAccessToken()', () => {
    describe('Environment Variable Priority', () => {
      it('should return token from environment variable', () => {
        process.env.SUPABASE_ACCESS_TOKEN = 'env-token-123'
        const token = auth.getAccessToken()
        expect(token).to.equal('env-token-123')
      })

      it('should prefer environment variable over credentials file', () => {
        process.env.SUPABASE_ACCESS_TOKEN = 'env-token'
        existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(true)
        readFileSyncStub = sinon.stub(require('fs'), 'readFileSync').returns(
          JSON.stringify({
            profiles: {
              default: {
                credentials: {
                  accessToken: 'file-token',
                },
              },
            },
          }),
        )

        const token = auth.getAccessToken()
        expect(token).to.equal('env-token')
        expect(readFileSyncStub.called).to.be.false
      })

      it('should handle empty environment variable', () => {
        process.env.SUPABASE_ACCESS_TOKEN = ''
        existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(false)

        const token = auth.getAccessToken()
        expect(token).to.be.null
      })
    })

    describe('Credentials File Loading', () => {
      beforeEach(() => {
        delete process.env.SUPABASE_ACCESS_TOKEN
      })

      it('should load token from credentials file (default profile)', () => {
        const mockCredentials = {
          profiles: {
            default: {
              credentials: {
                accessToken: 'file-token-456',
              },
            },
          },
        }

        existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(true)
        readFileSyncStub = sinon.stub(require('fs'), 'readFileSync').returns(JSON.stringify(mockCredentials))

        const token = auth.getAccessToken()
        expect(token).to.equal('file-token-456')
      })

      it('should load token from credentials file (custom profile)', () => {
        const mockCredentials = {
          profiles: {
            production: {
              credentials: {
                accessToken: 'prod-token-789',
              },
            },
          },
        }

        existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(true)
        readFileSyncStub = sinon.stub(require('fs'), 'readFileSync').returns(JSON.stringify(mockCredentials))

        const token = auth.getAccessToken('production')
        expect(token).to.equal('prod-token-789')
      })

      it('should return null if credentials file does not exist', () => {
        existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(false)

        const token = auth.getAccessToken()
        expect(token).to.be.null
      })

      it('should return null if profile not found in credentials file', () => {
        const mockCredentials = {
          profiles: {
            default: {
              credentials: {
                accessToken: 'default-token',
              },
            },
          },
        }

        existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(true)
        readFileSyncStub = sinon.stub(require('fs'), 'readFileSync').returns(JSON.stringify(mockCredentials))

        const token = auth.getAccessToken('nonexistent')
        expect(token).to.be.null
      })

      it('should return null if profile has no credentials', () => {
        const mockCredentials = {
          profiles: {
            default: {
              metadata: { something: 'else' },
            },
          },
        }

        existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(true)
        readFileSyncStub = sinon.stub(require('fs'), 'readFileSync').returns(JSON.stringify(mockCredentials))

        const token = auth.getAccessToken()
        expect(token).to.be.null
      })

      it('should handle malformed JSON in credentials file', () => {
        existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(true)
        readFileSyncStub = sinon.stub(require('fs'), 'readFileSync').returns('invalid json {')

        const token = auth.getAccessToken()
        expect(token).to.be.null
      })

      it('should handle empty credentials file', () => {
        existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(true)
        readFileSyncStub = sinon.stub(require('fs'), 'readFileSync').returns('{}')

        const token = auth.getAccessToken()
        expect(token).to.be.null
      })

      it('should handle credentials file without profiles', () => {
        existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(true)
        readFileSyncStub = sinon.stub(require('fs'), 'readFileSync').returns(JSON.stringify({ other: 'data' }))

        const token = auth.getAccessToken()
        expect(token).to.be.null
      })
    })

    describe('Complex Credentials', () => {
      beforeEach(() => {
        delete process.env.SUPABASE_ACCESS_TOKEN
      })

      it('should load credentials with refresh token', () => {
        const mockCredentials = {
          profiles: {
            default: {
              credentials: {
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                expiresAt: 1234567890,
              },
            },
          },
        }

        existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(true)
        readFileSyncStub = sinon.stub(require('fs'), 'readFileSync').returns(JSON.stringify(mockCredentials))

        const token = auth.getAccessToken()
        expect(token).to.equal('access-token')
      })

      it('should handle credentials with metadata', () => {
        const mockCredentials = {
          profiles: {
            default: {
              credentials: {
                accessToken: 'token-with-metadata',
              },
              metadata: {
                userId: 'user-123',
                email: 'test@example.com',
              },
              updatedAt: '2024-01-01T00:00:00Z',
            },
          },
        }

        existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(true)
        readFileSyncStub = sinon.stub(require('fs'), 'readFileSync').returns(JSON.stringify(mockCredentials))

        const token = auth.getAccessToken()
        expect(token).to.equal('token-with-metadata')
      })
    })
  })

  describe('ensureAuthenticated()', () => {
    it('should not throw if token exists in environment', () => {
      process.env.SUPABASE_ACCESS_TOKEN = 'valid-token'

      expect(() => auth.ensureAuthenticated()).to.not.throw()
    })

    it('should not throw if token exists in credentials file', () => {
      delete process.env.SUPABASE_ACCESS_TOKEN
      existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(true)
      readFileSyncStub = sinon.stub(require('fs'), 'readFileSync').returns(
        JSON.stringify({
          profiles: {
            default: {
              credentials: {
                accessToken: 'file-token',
              },
            },
          },
        }),
      )

      expect(() => auth.ensureAuthenticated()).to.not.throw()
    })

    it('should throw AuthenticationError if no token found', () => {
      delete process.env.SUPABASE_ACCESS_TOKEN
      existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(false)

      expect(() => auth.ensureAuthenticated()).to.throw(AuthenticationError)
    })

    it('should throw with helpful message', () => {
      delete process.env.SUPABASE_ACCESS_TOKEN
      existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(false)

      try {
        auth.ensureAuthenticated()
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.message).to.include('Not authenticated')
        expect(error.message).to.include('SUPABASE_ACCESS_TOKEN')
      }
    })

    it('should throw with correct error code', () => {
      delete process.env.SUPABASE_ACCESS_TOKEN
      existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(false)

      try {
        auth.ensureAuthenticated()
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.code).to.equal('UNAUTHORIZED')
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple profiles in credentials file', () => {
      delete process.env.SUPABASE_ACCESS_TOKEN
      const mockCredentials = {
        profiles: {
          default: { credentials: { accessToken: 'default-token' } },
          staging: { credentials: { accessToken: 'staging-token' } },
          production: { credentials: { accessToken: 'production-token' } },
        },
      }

      existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(true)
      readFileSyncStub = sinon.stub(require('fs'), 'readFileSync').returns(JSON.stringify(mockCredentials))

      expect(auth.getAccessToken('default')).to.equal('default-token')
      expect(auth.getAccessToken('staging')).to.equal('staging-token')
      expect(auth.getAccessToken('production')).to.equal('production-token')
    })

    it('should handle read errors gracefully', () => {
      delete process.env.SUPABASE_ACCESS_TOKEN
      existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(true)
      readFileSyncStub = sinon.stub(require('fs'), 'readFileSync').throws(new Error('Permission denied'))

      const token = auth.getAccessToken()
      expect(token).to.be.null
    })

    it('should handle credentials with only accessToken', () => {
      delete process.env.SUPABASE_ACCESS_TOKEN
      const mockCredentials = {
        profiles: {
          default: {
            credentials: {
              accessToken: 'minimal-token',
            },
          },
        },
      }

      existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(true)
      readFileSyncStub = sinon.stub(require('fs'), 'readFileSync').returns(JSON.stringify(mockCredentials))

      const token = auth.getAccessToken()
      expect(token).to.equal('minimal-token')
    })

    it('should handle very long tokens', () => {
      const longToken = 'sbp_' + 'a'.repeat(1000)
      process.env.SUPABASE_ACCESS_TOKEN = longToken

      const token = auth.getAccessToken()
      expect(token).to.equal(longToken)
      expect(token).to.have.length(1004)
    })

    it('should handle special characters in tokens', () => {
      const specialToken = 'sbp_abc123-def456_ghi789.jkl012'
      process.env.SUPABASE_ACCESS_TOKEN = specialToken

      const token = auth.getAccessToken()
      expect(token).to.equal(specialToken)
    })

    it('should not mutate credentials during read', () => {
      delete process.env.SUPABASE_ACCESS_TOKEN
      const mockCredentials = {
        profiles: {
          default: {
            credentials: {
              accessToken: 'immutable-token',
            },
          },
        },
      }

      existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(true)
      readFileSyncStub = sinon.stub(require('fs'), 'readFileSync').returns(JSON.stringify(mockCredentials))

      const token1 = auth.getAccessToken()
      const token2 = auth.getAccessToken()

      expect(token1).to.equal(token2)
      expect(token1).to.equal('immutable-token')
    })
  })

  describe('Profile Management', () => {
    beforeEach(() => {
      delete process.env.SUPABASE_ACCESS_TOKEN
    })

    it('should default to "default" profile when no profile specified', () => {
      const mockCredentials = {
        profiles: {
          default: { credentials: { accessToken: 'default-token' } },
          other: { credentials: { accessToken: 'other-token' } },
        },
      }

      existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(true)
      readFileSyncStub = sinon.stub(require('fs'), 'readFileSync').returns(JSON.stringify(mockCredentials))

      const token = auth.getAccessToken()
      expect(token).to.equal('default-token')
    })

    it('should support case-sensitive profile names', () => {
      const mockCredentials = {
        profiles: {
          Production: { credentials: { accessToken: 'prod-token' } },
          production: { credentials: { accessToken: 'prod-token-lowercase' } },
        },
      }

      existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(true)
      readFileSyncStub = sinon.stub(require('fs'), 'readFileSync').returns(JSON.stringify(mockCredentials))

      expect(auth.getAccessToken('Production')).to.equal('prod-token')
      expect(auth.getAccessToken('production')).to.equal('prod-token-lowercase')
    })

    it('should handle profiles with spaces in names', () => {
      const mockCredentials = {
        profiles: {
          'my profile': { credentials: { accessToken: 'space-token' } },
        },
      }

      existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(true)
      readFileSyncStub = sinon.stub(require('fs'), 'readFileSync').returns(JSON.stringify(mockCredentials))

      const token = auth.getAccessToken('my profile')
      expect(token).to.equal('space-token')
    })

    it('should handle empty profile name', () => {
      const mockCredentials = {
        profiles: {
          '': { credentials: { accessToken: 'empty-name-token' } },
        },
      }

      existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(true)
      readFileSyncStub = sinon.stub(require('fs'), 'readFileSync').returns(JSON.stringify(mockCredentials))

      const token = auth.getAccessToken('')
      expect(token).to.equal('empty-name-token')
    })
  })

  describe('File System Interactions', () => {
    it('should check credentials file existence', () => {
      delete process.env.SUPABASE_ACCESS_TOKEN
      existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(false)

      auth.getAccessToken()

      expect(existsSyncStub.called).to.be.true
      expect(existsSyncStub.firstCall.args[0]).to.include('credentials.json')
    })

    it('should read credentials file with utf-8 encoding', () => {
      delete process.env.SUPABASE_ACCESS_TOKEN
      existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(true)
      readFileSyncStub = sinon.stub(require('fs'), 'readFileSync').returns(JSON.stringify({ profiles: {} }))

      auth.getAccessToken()

      expect(readFileSyncStub.called).to.be.true
      expect(readFileSyncStub.firstCall.args[1]).to.equal('utf-8')
    })

    it('should use correct config directory path', () => {
      delete process.env.SUPABASE_ACCESS_TOKEN
      existsSyncStub = sinon.stub(require('fs'), 'existsSync').returns(false)

      auth.getAccessToken()

      const expectedPath = join(homedir(), '.supabase-cli', 'credentials.json')
      expect(existsSyncStub.firstCall.args[0]).to.equal(expectedPath)
    })
  })

  describe('Performance', () => {
    it('should not make unnecessary file reads when env var is set', () => {
      process.env.SUPABASE_ACCESS_TOKEN = 'env-token'
      existsSyncStub = sinon.stub(require('fs'), 'existsSync')
      readFileSyncStub = sinon.stub(require('fs'), 'readFileSync')

      auth.getAccessToken()

      expect(existsSyncStub.called).to.be.false
      expect(readFileSyncStub.called).to.be.false
    })

    it('should handle repeated calls efficiently', () => {
      process.env.SUPABASE_ACCESS_TOKEN = 'env-token'

      for (let i = 0; i < 100; i++) {
        const token = auth.getAccessToken()
        expect(token).to.equal('env-token')
      }
    })
  })
})
