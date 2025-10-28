# 🧪 AGENT BRIEF: TEST-WRITER-FIXER
## Phase 2A - Comprehensive Testing & Coverage

**Target**: Write 80+ comprehensive tests, maintain 82%+ coverage
**Timeline**: 9 AM - 3 PM (4-5 hours, parallel with implementation)
**Success Criteria**: All tests passing, 0 failures, 82%+ coverage

---

## YOUR MISSION

Write comprehensive test suite for all 27 new commands while maintaining 82%+ statement coverage.

**Test Matrix**:
- 54 command tests (happy path + error cases)
- 15 error handling tests (network, validation, edge cases)
- 12 integration tests (end-to-end workflows)
- 4 branch coverage tests (uncovered paths)
- **Total: 85 tests**

---

## TEST STRUCTURE (Copy from existing tests)

### Template

```typescript
import { expect } from 'chai'
import sinon from 'sinon'
import { cache } from '../src/cache'
import { supabase } from '../src/supabase'
import MyCommand from '../src/commands/path/to/my-command'

describe('my-command', () => {
  let command: MyCommand
  let sandbox: sinon.SinonSandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    cache.clear()
    command = new MyCommand([])
  })

  afterEach(() => {
    sandbox.restore()
    cache.clear()
  })

  describe('basic functionality', () => {
    it('should do something', async () => {
      sandbox.stub(supabase, 'method').resolves({
        id: 'test-id',
        name: 'test-name',
      })

      const result = await command.run()

      expect(result).to.equal(undefined) // Commands return void
      expect(supabase.method.called).to.be.true
    })

    it('should handle errors gracefully', async () => {
      sandbox.stub(supabase, 'method').rejects(
        new Error('API error')
      )

      try {
        await command.run()
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).to.include('API error')
      }
    })
  })
})
```

---

## STORAGE MANAGEMENT TESTS

### storage/buckets/list (3 tests)

```typescript
describe('storage buckets list', () => {
  it('should list buckets successfully', async () => {
    // Setup
    const buckets = [
      { id: 'b1', name: 'bucket1', is_public: false },
      { id: 'b2', name: 'bucket2', is_public: true },
    ]
    sandbox.stub(supabase, 'getStorageBuckets').resolves(buckets)

    // Execute
    const command = new StorageBucketsList([])
    await command.run()

    // Verify
    expect(supabase.getStorageBuckets.called).to.be.true
  })

  it('should handle empty bucket list', async () => {
    sandbox.stub(supabase, 'getStorageBuckets').resolves([])
    const command = new StorageBucketsList([])
    await command.run()
    // Should show "No buckets found"
  })

  it('should cache results', async () => {
    const buckets = [{ id: 'b1', name: 'bucket1' }]
    sandbox.stub(supabase, 'getStorageBuckets').resolves(buckets)

    const command = new StorageBucketsList([])
    await command.run()

    // Verify cache set
    expect(cache.get('buckets:list')).to.deep.equal(buckets)
  })
})
```

### storage/buckets/get (2 tests)

```typescript
describe('storage buckets get', () => {
  it('should get bucket details', async () => {
    sandbox.stub(supabase, 'getStorageBucket').resolves({
      id: 'b1',
      name: 'my-bucket',
      is_public: false,
    })

    const command = new StorageBucketGet(['b1'])
    await command.run()

    expect(supabase.getStorageBucket.calledWith('b1')).to.be.true
  })

  it('should handle bucket not found', async () => {
    sandbox.stub(supabase, 'getStorageBucket').rejects(
      new Error('Bucket not found')
    )

    const command = new StorageBucketGet(['nonexistent'])
    try {
      await command.run()
      expect.fail('Should throw')
    } catch (e) {
      expect((e as Error).message).to.include('Bucket not found')
    }
  })
})
```

### storage/buckets/create (3 tests)

