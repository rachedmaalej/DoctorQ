/**
 * Cache Service
 *
 * In-memory cache implementation with TTL support.
 * Can be swapped for Redis when scaling requires it.
 *
 * Usage:
 *   cache.set('key', value, 60000)  // Cache for 60 seconds
 *   cache.get('key')                 // Get value or null
 *   cache.delete('key')              // Remove from cache
 *   cache.invalidatePattern('queue:*')  // Remove matching keys
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set a value in cache with TTL (in milliseconds)
   */
  set<T>(key: string, value: T, ttlMs: number = 30000): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a pattern (simple prefix match)
   * Pattern: 'queue:*' matches 'queue:clinic123', 'queue:clinic456'
   */
  invalidatePattern(pattern: string): number {
    let count = 0;
    const prefix = pattern.replace('*', '');

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Stop the cleanup interval (for graceful shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Singleton cache instance
export const cache = new MemoryCache();

// Cache key builders for consistency
export const CacheKeys = {
  queue: (clinicId: string) => `queue:${clinicId}`,
  stats: (clinicId: string) => `stats:${clinicId}`,
  clinic: (clinicId: string) => `clinic:${clinicId}`,
};

// Default TTL values (milliseconds)
export const CacheTTL = {
  QUEUE: 5000,      // 5 seconds - queue changes frequently
  STATS: 10000,     // 10 seconds - stats can be slightly stale
  CLINIC: 60000,    // 1 minute - clinic info rarely changes
};
