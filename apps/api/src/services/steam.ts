import axios from 'axios';
import type { SteamProfile } from '@vantage/shared';
import { CS2Service } from './cs2';

const STEAM_API_BASE = 'https://api.steampowered.com';

export class SteamService {
  private cs2Service = new CS2Service();

  async getProfile(steamId64: string): Promise<SteamProfile> {
    const STEAM_API_KEY = process.env.STEAM_API_KEY;
    if (!STEAM_API_KEY) {
      throw new Error('STEAM_API_KEY not configured');
    }
    
    // Fetch ALL available data in parallel
    const [summaryRes, bansRes, friendsRes, levelRes, ownedGamesRes, cs2StatsRes] = await Promise.all([
      axios.get(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`, {
        params: { key: STEAM_API_KEY, steamids: steamId64 },
      }),
      axios.get(`${STEAM_API_BASE}/ISteamUser/GetPlayerBans/v1/`, {
        params: { key: STEAM_API_KEY, steamids: steamId64 },
      }),
      axios.get(`${STEAM_API_BASE}/ISteamUser/GetFriendList/v1/`, {
        params: { key: STEAM_API_KEY, steamid: steamId64, relationship: 'friend' },
      }).catch(() => null), // May fail if profile is private
      axios.get(`${STEAM_API_BASE}/IPlayerService/GetSteamLevel/v1/`, {
        params: { key: STEAM_API_KEY, steamid: steamId64 },
      }).catch(() => null),
      axios.get(`${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/`, {
        params: { key: STEAM_API_KEY, steamid: steamId64, include_appinfo: 1, include_played_free_games: 1 },
      }).catch(() => null),
      axios.get(`${STEAM_API_BASE}/ISteamUserStats/GetUserStatsForGame/v2/`, {
        params: { key: STEAM_API_KEY, steamid: steamId64, appid: '730' },
      }).catch(() => null),
    ]);
    
    const player = summaryRes.data.response?.players?.[0];
    const bans = bansRes.data.players?.[0];
    
    if (!player) {
      throw new Error('Steam profile not found');
    }
    
    // Calculate account age
    const accountCreated = player.timecreated 
      ? new Date(player.timecreated * 1000) 
      : undefined;
    
    const yearsOfService = accountCreated
      ? Math.floor((Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24 * 365))
      : undefined;
    
    // Friend count
    const friendCount = friendsRes?.data?.friendslist?.friends?.length || undefined;
    
    // Steam level
    const level = levelRes?.data?.response?.player_level || undefined;
    
    // Game count
    const gameCount = ownedGamesRes?.data?.response?.game_count || undefined;
    
    // Find CS2 game data
    const cs2Game = ownedGamesRes?.data?.response?.games?.find((g: any) => g.appid === 730);
    
    // Get CS2 achievements
    const achievementsRes = await axios.get(
      `${STEAM_API_BASE}/ISteamUserStats/GetPlayerAchievements/v1/`,
      {
        params: { key: STEAM_API_KEY, steamid: steamId64, appid: '730' },
      }
    ).catch(() => null);
    
    const achievements = achievementsRes?.data?.playerstats?.achievements;
    const achievementsUnlocked = achievements?.filter((a: any) => a.achieved === 1).length || undefined;
    const totalAchievements = achievements?.length || undefined;
    const achievementPercentage = totalAchievements && achievementsUnlocked
      ? Math.round((achievementsUnlocked / totalAchievements) * 100)
      : undefined;
    
    // Parse CS2 detailed stats
    let cs2DetailedStats: any = {};
    if (cs2StatsRes?.data?.playerstats?.stats) {
      const stats = cs2StatsRes.data.playerstats.stats;
      const findStat = (name: string) => {
        const stat = stats.find((s: any) => s.name === name);
        return stat ? stat.value : undefined;
      };
      
      const totalKills = findStat('total_kills');
      const totalDeaths = findStat('total_deaths');
      const totalHeadshots = findStat('total_kills_headshot');
      const totalWins = findStat('total_wins');
      const totalMatchesWon = findStat('total_matches_won');
      const totalRoundsPlayed = findStat('total_rounds_played');
      
      cs2DetailedStats = {
        totalKills,
        totalDeaths,
        kdRatio: totalKills && totalDeaths ? parseFloat((totalKills / totalDeaths).toFixed(2)) : undefined,
        totalWins: totalMatchesWon || totalWins,
        totalMatches: totalRoundsPlayed ? Math.floor(totalRoundsPlayed / 24) : undefined,
        winRate: totalRoundsPlayed && totalMatchesWon
          ? parseFloat((totalMatchesWon / (totalRoundsPlayed / 24)).toFixed(3))
          : undefined,
        totalRoundsPlayed,
        totalDamage: findStat('total_damage_done'),
        totalMoneyEarned: findStat('total_money_earned'),
        totalMVPs: findStat('total_mvps'),
        headshotPercentage: totalKills && totalHeadshots
          ? parseFloat(((totalHeadshots / totalKills) * 100).toFixed(1))
          : undefined,
      };
    }
    
    // Get basic CS2 game stats (hours played)
    const cs2Stats = await this.cs2Service.getCS2GameStats(steamId64);
    
    return {
      steamId64,
      username: player.personaname,
      realName: player.realname,
      avatar: player.avatarfull,
      profileUrl: player.profileurl,
      accountCreated,
      level,
      yearsOfService,
      isPrime: false, // Note: Prime status requires Game Coordinator access
      isPrivate: player.communityvisibilitystate !== 3,
      vacBanned: bans?.VACBanned || false,
      gameBanned: bans?.NumberOfGameBans > 0 || false,
      numberOfVACBans: bans?.NumberOfVACBans || 0,
      numberOfGameBans: bans?.NumberOfGameBans || 0,
      daysSinceLastBan: bans?.DaysSinceLastBan,
      economyBan: bans?.EconomyBan,
      communityBanned: bans?.CommunityBanned || false,
      country: player.loccountrycode,
      state: player.locstatecode,
      friendCount,
      gameCount,
      cs2Stats: {
        hoursPlayed: cs2Game?.playtime_forever ? Math.floor(cs2Game.playtime_forever / 60) : cs2Stats?.hoursPlayed,
        hoursLast2Weeks: cs2Game?.playtime_2weeks ? Math.floor(cs2Game.playtime_2weeks / 60) : undefined,
        lastPlayed: cs2Stats?.lastPlayed,
        achievementsUnlocked,
        totalAchievements,
        achievementPercentage,
        ...cs2DetailedStats,
      },
    };
  }
}
