/**
 * Cache service for AI responses to improve processing time
 * Uses KV namespace for distributed caching across edge locations
 */

import { createLogger } from './logger'

const logger = createLogger('CacheService')

export interface CacheConfig {
  defaultTtl: number // TTL in seconds
  maxKeyLength: number
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  defaultTtl: 3600, // 1 hour
  maxKeyLength: 512,
}

/**
 * Generates a cache key from request parameters
 */
export function generateCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key]
      return acc
    }, {} as Record<string, unknown>)

  const hash = btoa(JSON.stringify(sortedParams))
    .replace(/[+/=]/g, (char) => {
      const replacements: Record<string, string> = { '+': '-', '/': '_', '=': '' }
      return replacements[char] ?? char
    })
    .slice(0, DEFAULT_CACHE_CONFIG.maxKeyLength - prefix.length - 1)

  return `${prefix}:${hash}`
}

/**
 * Cache service wrapper for KV namespace operations
 */
export class CacheService {
  private kv: KVNamespace
  private config: CacheConfig

  constructor(kv: KVNamespace, config: Partial<CacheConfig> = {}) {
    this.kv = kv
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config }
  }

  /**
   * Get a cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(key)
      if (value) {
        logger.debug('Cache hit', { key })
        return JSON.parse(value) as T
      }
      logger.debug('Cache miss', { key })
      return null
    } catch (error) {
      logger.error('Cache get error', { key, error: String(error) })
      return null
    }
  }

  /**
   * Set a cached value
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      await this.kv.put(key, JSON.stringify(value), {
        expirationTtl: ttl ?? this.config.defaultTtl,
      })
      logger.debug('Cache set', { key, ttl: ttl ?? this.config.defaultTtl })
      return true
    } catch (error) {
      logger.error('Cache set error', { key, error: String(error) })
      return false
    }
  }

  /**
   * Delete a cached value
   */
  async delete(key: string): Promise<boolean> {
    try {
      await this.kv.delete(key)
      logger.debug('Cache delete', { key })
      return true
    } catch (error) {
      logger.error('Cache delete error', { key, error: String(error) })
      return false
    }
  }

  /**
   * Get or set a cached value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<{ data: T; cached: boolean }> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return { data: cached, cached: true }
    }

    const data = await fetchFn()
    await this.set(key, data, ttl)
    return { data, cached: false }
  }
}

/**
 * Creates a cache service instance
 */
export function createCacheService(
  kv: KVNamespace,
  config?: Partial<CacheConfig>
): CacheService {
  return new CacheService(kv, config)
}
