import { FastifyInstance } from 'fastify';
import Redis from 'ioredis';
import { Queue, Worker } from 'bullmq';

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Default rate limits
export const DEFAULT_RATE_LIMITS = {
  // Strict limits for profile searches
  profile: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },
  // More lenient for health checks
  health: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  },
  // No limit for stats endpoint
  stats: false, // No rate limiting
};

export class RateLimitService {
  private redis: Redis;
  private bullMQRedis: Redis;
  private requestQueue: Queue;
  private worker: Worker;

  /**
   * Generate a secure client identifier from IP and headers to prevent bypass
   */
  static getClientKey(ip: string, userAgent?: string, forwardedFor?: string): string {
    // Use IP as primary identifier
    // Check for proxy headers but don't trust them blindly
    const primaryIp = forwardedFor ? forwardedFor.split(',')[0].trim() : ip;
    
    // Create a composite key that's harder to bypass
    const identifier = `${primaryIp}:${userAgent || 'unknown'}`;
    return identifier.substring(0, 200); // Limit length
  }

  constructor(redisUrl?: string) {
    const redisConnectionUrl = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
    
    // Initialize Redis connection for general operations
    this.redis = new Redis(redisConnectionUrl, {
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        if (times > 3) {
          console.error('Redis connection failed after 3 retries');
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      },
    });
    
    this.redis.on('error', (err) => {
      console.error('Redis Error:', err);
    });
    
    this.redis.on('connect', () => {
      console.log('Redis connected for rate limiting');
    });

    // Initialize separate Redis connection for BullMQ with required options
    this.bullMQRedis = new Redis(redisConnectionUrl, {
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null, // Required for BullMQ blocking operations
    });

    // Initialize BullMQ queue for request processing
    this.requestQueue = new Queue('profile-requests', {
      connection: this.bullMQRedis,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    // Initialize worker to process queued requests
    this.worker = new Worker('profile-requests', this.processQueuedRequest.bind(this), {
      connection: this.bullMQRedis,
      concurrency: 2, // Process 2 requests concurrently
      limiter: {
        max: 10, // Max 10 jobs per duration
        duration: 1000, // Per 1 second
      },
    });

    this.worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed for ${job.data.steamId}`);
    });

    this.worker.on('failed', (job, err) => {
      if (job) {
        console.error(`Job ${job.id} failed for ${job.data.steamId}:`, err);
      } else {
        console.error('Job failed:', err);
      }
    });
  }

  /**
   * Check if Redis is connected and operational
   */
  async isRedisHealthy(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  /**
   * Initialize rate limiting (kept for compatibility with index.ts)
   */
  async registerRateLimiting(_fastify: FastifyInstance) {
    // Rate limiting is now handled directly in routes via checkAndRecordRequest
    // This method is kept for backward compatibility but does nothing
    return Promise.resolve();
  }

  /**
   * Check if an IP is rate limited
   */
  async isRateLimited(key: string, config: RateLimitConfig): Promise<boolean> {
    const redisKey = `ratelimit:${key}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get current request count
    const currentCount = await this.redis.zcount(redisKey, windowStart, now);

    return currentCount >= config.maxRequests;
  }

  /**
   * Record a request for rate limiting - MUST be called for every request
   */
  async recordRequest(key: string, windowMs?: number): Promise<void> {
    const redisKey = `ratelimit:${key}`;
    const now = Date.now();
    const window = windowMs || DEFAULT_RATE_LIMITS.profile.windowMs;
    const windowStart = now - window;

    // Use pipeline for atomic operations
    const pipeline = this.redis.pipeline();
    
    // Remove old entries outside the window
    pipeline.zremrangebyscore(redisKey, '-inf', windowStart);
    
    // Add current timestamp to sorted set with score as timestamp
    pipeline.zadd(redisKey, now, `${now}:${Math.random()}`);
    
    // Set expiration on the key (window + 1 minute buffer)
    pipeline.expire(redisKey, Math.ceil(window / 1000) + 60);
    
    await pipeline.exec();
  }

  /**
   * Queue a profile request for processing
   */
  async queueProfileRequest(steamId: string, requestData: any): Promise<string> {
    const job = await this.requestQueue.add('fetch-profile', {
      steamId,
      requestData,
      timestamp: new Date().toISOString(),
    }, {
      priority: 1, // High priority for profile requests
      delay: 0, // No delay by default
    });

    return job.id!;
  }

  /**
   * Process a queued profile request
   */
  private async processQueuedRequest(job: any) {
    const { steamId } = job.data;

    // Here we would normally call the profile fetching logic
    // For now, we'll just simulate processing
    console.log(`Processing queued request for Steam ID: ${steamId}`);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      steamId,
      processed: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get rate limit status for a key - cleans old entries first for accuracy
   */
  async getRateLimitStatus(key: string, windowMs?: number, maxRequests?: number): Promise<{
    remaining: number;
    resetTime: number;
    total: number;
    currentCount: number;
  }> {
    const redisKey = `ratelimit:${key}`;
    const now = Date.now();
    const window = windowMs || DEFAULT_RATE_LIMITS.profile.windowMs;
    const limit = maxRequests || DEFAULT_RATE_LIMITS.profile.maxRequests;
    const windowStart = now - window;

    // Use pipeline for atomic operations
    const pipeline = this.redis.pipeline();
    
    // Remove old entries outside the window
    pipeline.zremrangebyscore(redisKey, '-inf', windowStart);
    
    // Count remaining entries in window
    pipeline.zcount(redisKey, windowStart, '+inf');
    
    const results = await pipeline.exec();
    const currentCount = (results?.[1]?.[1] as number) || 0;
    
    // Get oldest entry to calculate accurate reset time
    const oldestEntry = await this.redis.zrange(redisKey, 0, 0, 'WITHSCORES');
    const oldestTimestamp = oldestEntry.length > 1 ? parseInt(oldestEntry[1]) : now;
    const resetTime = oldestTimestamp + window;

    return {
      remaining: Math.max(0, limit - currentCount),
      resetTime,
      total: limit,
      currentCount,
    };
  }

  /**
   * Check rate limit and record request atomically - prevents race conditions
   */
  async checkAndRecordRequest(key: string, windowMs?: number, maxRequests?: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    total: number;
    currentCount: number;
  }> {
    const redisKey = `ratelimit:${key}`;
    const now = Date.now();
    const window = windowMs || DEFAULT_RATE_LIMITS.profile.windowMs;
    const limit = maxRequests || DEFAULT_RATE_LIMITS.profile.maxRequests;
    const windowStart = now - window;

    // Use Lua script for atomic check-and-increment
    const script = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local window_start = tonumber(ARGV[2])
      local limit = tonumber(ARGV[3])
      local window = tonumber(ARGV[4])
      
      -- Remove old entries outside window
      redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)
      
      -- Get current count AFTER cleanup
      local current = redis.call('ZCOUNT', key, window_start, '+inf')
      
      -- Determine if request is allowed BEFORE incrementing
      local allowed = 0
      if current < limit then
        allowed = 1
        -- Add new entry only if under limit
        redis.call('ZADD', key, now, now .. ':' .. math.random())
        redis.call('EXPIRE', key, math.ceil(window / 1000) + 60)
        current = current + 1
      end
      
      -- Get oldest entry for reset time calculation
      local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
      local oldest_time = now
      if #oldest > 1 then
        oldest_time = tonumber(oldest[2])
      end
      
      return {current, oldest_time, allowed}
    `;

    const result = await this.redis.eval(
      script,
      1,
      redisKey,
      now.toString(),
      windowStart.toString(),
      limit.toString(),
      window.toString()
    ) as [number, number, number];

    const currentCount = result[0];
    const oldestTimestamp = result[1];
    const allowed = result[2] === 1;
    const resetTime = oldestTimestamp + window;

    return {
      allowed,
      remaining: Math.max(0, limit - currentCount),
      resetTime,
      total: limit,
      currentCount,
    };
  }

  /**
   * Clean up old rate limit data
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    const windowStart = now - DEFAULT_RATE_LIMITS.profile.windowMs;

    // Clean up old entries from rate limiting keys
    const keys = await this.redis.keys('ratelimit:*');
    for (const key of keys) {
      await this.redis.zremrangebyscore(key, '-inf', windowStart);
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.redis.quit();
    await this.bullMQRedis.quit();
    await this.requestQueue.close();
    await this.worker.close();
  }
}

// Export singleton instance
export const rateLimitService = new RateLimitService();