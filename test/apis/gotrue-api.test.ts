import { expect } from 'chai'
import { describe, it } from 'mocha'

import { GoTrueAPI } from '../../src/apis/gotrue-api'

describe('GoTrueAPI', () => {
  const projectRef = 'test-project'
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service'

  describe('constructor', () => {
    it('should create instance with projectRef and anonKey', () => {
      const api = new GoTrueAPI(projectRef, anonKey)
      expect(api).to.be.instanceOf(GoTrueAPI)
    })

    it('should create instance with optional serviceKey', () => {
      const api = new GoTrueAPI(projectRef, anonKey, serviceKey)
      expect(api).to.be.instanceOf(GoTrueAPI)
    })
  })

  describe('formatProviderName', () => {
    it('should format single word provider names', () => {
      const api = new GoTrueAPI(projectRef, anonKey)
      // Access private method via any cast for testing
      const result = (api as any).formatProviderName('google')
      expect(result).to.equal('Google')
    })

    it('should format multi-word provider names', () => {
      const api = new GoTrueAPI(projectRef, anonKey)
      const result = (api as any).formatProviderName('linkedin_oidc')
      expect(result).to.equal('Linkedin OIDC')
    })

    it('should handle special cases (OIDC)', () => {
      const api = new GoTrueAPI(projectRef, anonKey)
      const result = (api as any).formatProviderName('slack_oidc')
      expect(result).to.equal('Slack OIDC')
    })

    it('should handle email provider', () => {
      const api = new GoTrueAPI(projectRef, anonKey)
      const result = (api as any).formatProviderName('email')
      expect(result).to.equal('Email')
    })
  })

  describe('listProviders', () => {
    it('should parse providers from settings', async () => {
      // Mock the getSettings method
      const api = new GoTrueAPI(projectRef, anonKey)

      // Override getSettings for testing
      ;(api as any).getSettings = async () => ({
        disable_signup: false,
        external: {
          email: true,
          github: false,
          google: true,
        },
        mailer_autoconfirm: false,
        phone_autoconfirm: false,
        saml_enabled: false,
        sms_provider: 'twilio',
      })

      const providers = await api.listProviders()

      expect(providers).to.be.an('array')
      expect(providers).to.have.lengthOf(3)

      // Check email provider
      const emailProvider = providers.find((p) => p.provider === 'email')
      expect(emailProvider).to.exist
      expect(emailProvider?.enabled).to.be.true
      expect(emailProvider?.name).to.equal('Email')

      // Check github provider
      const githubProvider = providers.find((p) => p.provider === 'github')
      expect(githubProvider).to.exist
      expect(githubProvider?.enabled).to.be.false
      expect(githubProvider?.name).to.equal('Github')

      // Check google provider
      const googleProvider = providers.find((p) => p.provider === 'google')
      expect(googleProvider).to.exist
      expect(googleProvider?.enabled).to.be.true
      expect(googleProvider?.name).to.equal('Google')
    })

    it('should sort providers by name', async () => {
      const api = new GoTrueAPI(projectRef, anonKey)

      ;(api as any).getSettings = async () => ({
        disable_signup: false,
        external: {
          email: true,
          google: true,
          apple: true,
          github: true,
        },
        mailer_autoconfirm: false,
        phone_autoconfirm: false,
        saml_enabled: false,
        sms_provider: 'twilio',
      })

      const providers = await api.listProviders()

      // Check if sorted alphabetically
      expect(providers[0].name).to.equal('Apple')
      expect(providers[1].name).to.equal('Email')
      expect(providers[2].name).to.equal('Github')
      expect(providers[3].name).to.equal('Google')
    })
  })

  describe('error handling', () => {
    it('should handle network errors in checkHealth', async () => {
      const api = new GoTrueAPI('invalid-project', anonKey)

      // checkHealth should return false on network error
      const healthy = await api.checkHealth()
      expect(healthy).to.be.false
    })
  })

  describe('integration', () => {
    // Note: These tests require a real project and API key
    // They are skipped by default and only run with TEST_INTEGRATION=true

    const shouldRunIntegration = process.env.TEST_INTEGRATION === 'true'
    const testProjectRef = process.env.TEST_PROJECT_REF
    const testAnonKey = process.env.TEST_ANON_KEY

    ;(shouldRunIntegration ? describe : describe.skip)('with real API', () => {
      it('should get settings from real project', async () => {
        if (!testProjectRef || !testAnonKey) {
          console.log('Skipping: TEST_PROJECT_REF and TEST_ANON_KEY required')
          return
        }

        const api = new GoTrueAPI(testProjectRef, testAnonKey)
        const settings = await api.getSettings()

        expect(settings).to.have.property('external')
        expect(settings).to.have.property('disable_signup')
        expect(settings.external).to.have.property('email')
      })

      it('should list providers from real project', async () => {
        if (!testProjectRef || !testAnonKey) {
          console.log('Skipping: TEST_PROJECT_REF and TEST_ANON_KEY required')
          return
        }

        const api = new GoTrueAPI(testProjectRef, testAnonKey)
        const providers = await api.listProviders()

        expect(providers).to.be.an('array')
        expect(providers.length).to.be.greaterThan(0)

        // Email should always be present
        const emailProvider = providers.find((p) => p.provider === 'email')
        expect(emailProvider).to.exist
      })

      it('should check health of real project', async () => {
        if (!testProjectRef || !testAnonKey) {
          console.log('Skipping: TEST_PROJECT_REF and TEST_ANON_KEY required')
          return
        }

        const api = new GoTrueAPI(testProjectRef, testAnonKey)
        const healthy = await api.checkHealth()

        expect(healthy).to.be.true
      })
    })
  })
})
