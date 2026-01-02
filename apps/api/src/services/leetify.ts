import axios from 'axios';
import type { LeetifyStats, LeetifyMatchDetails } from '@vantage/shared';

const LEETIFY_API_BASE = 'https://api-public.cs-prod.leetify.com';

export class LeetifyService {
  private getHeaders(apiKey?: string): Record<string, string> {
    const LEETIFY_API_KEY = apiKey || process.env.LEETIFY_API_KEY;
    const headers: Record<string, string> = {};
    if (LEETIFY_API_KEY) {
      headers['Authorization'] = LEETIFY_API_KEY;
    }
    return headers;
  }

  /**
   * Get complete Leetify profile with ALL available data
   * Includes: profile info, ranks, ratings, stats, recent matches, recent teammates
   */
  async getStats(steamId64: string, includeMatchHistory = true, apiKey?: string): Promise<LeetifyStats | null> {
    try {
      const headers = this.getHeaders(apiKey);
      
      // Get profile data from v3 endpoint
      const response = await axios.get(`${LEETIFY_API_BASE}/v3/profile`, {
        params: { steam64_id: steamId64 },
        headers,
      });
      
      const data = response.data;
      
      // Check privacy mode
      if (data.privacy_mode !== 'public') {
        console.warn(`Leetify profile for ${steamId64} is not public`);
        return null;
      }
      
      // Get full match history if requested
      let matchHistory: LeetifyMatchDetails[] | undefined;
      if (includeMatchHistory) {
        matchHistory = await this.getMatchHistory(steamId64, 10, apiKey);
      }
      
      // Return ALL the data from Leetify
      return {
        ...data,
        match_history: matchHistory,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.warn(`Leetify profile not found for ${steamId64}`);
      } else {
        console.error('Leetify API error:', error);
      }
      return null;
    }
  }

  /**
   * Get detailed match history for a player
   * Uses v3 endpoint for CS2 matches
   * Returns basic match data - use getMatchByDataSource for full player stats
   */
  async getMatchHistory(steamId64: string, limit: number = 10, apiKey?: string): Promise<LeetifyMatchDetails[]> {
    try {
      const headers = this.getHeaders(apiKey);
      
      const response = await axios.get(`${LEETIFY_API_BASE}/v3/profile/matches`, {
        params: { steam64_id: steamId64 },
        headers,
      });
      
      const matches = response.data || [];
      
      // Apply limit (default to 10 recent matches)
      if (limit && Array.isArray(matches)) {
        return matches.slice(0, limit);
      }
      
      return matches;
    } catch (error) {
      console.error('Failed to fetch Leetify match history:', error);
      return [];
    }
  }

  /**
   * Get specific match details by match ID
   * Uses v2 endpoint for match details
   * @param matchId - The Leetify match ID (game ID)
   */
  async getMatchDetails(matchId: string, apiKey?: string): Promise<LeetifyMatchDetails | null> {
    try {
      const headers = this.getHeaders(apiKey);
      
      const response = await axios.get(`${LEETIFY_API_BASE}/v2/matches/${matchId}`, {
        headers,
      });
      
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch match details for ${matchId}:`, error);
      return null;
    }
  }

  /**
   * Get match details by data source and data source ID
   * Use this to get full scoreboard with ALL 10 players' stats
   * Uses v2 endpoint for match details
   * @param dataSource - e.g., 'matchmaking', 'faceit', 'premier'
   * @param dataSourceId - The match ID from the data source
   */
  async getMatchByDataSource(
    dataSource: string,
    dataSourceId: string,
    apiKey?: string
  ): Promise<LeetifyMatchDetails | null> {
    try {
      const headers = this.getHeaders(apiKey);
      
      const response = await axios.get(
        `${LEETIFY_API_BASE}/v2/matches/${dataSource}/${dataSourceId}`,
        { headers }
      );
      
      return response.data;
    } catch (error) {
      console.error(
        `Failed to fetch match details for ${dataSource}/${dataSourceId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const headers = this.getHeaders();
      const response = await axios.get(`${LEETIFY_API_BASE}/api-key/validate`, {
        headers,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}