```typescript
describe('storage buckets create', () => {
  it('should create bucket successfully', async () => {
    sandbox.stub(supabase, 'createStorageBucket').resolves({
      id: 'b-new',
      name: 'new-bucket',
    })

    const command = new StorageBucketCreate(['new-bucket'])
    await command.parse({ flags: { yes: true } })
    await command.run()

    expect(supabase.createStorageBucket.called).to.be.true
    expect(cache.get('buckets:list')).to.be.undefined // Invalidated
  })

  it('should require confirmation', async () => {
    const command = new StorageBucketCreate(['bucket'])
    // Stub confirm to return false
    sinon.stub(command, 'confirm').resolves(false)
    await command.run()
    // Should exit without creating
  })

  it('should handle bucket already exists', async () => {
    sandbox.stub(supabase, 'createStorageBucket').rejects(
      new Error('Bucket already exists')
    )
    const command = new StorageBucketCreate(['existing'])
    command.parse({ flags: { yes: true } })
    try {
      await command.run()
      expect.fail('Should throw')
    } catch (e) {
      expect((e as Error).message).to.include('already exists')
    }
  })
})
```

### storage/buckets/delete (2 tests)

```typescript
describe('storage buckets delete', () => {
  it('should delete with --yes flag', async () => {
    sandbox.stub(supabase, 'deleteStorageBucket').resolves(true)
    const command = new StorageBucketDelete(['b1'])
    await command.parse({ flags: { yes: true } })
    await command.run()
    expect(supabase.deleteStorageBucket.calledWith('b1')).to.be.true
    expect(cache.get('buckets:list')).to.be.undefined
  })

  it('should require confirmation', async () => {
    const command = new StorageBucketDelete(['b1'])
    sinon.stub(command, 'confirm').resolves(false)
    await command.run()
    // Should not call deleteStorageBucket
  })
})
```

### storage/policies/list (2 tests)

```typescript
describe('storage policies list', () => {
  it('should list policies', async () => {
    const policies = [
      { id: 'p1', action: 'SELECT', effect: 'ALLOW' },
    ]
    sandbox.stub(supabase, 'getStoragePolicies').resolves(policies)
    const command = new StoragePoliciesList(['bucket1'])
    await command.run()
    expect(supabase.getStoragePolicies.calledWith('bucket1')).to.be.true
  })

  it('should handle empty policies', async () => {
    sandbox.stub(supabase, 'getStoragePolicies').resolves([])
    const command = new StoragePoliciesList(['bucket1'])
    await command.run()
  })
})
```

### storage/policies/set (2 tests)

```typescript
describe('storage policies set', () => {
  it('should set policy with --yes', async () => {
    const policy = { action: 'SELECT', effect: 'ALLOW' }
    sandbox.stub(supabase, 'setStoragePolicies').resolves(policy)
    const command = new StoragePoliciesSet(['bucket1'])
    await command.parse({
      flags: { policy: JSON.stringify(policy), yes: true }
    })
    await command.run()
    expect(supabase.setStoragePolicies.called).to.be.true
  })

  it('should validate policy JSON', async () => {
    const command = new StoragePoliciesSet(['bucket1'])
    try {
      await command.parse({
        flags: { policy: 'invalid json', yes: true }
      })
      expect.fail('Should throw')
    } catch (e) {
      expect((e as Error).message).to.include('JSON')
    }
  })
})
```

---

## AUTHENTICATION TESTS (8+ tests)

### auth/sso/list (1 test)

```typescript
describe('auth sso list', () => {
  it('should list SSO providers', async () => {
    const providers = [
      { id: 'okta', name: 'Okta', enabled: true },
    ]
    sandbox.stub(supabase, 'getSSOProviders').resolves(providers)
    const command = new AuthSSOList([])
    await command.run()
    expect(supabase.getSSOProviders.called).to.be.true
  })
})
```

### auth/sso/enable (2 tests)

```typescript
describe('auth sso enable', () => {
  it('should enable SSO provider', async () => {
    const config = { clientId: 'xxx', clientSecret: 'yyy' }
    sandbox.stub(supabase, 'enableSSOProvider').resolves(true)
    const command = new AuthSSOEnable(['okta'])
    await command.parse({
      flags: { config: JSON.stringify(config), yes: true }
    })
    await command.run()
    expect(supabase.enableSSOProvider.called).to.be.true
  })

  it('should validate config JSON', async () => {
    const command = new AuthSSOEnable(['okta'])
    try {
      await command.parse({
        flags: { config: 'invalid', yes: true }
      })
      expect.fail('Should throw')
    } catch (e) {
      expect((e as Error).message).to.include('JSON')
    }
  })
})
```

