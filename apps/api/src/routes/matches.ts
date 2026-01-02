import type { FastifyInstance } from 'fastify';
import { LeetifyService } from '../services/leetify';
import { SteamService } from '../services/steam';
import { CacheService } from '../services/cache';
import type { ApiResponse } from '@vantage/shared';

const leetifyService = new LeetifyService();
const steamService = new SteamService();
const cacheService = new CacheService();

export async function matchesRoutes(fastify: FastifyInstance) {
  // Get full match details by data source and ID
  fastify.get<{
    Params: { dataSource: string; dataSourceId: string };
  }>('/matches/:dataSource/:dataSourceId', async (request, reply) => {
    const { dataSource, dataSourceId } = request.params;
    const cacheKey = `match:${dataSource}:${dataSourceId}`;

    // Extract API keys from headers
    const steamApiKey = request.headers['x-steam-api-key'] as string | undefined;
    const leetifyApiKey = request.headers['x-leetify-api-key'] as string | undefined;

    try {
      // Check cache first
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        fastify.log.info(`Cache hit for match ${dataSource}/${dataSourceId}`);
        return {
          success: true,
          data: cached,
          timestamp: new Date().toISOString(),
        } as ApiResponse<any>;
      }

      fastify.log.info(`Fetching match details for ${dataSource}/${dataSourceId}`);

      const matchDetails = await leetifyService.getMatchByDataSource(
        dataSource,
        dataSourceId,
        leetifyApiKey
      );

      if (!matchDetails) {
        return reply.status(404).send({
          success: false,
          error: 'Match not found',
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
      }

      // Fetch Steam avatars for all players
      const steamIds = matchDetails.stats.map(s => s.steam64_id);
      const avatarPromises = steamIds.map(async (steamId) => {
        try {
          const profile = await steamService.getProfile(steamId, steamApiKey);
          return { steamId, avatar: profile.avatar, username: profile.username };
        } catch (error) {
          fastify.log.warn(`Failed to fetch Steam profile for ${steamId}`);
          return { steamId, avatar: null, username: null };
        }
      });

      const avatarData = await Promise.all(avatarPromises);
      const avatarMap = new Map(avatarData.map(d => [d.steamId, { avatar: d.avatar, username: d.username }]));

      // Enrich match data with avatars
      const enrichedMatch = {
        ...matchDetails,
        stats: matchDetails.stats.map(s => ({
          ...s,
          avatar: avatarMap.get(s.steam64_id)?.avatar,
          steam_username: avatarMap.get(s.steam64_id)?.username,
        })),
      };

      // Cache the enriched match data for 5 minutes
      await cacheService.set(cacheKey, enrichedMatch, 300);

      return {
        success: true,
        data: enrichedMatch,
        timestamp: new Date().toISOString(),
      } as ApiResponse<any>;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch match details',
        timestamp: new Date().toISOString(),
      } as ApiResponse<never>);
    }
  });
}
