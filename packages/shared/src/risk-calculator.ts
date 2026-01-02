import type { RiskAssessment, RiskFlag, SteamProfile, FaceitStats, LeetifyStats } from './types';

export interface RiskCalculationInput {
  steam: SteamProfile;
  faceit?: FaceitStats;
  leetify?: LeetifyStats;
  premier?: { rating: number };
}

/**
 * Calculates the Vantage Risk Factor (0-100)
 * Comprehensive multi-layered detection system analyzing:
 * - Account characteristics & history
 * - Statistical anomalies & patterns
 * - Performance inconsistencies
 * - Behavioral red flags
 */
export function calculateRiskScore(data: RiskCalculationInput): RiskAssessment {
  const flags: RiskFlag[] = [];
  let totalScore = 0;
  
  // ==========================================
  // CATEGORY 1: ACCOUNT FLAGS
  // ==========================================
  
  // Flag 1: New Steam Account (0-1 year: +30, 1-2 years: +15)
  if (data.steam.accountCreated) {
    const accountCreatedTime = typeof data.steam.accountCreated === 'string' 
      ? new Date(data.steam.accountCreated).getTime() 
      : data.steam.accountCreated.getTime();
    const accountAgeDays = (Date.now() - accountCreatedTime) / (1000 * 60 * 60 * 24);
    const accountAgeYears = accountAgeDays / 365;
    
    if (accountAgeYears < 1) {
      const weight = 30;
      flags.push({
        flag: 'NEW_ACCOUNT',
        weight,
        reason: `Account created ${Math.floor(accountAgeDays)} days ago (< 1 year)`,
        detected: true
      });
      totalScore += weight;
    } else if (accountAgeYears < 2) {
      const weight = 15;
      flags.push({
        flag: 'YOUNG_ACCOUNT',
        weight,
        reason: `Account created ${accountAgeYears.toFixed(1)} years ago (< 2 years)`,
        detected: true
      });
      totalScore += weight;
    }
  }
  
  // Flag 2: Private Profile (+10)
  if (data.steam.isPrivate) {
    const weight = 10;
    flags.push({
      flag: 'HIDDEN_PROFILE',
      weight,
      reason: 'Profile is set to private - hiding information',
      detected: true
    });
    totalScore += weight;
  }
  
  // Flag 3: VAC/Game Ban History (+60 for VAC - CRITICAL, +25 for game ban)
  // Note: VAC banned players can't play on VAC servers, so if they're playing,
  // they're on a new account after being banned - extremely suspicious
  if (data.steam.vacBanned) {
    const weight = 60;
    const daysSince = data.steam.daysSinceLastBan || 0;
    flags.push({
      flag: 'VAC_BANNED',
      weight,
      reason: `VAC ban detected${daysSince > 0 ? ` (${daysSince} days ago)` : ''} - Using new account after ban`,
      detected: true
    });
    totalScore += weight;
  } else if (data.steam.gameBanned) {
    const weight = 25;
    const daysSince = data.steam.daysSinceLastBan || 0;
    flags.push({
      flag: 'GAME_BANNED',
      weight,
      reason: `Game ban detected${daysSince > 0 ? ` (${daysSince} days ago)` : ''}`,
      detected: true
    });
    totalScore += weight;
  }
  
  // Flag 4: Low Steam Level for Hours Played (+12)
  if (data.steam.level !== undefined && data.steam.cs2Stats?.hoursPlayed) {
    if (data.steam.level < 5 && data.steam.cs2Stats.hoursPlayed > 500) {
      const weight = 12;
      flags.push({
        flag: 'LOW_STEAM_LEVEL',
        weight,
        reason: `Only level ${data.steam.level} with ${data.steam.cs2Stats.hoursPlayed} hours played`,
        detected: true
      });
      totalScore += weight;
    }
  }
  
  // Flag 5: Faceit Ban History (+35)
  if (data.faceit?.hasBan && data.faceit.activeBans && data.faceit.activeBans.length > 0) {
    const weight = 35;
    flags.push({
      flag: 'FACEIT_BANNED',
      weight,
      reason: `Active Faceit ban(s): ${data.faceit.activeBans.map((b: any) => b.reason).join(', ')}`,
      detected: true
    });
    totalScore += weight;
  }
  
  // ==========================================
  // CATEGORY 2: STATISTICAL ANOMALIES
  // ==========================================
  
  // Flag 6: Abnormally High Headshot % (+20)
  if (data.leetify?.stats?.accuracy_head) {
    const hsPercent = data.leetify.stats.accuracy_head > 1 
      ? data.leetify.stats.accuracy_head 
      : data.leetify.stats.accuracy_head * 100;
    
    if (hsPercent > 65) {
      const weight = 20;
      flags.push({
        flag: 'EXTREME_HEADSHOT',
        weight,
        reason: `Abnormally high headshot accuracy: ${hsPercent.toFixed(1)}% (Pro avg: ~50%)`,
        detected: true
      });
      totalScore += weight;
    }
  }
  
  // Flag 7: Superhuman Reaction Time (+18)
  if (data.leetify?.stats?.reaction_time_ms) {
    if (data.leetify.stats.reaction_time_ms < 150) {
      const weight = 18;
      flags.push({
        flag: 'INHUMAN_REACTIONS',
        weight,
        reason: `Reaction time ${data.leetify.stats.reaction_time_ms.toFixed(0)}ms (avg human: 200-250ms)`,
        detected: true
      });
      totalScore += weight;
    }
  }
  
  // Flag 8: Perfect Spray Control (+15)
  if (data.leetify?.stats?.spray_accuracy) {
    const sprayAcc = data.leetify.stats.spray_accuracy > 1 
      ? data.leetify.stats.spray_accuracy 
      : data.leetify.stats.spray_accuracy * 100;
    
    if (sprayAcc > 85) {
      const weight = 15;
      flags.push({
        flag: 'PERFECT_SPRAY',
        weight,
        reason: `Unnaturally consistent spray control: ${sprayAcc.toFixed(1)}%`,
        detected: true
      });
      totalScore += weight;
    }
  }
  
  // Flag 9: Inconsistent Skill Distribution (+22)
  // High aim but low game sense suggests aim assistance
  if (data.leetify?.rating) {
    const aim = data.leetify.rating.aim || 0;
    const positioning = data.leetify.rating.positioning || 0;
    const utility = data.leetify.rating.utility || 0;
    
    if (aim > 85 && positioning < 35) {
      const weight = 22;
      flags.push({
        flag: 'SKILL_IMBALANCE',
        weight,
        reason: `High aim (${aim.toFixed(0)}) but poor positioning (${positioning.toFixed(0)}) - suggests assistance`,
        detected: true
      });
      totalScore += weight;
    }
    
    // Also check aim vs utility
    if (aim > 85 && utility < 30) {
      const weight = 18;
      flags.push({
        flag: 'NO_UTILITY_USAGE',
        weight,
        reason: `High aim (${aim.toFixed(0)}) but minimal utility (${utility.toFixed(0)}) - unnatural for skill level`,
        detected: true
      });
      totalScore += weight;
    }
  }
  
  // Flag 10: Extreme K/D with Low Experience (+20)
  if (data.faceit) {
    if (data.faceit.avgKD > 1.7 && data.faceit.matches < 100) {
      const weight = 20;
      flags.push({
        flag: 'HIGH_KD_LOW_MATCHES',
        weight,
        reason: `Exceptional K/D (${data.faceit.avgKD.toFixed(2)}) with only ${data.faceit.matches} matches`,
        detected: true
      });
      totalScore += weight;
    }
  }
  
  // ==========================================
  // CATEGORY 3: PERFORMANCE PATTERNS
  // ==========================================
  
  // Flag 11: Perfect Counter-Strafing (+16)
  if (data.leetify?.stats?.counter_strafing_good_shots_ratio) {
    const csRatio = data.leetify.stats.counter_strafing_good_shots_ratio > 1
      ? data.leetify.stats.counter_strafing_good_shots_ratio
      : data.leetify.stats.counter_strafing_good_shots_ratio * 100;
    
    if (csRatio > 90) {
      const weight = 16;
      flags.push({
        flag: 'PERFECT_MOVEMENT',
        weight,
        reason: `Suspiciously high counter-strafe accuracy: ${csRatio.toFixed(1)}%`,
        detected: true
      });
      totalScore += weight;
    }
  }
  
  // Flag 12: Extreme Opening Duel Success (+17)
  if (data.leetify?.stats) {
    const tOpeningSuccess = data.leetify.stats.t_opening_duel_success_percentage;
    const ctOpeningSuccess = data.leetify.stats.ct_opening_duel_success_percentage;
    
    if (tOpeningSuccess && tOpeningSuccess > 70) {
      const weight = 17;
      flags.push({
        flag: 'DOMINANT_T_ENTRIES',
        weight,
        reason: `Abnormal T-side opening success: ${tOpeningSuccess.toFixed(1)}% (Pro avg: 50-55%)`,
        detected: true
      });
      totalScore += weight;
    }
    
    if (ctOpeningSuccess && ctOpeningSuccess > 70) {
      const weight = 17;
      flags.push({
        flag: 'DOMINANT_CT_HOLDS',
        weight,
        reason: `Abnormal CT-side opening success: ${ctOpeningSuccess.toFixed(1)}% (Pro avg: 45-50%)`,
        detected: true
      });
      totalScore += weight;
    }
  }
  
  // Flag 13: Perfect Pre-aim (+14)
  if (data.leetify?.stats?.preaim !== undefined) {
    if (data.leetify.stats.preaim < 5) { // Lower is better (degrees off target)
      const weight = 14;
      flags.push({
        flag: 'PERFECT_CROSSHAIR',
        weight,
        reason: `Suspiciously perfect crosshair placement: ${data.leetify.stats.preaim.toFixed(1)}° avg offset`,
        detected: true
      });
      totalScore += weight;
    }
  }
  
  // Flag 14: High Win Rate with New Account (+19)
  if (data.leetify && data.steam.accountCreated) {
    const accountCreatedTime = typeof data.steam.accountCreated === 'string' 
      ? new Date(data.steam.accountCreated).getTime() 
      : data.steam.accountCreated.getTime();
    const accountAgeMonths = (Date.now() - accountCreatedTime) / (1000 * 60 * 60 * 24 * 30);
    
    if (accountAgeMonths < 6 && data.leetify.winrate > 0.65 && data.leetify.total_matches > 20) {
      const weight = 19;
      flags.push({
        flag: 'NEW_ACCOUNT_DOMINATING',
        weight,
        reason: `${(data.leetify.winrate * 100).toFixed(1)}% winrate with ${Math.floor(accountAgeMonths)} month old account`,
        detected: true
      });
      totalScore += weight;
    }
  }
  
  // ==========================================
  // CATEGORY 4: BEHAVIORAL FLAGS
  // ==========================================
  
  // Flag 15: New Faceit Account with High Skill (+20)
  if (data.faceit && data.faceit.accountAge !== undefined) {
    if (data.faceit.accountAge < 60 && data.faceit.level >= 8) {
      const weight = 20;
      flags.push({
        flag: 'NEW_FACEIT_HIGH_LEVEL',
        weight,
        reason: `Faceit account only ${data.faceit.accountAge} days old but already level ${data.faceit.level}`,
        detected: true
      });
      totalScore += weight;
    }
  }
  
  // Flag 16: Inconsistent Match History Performance (+13)
  // Check for sudden skill spikes in recent matches
  if (data.leetify?.recent_matches && data.leetify.recent_matches.length >= 10) {
    const recentRatings = data.leetify.recent_matches.slice(0, 10).map(m => m.leetify_rating);
    const avg = recentRatings.reduce((a, b) => a + b, 0) / recentRatings.length;
    const maxRating = Math.max(...recentRatings);
    const minRating = Math.min(...recentRatings);
    
    // If there's extreme variance (max is 2x+ the min)
    if (maxRating > minRating * 2 && avg > 0.7) {
      const weight = 13;
      flags.push({
        flag: 'INCONSISTENT_PERFORMANCE',
        weight,
        reason: `Extreme performance variance in recent matches (${(minRating * 100).toFixed(0)} to ${(maxRating * 100).toFixed(0)})`,
        detected: true
      });
      totalScore += weight;
    }
  }
  
  // Flag 17: Low Total Playtime for Skill Level (+15)
  if (data.steam.cs2Stats?.hoursPlayed && data.leetify?.ranks?.leetify) {
    if (data.steam.cs2Stats.hoursPlayed < 500 && data.leetify.ranks.leetify > 80) {
      const weight = 15;
      flags.push({
        flag: 'LOW_HOURS_HIGH_SKILL',
        weight,
        reason: `Only ${data.steam.cs2Stats.hoursPlayed} hours but top ${(100 - data.leetify.ranks.leetify).toFixed(0)}% skill rank`,
        detected: true
      });
      totalScore += weight;
    }
  }
  
  // Flag 18: Abnormal Side Imbalance (+11)
  if (data.leetify?.rating) {
    const ctRating = data.leetify.rating.ct_leetify || 0;
    const tRating = data.leetify.rating.t_leetify || 0;
    
    // If one side is significantly better (difference > 1.5 standard deviations)
    if (Math.abs(ctRating - tRating) > 1.5 && Math.max(ctRating, tRating) > 1.0) {
      const weight = 11;
      const betterSide = ctRating > tRating ? 'CT' : 'T';
      flags.push({
        flag: 'EXTREME_SIDE_BIAS',
        weight,
        reason: `Extreme performance bias: ${betterSide}-side significantly outperforms (${Math.abs(ctRating - tRating).toFixed(2)} diff)`,
        detected: true
      });
      totalScore += weight;
    }
  }
  
  // Cap score at 100
  totalScore = Math.min(totalScore, 100);
  
  // Determine risk level
  let level: 'low' | 'medium' | 'high' | 'critical';
  if (totalScore >= 70) level = 'critical';
  else if (totalScore >= 45) level = 'high';
  else if (totalScore >= 25) level = 'medium';
  else level = 'low';
  
  return {
    totalScore,
    level,
    flags,
    calculatedAt: new Date()
  };
}

/**
 * Gets color class for risk score display
 */
export function getRiskColor(score: number): string {
  if (score >= 70) return 'red';
  if (score >= 50) return 'orange';
  if (score >= 30) return 'yellow';
  return 'green';
}

/**
 * Gets risk level text
 */
export function getRiskLevelText(level: string): string {
  switch (level) {
    case 'critical': return 'CRITICAL THREAT';
    case 'high': return 'HIGH RISK';
    case 'medium': return 'MODERATE RISK';
    case 'low': return 'LOW RISK';
    default: return 'UNKNOWN';
  }
}