### auth/sso/disable (1 test)

```typescript
describe('auth sso disable', () => {
  it('should disable SSO with --yes', async () => {
    sandbox.stub(supabase, 'disableSSOProvider').resolves(true)
    const command = new AuthSSODisable(['okta'])
    await command.parse({ flags: { yes: true } })
    await command.run()
    expect(supabase.disableSSOProvider.called).to.be.true
  })
})
```

### auth/jwt/get (1 test)

```typescript
describe('auth jwt get', () => {
  it('should get JWT key', async () => {
    sandbox.stub(supabase, 'getJWTKey').resolves({
      kid: 'key-id-123',
      algorithm: 'HS256',
    })
    const command = new AuthJWTGet([])
    await command.run()
    expect(supabase.getJWTKey.called).to.be.true
  })
})
```

### auth/jwt/rotate (1 test)

```typescript
describe('auth jwt rotate', () => {
  it('should rotate JWT with --yes', async () => {
    sandbox.stub(supabase, 'rotateJWTKey').resolves({
      kid: 'new-key-id',
    })
    const command = new AuthJWTRotate([])
    await command.parse({ flags: { yes: true } })
    await command.run()
    expect(supabase.rotateJWTKey.called).to.be.true
  })
})
```

### auth/providers/list (1 test)

```typescript
describe('auth providers list', () => {
  it('should list providers', async () => {
    const providers = [
      { name: 'google', enabled: true },
      { name: 'github', enabled: false },
    ]
    sandbox.stub(supabase, 'getAuthProviders').resolves(providers)
    const command = new AuthProvidersList([])
    await command.run()
    expect(supabase.getAuthProviders.called).to.be.true
  })
})
```

### auth/providers/config (1 test)

```typescript
describe('auth providers config', () => {
  it('should configure provider', async () => {
    sandbox.stub(supabase, 'setAuthProviderConfig').resolves(true)
    const command = new AuthProvidersConfig(['google', '--key', 'clientId', '--value', 'xxx'])
    await command.parse({ flags: { yes: true } })
    await command.run()
    expect(supabase.setAuthProviderConfig.called).to.be.true
  })
})
```

### auth/service/config (1 test)

```typescript
describe('auth service config', () => {
  it('should configure auth service', async () => {
    sandbox.stub(supabase, 'setAuthServiceConfig').resolves(true)
    const command = new AuthServiceConfig([])
    await command.parse({
      flags: { setting: 'enableEmail=true', yes: true }
    })
    await command.run()
    expect(supabase.setAuthServiceConfig.called).to.be.true
  })
})
```

---

## INTEGRATIONS TESTS (3+ tests)

### integrations/webhooks/list (1 test)

```typescript
describe('integrations webhooks list', () => {
  it('should list webhooks', async () => {
    sandbox.stub(supabase, 'getWebhooks').resolves([
      { id: 'w1', url: 'https://example.com/hook' }
    ])
    const command = new IntegrationsWebhooksList([])
    await command.run()
    expect(supabase.getWebhooks.called).to.be.true
  })
})
```

### integrations/webhooks/create (2 tests)

```typescript
describe('integrations webhooks create', () => {
  it('should create webhook', async () => {
    sandbox.stub(supabase, 'createWebhook').resolves({
      id: 'w-new'
    })
    const command = new IntegrationsWebhooksCreate([])
    await command.parse({
      flags: {
        url: 'https://example.com/hook',
        events: 'insert,update',
        yes: true
      }
    })
    await command.run()
    expect(supabase.createWebhook.called).to.be.true
  })

  it('should validate URL format', async () => {
    const command = new IntegrationsWebhooksCreate([])
    try {
      await command.parse({
        flags: { url: 'invalid-url', yes: true }
      })
      expect.fail('Should throw')
    } catch (e) {
      expect((e as Error).message).to.include('URL')
    }
  })
})
```

