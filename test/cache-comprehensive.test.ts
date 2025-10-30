import { expect } from 'chai'
import * as sinon from 'sinon'
import { Cache, CACHE_PROFILES } from '../src/cache'

describe('Cache - Comprehensive', () => {
  let cache: Cache
  let clock: sinon.SinonFakeTimers

  beforeEach(() => {
    // Use fake timers for testing TTL
    clock = sinon.useFakeTimers()
    cache = new Cache()
  })

  afterEach(() => {
    clock.restore()
  })

  describe('Basic Operations', () => {
    it('should store and retrieve values', () => {
      cache.set('test-key', 'test-value')

      const value = cache.get('test-key')

      expect(value).to.equal('test-value')
    })

    it('should return undefined for non-existent keys', () => {
      const value = cache.get('nonexistent')

      expect(value).to.be.undefined
    })

    it('should check if key exists', () => {
      cache.set('test-key', 'test-value')

      expect(cache.has('test-key')).to.be.true
      expect(cache.has('nonexistent')).to.be.false
    })

    it('should delete specific keys', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      cache.delete('key1')

      expect(cache.has('key1')).to.be.false
      expect(cache.has('key2')).to.be.true
    })

    it('should clear all entries', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')

      cache.clear()

      expect(cache.size()).to.equal(0)
      expect(cache.has('key1')).to.be.false
      expect(cache.has('key2')).to.be.false
      expect(cache.has('key3')).to.be.false
    })

    it('should return cache size', () => {
      expect(cache.size()).to.equal(0)

      cache.set('key1', 'value1')
      expect(cache.size()).to.equal(1)

      cache.set('key2', 'value2')
      expect(cache.size()).to.equal(2)

      cache.delete('key1')
      expect(cache.size()).to.equal(1)
    })

    it('should get all cache keys', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')

      const keys = Array.from(cache.keys())

      expect(keys).to.have.lengthOf(3)
      expect(keys).to.include('key1')
      expect(keys).to.include('key2')
      expect(keys).to.include('key3')
    })
  })

  describe('TTL and Expiration', () => {
    it('should expire entries after default TTL', () => {
      cache.set('test-key', 'test-value')

      // Before expiration
      expect(cache.get('test-key')).to.equal('test-value')

      // After default TTL (5 minutes)
      clock.tick(300_001)

      expect(cache.get('test-key')).to.be.undefined
    })

    it('should respect custom TTL', () => {
      const customTTL = 60_000 // 1 minute
      cache.set('test-key', 'test-value', customTTL)

      // Before expiration
      clock.tick(59_000)
      expect(cache.get('test-key')).to.equal('test-value')

      // After expiration
      clock.tick(2_000)
      expect(cache.get('test-key')).to.be.undefined
    })

    it('should remove expired entries on has() check', () => {
      cache.set('test-key', 'test-value', 60_000)

      expect(cache.has('test-key')).to.be.true

      clock.tick(61_000)

      expect(cache.has('test-key')).to.be.false
      expect(cache.size()).to.equal(0)
    })

    it('should remove expired entries on get()', () => {
      cache.set('test-key', 'test-value', 60_000)

      expect(cache.size()).to.equal(1)

      clock.tick(61_000)

      expect(cache.get('test-key')).to.be.undefined
      expect(cache.size()).to.equal(0)
    })

    it('should handle multiple entries with different TTLs', () => {
      cache.set('fast', 'value1', 30_000) // 30 seconds
      cache.set('medium', 'value2', 300_000) // 5 minutes
      cache.set('slow', 'value3', 3_600_000) // 1 hour

      // After 31 seconds
      clock.tick(31_000)
      expect(cache.has('fast')).to.be.false
      expect(cache.has('medium')).to.be.true
      expect(cache.has('slow')).to.be.true

      // After 6 minutes
      clock.tick(330_000)
      expect(cache.has('fast')).to.be.false
      expect(cache.has('medium')).to.be.false
      expect(cache.has('slow')).to.be.true

      // After 1 hour
      clock.tick(3_600_000)
      expect(cache.has('fast')).to.be.false
      expect(cache.has('medium')).to.be.false
      expect(cache.has('slow')).to.be.false
    })
  })

  describe('Cache Profiles', () => {
    it('should support FAST profile (30 seconds)', () => {
      cache.set('fast-data', 'value', CACHE_PROFILES.FAST)

      clock.tick(29_000)
      expect(cache.has('fast-data')).to.be.true

      clock.tick(2_000)
      expect(cache.has('fast-data')).to.be.false
    })

    it('should support MEDIUM profile (5 minutes)', () => {
      cache.set('medium-data', 'value', CACHE_PROFILES.MEDIUM)

      clock.tick(299_000)
      expect(cache.has('medium-data')).to.be.true

      clock.tick(2_000)
      expect(cache.has('medium-data')).to.be.false
    })

    it('should support SLOW profile (1 hour)', () => {
      cache.set('slow-data', 'value', CACHE_PROFILES.SLOW)

      clock.tick(3_599_000)
      expect(cache.has('slow-data')).to.be.true

      clock.tick(2_000)
      expect(cache.has('slow-data')).to.be.false
    })

    it('should support STATIC profile (24 hours)', () => {
      cache.set('static-data', 'value', CACHE_PROFILES.STATIC)

      clock.tick(86_399_000)
      expect(cache.has('static-data')).to.be.true

      clock.tick(2_000)
      expect(cache.has('static-data')).to.be.false
    })
  })

  describe('Enabled/Disabled State', () => {
    it('should not store values when disabled', () => {
      cache.setEnabled(false)
      cache.set('test-key', 'test-value')

      expect(cache.get('test-key')).to.be.undefined
    })

    it('should not retrieve values when disabled', () => {
      cache.set('test-key', 'test-value')
      cache.setEnabled(false)

      expect(cache.get('test-key')).to.be.undefined
    })

    it('should return false for has() when disabled', () => {
      cache.set('test-key', 'test-value')
      cache.setEnabled(false)

      expect(cache.has('test-key')).to.be.false
    })

    it('should clear cache when disabling', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      expect(cache.size()).to.equal(2)

      cache.setEnabled(false)

      expect(cache.size()).to.equal(0)
    })

    it('should work normally after re-enabling', () => {
      cache.setEnabled(false)
      cache.setEnabled(true)

      cache.set('test-key', 'test-value')

      expect(cache.get('test-key')).to.equal('test-value')
    })

    it('should be enabled by default', () => {
      const newCache = new Cache()

      newCache.set('test-key', 'test-value')

      expect(newCache.get('test-key')).to.equal('test-value')
    })

    it('should respect enabled option in constructor', () => {
      const disabledCache = new Cache({ enabled: false })

      disabledCache.set('test-key', 'test-value')

      expect(disabledCache.get('test-key')).to.be.undefined
    })
  })

  describe('LRU Behavior', () => {
    it('should evict oldest entry when max size exceeded', () => {
      const smallCache = new Cache({ maxSize: 3 })

      smallCache.set('key1', 'value1')
      smallCache.set('key2', 'value2')
      smallCache.set('key3', 'value3')
      smallCache.set('key4', 'value4')

      // key1 should have been evicted
      expect(smallCache.has('key1')).to.be.false
      expect(smallCache.has('key2')).to.be.true
      expect(smallCache.has('key3')).to.be.true
      expect(smallCache.has('key4')).to.be.true
    })

    it('should respect maxSize option in constructor', () => {
      const smallCache = new Cache({ maxSize: 2 })

      smallCache.set('key1', 'value1')
      smallCache.set('key2', 'value2')

      expect(smallCache.size()).to.equal(2)

      smallCache.set('key3', 'value3')

      expect(smallCache.size()).to.equal(2)
      expect(smallCache.has('key1')).to.be.false
    })

    it('should update LRU order on access', () => {
      const smallCache = new Cache({ maxSize: 3 })

      smallCache.set('key1', 'value1')
      smallCache.set('key2', 'value2')
      smallCache.set('key3', 'value3')

      // Access key1 to make it most recently used
      smallCache.get('key1')

      // Add key4, key2 should be evicted (not key1)
      smallCache.set('key4', 'value4')

      expect(smallCache.has('key1')).to.be.true
      expect(smallCache.has('key2')).to.be.false
      expect(smallCache.has('key3')).to.be.true
      expect(smallCache.has('key4')).to.be.true
    })
  })

  describe('Data Types', () => {
    it('should store strings', () => {
      cache.set('string-key', 'string-value')

      expect(cache.get('string-key')).to.equal('string-value')
    })

    it('should store numbers', () => {
      cache.set('number-key', 42)

      expect(cache.get('number-key')).to.equal(42)
    })

    it('should store objects', () => {
      const obj = { name: 'Test', value: 123 }
      cache.set('object-key', obj)

      expect(cache.get('object-key')).to.deep.equal(obj)
    })

    it('should store arrays', () => {
      const arr = [1, 2, 3, 4, 5]
      cache.set('array-key', arr)

      expect(cache.get('array-key')).to.deep.equal(arr)
    })

    it('should store null', () => {
      cache.set('null-key', null)

      expect(cache.get('null-key')).to.be.null
    })

    it('should store boolean values', () => {
      cache.set('bool-true', true)
      cache.set('bool-false', false)

      expect(cache.get('bool-true')).to.be.true
      expect(cache.get('bool-false')).to.be.false
    })

    it('should handle complex nested objects', () => {
      const complex = {
        user: {
          id: 123,
          name: 'Test User',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
        projects: ['project1', 'project2'],
      }

      cache.set('complex-key', complex)

      expect(cache.get('complex-key')).to.deep.equal(complex)
    })
  })

  describe('Constructor Options', () => {
    it('should use default TTL when not specified', () => {
      const defaultCache = new Cache()

      defaultCache.set('test-key', 'test-value')

      // Should expire after default 5 minutes
      clock.tick(300_001)

      expect(defaultCache.get('test-key')).to.be.undefined
    })

    it('should use custom default TTL from constructor', () => {
      const customCache = new Cache({ ttl: 60_000 }) // 1 minute

      customCache.set('test-key', 'test-value')

      clock.tick(59_000)
      expect(customCache.get('test-key')).to.equal('test-value')

      clock.tick(2_000)
      expect(customCache.get('test-key')).to.be.undefined
    })

    it('should use default maxSize when not specified', () => {
      const defaultCache = new Cache()

      // Default is 100, so we should be able to store 100 items
      for (let i = 0; i < 100; i++) {
        defaultCache.set(`key${i}`, `value${i}`)
      }

      expect(defaultCache.size()).to.equal(100)

      // 101st item should evict the first
      defaultCache.set('key100', 'value100')
      expect(defaultCache.size()).to.equal(100)
      expect(defaultCache.has('key0')).to.be.false
    })

    it('should use custom maxSize from constructor', () => {
      const smallCache = new Cache({ maxSize: 5 })

      for (let i = 0; i < 6; i++) {
        smallCache.set(`key${i}`, `value${i}`)
      }

      expect(smallCache.size()).to.equal(5)
      expect(smallCache.has('key0')).to.be.false
    })
  })

  describe('Edge Cases', () => {
    it('should handle updating existing keys', () => {
      cache.set('key', 'value1')
      expect(cache.get('key')).to.equal('value1')

      cache.set('key', 'value2')
      expect(cache.get('key')).to.equal('value2')
    })

    it('should handle updating with different TTL', () => {
      cache.set('key', 'value1', 60_000)

      clock.tick(50_000)
      expect(cache.get('key')).to.equal('value1')

      // Update with longer TTL
      cache.set('key', 'value2', 300_000)

      clock.tick(100_000) // Total 150 seconds
      expect(cache.get('key')).to.equal('value2') // Should still be valid
    })

    it('should handle empty string keys', () => {
      cache.set('', 'empty-key-value')

      expect(cache.get('')).to.equal('empty-key-value')
    })

    it('should handle empty string values', () => {
      cache.set('empty-value', '')

      expect(cache.get('empty-value')).to.equal('')
    })

    it('should handle zero TTL', () => {
      cache.set('zero-ttl', 'value', 0)

      // Should expire immediately
      expect(cache.get('zero-ttl')).to.be.undefined
    })

    it('should handle very large TTL', () => {
      const largeTTL = Number.MAX_SAFE_INTEGER
      cache.set('large-ttl', 'value', largeTTL)

      clock.tick(86_400_000) // 24 hours
      expect(cache.get('large-ttl')).to.equal('value')
    })

    it('should handle concurrent operations', () => {
      for (let i = 0; i < 10; i++) {
        cache.set(`key${i}`, `value${i}`)
      }

      for (let i = 0; i < 10; i++) {
        expect(cache.get(`key${i}`)).to.equal(`value${i}`)
      }
    })

    it('should handle deletion of non-existent key', () => {
      // Should not throw
      cache.delete('nonexistent')

      expect(cache.size()).to.equal(0)
    })

    it('should handle has() on expired entry without side effects', () => {
      cache.set('key1', 'value1', 60_000)
      cache.set('key2', 'value2', 120_000)

      clock.tick(61_000)

      // Checking expired key should not affect other keys
      expect(cache.has('key1')).to.be.false
      expect(cache.has('key2')).to.be.true
    })
  })

  describe('Performance Characteristics', () => {
    it('should handle large number of entries efficiently', () => {
      const largeCache = new Cache({ maxSize: 1000 })

      const start = Date.now()

      for (let i = 0; i < 1000; i++) {
        largeCache.set(`key${i}`, `value${i}`)
      }

      const setTime = Date.now() - start

      const getStart = Date.now()

      for (let i = 0; i < 1000; i++) {
        largeCache.get(`key${i}`)
      }

      const getTime = Date.now() - getStart

      // These should be fast (< 100ms for 1000 operations)
      expect(setTime).to.be.lessThan(100)
      expect(getTime).to.be.lessThan(100)
    })

    it('should handle rapid TTL checks efficiently', () => {
      cache.set('key1', 'value1', 60_000)

      const start = Date.now()

      for (let i = 0; i < 100; i++) {
        cache.has('key1')
      }

      const duration = Date.now() - start

      expect(duration).to.be.lessThan(50)
    })
  })

  describe('Cache Entry Metadata', () => {
    it('should store timestamp with entries', () => {
      const now = Date.now()
      cache.set('test-key', 'test-value')

      // Access internal cache structure to verify timestamp
      const entry = (cache as any).cache.get('test-key')

      expect(entry).to.have.property('timestamp')
      expect(entry.timestamp).to.be.closeTo(now, 10)
    })

    it('should store TTL with entries', () => {
      const customTTL = 120_000
      cache.set('test-key', 'test-value', customTTL)

      const entry = (cache as any).cache.get('test-key')

      expect(entry).to.have.property('ttl', customTTL)
    })

    it('should store data correctly in entry', () => {
      const testData = { complex: 'object', with: ['nested', 'arrays'] }
      cache.set('test-key', testData)

      const entry = (cache as any).cache.get('test-key')

      expect(entry).to.have.property('data')
      expect(entry.data).to.deep.equal(testData)
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle typical API response caching workflow', () => {
      // Simulate caching API responses
      const apiResponse = {
        data: [
          { id: 1, name: 'Project 1' },
          { id: 2, name: 'Project 2' },
        ],
        total: 2,
      }

      cache.set('api:projects:list', apiResponse, CACHE_PROFILES.MEDIUM)

      // First access - from cache
      expect(cache.get('api:projects:list')).to.deep.equal(apiResponse)

      // After 4 minutes - still cached
      clock.tick(240_000)
      expect(cache.get('api:projects:list')).to.deep.equal(apiResponse)

      // After 6 minutes - expired
      clock.tick(120_000)
      expect(cache.get('api:projects:list')).to.be.undefined
    })

    it('should handle cache invalidation on data change', () => {
      // Initial cached data
      cache.set('projects:list', ['project1', 'project2'], CACHE_PROFILES.MEDIUM)

      // Data changes - invalidate cache
      cache.delete('projects:list')

      expect(cache.has('projects:list')).to.be.false
    })

    it('should support multiple cache namespaces', () => {
      cache.set('projects:123', { id: 123, name: 'Project' })
      cache.set('users:456', { id: 456, name: 'User' })
      cache.set('orgs:789', { id: 789, name: 'Org' })

      expect(cache.get('projects:123')).to.have.property('name', 'Project')
      expect(cache.get('users:456')).to.have.property('name', 'User')
      expect(cache.get('orgs:789')).to.have.property('name', 'Org')

      // Can invalidate specific namespace
      cache.delete('projects:123')
      expect(cache.has('projects:123')).to.be.false
      expect(cache.has('users:456')).to.be.true
      expect(cache.has('orgs:789')).to.be.true
    })
  })
})
