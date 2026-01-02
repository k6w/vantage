import { Queue, Worker, Job } from 'bullmq';
import { SteamService } from './services/steam';
import { FaceitService } from './services/faceit';
import { LeetifyService } from './services/leetify';
import { DatabaseService } from './services/database';
import { CacheService } from './services/cache';
import { calculateRiskScore } from '@vantage/shared';
import type { UserProfile } from '@vantage/shared';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from workspace root
const envPath = path.resolve(process.cwd(), '../../.env');
dotenv.config({ path: envPath });

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

// Create queue
export const profileQueue = new Queue('profile-updates', { connection });

// Services
const steamService = new SteamService();
const faceitService = new FaceitService();
const leetifyService = new LeetifyService();
const dbService = new DatabaseService();
const cacheService = new CacheService();

interface ProfileJobData {
  steamId64: string;
}

// Worker
const worker = new Worker<ProfileJobData>(
  'profile-updates',
  async (job: Job<ProfileJobData>) => {
    const { steamId64 } = job.data;
    
    console.log(`[Worker] Processing profile update for ${steamId64}`);
    
    try {
      // Fetch all data
      const [steamProfile, faceitStats, leetifyStats] = await Promise.allSettled([
        steamService.getProfile(steamId64),
        faceitService.getStats(steamId64).catch(() => null),
        leetifyService.getStats(steamId64).catch(() => null),
      ]);
      
      if (steamProfile.status === 'rejected') {
        throw new Error('Failed to fetch Steam profile');
      }
      
      const steam = steamProfile.value;
      const faceit = faceitStats.status === 'fulfilled' ? faceitStats.value : undefined;
      const leetify = leetifyStats.status === 'fulfilled' ? leetifyStats.value : undefined;
      
      // Calculate risk
      const risk = calculateRiskScore({
        steam,
      faceit: faceit || undefined,
      leetify: leetify || undefined,
      });
      
      const profile: UserProfile = {
        steam,
      faceit: faceit || undefined,
      leetify: leetify || undefined,
        risk,
      };
      
      // Update database and cache
      await Promise.all([
        dbService.upsertUser(steamId64, profile),
        cacheService.setProfile(steamId64, profile),
      ]);
      
      console.log(`[Worker] Successfully updated profile for ${steamId64}`);
      
      return { success: true, steamId64 };
    } catch (error) {
      console.error(`[Worker] Error processing ${steamId64}:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});

console.log('BullMQ Worker started for profile updates');