### integrations/webhooks/delete (1 test)

```typescript
describe('integrations webhooks delete', () => {
  it('should delete webhook', async () => {
    sandbox.stub(supabase, 'deleteWebhook').resolves(true)
    const command = new IntegrationsWebhooksDelete(['w1'])
    await command.parse({ flags: { yes: true } })
    await command.run()
    expect(supabase.deleteWebhook.called).to.be.true
  })
})
```

### integrations/list (1 test)

```typescript
describe('integrations list', () => {
  it('should list integrations', async () => {
    sandbox.stub(supabase, 'getAvailableIntegrations').resolves([
      { name: 'slack', enabled: false }
    ])
    const command = new IntegrationsList([])
    await command.run()
    expect(supabase.getAvailableIntegrations.called).to.be.true
  })
})
```

### integrations/setup (1 test)

```typescript
describe('integrations setup', () => {
  it('should setup integration', async () => {
    sandbox.stub(supabase, 'setupIntegration').resolves(true)
    const command = new IntegrationsSetup(['slack'])
    await command.parse({
      flags: { config: '{}', yes: true }
    })
    await command.run()
    expect(supabase.setupIntegration.called).to.be.true
  })
})
```

---

## MONITORING & LOGGING TESTS (8+ tests)

### logs/functions/list (2 tests)

```typescript
describe('logs functions list', () => {
  it('should list function logs', async () => {
    sandbox.stub(supabase, 'getFunctionLogs').resolves([
      { id: 'l1', functionName: 'fn1', status: 'success' }
    ])
    const command = new LogsFunctionsList([])
    await command.run()
    expect(supabase.getFunctionLogs.called).to.be.true
  })

  it('should filter by timestamp', async () => {
    sandbox.stub(supabase, 'getFunctionLogs').resolves([])
    const command = new LogsFunctionsList([])
    await command.parse({
      flags: { since: '2024-01-01', until: '2024-01-02' }
    })
    await command.run()
    expect(supabase.getFunctionLogs.called).to.be.true
  })
})
```

### logs/functions/get (1 test)

```typescript
describe('logs functions get', () => {
  it('should get function log', async () => {
    sandbox.stub(supabase, 'getFunctionLog').resolves({
      id: 'l1',
      output: 'Success',
    })
    const command = new LogsFunctionsGet(['l1'])
    await command.run()
    expect(supabase.getFunctionLog.calledWith('l1')).to.be.true
  })
})
```

### logs/errors/list (1 test)

```typescript
describe('logs errors list', () => {
  it('should list error logs', async () => {
    sandbox.stub(supabase, 'getErrorLogs').resolves([
      { id: 'e1', message: 'Error message' }
    ])
    const command = new LogsErrorsList([])
    await command.run()
    expect(supabase.getErrorLogs.called).to.be.true
  })
})
```

### logs/errors/get (1 test)

```typescript
describe('logs errors get', () => {
  it('should get error log', async () => {
    sandbox.stub(supabase, 'getErrorLog').resolves({
      id: 'e1',
      stackTrace: 'Stack...',
    })
    const command = new LogsErrorsGet(['e1'])
    await command.run()
    expect(supabase.getErrorLog.called).to.be.true
  })
})
```

### logs/api/list (2 tests)

```typescript
describe('logs api list', () => {
  it('should list API logs', async () => {
    sandbox.stub(supabase, 'getAPILogs').resolves([
      { id: 'a1', endpoint: '/projects', method: 'GET' }
    ])
    const command = new LogsAPIList([])
    await command.run()
    expect(supabase.getAPILogs.called).to.be.true
  })

  it('should filter by endpoint', async () => {
    sandbox.stub(supabase, 'getAPILogs').resolves([])
    const command = new LogsAPIList([])
    await command.parse({
      flags: { endpoint: '/projects' }
    })
    await command.run()
    expect(supabase.getAPILogs.called).to.be.true
  })
})
```

### logs/api/get (1 test)

