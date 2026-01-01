import axios from 'axios';
import type { FaceitStats } from '@vantage/shared';

const FACEIT_API_BASE = 'https://open.faceit.com/data/v4';

export class FaceitService {
  async getStats(steamId64: string): Promise<FaceitStats | null> {
    const FACEIT_API_KEY = process.env.FACEIT_API_KEY;
    if (!FACEIT_API_KEY) {
      console.warn('FACEIT_API_KEY not configured');
      return null;
    }
    
    try {
      // 1. Find player by Steam ID
      const playerRes = await axios.get(`${FACEIT_API_BASE}/players`, {
        params: { game: 'cs2', game_player_id: steamId64 },
        headers: { Authorization: `Bearer ${FACEIT_API_KEY}` },
      });
      
      const player = playerRes.data;
      if (!player) return null;
      
      const playerId = player.player_id;
      const cs2Game = player.games?.cs2;
      
      // 2. Get CS2 lifetime stats
      const statsRes = await axios.get(`${FACEIT_API_BASE}/players/${playerId}/stats/cs2`, {
        headers: { Authorization: `Bearer ${FACEIT_API_KEY}` },
      });
      
      const lifetime = statsRes.data?.lifetime;
      if (!lifetime) return null;
      
      // 3. Get match history (last 20 matches)
      let recentMatches: number = 0;
      let recentWins: number = 0;
      const matchHistory: any[] = [];
      try {
        const historyRes = await axios.get(`${FACEIT_API_BASE}/players/${playerId}/history`, {
          params: { game: 'cs2', offset: 0, limit: 20 },
          headers: { Authorization: `Bearer ${FACEIT_API_KEY}` },
        });
        
        if (historyRes.data?.items) {
          recentMatches = historyRes.data.items.length;
          
          // Process each match for detailed stats
          for (const match of historyRes.data.items) {
            const isWin = match.results?.winner === match.playing_faction;
            if (isWin) recentWins++;
            
            // Get detailed match stats
            try {
              const matchStatsRes = await axios.get(`${FACEIT_API_BASE}/matches/${match.match_id}/stats`, {
                headers: { Authorization: `Bearer ${FACEIT_API_KEY}` },
              });
              
              // Find player's stats in the match
              let playerStats: any = null;
              const teams: any = { team1: null, team2: null };
              
              for (const round of matchStatsRes.data.rounds || []) {
                const team1Data = round.teams?.[0];
                const team2Data = round.teams?.[1];
                
                // Process team 1
                if (team1Data) {
                  const team1Players = team1Data.players?.map((p: any) => ({
                    playerId: p.player_id,
                    nickname: p.nickname,
                    avatar: p.avatar,
                    kills: parseInt(p.player_stats?.Kills || p.player_stats?.kills || '0'),
                    deaths: parseInt(p.player_stats?.Deaths || p.player_stats?.deaths || '0'),
                    assists: parseInt(p.player_stats?.Assists || p.player_stats?.assists || '0'),
                    kd: parseFloat(p.player_stats?.['K/D Ratio'] || p.player_stats?.['k_d_ratio'] || '0'),
                    kr: parseFloat(p.player_stats?.['K/R Ratio'] || p.player_stats?.['k_r_ratio'] || '0'),
                    hs: parseInt(p.player_stats?.Headshots || p.player_stats?.headshots || '0'),
                    hsPercent: parseInt(p.player_stats?.['Headshots %'] || p.player_stats?.['headshots_%'] || '0'),
                    mvps: parseInt(p.player_stats?.MVPs || p.player_stats?.mvps || '0'),
                    tripleKills: parseInt(p.player_stats?.['Triple Kills'] || p.player_stats?.triple_kills || '0'),
                    quadroKills: parseInt(p.player_stats?.['Quadro Kills'] || p.player_stats?.quadro_kills || '0'),
                    pentaKills: parseInt(p.player_stats?.['Penta Kills'] || p.player_stats?.penta_kills || '0'),
                    result: parseInt(p.player_stats?.Result || p.player_stats?.result || '0'),
                  })) || [];
                  
                  teams.team1 = {
                    name: team1Data.team_id || 'Team 1',
                    score: parseInt(team1Data.team_stats?.['Final Score'] || team1Data.team_stats?.final_score || '0'),
                    won: team1Data.team_stats?.['Team Win'] === '1' || team1Data.team_stats?.team_win === '1',
                    players: team1Players,
                  };
                  
                  const foundInTeam1 = team1Data.players?.find((p: any) => p.player_id === playerId);
                  if (foundInTeam1) {
                    playerStats = foundInTeam1;
                  }
                }
                
                // Process team 2
                if (team2Data) {
                  const team2Players = team2Data.players?.map((p: any) => ({
                    playerId: p.player_id,
                    nickname: p.nickname,
                    avatar: p.avatar,
                    kills: parseInt(p.player_stats?.Kills || p.player_stats?.kills || '0'),
                    deaths: parseInt(p.player_stats?.Deaths || p.player_stats?.deaths || '0'),
                    assists: parseInt(p.player_stats?.Assists || p.player_stats?.assists || '0'),
                    kd: parseFloat(p.player_stats?.['K/D Ratio'] || p.player_stats?.['k_d_ratio'] || '0'),
                    kr: parseFloat(p.player_stats?.['K/R Ratio'] || p.player_stats?.['k_r_ratio'] || '0'),
                    hs: parseInt(p.player_stats?.Headshots || p.player_stats?.headshots || '0'),
                    hsPercent: parseInt(p.player_stats?.['Headshots %'] || p.player_stats?.['headshots_%'] || '0'),
                    mvps: parseInt(p.player_stats?.MVPs || p.player_stats?.mvps || '0'),
                    tripleKills: parseInt(p.player_stats?.['Triple Kills'] || p.player_stats?.triple_kills || '0'),
                    quadroKills: parseInt(p.player_stats?.['Quadro Kills'] || p.player_stats?.quadro_kills || '0'),
                    pentaKills: parseInt(p.player_stats?.['Penta Kills'] || p.player_stats?.penta_kills || '0'),
                    result: parseInt(p.player_stats?.Result || p.player_stats?.result || '0'),
                  })) || [];
                  
                  teams.team2 = {
                    name: team2Data.team_id || 'Team 2',
                    score: parseInt(team2Data.team_stats?.['Final Score'] || team2Data.team_stats?.final_score || '0'),
                    won: team2Data.team_stats?.['Team Win'] === '1' || team2Data.team_stats?.team_win === '1',
                    players: team2Players,
                  };
                  
                  const foundInTeam2 = team2Data.players?.find((p: any) => p.player_id === playerId);
                  if (foundInTeam2) {
                    playerStats = foundInTeam2;
                  }
                }
                
                if (playerStats) break;
              }
              
              if (playerStats && playerStats.player_stats) {
                const stats = playerStats.player_stats;
                const kills = parseInt(stats.Kills || stats.kills || '0');
                const deaths = parseInt(stats.Deaths || stats.deaths || '0');
                const assists = parseInt(stats.Assists || stats.assists || '0');
                const hs = parseInt(stats.Headshots || stats.headshots || '0');
                const hsPercent = parseInt(stats['Headshots %'] || stats['headshots_%'] || '0');
                
                matchHistory.push({
                  matchId: match.match_id,
                  date: new Date(match.finished_at * 1000),
                  map: match.game_mode || 'Unknown',
                  result: isWin ? 'win' : 'loss',
                  score: `${match.results?.score?.faction1 || 0}-${match.results?.score?.faction2 || 0}`,
                  kills,
                  deaths,
                  assists,
                  kd: deaths > 0 ? kills / deaths : kills,
                  kr: parseFloat(stats['K/R Ratio'] || stats['k_r_ratio'] || '0'),
                  hs,
                  hsPercent,
                  mvps: parseInt(stats.MVPs || stats.mvps || '0'),
                  tripleKills: parseInt(stats['Triple Kills'] || stats.triple_kills || '0'),
                  quadroKills: parseInt(stats['Quadro Kills'] || stats.quadro_kills || '0'),
                  pentaKills: parseInt(stats['Penta Kills'] || stats.penta_kills || '0'),
                  gameMode: match.game_mode,
                  faceitElo: match.elo,
                  eloChange: match.elo_change,
                  teams: teams.team1 && teams.team2 ? teams : undefined,
                  rounds: matchStatsRes.data.rounds?.length || 0,
                  matchUrl: `https://www.faceit.com/en/cs2/room/${match.match_id}`,
                });
              }
            } catch (matchError) {
              console.warn(`Could not fetch stats for match ${match.match_id}:`, matchError);
            }
          }
        }
      } catch (historyError) {
        console.warn('Could not fetch match history:', historyError);
      }
      
      // 4. Get player bans
      let hasBan = false;
      let activeBans: any[] = [];
      try {
        const bansRes = await axios.get(`${FACEIT_API_BASE}/players/${playerId}/bans`, {
          headers: { Authorization: `Bearer ${FACEIT_API_KEY}` },
        });
        
        if (bansRes.data?.items) {
          const now = Date.now();
          activeBans = bansRes.data.items.filter((ban: any) => {
            const endsAt = new Date(ban.ends_at).getTime();
            return endsAt > now;
          });
          hasBan = activeBans.length > 0;
        }
      } catch (banError) {
        console.warn('Could not fetch bans:', banError);
      }
      
      return {
        playerId,
        nickname: player.nickname,
        avatar: player.avatar || '',
        country: player.country || '',
        verified: player.verified || false,
        membershipType: player.memberships?.[0] || 'free',
        steamId64: player.steam_id_64 || steamId64,
        
        // CS2 Game Stats
        elo: cs2Game?.faceit_elo || 0,
        level: cs2Game?.skill_level || 0,
        region: cs2Game?.region || '',
        
        // Lifetime Stats
        matches: parseInt(lifetime.Matches) || 0,
        wins: parseInt(lifetime.Wins) || 0,
        winRate: (parseFloat(lifetime['Win Rate %']) || 0) / 100,
        
        // K/D Stats
        totalKills: parseInt(lifetime['Total Kills']) || 0,
        totalDeaths: parseInt(lifetime['Total Deaths']) || 0,
        avgKills: parseFloat(lifetime['Average Kills']) || 0,
        avgDeaths: parseFloat(lifetime['Average Deaths']) || 0,
        avgKD: parseFloat(lifetime['Average K/D Ratio']) || 0,
        
        // Accuracy Stats
        avgHeadshotPercent: parseFloat(lifetime['Average Headshots %']) || 0,
        totalHeadshots: parseInt(lifetime['Total Headshots']) || 0,
        avgMVPs: parseFloat(lifetime['Average MVPs']) || 0,
        avgTripleKills: parseFloat(lifetime['Average Triple Kills']) || 0,
        avgQuadroKills: parseFloat(lifetime['Average Quadro Kills']) || 0,
        avgPentaKills: parseFloat(lifetime['Average Penta Kills']) || 0,
        
        // Recent Performance
        recentMatches,
        recentWins,
        recentWinRate: recentMatches > 0 ? (recentWins / recentMatches) * 100 : 0,
        
        // Bans
        hasBan,
        activeBans: activeBans.map(ban => ({
          reason: ban.reason,
          startsAt: ban.starts_at,
          endsAt: ban.ends_at,
          type: ban.type,
        })),
        
        // Additional Info
        accountAge: player.activated_at ? 
          Math.floor((Date.now() - new Date(player.activated_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        
        // Match History
        matchHistory: matchHistory.length > 0 ? matchHistory : undefined,
      };
    } catch (error) {
      console.error('Faceit API error:', error);
      return null;
    }
  }
}
