import QuickLRU from 'quick-lru'

/**
 * Cache TTL profiles for different data types
 */
export const CACHE_PROFILES = {
  /** 30 seconds - frequently changing data (connections, real-time metrics) */
  FAST: 30_000,
  /** 5 minutes - moderately changing data (project info, database stats) */
  MEDIUM: 300_000,
  /** 1 hour - rarely changing data (extensions, regions, plans) */
  SLOW: 3_600_000,
  /** 24 hours - almost never changes (API schema, supported features) */
  STATIC: 86_400_000,
} as const

export interface CacheOptions {
  enabled?: boolean // Whether caching is enabled
  maxSize?: number // Maximum number of items in cache
  ttl?: number // Time to live in milliseconds
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export class Cache {
  private cache: QuickLRU<string, CacheEntry<unknown>>
  private defaultTTL: number
  private enabled: boolean

  constructor(options: CacheOptions = {}) {
    this.enabled = options.enabled ?? true
    this.defaultTTL = options.ttl ?? 300_000 // 5 minutes default
    this.cache = new QuickLRU({
      maxSize: options.maxSize ?? 100,
    })
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Delete a specific key from the cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | undefined {
    if (!this.enabled) return undefined

    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    if (!entry) return undefined

    // Check if entry has expired
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return undefined
    }

    return entry.data
  }

  /**
   * Check if a key exists and is valid in the cache
   */
  has(key: string): boolean {
    if (!this.enabled) return false

    const entry = this.cache.get(key)
    if (!entry) return false

    // Check if entry has expired
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Get all cache keys
   */
  keys(): IterableIterator<string> {
    return this.cache.keys()
  }

  /**
   * Set a value in the cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    if (!this.enabled) return

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    }

    this.cache.set(key, entry as CacheEntry<unknown>)
  }

  /**
   * Enable or disable caching
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.clear()
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }
}

// Export singleton instance
export const cache = new Cache({
  enabled: process.env.CACHE_ENABLED !== 'false',
  maxSize: process.env.CACHE_MAX_SIZE ? Number.parseInt(process.env.CACHE_MAX_SIZE, 10) : undefined,
  ttl: process.env.CACHE_TTL ? Number.parseInt(process.env.CACHE_TTL, 10) : undefined,
})