```typescript
describe('logs api get', () => {
  it('should get API log', async () => {
    sandbox.stub(supabase, 'getAPILog').resolves({
      id: 'a1',
      request: {},
      response: {}
    })
    const command = new LogsAPIGet(['a1'])
    await command.run()
    expect(supabase.getAPILog.called).to.be.true
  })
})
```

### monitor/metrics (1 test)

```typescript
describe('monitor metrics', () => {
  it('should get metrics', async () => {
    sandbox.stub(supabase, 'getMetrics').resolves({
      apiResponseTime: '150ms',
      databaseQueryTime: '50ms',
    })
    const command = new MonitorMetrics([])
    await command.run()
    expect(supabase.getMetrics.called).to.be.true
  })
})
```

### monitor/health (1 test)

```typescript
describe('monitor health', () => {
  it('should check system health', async () => {
    sandbox.stub(supabase, 'getHealth').resolves({
      api: 'healthy',
      database: 'healthy',
    })
    const command = new MonitorHealth([])
    await command.run()
    expect(supabase.getHealth.called).to.be.true
  })
})
```

---

## ERROR HANDLING TESTS (15 tests)

Create error handling tests for:

1. **Network Errors** (3 tests)
   - Timeout errors
   - Connection errors
   - Retry behavior

2. **Validation Errors** (3 tests)
   - Invalid input format
   - Missing required arguments
   - Invalid flag values

3. **API Errors** (3 tests)
   - 404 Not Found
   - 403 Forbidden
   - 500 Internal Server Error

4. **Rate Limiting** (3 tests)
   - Rate limit error
   - Circuit breaker activation
   - Retry backoff

5. **Edge Cases** (3 tests)
   - Empty responses
   - Malformed JSON
   - Large result sets

---

## INTEGRATION TESTS (12 tests)

Test end-to-end workflows:

1. **Storage Workflow** (2 tests)
   - Create bucket → set policies → list
   - Delete bucket → verify gone

2. **Auth Workflow** (2 tests)
   - Enable SSO → configure → get status
   - Rotate JWT → verify change

3. **Integration Workflow** (2 tests)
   - Create webhook → list → delete
   - Setup integration → configure → verify

4. **Monitoring Workflow** (2 tests)
   - Get logs → filter → get details
   - Check health → get metrics → verify status

5. **Cache Invalidation** (2 tests)
   - Cache list → create new → verify cache invalidated
   - Get cache → delete → verify cleared

6. **Multi-command Sequence** (2 tests)
   - List → get one → update → verify
   - Multiple operations → verify consistency

---

## BRANCH COVERAGE TESTS (4 tests)

Target uncovered branches in:
- Error path handling
- Timeout/retry logic
- Cache miss scenarios
- Format conversion

---

## TEST EXECUTION

Run tests in this order:

```bash
# Watch mode during development
npm run test:watch

# Full suite with coverage
npm run test:coverage

# Specific test file
npm test -- test/commands/storage/buckets/list.test.ts

# Check coverage
npm run test:coverage -- --reporter=text-summary
```

---

## COVERAGE TARGETS

| Metric | Target | Current |
|--------|--------|---------|
| Statement | 82% | 82.98% ✅ |
| Branch | 70% | 70.26% ✅ |
| Function | 90% | 93.22% ✅ |
| Line | 80% | 83.75% ✅ |

**Maintain or improve these metrics.**

---

## SUCCESS CHECKLIST

- [ ] 54 command tests written
- [ ] 15 error handling tests written
- [ ] 12 integration tests written
- [ ] 4 branch coverage tests written
- [ ] All 85 tests passing
- [ ] 82%+ statement coverage
- [ ] 70%+ branch coverage
- [ ] 90%+ function coverage
- [ ] 0 failures
- [ ] `npm test` clean output

---

## IF TESTS FAIL

**Common issues**:

1. **Module not found**: Check import paths match file structure
2. **Stub not working**: Verify supabase.method exists in supabase.ts
3. **Coverage drop**: Add tests for uncovered branches
4. **Timeout**: Increase timeout or check async handling
5. **Cache pollution**: Ensure cache.clear() in afterEach

---

*Created by: Chen (Claude Code)*
*For: Phase 2A Testing*
*Target: 85 Tests, 82%+ Coverage*
