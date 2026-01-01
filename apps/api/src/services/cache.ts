import Redis from 'ioredis';
import type { UserProfile } from '@vantage/shared';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: 3,
});

const CACHE_TTL = 604800; // 7 days (604800 seconds)

export class CacheService {
  async getProfile(steamId64: string): Promise<UserProfile | null> {
    try {
      const cached = await redis.get(`profile:${steamId64}`);
      if (cached) {
        const profile = JSON.parse(cached);
        // Convert date strings back to Date objects
        if (profile.steam?.accountCreated) {
          profile.steam.accountCreated = new Date(profile.steam.accountCreated);
        }
        if (profile.steam?.cs2Stats?.lastPlayed) {
          profile.steam.cs2Stats.lastPlayed = new Date(profile.steam.cs2Stats.lastPlayed);
        }
        if (profile.risk?.calculatedAt) {
          profile.risk.calculatedAt = new Date(profile.risk.calculatedAt);
        }
        if (profile.faceit?.matchHistory) {
          profile.faceit.matchHistory.forEach((match: any) => {
            if (match.date) match.date = new Date(match.date);
          });
        }
        return profile;
      }
      return null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }
  
  async setProfile(steamId64: string, profile: UserProfile): Promise<void> {
    try {
      await redis.setex(
        `profile:${steamId64}`,
        CACHE_TTL,
        JSON.stringify(profile)
      );
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }
  
  async invalidateProfile(steamId64: string): Promise<void> {
    try {
      await redis.del(`profile:${steamId64}`);
    } catch (error) {
      console.error('Redis del error:', error);
    }
  }

  // Generic cache methods for any data
  async get(key: string): Promise<any | null> {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = CACHE_TTL): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  // Track last refresh time for rate limiting (10 minutes cooldown)
  async getLastRefreshTime(steamId64: string): Promise<number | null> {
    try {
      const timestamp = await redis.get(`refresh:${steamId64}`);
      return timestamp ? parseInt(timestamp) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async setLastRefreshTime(steamId64: string): Promise<void> {
    try {
      // Store timestamp for 10 minutes (600 seconds)
      await redis.setex(`refresh:${steamId64}`, 600, Date.now().toString());
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async canRefresh(steamId64: string): Promise<{ allowed: boolean; waitTime?: number }> {
    try {
      const lastRefresh = await this.getLastRefreshTime(steamId64);
      if (!lastRefresh) {
        return { allowed: true };
      }

      const now = Date.now();
      const elapsed = now - lastRefresh;
      const cooldown = 10 * 60 * 1000; // 10 minutes in milliseconds

      if (elapsed < cooldown) {
        const waitTime = Math.ceil((cooldown - elapsed) / 1000); // seconds remaining
        return { allowed: false, waitTime };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Redis canRefresh error:', error);
      return { allowed: true }; // Allow on error
    }
  }
}
