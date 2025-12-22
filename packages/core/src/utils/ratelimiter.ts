import { MpesaRateLimitError } from "./errors";

export interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private options: Required<RateLimiterOptions>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: RateLimiterOptions) {
    this.options = {
      keyPrefix: "mpesa",
      ...options,
    };

    // Cleanup expired entries every minute
    this.startCleanup();
  }

  /**
   * Check if request is allowed
   */
  async checkLimit(key: string): Promise<void> {
    const fullKey = `${this.options.keyPrefix}:${key}`;
    const now = Date.now();
    const entry = this.store.get(fullKey);

    if (!entry || now >= entry.resetAt) {
      // No entry or expired, create new
      this.store.set(fullKey, {
        count: 1,
        resetAt: now + this.options.windowMs,
      });
      return;
    }

    if (entry.count >= this.options.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      throw new MpesaRateLimitError(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
        {
          limit: this.options.maxRequests,
          windowMs: this.options.windowMs,
          resetAt: entry.resetAt,
        },
      );
    }

    entry.count++;
  }

  /**
   * Get current usage for a key
   */
  getUsage(key: string): { count: number; remaining: number; resetAt: number } {
    const fullKey = `${this.options.keyPrefix}:${key}`;
    const entry = this.store.get(fullKey);
    const now = Date.now();

    if (!entry || now >= entry.resetAt) {
      return {
        count: 0,
        remaining: this.options.maxRequests,
        resetAt: now + this.options.windowMs,
      };
    }

    return {
      count: entry.count,
      remaining: Math.max(0, this.options.maxRequests - entry.count),
      resetAt: entry.resetAt,
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    const fullKey = `${this.options.keyPrefix}:${key}`;
    this.store.delete(fullKey);
  }

  /**
   * Clear all rate limits
   */
  resetAll(): void {
    this.store.clear();
  }

  /**
   * Start cleanup interval
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now >= entry.resetAt) {
          this.store.delete(key);
        }
      }
    }, 60000); // Run every minute

    // Don't prevent Node.js from exiting
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

/**
 * Create a Redis-backed rate limiter (for distributed systems)
 */
export interface RedisLike {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    mode: string,
    duration: number,
  ): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
}

export class RedisRateLimiter {
  private options: Required<RateLimiterOptions>;
  private redis: RedisLike;

  constructor(redis: RedisLike, options: RateLimiterOptions) {
    this.redis = redis;
    this.options = {
      keyPrefix: "mpesa",
      ...options,
    };
  }

  async checkLimit(key: string): Promise<void> {
    const fullKey = `${this.options.keyPrefix}:${key}`;
    const count = await this.redis.incr(fullKey);

    if (count === 1) {
      // First request, set expiry
      await this.redis.expire(fullKey, Math.ceil(this.options.windowMs / 1000));
    }

    if (count > this.options.maxRequests) {
      // Get TTL for retry-after
      const ttlKey = `${fullKey}:ttl`;
      const ttl = await this.redis.get(ttlKey);
      const retryAfter = ttl
        ? parseInt(ttl)
        : Math.ceil(this.options.windowMs / 1000);

      throw new MpesaRateLimitError(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
        {
          limit: this.options.maxRequests,
          windowMs: this.options.windowMs,
        },
      );
    }
  }

  async reset(key: string): Promise<void> {
    const fullKey = `${this.options.keyPrefix}:${key}`;
    await this.redis.set(fullKey, "0", "EX", 0);
  }
}
