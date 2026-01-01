"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { HiChevronDown, HiChevronUp, HiDownload } from 'react-icons/hi';
import { SiFaceit } from 'react-icons/si';
import { HiLightningBolt } from 'react-icons/hi';
import type { LeetifyRecentMatch } from '@vantage/shared';

// --- Leetify Card ---

export function LeetifyMatchCard({ match, steamId, expanded, onToggle, onViewScoreboard }: any) {
  const player = match.stats.find((p: any) => p.steam64_id === steamId);
  if (!player) return null;

  const teamIdx = player.initial_team_number;
  const myScore = match.team_scores.find((t: any) => t.team_number === teamIdx)?.score || 0;
  const enemyScore = match.team_scores.find((t: any) => t.team_number !== teamIdx)?.score || 0;
  const outcome = myScore > enemyScore ? 'win' : myScore < enemyScore ? 'loss' : 'tie';

  const indicatorColor = {
    win: 'bg-emerald-500',
    loss: 'bg-rose-500',
    tie: 'bg-amber-500'
  }[outcome];

  return (
    <div className="bg-card rounded border border-border overflow-hidden">
      <div className="flex items-stretch min-h-[60px]" onClick={onToggle}>
        {/* Color Indicator Strip */}
        <div className={`w-1 shrink-0 ${indicatorColor}`} />

        <div className="flex-1 p-3 md:p-4 flex flex-col md:flex-row items-center gap-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
          
          {/* Main Info */}
          <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-4 items-center w-full">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <HiLightningBolt className="text-purple-500 w-3.5 h-3.5 shrink-0" title="Leetify" />
                <div className="font-bold text-foreground truncate">{match.map_name}</div>
              </div>
              <div className="text-xs text-muted-foreground">{new Date(match.finished_at).toLocaleDateString()}</div>
            </div>
            
            <div className="text-xl font-mono font-bold">
              <span className={outcome === 'win' ? 'text-emerald-500' : outcome === 'loss' ? 'text-rose-500' : ''}>
                {myScore}
              </span>
              <span className="text-muted-foreground mx-1">-</span>
              <span>{enemyScore}</span>
            </div>

            {/* Key Stats (Desktop) */}
            <div className="hidden md:block text-sm">
              <span className="text-muted-foreground">Rating: </span>
              <span className={`font-mono font-bold ${player.leetify_rating > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {player.leetify_rating > 0 ? '+' : ''}{(player.leetify_rating * 100).toFixed(0)}
              </span>
            </div>
            
            <div className="hidden md:block text-sm">
              <span className="text-muted-foreground">K/D: </span>
              <span className="font-mono font-bold">{player.kd_ratio.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
             <button 
              onClick={(e) => { e.stopPropagation(); onViewScoreboard(); }}
              className="px-3 py-1 text-xs font-medium border border-border rounded hover:bg-secondary"
            >
              Scoreboard
            </button>
            <div className="text-muted-foreground">
              {expanded ? <HiChevronUp /> : <HiChevronDown />}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-border"
          >
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <StatColumn title="Combat">
                <Row label="Kills" value={player.total_kills} />
                <Row label="Deaths" value={player.total_deaths} />
                <Row label="Assists" value={player.total_assists} />
                <Row label="ADR" value={player.dpr?.toFixed(0)} />
              </StatColumn>
              
              <StatColumn title="Aim">
                <Row label="HS %" value={`${(player.accuracy_head * 100).toFixed(0)}%`} />
                <Row label="Crosshair" value={player.preaim?.toFixed(0)} />
                <Row label="Time to Dmg" value={`${(player.reaction_time * 1000).toFixed(0)}ms`} />
                <Row label="Spray" value={`${(player.spray_accuracy * 100).toFixed(0)}%`} />
              </StatColumn>
              
              <StatColumn title="Utility">
                <Row label="Flash Ast" value={player.flash_assist || player.flashbang_leading_to_kill} />
                <Row label="Trade Kill" value={`${(player.trade_kills_success_percentage * 100).toFixed(0)}%`} />
                <Row label="Util Dmg" value={player.he_foes_damage_avg?.toFixed(0)} />
              </StatColumn>
              
              <StatColumn title="Extra">
                 {match.demo_url && (
                  <a href={match.demo_url} className="flex items-center gap-2 text-primary hover:underline mb-2">
                    <HiDownload /> Demo
                  </a>
                 )}
                 <Row label="CT Rating" value={player.ct_leetify_rating ? (player.ct_leetify_rating * 100).toFixed(0) : '-'} />
                 <Row label="T Rating" value={player.t_leetify_rating ? (player.t_leetify_rating * 100).toFixed(0) : '-'} />
              </StatColumn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Faceit Card ---

export function FaceitMatchCard({ match, onViewScoreboard }: any) {
  const isWin = match.result === 'win';
  const indicatorColor = isWin ? 'bg-emerald-500' : 'bg-rose-500';

  return (
    <div className="bg-card rounded border border-border overflow-hidden flex items-stretch min-h-[60px]">
      <div className={`w-1 shrink-0 ${indicatorColor}`} />
      
      <div className="flex-1 p-3 md:p-4 flex items-center justify-between">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
          <div className="flex items-center gap-2">
            <SiFaceit className="text-[#FF5500] w-3.5 h-3.5 shrink-0" title="FACEIT" />
            <div className="font-bold text-foreground w-24">{match.map}</div>
          </div>
          <div className="font-mono text-lg font-bold">
            <span className={isWin ? 'text-emerald-500' : 'text-rose-500'}>{match.score}</span>
          </div>
          <div className="text-sm text-muted-foreground font-mono">
            {match.kills}K / {match.deaths}D ({match.kd.toFixed(2)})
          </div>
        </div>

        <div className="flex items-center gap-4">
           {match.eloChange !== undefined && (
            <span className={`text-xs font-mono font-bold ${match.eloChange > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {match.eloChange > 0 ? '+' : ''}{match.eloChange}
            </span>
           )}
           <button 
              onClick={onViewScoreboard}
              className="px-3 py-1 text-xs font-medium border border-border rounded hover:bg-secondary"
            >
              Scoreboard
            </button>
        </div>
      </div>
    </div>
  );
}

// --- Simple Card ---

export function LeetifyRecentMatchCard({ match }: { match: LeetifyRecentMatch }) {
  const isWin = match.outcome === 'win';
  return (
    <div className="bg-card rounded border border-border p-3 flex items-center justify-between">
       <div className="flex items-center gap-3">
         <div className={`w-2 h-2 rounded-full ${isWin ? 'bg-emerald-500' : 'bg-rose-500'}`} />
         <HiLightningBolt className="text-purple-500 w-3.5 h-3.5 shrink-0" title="Leetify" />
         <span className="font-medium text-sm">{match.map_name}</span>
       </div>
       <div className="flex gap-4 text-sm font-mono text-muted-foreground">
         <span>{match.score.join('-')}</span>
         <span className={match.leetify_rating > 0 ? 'text-emerald-500' : 'text-rose-500'}>
           {match.leetify_rating > 0 ? '+' : ''}{(match.leetify_rating * 100).toFixed(0)}
         </span>
       </div>
    </div>
  );
}

// Helpers
function StatColumn({ title, children }: any) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: any) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  );
}