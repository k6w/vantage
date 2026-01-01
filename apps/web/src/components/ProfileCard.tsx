"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  HiShieldCheck, 
  HiUser, 
  HiExternalLink, 
  HiLightningBolt, 
  HiChartPie, 
  HiGlobeAlt, 
  HiClock 
} from 'react-icons/hi';
import { SiFaceit, SiSteam } from 'react-icons/si';
import type { UserProfile } from '@vantage/shared';

// --- Main Component ---

export default function ProfileCard({ profile }: { profile: UserProfile }) {
  const { steam, faceit, leetify } = profile;
  const isBanned = steam.vacBanned || steam.gameBanned || steam.communityBanned;

  return (
    <div className="space-y-6 w-full">
      {/* 1. Identity Header */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10">
          {/* Avatar Ring */}
          <div className="relative shrink-0">
            <div className={`w-28 h-28 rounded-full p-1 border-2 ${isBanned ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-700'}`}>
              <div className="w-full h-full rounded-full overflow-hidden relative bg-zinc-900">
                {steam.avatar ? (
                  <Image src={steam.avatar} alt={steam.username} fill className="object-cover" />
                ) : (
                  <HiUser className="w-full h-full p-4 text-zinc-500" />
                )}
              </div>
            </div>
            {steam.level && (
              <div className="absolute bottom-0 right-0 bg-zinc-900 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-zinc-700 shadow-sm">
                Lvl {steam.level}
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="flex-1 space-y-2 text-center md:text-left">
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center justify-center md:justify-start gap-3">
                {steam.username}
                {isBanned && <span className="text-xs bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-1 rounded">BANNED</span>}
                {steam.isPrime && <span className="text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded flex items-center gap-1"><HiShieldCheck /> PRIME</span>}
              </h1>
              <p className="text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-4 text-sm mt-1">
                {steam.realName && <span>{steam.realName}</span>}
                {steam.country && <span className="flex items-center gap-1"><HiGlobeAlt /> {steam.country}</span>}
                <span className="flex items-center gap-1"><HiClock /> {steam.yearsOfService ?? 0} Years</span>
              </p>
            </div>

            {/* Platform Links */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
              <SocialButton icon={SiSteam} label="Steam" href={steam.profileUrl} />
              {faceit && <SocialButton icon={SiFaceit} label="FACEIT" href={`https://www.faceit.com/en/players/${faceit.nickname}`} highlight />}
              {leetify && <SocialButton icon={HiLightningBolt} label="Leetify" href={`https://leetify.com/app/profile/${steam.steamId64}`} />}
            </div>
          </div>

          {/* Steam Stats (Hours) */}
          {steam.cs2Stats && steam.cs2Stats.hoursPlayed && steam.cs2Stats.hoursPlayed > 0 && (
            <div className="hidden md:block text-right space-y-2 p-5 bg-card border border-border rounded-xl shadow-sm">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Playtime</div>
              <div className="text-3xl font-mono font-black text-foreground">
                {steam.cs2Stats.hoursPlayed?.toLocaleString() ?? 0}<span className="text-sm text-muted-foreground font-normal ml-1">hrs</span>
              </div>
              {steam.cs2Stats.winRate !== undefined && (
                <div className="text-sm font-medium text-muted-foreground">
                  {(steam.cs2Stats.winRate * 100).toFixed(1)}% Winrate
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Key Ratings & FACEIT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left: Circular Ratings (Leetify) */}
        {leetify?.rating && (
          <div className="md:col-span-8 bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-muted-foreground uppercase mb-6 flex items-center gap-2">
              <HiChartPie /> Leetify Performance Ratings
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <RingMetric 
                label="Aim" 
                value={leetify.rating.aim} 
                color="text-rose-500" 
                detail="Raw mechanics"
              />
              <RingMetric 
                label="Positioning" 
                value={leetify.rating.positioning} 
                color="text-blue-500" 
                detail="Game sense"
              />
              <RingMetric 
                label="Utility" 
                value={leetify.rating.utility} 
                color="text-emerald-500" 
                detail="Nade usage"
              />
            </div>
            {/* Split Ratings */}
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-4">
              <RelativeRating 
                label="CT Rating" 
                value={leetify.rating.ct_leetify} 
                color="text-blue-500" 
              />
              <RelativeRating 
                label="T Rating" 
                value={leetify.rating.t_leetify} 
                color="text-amber-500" 
              />
            </div>
          </div>
        )}

        {/* Right: FACEIT Card */}
        {faceit && (
          <div className="md:col-span-4 bg-[#FF5500]/5 border border-[#FF5500]/20 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <SiFaceit className="text-[#FF5500] w-8 h-8" />
                <span className="text-xs font-bold text-[#FF5500] uppercase border border-[#FF5500]/30 px-2 py-1 rounded">
                  Verified
                </span>
              </div>
              <div className="text-4xl font-black text-foreground mb-1">{faceit.elo}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase mb-6">FACEIT Elo</div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Level</span>
                  <span className="font-bold bg-zinc-900 text-white w-6 h-6 flex items-center justify-center rounded text-xs">{faceit.level}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">K/D Ratio</span>
                  <span className={`font-mono font-bold ${faceit.avgKD >= 1 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {faceit.avgKD.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Matches</span>
                  <span className="font-mono font-bold">{faceit.matches}</span>
                </div>
              </div>
            </div>
            {/* Background Decor */}
            <SiFaceit className="absolute -bottom-6 -right-6 text-[#FF5500] opacity-5 w-40 h-40 pointer-events-none" />
          </div>
        )}
      </div>

    </div>
  );
}

// --- Sub-Components ---

function SocialButton({ icon: Icon, label, href, highlight }: any) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border
        ${highlight 
          ? 'bg-[#FF5500] border-[#FF5500] text-white hover:bg-[#FF5500]/90' 
          : 'bg-secondary border-border text-foreground hover:bg-secondary/80'}
      `}
    >
      <Icon className="w-3.5 h-3.5" /> {label} <HiExternalLink className="opacity-60" />
    </a>
  );
}

function RingMetric({ label, value, color, detail }: any) {
  // Normalize value to 0-100 for drawing
  const raw = value || 0;
  const displayValue = raw > 0 ? (raw <= 1 ? raw * 100 : raw) : 0;
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(displayValue, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-secondary/20 rounded-xl">
      <div className="relative w-20 h-20 mb-2">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="40" cy="40" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-border/30" />
          <motion.circle
            cx="40" cy="40" r={radius}
            stroke="currentColor" strokeWidth="6" fill="transparent" strokeLinecap="round"
            className={color}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-black text-lg">
          {displayValue.toFixed(0)}
        </div>
      </div>
      <div className="text-sm font-bold uppercase tracking-wide">{label}</div>
      <div className="text-[10px] text-muted-foreground">{detail}</div>
    </div>
  );
}

function BarMetric({ label, value, max }: any) {
  const percent = Math.min(((value || 0) / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs font-bold mb-1">
        <span>{label}</span>
        <span>{value?.toFixed(1) || 0}</span>
      </div>
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className="h-full bg-primary"
        />
      </div>
    </div>
  );
}

function RelativeRating({ label, value }: any) {
  const percent = (value || 0) * 100; // Convert to percentage
  const displayValue = percent >= 0 ? `+${percent.toFixed(1)}%` : `${percent.toFixed(1)}%`;
  const isPositive = percent >= 0;
  
  return (
    <div>
      <div className="flex justify-between items-center text-xs font-bold mb-1">
        <span>{label}</span>
        <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
          {displayValue}
        </span>
      </div>
      <div className="text-[10px] text-muted-foreground">
        {isPositive ? 'Above average' : 'Below average'}
      </div>
    </div>
  );
}