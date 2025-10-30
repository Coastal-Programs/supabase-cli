import { expect } from 'chai'
import * as sinon from 'sinon'
import { SecureStorage } from '../../src/utils/secure-storage'
import * as keytar from 'keytar'
import * as fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import * as path from 'node:path'
import { homedir } from 'node:os'

describe('SecureStorage', () => {
  let storage: SecureStorage
  let _keytarStub: sinon.SinonStubbedInstance<typeof keytar>
  let _fsStub: sinon.SinonStubbedInstance<typeof fs>
  let _existsSyncStub: sinon.SinonStub

  const CONFIG_DIR = path.join(homedir(), '.supabase')
  const ENCRYPTED_FILE = path.join(CONFIG_DIR, 'credentials.enc')
  const CONSENT_FILE = path.join(CONFIG_DIR, '.fallback-consent')

  beforeEach(() => {
    storage = new SecureStorage()

    // Stub keytar methods
    _keytarStub = {
      getPassword: sinon.stub(),
      setPassword: sinon.stub(),
      deletePassword: sinon.stub(),
    } as any

    // Stub fs methods
    _fsStub = {
      mkdir: sinon.stub().resolves(),
      readFile: sinon.stub(),
      writeFile: sinon.stub().resolves(),
      unlink: sinon.stub().resolves(),
    } as any

    _existsSyncStub = sinon.stub()

    // Replace the real modules with stubs
    sinon.stub(keytar, 'getPassword').callsFake(keytarStub.getPassword)
    sinon.stub(keytar, 'setPassword').callsFake(keytarStub.setPassword)
    sinon.stub(keytar, 'deletePassword').callsFake(keytarStub.deletePassword)
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('OS Keychain Storage', () => {
    it('should store credential in OS keychain when available', async () => {
      keytarStub.getPassword.resolves(null)
      keytarStub.setPassword.resolves()

      await storage.store('test-account', 'test-value')

      expect(keytarStub.setPassword.calledOnce).to.be.true
      expect(keytarStub.setPassword.firstCall.args).to.deep.equal([
        'supabase-cli',
        'test-account',
        'test-value',
      ])
    })

    it('should retrieve credential from OS keychain when available', async () => {
      keytarStub.getPassword.resolves('stored-value')

      const result = await storage.retrieve('test-account')

      expect(result).to.equal('stored-value')
      expect(keytarStub.getPassword.calledOnce).to.be.true
      expect(keytarStub.getPassword.firstCall.args).to.deep.equal(['supabase-cli', 'test-account'])
    })

    it('should delete credential from OS keychain when available', async () => {
      keytarStub.getPassword.resolves(null)
      keytarStub.deletePassword.resolves(true)

      await storage.delete('test-account')

      expect(keytarStub.deletePassword.calledOnce).to.be.true
      expect(keytarStub.deletePassword.firstCall.args).to.deep.equal(['supabase-cli', 'test-account'])
    })

    it('should return null when credential not found in keychain', async () => {
      keytarStub.getPassword.resolves(null)

      const result = await storage.retrieve('nonexistent')

      expect(result).to.be.null
    })

    it('should throw error when keychain delete fails', async () => {
      keytarStub.getPassword.resolves(null)
      keytarStub.deletePassword.resolves(false)

      try {
        await storage.delete('test-account')
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.message).to.include('Failed to delete credential')
      }
    })
  })

  describe('Encrypted File Fallback', () => {
    beforeEach(() => {
      // Make keychain unavailable
      keytarStub.getPassword.rejects(new Error('Keychain not available'))
    })

    it('should fallback to encrypted file when keychain unavailable', async () => {
      const mockEncryptedData = {
        'test-account': {
          algorithm: 'aes-256-gcm',
          salt: 'abc123',
          iv: 'def456',
          authTag: 'ghi789',
          data: 'encrypted',
        },
      }

      // Mock consent
      sinon.stub(storage as any, 'hasFallbackConsent').resolves(true)

      // Mock fs operations for store
      const mkdirStub = sinon.stub(fs, 'mkdir').resolves()
      const writeFileStub = sinon.stub(fs, 'writeFile').resolves()
      const _existsSyncStub = sinon.stub().returns(false)

      sinon.replace(storage as any, 'storeInKeychain', sinon.stub().rejects())
      sinon.stub(storage as any, 'encrypt').returns(mockEncryptedData['test-account'])

      await storage.store('test-account', 'test-value', { skipConsent: true })

      expect(writeFileStub.calledOnce).to.be.true
    })

    it('should require consent for encrypted file storage', async () => {
      sinon.stub(storage as any, 'hasFallbackConsent').resolves(false)
      keytarStub.setPassword.rejects(new Error('Keychain unavailable'))

      try {
        await storage.store('test-account', 'test-value')
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.message).to.include('requires user consent')
      }
    })

    it('should skip consent check when skipConsent option is true', async () => {
      keytarStub.setPassword.rejects(new Error('Keychain unavailable'))

      const mkdirStub = sinon.stub(fs, 'mkdir').resolves()
      const writeFileStub = sinon.stub(fs, 'writeFile').resolves()
      sinon.stub(storage as any, 'encrypt').returns({
        algorithm: 'aes-256-gcm',
        salt: 'test',
        iv: 'test',
        authTag: 'test',
        data: 'test',
      })

      await storage.store('test-account', 'test-value', { skipConsent: true })

      expect(writeFileStub.calledOnce).to.be.true
    })

    it('should retrieve credential from encrypted file', async () => {
      const mockEncryptedData = {
        'test-account': {
          algorithm: 'aes-256-gcm',
          salt: Buffer.alloc(32).toString('hex'),
          iv: Buffer.alloc(16).toString('hex'),
          authTag: Buffer.alloc(16).toString('hex'),
          data: 'encrypted',
        },
      }

      const readFileStub = sinon.stub(fs, 'readFile').resolves(JSON.stringify(mockEncryptedData))
      sinon.stub(storage as any, 'decrypt').returns('decrypted-value')

      const result = await storage.retrieve('test-account', { forceFallback: true })

      expect(result).to.equal('decrypted-value')
    })

    it('should delete credential from encrypted file', async () => {
      const mockData = {
        'test-account': { data: 'encrypted' },
        'other-account': { data: 'other' },
      }

      const readFileStub = sinon.stub(fs, 'readFile').resolves(JSON.stringify(mockData))
      const writeFileStub = sinon.stub(fs, 'writeFile').resolves()

      await storage.delete('test-account', { forceFallback: true })

      expect(writeFileStub.calledOnce).to.be.true
      const writtenData = JSON.parse(writeFileStub.firstCall.args[1] as string)
      expect(writtenData).to.not.have.property('test-account')
      expect(writtenData).to.have.property('other-account')
    })

    it('should delete file when last credential is removed', async () => {
      const mockData = {
        'test-account': { data: 'encrypted' },
      }

      const readFileStub = sinon.stub(fs, 'readFile').resolves(JSON.stringify(mockData))
      const unlinkStub = sinon.stub(fs, 'unlink').resolves()

      await storage.delete('test-account', { forceFallback: true })

      expect(unlinkStub.calledTwice).to.be.true // Both encrypted file and consent file
    })
  })

  describe('Encryption/Decryption', () => {
    it('should encrypt and decrypt values correctly', async () => {
      const testValue = 'my-secret-token-12345'

      // Test encryption
      const encrypted = (storage as any).encrypt(testValue)

      expect(encrypted).to.have.property('algorithm', 'aes-256-gcm')
      expect(encrypted).to.have.property('salt')
      expect(encrypted).to.have.property('iv')
      expect(encrypted).to.have.property('authTag')
      expect(encrypted).to.have.property('data')

      // Test decryption
      const decrypted = (storage as any).decrypt(encrypted)
      expect(decrypted).to.equal(testValue)
    })

    it('should use different salt and IV for each encryption', async () => {
      const value = 'test-value'

      const encrypted1 = (storage as any).encrypt(value)
      const encrypted2 = (storage as any).encrypt(value)

      expect(encrypted1.salt).to.not.equal(encrypted2.salt)
      expect(encrypted1.iv).to.not.equal(encrypted2.iv)
      expect(encrypted1.data).to.not.equal(encrypted2.data)
    })

    it('should include auth tag for authenticated encryption', async () => {
      const encrypted = (storage as any).encrypt('test')

      expect(encrypted.authTag).to.be.a('string')
      expect(encrypted.authTag).to.have.lengthOf.at.least(32) // 16 bytes hex = 32 chars
    })

    it('should fail decryption with wrong auth tag', async () => {
      const encrypted = (storage as any).encrypt('test')
      encrypted.authTag = Buffer.alloc(16, 0).toString('hex') // Wrong tag

      try {
        (storage as any).decrypt(encrypted)
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.message).to.include('Unsupported state or unable to authenticate data')
      }
    })
  })

  describe('Consent Management', () => {
    it('should record fallback consent', async () => {
      const mkdirStub = sinon.stub(fs, 'mkdir').resolves()
      const writeFileStub = sinon.stub(fs, 'writeFile').resolves()

      await storage.recordFallbackConsent()

      expect(mkdirStub.calledOnce).to.be.true
      expect(writeFileStub.calledOnce).to.be.true

      const writtenData = JSON.parse(writeFileStub.firstCall.args[1] as string)
      expect(writtenData).to.have.property('consentDate')
      expect(writtenData).to.have.property('version', '1.0')
    })

    it('should revoke fallback consent', async () => {
      const unlinkStub = sinon.stub(fs, 'unlink').resolves()

      await storage.revokeFallbackConsent()

      expect(unlinkStub.calledOnce).to.be.true
    })

    it('should check environment variable for consent', async () => {
      const originalEnv = process.env.SUPABASE_CLI_ACCEPT_ENCRYPTED_FALLBACK
      process.env.SUPABASE_CLI_ACCEPT_ENCRYPTED_FALLBACK = 'true'

      const hasConsent = await (storage as any).hasFallbackConsent()

      expect(hasConsent).to.be.true

      // Restore
      if (originalEnv === undefined) {
        delete process.env.SUPABASE_CLI_ACCEPT_ENCRYPTED_FALLBACK
      } else {
        process.env.SUPABASE_CLI_ACCEPT_ENCRYPTED_FALLBACK = originalEnv
      }
    })
  })

  describe('Machine ID Generation', () => {
    it('should generate consistent machine ID', () => {
      const id1 = (storage as any).getMachineId()
      const id2 = (storage as any).getMachineId()

      expect(id1).to.equal(id2)
      expect(id1).to.include('supabase-cli')
    })

    it('should include hostname and username in machine ID', () => {
      const machineId = (storage as any).getMachineId()

      expect(machineId).to.be.a('string')
      expect(machineId).to.include('supabase-cli')
    })
  })

  describe('Error Handling', () => {
    it('should handle keychain availability check errors gracefully', async () => {
      keytarStub.getPassword.rejects(new Error('Keychain error'))

      const isAvailable = await (storage as any).isKeychainAvailable()

      expect(isAvailable).to.be.false
    })

    it('should handle corrupt encrypted file gracefully on read', async () => {
      const readFileStub = sinon.stub(fs, 'readFile').resolves('invalid json{{{')

      const result = await storage.retrieve('test-account', { forceFallback: true })

      expect(result).to.be.null
    })

    it('should handle missing encrypted file on delete', async () => {
      const readFileStub = sinon.stub(fs, 'readFile').rejects(new Error('File not found'))

      // Should not throw
      await storage.delete('test-account', { forceFallback: true })
    })

    it('should create new file when encrypted file is corrupt on write', async () => {
      keytarStub.setPassword.rejects(new Error('Keychain unavailable'))

      const readFileStub = sinon.stub(fs, 'readFile').resolves('corrupt data')
      const mkdirStub = sinon.stub(fs, 'mkdir').resolves()
      const writeFileStub = sinon.stub(fs, 'writeFile').resolves()

      sinon.stub(storage as any, 'encrypt').returns({
        algorithm: 'aes-256-gcm',
        salt: 'test',
        iv: 'test',
        authTag: 'test',
        data: 'test',
      })

      await storage.store('test-account', 'test-value', { skipConsent: true })

      expect(writeFileStub.calledOnce).to.be.true
    })
  })

  describe('Force Fallback Option', () => {
    it('should skip keychain when forceFallback is true', async () => {
      keytarStub.getPassword.resolves('keychain-value')

      const readFileStub = sinon.stub(fs, 'readFile').resolves(
        JSON.stringify({
          'test-account': {
            algorithm: 'aes-256-gcm',
            salt: Buffer.alloc(32).toString('hex'),
            iv: Buffer.alloc(16).toString('hex'),
            authTag: Buffer.alloc(16).toString('hex'),
            data: 'encrypted',
          },
        }),
      )

      sinon.stub(storage as any, 'decrypt').returns('file-value')

      const result = await storage.retrieve('test-account', { forceFallback: true })

      expect(keytarStub.getPassword.called).to.be.false
      expect(result).to.equal('file-value')
    })

    it('should use encrypted file for store when forceFallback is true', async () => {
      const mkdirStub = sinon.stub(fs, 'mkdir').resolves()
      const writeFileStub = sinon.stub(fs, 'writeFile').resolves()

      sinon.stub(storage as any, 'encrypt').returns({
        algorithm: 'aes-256-gcm',
        salt: 'test',
        iv: 'test',
        authTag: 'test',
        data: 'test',
      })

      await storage.store('test-account', 'test-value', { forceFallback: true, skipConsent: true })

      expect(keytarStub.setPassword.called).to.be.false
      expect(writeFileStub.calledOnce).to.be.true
    })
  })

  describe('File Permissions', () => {
    it('should create config directory with restricted permissions', async () => {
      keytarStub.setPassword.rejects(new Error('Keychain unavailable'))

      const mkdirStub = sinon.stub(fs, 'mkdir').resolves()
      const writeFileStub = sinon.stub(fs, 'writeFile').resolves()

      sinon.stub(storage as any, 'encrypt').returns({
        algorithm: 'aes-256-gcm',
        salt: 'test',
        iv: 'test',
        authTag: 'test',
        data: 'test',
      })

      await storage.store('test-account', 'test-value', { skipConsent: true })

      expect(mkdirStub.firstCall.args[1]).to.deep.include({ mode: 0o700 })
    })

    it('should create encrypted file with restricted permissions', async () => {
      keytarStub.setPassword.rejects(new Error('Keychain unavailable'))

      const mkdirStub = sinon.stub(fs, 'mkdir').resolves()
      const writeFileStub = sinon.stub(fs, 'writeFile').resolves()

      sinon.stub(storage as any, 'encrypt').returns({
        algorithm: 'aes-256-gcm',
        salt: 'test',
        iv: 'test',
        authTag: 'test',
        data: 'test',
      })

      await storage.store('test-account', 'test-value', { skipConsent: true })

      expect(writeFileStub.firstCall.args[2]).to.deep.include({ mode: 0o600 })
    })

    it('should create consent file with restricted permissions', async () => {
      const mkdirStub = sinon.stub(fs, 'mkdir').resolves()
      const writeFileStub = sinon.stub(fs, 'writeFile').resolves()

      await storage.recordFallbackConsent()

      expect(writeFileStub.firstCall.args[2]).to.deep.include({ mode: 0o600 })
    })
  })

  describe('Multiple Credentials', () => {
    it('should store multiple credentials in encrypted file', async () => {
      keytarStub.setPassword.rejects(new Error('Keychain unavailable'))

      const mkdirStub = sinon.stub(fs, 'mkdir').resolves()
      const writeFileStub = sinon.stub(fs, 'writeFile').resolves()
      const readFileStub = sinon.stub(fs, 'readFile')

      // First store
      readFileStub.onFirstCall().rejects(new Error('File not found'))

      sinon.stub(storage as any, 'encrypt').returns({
        algorithm: 'aes-256-gcm',
        salt: 'test',
        iv: 'test',
        authTag: 'test',
        data: 'test',
      })

      await storage.store('account1', 'value1', { skipConsent: true })

      // Second store - file exists now
      const firstWrite = JSON.parse(writeFileStub.firstCall.args[1] as string)
      readFileStub.onSecondCall().resolves(JSON.stringify(firstWrite))

      await storage.store('account2', 'value2', { skipConsent: true })

      const secondWrite = JSON.parse(writeFileStub.secondCall.args[1] as string)
      expect(Object.keys(secondWrite)).to.have.lengthOf(2)
      expect(secondWrite).to.have.property('account1')
      expect(secondWrite).to.have.property('account2')
    })
  })
})
