"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiTrendingUp, HiTrendingDown, HiLightningBolt, HiChartBar, HiFire } from 'react-icons/hi';
import { GiExplosiveMaterials, GiSmokeBomb, GiFlashGrenade } from 'react-icons/gi';
import type { MatchStats } from '@vantage/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: any;
  type: 'faceit' | 'leetify';
  loading?: boolean;
}

export default function MatchModal({ isOpen, onClose, match, type, loading }: Props) {
  if (!match && !loading) return null;

  const map = type === 'faceit' ? match?.map : match?.map_name;
  const dateStr = type === 'faceit' 
    ? new Date(match?.date).toLocaleDateString()
    : new Date(match?.finished_at).toLocaleDateString();
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose} 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative bg-card w-full max-w-7xl max-h-[90vh] rounded-xl border border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-zinc-800 rounded-lg">
                  <HiChartBar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{map || 'Match Details'}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="capitalize">{type}</span>
                    {!loading && <span>•</span>}
                    {!loading && <span>{dateStr}</span>}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-32">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-zinc-800 border-t-primary mb-4"></div>
                    <p className="text-sm text-muted-foreground font-medium">Loading full match details...</p>
                  </div>
                </div>
              ) : type === 'faceit' 
                ? <FaceitTable match={match} /> 
                : <LeetifyTable match={match} />
              }
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function FaceitTable({ match }: { match: MatchStats }) {
  const { team1, team2 } = match.teams || {};
  if (!team1 || !team2) return <div className="text-center text-muted-foreground py-8">No data available</div>;

  return (
    <div className="space-y-6">
      <CS2TeamCard team={team1} label="Team 1" color="blue" isFaceit={true} />
      <CS2TeamCard team={team2} label="Team 2" color="amber" isFaceit={true} />
    </div>
  );
}

function LeetifyTable({ match }: { match: any }) {
  const t1 = match.stats.filter((p: any) => p.initial_team_number === 2);
  const t2 = match.stats.filter((p: any) => p.initial_team_number === 3);
  const s1 = match.team_scores.find((s: any) => s.team_number === 2)?.score || 0;
  const s2 = match.team_scores.find((s: any) => s.team_number === 3)?.score || 0;

  return (
    <div className="space-y-6">
      <CS2TeamCard team={{ players: t1, score: s1, won: s1 > s2 }} label="CT" color="blue" />
      <CS2TeamCard team={{ players: t2, score: s2, won: s2 > s1 }} label="T" color="amber" />
    </div>
  );
}

