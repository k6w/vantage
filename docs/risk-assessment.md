# Vantage Risk Assessment System

## Overview

The Vantage Risk Assessment System is a proprietary algorithm that calculates a "Trust Variance" score (0-100) for Counter-Strike 2 players. This score represents the likelihood that a player may be using unauthorized assistance, cheating, or engaging in other suspicious behavior.

**Risk Levels:**
- **Low (0-29)**: Trustworthy player
- **Medium (30-49)**: Some concerns, monitor closely
- **High (50-69)**: Multiple red flags, high suspicion
- **Critical (70-100)**: Severe violations, avoid playing with

## Algorithm Architecture

The system analyzes four main categories of data:

1. **Account Characteristics** - Age, privacy settings, ban history
2. **Statistical Anomalies** - Performance metrics that defy probability
3. **Performance Patterns** - Skill distribution and consistency
4. **Behavioral Flags** - Account usage patterns and progression

## Risk Flags & Weights

### Category 1: Account Characteristics

#### NEW_ACCOUNT (+30)
**Trigger:** Steam account created less than 1 year ago
**Rationale:** New accounts are more likely to be smurf accounts or ban evaders
**Calculation:** Days since account creation

#### YOUNG_ACCOUNT (+15)
**Trigger:** Steam account created 1-2 years ago
**Rationale:** Relatively new accounts with established patterns
**Calculation:** Years since account creation

#### HIDDEN_PROFILE (+10)
**Trigger:** Steam profile set to private
**Rationale:** Players hiding information often have something to conceal
**Detection:** `isPrivate` flag from Steam API

#### VAC_BANNED (+60)
**Trigger:** Active VAC ban detected
**Rationale:** Players using new accounts after VAC bans are highly suspicious
**Detection:** `vacBanned` flag from Steam API
**Note:** Critical weight due to ban evasion implications

#### GAME_BANNED (+25)
**Trigger:** Active game ban detected
**Rationale:** Game bans indicate rule violations
**Detection:** `gameBanned` flag from Steam API

#### FACEIT_BANNED (+35)
**Trigger:** Active Faceit ban(s) detected
**Rationale:** Competitive platform bans suggest serious misconduct
**Detection:** `hasBan` and `activeBans` from Faceit API

#### LOW_STEAM_LEVEL (+12)
**Trigger:** Steam level < 5 with > 500 CS2 hours
**Rationale:** Experienced players typically have higher Steam levels
**Calculation:** Level vs hours played ratio

### Category 2: Statistical Anomalies

#### EXTREME_HEADSHOT (+20)
**Trigger:** Headshot accuracy > 65%
**Rationale:** Human limits are ~50-55% for professional players
**Detection:** `accuracy_head` from Leetify API
**Note:** Accounts for spray transfer and positioning

#### INHUMAN_REACTIONS (+18)
**Trigger:** Reaction time < 150ms
**Rationale:** Human reaction time averages 200-250ms
**Detection:** `reaction_time_ms` from Leetify API

#### PERFECT_SPRAY (+15)
**Trigger:** Spray control accuracy > 85%
**Rationale:** Perfect consistency suggests automation
**Detection:** `spray_accuracy` from Leetify API

#### SKILL_IMBALANCE (+22)
**Trigger:** Aim rating > 85 but positioning < 35
**Rationale:** Natural skill development creates balanced progression
**Detection:** Aim vs positioning rating comparison
**Note:** Classic indicator of aim assistance

#### NO_UTILITY_USAGE (+18)
**Trigger:** Aim rating > 85 but utility < 30
**Rationale:** Skilled players use grenades effectively
**Detection:** Aim vs utility rating comparison

#### HIGH_KD_LOW_MATCHES (+20)
**Trigger:** K/D > 1.7 with < 100 Faceit matches
**Rationale:** Exceptional performance requires experience
**Detection:** Faceit stats analysis

### Category 3: Performance Patterns

#### PERFECT_MOVEMENT (+16)
**Trigger:** Counter-strafe accuracy > 90%
**Rationale:** Perfect movement suggests prediction or automation
**Detection:** `counter_strafing_good_shots_ratio` from Leetify

#### DOMINANT_T_ENTRIES (+17)
**Trigger:** T-side opening duel success > 70%
**Rationale:** Pro average is 50-55% for T-side entries
**Detection:** `t_opening_duel_success_percentage` from Leetify

#### DOMINANT_CT_HOLDS (+17)
**Trigger:** CT-side opening success > 70%
**Rationale:** Pro average is 45-50% for CT-side holds
**Detection:** `ct_opening_duel_success_percentage` from Leetify

#### PERFECT_CROSSHAIR (+14)
**Trigger:** Pre-aim offset < 5 degrees
**Rationale:** Perfect crosshair placement is mechanically impossible
**Detection:** `preaim` from Leetify API

#### NEW_ACCOUNT_DOMINATING (+19)
**Trigger:** >65% winrate with <6 month old account and >20 matches
**Rationale:** New accounts shouldn't dominate established players
**Detection:** Account age vs winrate analysis

### Category 4: Behavioral Flags

#### NEW_FACEIT_HIGH_LEVEL (+20)
**Trigger:** Faceit account <60 days old but level ≥8
**Rationale:** Skill progression takes time to reach high levels
**Detection:** Faceit account age vs level analysis

