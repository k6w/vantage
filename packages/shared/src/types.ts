export interface SteamProfile {
  steamId64: string;
  steamId32?: string;
  username: string;
  realName?: string;
  avatar?: string;
  profileUrl: string;
  accountCreated?: Date | string;
  level?: number;
  yearsOfService?: number;
  isPrime: boolean;
  isPrivate: boolean;
  vacBanned: boolean;
  gameBanned: boolean;
  communityBanned?: boolean;
  country?: string;
  daysSinceLastBan?: number;
  cs2Stats?: {
    hoursPlayed?: number;
    winRate?: number;
    totalKills?: number;
    totalMatches?: number;
  };
}

export interface FaceitStats {
  playerId: string;
  nickname: string;
  avatar: string;
  elo: number;
  level: number;
  matches: number;
  winRate: number;
  avgKD: number;
  hasBan?: boolean;
  activeBans?: Array<{ reason: string; duration: string }>;
  accountAge?: number;
  matchHistory?: MatchStats[];
}

export interface LeetifyRanks {
  leetify: number;
  premier: number | null;
  faceit: number | null;
}

export interface LeetifyRating {
  aim: number;
  positioning: number;
  utility: number;
  clutch: number;
  opening: number;
  ct_leetify: number;  // CT-side performance rating (normalized around 0)
  t_leetify: number;   // T-side performance rating (normalized around 0)
}

export interface LeetifyDetailedStats {
  accuracy_enemy_spotted: number;
  accuracy_head: number;
  counter_strafing_good_shots_ratio: number;
  reaction_time_ms: number;
  spray_accuracy: number;
  flashbang_leading_to_kill: number;
  preaim: number;
  he_foes_damage_avg: number;
  trade_kills_success_percentage: number;
  t_opening_duel_success_percentage: number;
  ct_opening_duel_success_percentage: number;
  [key: string]: number | undefined;
}

export interface LeetifyPlayerMatchStats {
  steam64_id: string;
  name: string;
  nickname?: string;
  total_kills: number;
  total_deaths: number;
  total_assists: number;
  total_hs_kills: number;
  mvps: number;
  score: number;
  kd_ratio: number;
  leetify_rating: number;
  ct_leetify_rating?: number;
  t_leetify_rating?: number;
  accuracy_head: number;
  accuracy: number;
  preaim: number;
  reaction_time: number;
  spray_accuracy: number;
  counter_strafing_shots_good_ratio: number;
  initial_team_number: number;
  dpr: number;
  rounds_count: number;
  flash_assist: number;
  trade_kills_succeed: number;
  trade_kill_attempts: number;
  trade_kills_success_percentage: number;
  // Fallbacks
  kills?: number;
  deaths?: number;
  assists?: number;
  damage_per_round?: number;
}

export interface LeetifyMatchDetails {
  id: string;
  finished_at: string;
  data_source: string;
  data_source_match_id?: string;
  matchmaking_source?: string;
  map_name: string;
  has_banned_player?: boolean;
  replay_url?: string;
  demo_url?: string;
  team_scores: Array<{ team_number: number; score: number }>;
  stats: LeetifyPlayerMatchStats[];
  duration_seconds: number;
}

export interface LeetifyRecentMatch {
  id: string;
  finished_at: string;
  data_source: string;
  outcome: 'win' | 'loss' | 'tie';
  map_name: string;
  leetify_rating: number;
  score: number[];
  accuracy_enemy_spotted: number;
}

export interface LeetifyRecentTeammate {
  steam64_id: string;
  recent_matches_count: number;
  name?: string;
  avatar?: string;
}

export interface LeetifyStats {
  steam64_id: string;
  name: string;
  winrate: number;
  total_matches: number;
  ranks: LeetifyRanks;
  rating: LeetifyRating;
  stats: LeetifyDetailedStats;
  recent_matches: LeetifyRecentMatch[];
  recent_teammates?: LeetifyRecentTeammate[];
  match_history?: LeetifyMatchDetails[];
}

export interface MatchPlayer {
  playerId: string;
  nickname: string;
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
}

export interface MatchTeam {
  name: string;
  score: number;
  won: boolean;
  players: MatchPlayer[];
}

export interface MatchStats {
  matchId: string;
  date: Date | string;
  map: string;
  result: 'win' | 'loss';
  score: string;
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  hsPercent: number;
  eloChange?: number;
  teams?: {
    team1: MatchTeam;
    team2: MatchTeam;
  };
}

export interface RiskFlag {
  flag: string;
  weight: number;
  reason: string;
  detected?: boolean;
}

export interface RiskAssessment {
  totalScore: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  flags: RiskFlag[];
  calculatedAt: Date | string;
}

export interface PremierStats {
  rating: number;
  wins: number;
  matchesPlayed: number;
  winRate: number;
  rank?: number;
  rankName?: string;
}

export interface CompetitiveStats {
  wins: number;
  matchesPlayed: number;
  winRate: number;
  rank?: number;
  rankName?: string;
}

export interface WingmanStats {
  wins: number;
  rank?: number;
  rankName?: string;
}

export interface UserProfile {
  steam: SteamProfile;
  faceit?: FaceitStats | null;  // null = explicitly not found (404), undefined = not checked yet
  leetify?: LeetifyStats | null;
  premier?: PremierStats | null;
  competitive?: CompetitiveStats | null;
  wingman?: WingmanStats | null;
  risk: RiskAssessment;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  requiresCaptcha?: boolean;
}