function TeamCard({ team, label, isLeetify, color }: any) {
  const totalKills = team.players.reduce((sum: number, p: any) => sum + (p.kills || p.total_kills || 0), 0);
  const totalDeaths = team.players.reduce((sum: number, p: any) => sum + (p.deaths || p.total_deaths || 0), 0);
  const teamKD = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills.toFixed(2);
  
  const colorClasses = color === 'blue' 
    ? 'border-blue-500/20 bg-blue-500/5'
    : color === 'amber'
    ? 'border-amber-500/20 bg-amber-500/5'
    : 'border-zinc-700 bg-zinc-900/30';

  return (
    <div className={`rounded-xl border ${colorClasses} overflow-hidden`}>
      {/* Team Header */}
      <div className="px-5 py-4 bg-zinc-900/60 border-b border-white/5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {team.won ? (
              <HiTrendingUp className="w-6 h-6 text-emerald-500" />
            ) : (
              <HiTrendingDown className="w-6 h-6 text-zinc-500" />
            )}
            <div>
              <h4 className="text-lg font-bold text-foreground">{label}</h4>
              <p className="text-xs text-muted-foreground">Team K/D: {teamKD}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-black font-mono ${team.won ? 'text-emerald-500' : 'text-zinc-500'}`}>
              {team.score}
            </div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              {team.won ? 'Victory' : 'Defeat'}
            </p>
          </div>
        </div>
      </div>

      {/* Players Table */}
      <div className="p-4">
        <div className="space-y-2">
          {team.players
            .sort((a: any, b: any) => (b.total_kills || b.kills || 0) - (a.total_kills || a.kills || 0))
            .map((p: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-3 bg-zinc-900/40 hover:bg-zinc-800/60 rounded-lg border border-white/5 transition-colors"
            >
              {/* Rank Badge */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
              </div>

              {/* Player Name */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-foreground truncate">
                  {p.nickname || p.name}
                </div>
                {isLeetify && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <HiLightningBolt className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Rating: {((p.leetify_rating || 0) * 100).toFixed(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="flex gap-3 items-center">
                <StatPill label="K" value={p.kills || p.total_kills} color="emerald" />
                <StatPill label="D" value={p.deaths || p.total_deaths} color="rose" />
                <StatPill label="A" value={p.assists || p.total_assists || 0} color="blue" />
                {!isLeetify && (
                  <div className="px-3 py-1.5 bg-zinc-800 rounded-md border border-white/10">
                    <div className="text-xs font-mono font-bold text-foreground">
                      {p.kd?.toFixed(2)}
                    </div>
                    <div className="text-[8px] text-muted-foreground uppercase">K/D</div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: 'emerald' | 'rose' | 'blue' }) {
  const colorClass = color === 'emerald' 
    ? 'text-emerald-500' 
    : color === 'rose' 
    ? 'text-rose-500' 
    : 'text-blue-500';

  return (
    <div className="flex flex-col items-center min-w-[36px]">
      <div className={`text-base font-mono font-bold ${colorClass}`}>
        {value}
      </div>
      <div className="text-[8px] text-muted-foreground uppercase font-bold">
        {label}
      </div>
    </div>
  );
}

function CS2TeamCard({ team, label, color, isFaceit }: any) {
  const colorClasses = color === 'blue' 
    ? 'border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent'
    : 'border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent';
  
  const textColor = color === 'blue' ? 'text-blue-400' : 'text-amber-400';
  const bgColor = color === 'blue' ? 'bg-blue-500/10' : 'bg-amber-500/10';

  return (
    <div className={`rounded-xl border ${colorClasses} overflow-hidden`}>
      {/* Team Header */}
      <div className="px-5 py-3 bg-zinc-900/80 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 ${bgColor} rounded-md`}>
            <span className={`text-sm font-black ${textColor} uppercase tracking-wider`}>
              {isFaceit ? label : `${label} SIDE`}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{team.players.length} Players</span>
        </div>
        <div className="flex items-center gap-3">
          {team.won ? (
            <HiTrendingUp className="w-5 h-5 text-emerald-500" />
          ) : (
            <HiTrendingDown className="w-5 h-5 text-zinc-500" />
          )}
          <div className={`text-3xl font-black font-mono ${team.won ? 'text-emerald-500' : 'text-zinc-500'}`}>
            {team.score}
          </div>
        </div>
      </div>

      {/* CS2-Style Scoreboard */}
      <div className="p-4">
        <div className="space-y-1">
          {/* Header Row */}
          <div className="grid grid-cols-[auto_1fr_repeat(10,auto)] gap-2 px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-white/5">
            <div className="w-8"></div>
            <div>Player</div>
            <div className="text-center w-12">K</div>
            <div className="text-center w-12">A</div>
            <div className="text-center w-12">D</div>
            <div className="text-center w-14">K/D</div>
            <div className="text-center w-14">{isFaceit ? 'K/R' : 'ADR'}</div>
            <div className="text-center w-14">HS%</div>
            <div className="text-center w-12">MVP</div>
            <div className="text-center w-12">3K</div>
            <div className="text-center w-12">4K</div>
            <div className="text-center w-12">5K</div>
          </div>

          {/* Player Rows */}
          {team.players
            .sort((a: any, b: any) => (b.kills || b.total_kills || 0) - (a.kills || a.total_kills || 0))
            .map((p: any, i: number) => {
              const kills = p.kills || p.total_kills || 0;
              const deaths = p.deaths || p.total_deaths || 0;
              const assists = p.assists || p.total_assists || 0;
              const kd = p.kd || p.kd_ratio || 0;
              const secondaryStat = isFaceit ? (p.kr || 0).toFixed(2) : Math.round(p.dpr || 0);
              const hsPercent = isFaceit 
                ? (p.hsPercent || 0)
                : (p.total_hs_kills && p.total_kills ? Math.round((p.total_hs_kills / p.total_kills) * 100) : 0);
              const mvps = p.mvps || 0;
              const tripleKills = p.tripleKills || p.multi3k || 0;
              const quadroKills = p.quadroKills || p.multi4k || 0;
              const pentaKills = p.pentaKills || p.multi5k || 0;

              return (
                <motion.div
                  key={isFaceit ? p.playerId : p.steam64_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-[auto_1fr_repeat(10,auto)] gap-2 px-3 py-2.5 bg-zinc-900/40 hover:bg-zinc-800/60 rounded-lg border border-white/5 transition-all hover:border-white/10 items-center"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 border-2 border-white/10 flex-shrink-0">
                    {p.avatar ? (
                      <img src={p.avatar} alt={p.nickname || p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {(p.nickname || p.name)?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  {/* Player Name */}
                  <div className="flex flex-col min-w-0">
                    <div className="font-bold text-sm text-foreground truncate">
                      {p.nickname || p.steam_username || p.name}
                    </div>
                    {!isFaceit && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <HiLightningBolt className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {Math.round((p.leetify_rating || 0) * 100)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="text-center w-12 font-mono font-bold text-emerald-500">{kills}</div>
                  <div className="text-center w-12 font-mono font-bold text-blue-500">{assists}</div>
                  <div className="text-center w-12 font-mono font-bold text-rose-500">{deaths}</div>
                  <div className="text-center w-14 font-mono font-bold text-foreground">{typeof kd === 'number' ? kd.toFixed(2) : kd}</div>
                  <div className="text-center w-14 font-mono font-bold text-orange-500">{secondaryStat}</div>
                  <div className="text-center w-14 font-mono font-bold text-yellow-500">{hsPercent}%</div>
                  <div className="text-center w-12">
                    <div className={`inline-flex items-center justify-center w-7 h-7 rounded ${mvps > 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-zinc-800 text-zinc-600'}`}>
                      <span className="text-xs font-bold">{mvps}</span>
                    </div>
                  </div>
                  <div className="text-center w-12 font-mono text-xs text-muted-foreground">{tripleKills}</div>
                  <div className="text-center w-12 font-mono text-xs text-muted-foreground">{quadroKills}</div>
                  <div className="text-center w-12">
                    {pentaKills > 0 ? (
                      <div className="inline-flex items-center justify-center px-2 py-1 bg-red-500/20 text-red-500 rounded font-bold text-xs">
                        {pentaKills}
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-zinc-600">0</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
        </div>

        {/* Team Stats Summary */}
        {!isFaceit && (
          <div className="mt-4 p-4 bg-zinc-900/60 rounded-lg border border-white/5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <TeamStatBox
                icon={<HiFire className="w-4 h-4" />}
                label="Total Kills"
                value={team.players.reduce((sum: number, p: any) => sum + (p.total_kills || 0), 0)}
                color="emerald"
              />
              <TeamStatBox
                icon={<GiExplosiveMaterials className="w-4 h-4" />}
                label="HE Grenades"
                value={team.players.reduce((sum: number, p: any) => sum + (p.he_thrown || 0), 0)}
                color="orange"
              />
              <TeamStatBox
                icon={<GiSmokeBomb className="w-4 h-4" />}
                label="Smokes"
                value={team.players.reduce((sum: number, p: any) => sum + (p.smoke_thrown || 0), 0)}
                color="zinc"
              />
              <TeamStatBox
                icon={<GiFlashGrenade className="w-4 h-4" />}
                label="Flashbangs"
                value={team.players.reduce((sum: number, p: any) => sum + (p.flashbang_thrown || 0), 0)}
                color="yellow"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamStatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colorClasses = {
    emerald: 'text-emerald-500',
    orange: 'text-orange-500',
    zinc: 'text-zinc-400',
    yellow: 'text-yellow-500',
  }[color] || 'text-foreground';

  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 bg-zinc-800 rounded-lg ${colorClasses}`}>
        {icon}
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-lg font-mono font-bold ${colorClasses}`}>{value}</div>
      </div>
    </div>
  );
}