#### INCONSISTENT_PERFORMANCE (+13)
**Trigger:** Extreme rating variance in recent 10 matches (2x+ difference)
**Rationale:** Consistent performance is expected at high skill levels
**Detection:** Recent match rating analysis

#### LOW_HOURS_HIGH_SKILL (+15)
**Trigger:** <500 CS2 hours but top 20% Leetify rank
**Rationale:** High skill requires significant playtime
**Detection:** Hours played vs skill rank comparison

#### EXTREME_SIDE_BIAS (+11)
**Trigger:** CT/T rating difference >1.5 standard deviations
**Rationale:** Skilled players perform consistently on both sides
**Detection:** Side rating comparison

## Calculation Process

1. **Data Collection**: Aggregate from Steam, Faceit, Leetify APIs
2. **Flag Evaluation**: Check each condition against player data
3. **Score Accumulation**: Sum weights of triggered flags
4. **Score Capping**: Maximum score of 100
5. **Level Assignment**: Map score to risk level

## Example Calculations

### Low Risk Player (Score: 15)
```
Flags Triggered:
- YOUNG_ACCOUNT (+15): Account created 1.3 years ago

Total: 15 → LOW RISK
```

### Medium Risk Player (Score: 35)
```
Flags Triggered:
- HIDDEN_PROFILE (+10): Profile set to private
- HIGH_KD_LOW_MATCHES (+20): 1.85 KD with 75 matches
- LOW_STEAM_LEVEL (+5): Level 3 with 600 hours

Total: 35 → MEDIUM RISK
```

### High Risk Player (Score: 65)
```
Flags Triggered:
- VAC_BANNED (+60): VAC ban 2 years ago
- SKILL_IMBALANCE (+22): Aim 92, Positioning 28
- EXTREME_HEADSHOT (+20): 68% headshot accuracy
- INHUMAN_REACTIONS (+18): 145ms reaction time

Total: 120 → CAPPED at 100 → CRITICAL RISK
```

### Critical Risk Player (Score: 85)
```
Flags Triggered:
- NEW_ACCOUNT (+30): Account created 45 days ago
- VAC_BANNED (+60): Recent VAC ban
- SKILL_IMBALANCE (+22): Aim 89, Positioning 31
- PERFECT_SPRAY (+15): 87% spray accuracy
- DOMINANT_T_ENTRIES (+17): 72% T-side success

Total: 144 → CAPPED at 100 → CRITICAL RISK
```

## Data Sources

### Steam Web API
- Account creation date and age
- Profile privacy settings
- VAC/Game ban history
- Steam level and hours played

### Faceit Data API
- Account age and level progression
- Ban history and active sanctions
- Performance statistics and match counts

### Leetify API
- Advanced performance analytics
- Reaction time measurements
- Accuracy and movement metrics
- Skill rating breakdowns

## Limitations & Considerations

### False Positives
- **Legitimate Skill**: Some players naturally excel in certain areas
- **Playstyle Differences**: Aggressive players may show statistical anomalies
- **Data Quality**: Incomplete data can lead to incorrect assessments

### False Negatives
- **New Cheating Methods**: Undetected by current algorithm
- **Private Profiles**: Limited data availability
- **API Limitations**: Dependent on third-party data accuracy

### Algorithm Updates
The system is continuously refined based on:
- Professional player statistics
- Cheating pattern analysis
- Community feedback
- New data source integration

## Usage in API

```typescript
import { calculateRiskScore } from '@vantage/shared';

const profile = await getPlayerProfile(steamId);
const risk = calculateRiskScore({
  steam: profile.steam,
  faceit: profile.faceit,
  leetify: profile.leetify
});

console.log(`Risk Score: ${risk.totalScore}`);
console.log(`Risk Level: ${risk.level}`);
console.log(`Flags:`, risk.flags);
```

## Integration Examples

### Frontend Display
```javascript
function RiskIndicator({ score, level, flags }) {
  const color = score >= 70 ? 'red' : score >= 50 ? 'orange' : score >= 30 ? 'yellow' : 'green';

  return (
    <div className={`risk-indicator ${color}`}>
      <h3>Risk Level: {level.toUpperCase()}</h3>
      <div className="score">Score: {score}/100</div>
      <div className="flags">
        {flags.map(flag => (
          <div key={flag.flag} className="flag">
            {flag.reason} (+{flag.weight})
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Backend Filtering
```typescript
function filterPlayers(players, maxRisk = 50) {
  return players.filter(player =>
    player.risk.totalScore <= maxRisk
  );
}
```

## Future Enhancements

- **Machine Learning**: Pattern recognition for new cheating methods
- **Historical Analysis**: Track risk score changes over time
- **Cross-Platform Data**: Integration with additional gaming platforms
- **Real-time Updates**: Live risk assessment during matches
- **Community Reporting**: User-submitted evidence integration

## Research & Validation

The algorithm is validated against:
- Professional player statistics
- Known cheating cases
- Community reports
- Statistical analysis of large player datasets

Regular updates ensure the system adapts to evolving cheating methods and maintains accuracy.</content>
<parameter name="filePath">c:\Users\drwn\Downloads\vantage-main\docs\risk-assessment.md