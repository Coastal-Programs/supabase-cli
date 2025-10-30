import { expect } from 'chai'
import { Validator } from '../../src/utils/validation'

describe('Validator - Security Fixes', () => {
  describe('isValidEmail()', () => {
    describe('ReDoS Prevention - Length Check', () => {
      it('should reject empty email', () => {
        expect(Validator.isValidEmail('')).to.be.false
      })

      it('should reject email exceeding 320 characters (RFC 5321 limit)', () => {
        // Create an email with 321 characters
        const longEmail = 'a'.repeat(300) + '@example.com'
        expect(longEmail.length).to.be.greaterThan(320)
        expect(Validator.isValidEmail(longEmail)).to.be.false
      })

      it('should accept email at exactly 320 characters', () => {
        // Create an email with exactly 320 characters
        const localPart = 'a'.repeat(307) // 307 + '@' + 'example.com' (11) = 319 + 1 = 320
        const email = `${localPart}@example.com`
        expect(email.length).to.equal(320)
        expect(Validator.isValidEmail(email)).to.be.true
      })

      it('should reject extremely long input (ReDoS attack vector)', () => {
        // Attempt to create a ReDoS attack with very long input
        const attackEmail = 'a'.repeat(10000) + '@example.com'
        const startTime = Date.now()
        Validator.isValidEmail(attackEmail) // Should return false quickly
        const endTime = Date.now()

        expect(endTime - startTime).to.be.lessThan(100) // Should fail fast, not hang
      })

      it('should handle malicious input patterns quickly', () => {
        // Common ReDoS pattern: nested repetition
        const maliciousInput = 'a@' + 'b'.repeat(5000) + '.com'
        const startTime = Date.now()
        Validator.isValidEmail(maliciousInput) // Should complete quickly
        const endTime = Date.now()

        expect(endTime - startTime).to.be.lessThan(100) // Should complete quickly
      })
    })

    describe('Valid Email Formats', () => {
      it('should accept simple valid email', () => {
        expect(Validator.isValidEmail('user@example.com')).to.be.true
      })

      it('should accept email with subdomain', () => {
        expect(Validator.isValidEmail('user@mail.example.com')).to.be.true
      })

      it('should accept email with dots in local part', () => {
        expect(Validator.isValidEmail('first.last@example.com')).to.be.true
      })

      it('should accept email with numbers', () => {
        expect(Validator.isValidEmail('user123@example456.com')).to.be.true
      })

      it('should accept email with plus sign', () => {
        expect(Validator.isValidEmail('user+tag@example.com')).to.be.true
      })
    })

    describe('Invalid Email Formats', () => {
      it('should reject email without @', () => {
        expect(Validator.isValidEmail('userexample.com')).to.be.false
      })

      it('should reject email without domain', () => {
        expect(Validator.isValidEmail('user@')).to.be.false
      })

      it('should reject email without local part', () => {
        expect(Validator.isValidEmail('@example.com')).to.be.false
      })

      it('should reject email with spaces', () => {
        expect(Validator.isValidEmail('user @example.com')).to.be.false
        expect(Validator.isValidEmail('user@ example.com')).to.be.false
      })

      it('should reject email without TLD', () => {
        expect(Validator.isValidEmail('user@example')).to.be.false
      })

      it('should reject null input', () => {
        expect(Validator.isValidEmail(null as any)).to.be.false
      })

      it('should reject undefined input', () => {
        expect(Validator.isValidEmail(undefined as any)).to.be.false
      })
    })
  })

  describe('isValidUUID()', () => {
    it('should accept valid UUID v4', () => {
      expect(Validator.isValidUUID('550e8400-e29b-41d4-a716-446655440000')).to.be.true
    })

    it('should accept lowercase UUID', () => {
      expect(Validator.isValidUUID('550e8400-e29b-41d4-a716-446655440000')).to.be.true
    })

    it('should accept uppercase UUID', () => {
      expect(Validator.isValidUUID('550E8400-E29B-41D4-A716-446655440000')).to.be.true
    })

    it('should reject UUID without hyphens', () => {
      expect(Validator.isValidUUID('550e8400e29b41d4a716446655440000')).to.be.false
    })

    it('should reject malformed UUID', () => {
      expect(Validator.isValidUUID('not-a-uuid')).to.be.false
    })

    it('should reject empty string', () => {
      expect(Validator.isValidUUID('')).to.be.false
    })
  })

  describe('isValidUrl()', () => {
    it('should accept valid HTTP URL', () => {
      expect(Validator.isValidUrl('http://example.com')).to.be.true
    })

    it('should accept valid HTTPS URL', () => {
      expect(Validator.isValidUrl('https://example.com')).to.be.true
    })

    it('should accept URL with path', () => {
      expect(Validator.isValidUrl('https://example.com/path/to/resource')).to.be.true
    })

    it('should accept URL with query parameters', () => {
      expect(Validator.isValidUrl('https://example.com?key=value')).to.be.true
    })

    it('should accept URL with port', () => {
      expect(Validator.isValidUrl('https://example.com:8080')).to.be.true
    })

    it('should reject malformed URL', () => {
      expect(Validator.isValidUrl('not a url')).to.be.false
    })

    it('should reject empty string', () => {
      expect(Validator.isValidUrl('')).to.be.false
    })

    it('should reject URL without protocol', () => {
      expect(Validator.isValidUrl('example.com')).to.be.false
    })
  })

  describe('Performance Tests', () => {
    it('should validate 1000 emails quickly', () => {
      const startTime = Date.now()

      for (let i = 0; i < 1000; i++) {
        Validator.isValidEmail(`user${i}@example.com`)
      }

      const endTime = Date.now()
      expect(endTime - startTime).to.be.lessThan(500) // Should complete in < 500ms
    })

    it('should validate long inputs without hanging', () => {
      const longInputs = [
        'a'.repeat(1000) + '@example.com',
        'user@' + 'b'.repeat(1000) + '.com',
        'c'.repeat(500) + '@' + 'd'.repeat(500) + '.com',
      ]

      const startTime = Date.now()

      for (const input of longInputs) {
        Validator.isValidEmail(input)
      }

      const endTime = Date.now()
      expect(endTime - startTime).to.be.lessThan(100) // Should fail fast
    })
  })
})
