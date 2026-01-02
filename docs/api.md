# Vantage API Documentation

## Overview

The Vantage API is a RESTful service that aggregates gaming intelligence data from multiple sources (Steam, Faceit, Leetify, CS2) to provide comprehensive player profiles and risk assessments for Counter-Strike 2 players.

**Base URL:** `http://localhost:3001` (development) | `https://your-domain.com` (production)

**Authentication:** API keys required via headers (see Authentication section below)

**Rate Limiting:** 10 requests per minute per IP (configurable)

**Caching:** Redis caching with 5-minute TTL for improved performance

---

## Quick Reference

### Example Request
```bash
curl -H "X-Steam-Api-Key: YOUR_STEAM_KEY" \
     -H "X-Faceit-Api-Key: YOUR_FACEIT_KEY" \
     -H "X-Leetify-Api-Key: YOUR_LEETIFY_KEY" \
     "http://localhost:3001/api/profile/76561198012345678"
```

### Available Endpoints
- `GET /health` - Health check (no auth required)
- `GET /api/stats` - Server statistics (no auth required)
- `GET /api/profile/{id}` - Get player profile (requires Steam API key)
- `GET /api/matches/{dataSource}/{dataSourceId}` - Get match details (requires Steam + Leetify keys)

### Required API Keys
| Service | Get Key From | Required For |
|---------|--------------|--------------|
| Steam | https://steamcommunity.com/dev/apikey | All profile data |
| Faceit | https://developers.faceit.com/ | Faceit stats (optional) |
| Leetify | Contact Leetify | Leetify stats & matches (optional) |

---

## Authentication

To use the Vantage API, you must provide your own API keys for the external services (Steam, Faceit, Leetify) via request headers.

### Required Headers

```http
X-Steam-Api-Key: YOUR_STEAM_API_KEY
X-Faceit-Api-Key: YOUR_FACEIT_API_KEY
X-Leetify-Api-Key: YOUR_LEETIFY_API_KEY
```

### Getting API Keys

- **Steam API Key**: https://steamcommunity.com/dev/apikey
- **Faceit API Key**: https://developers.faceit.com/
- **Leetify API Key**: Contact Leetify for API access

### Important Notes

- ⚠️ **All three API keys are required** for full functionality
- 🔒 API keys are passed per-request, not stored by the server
- 🔐 Keep your API keys secure and never commit them to public repositories
- ⚡ Keys can be omitted for specific services (e.g., if you only want Steam data)
- 📊 Missing keys will result in partial data (e.g., Steam only, no Faceit/Leetify)

### Example Request

```bash
curl -H "X-Steam-Api-Key: YOUR_STEAM_KEY" \
     -H "X-Faceit-Api-Key: YOUR_FACEIT_KEY" \
     -H "X-Leetify-Api-Key: YOUR_LEETIFY_KEY" \
     "http://localhost:3001/api/profile/76561198012345678"
```

---

## Quick Start

### Basic Usage

```javascript
const response = await fetch('http://localhost:3001/api/profile/76561198012345678', {
  headers: {
    'X-Steam-Api-Key': 'YOUR_STEAM_KEY',
    'X-Faceit-Api-Key': 'YOUR_FACEIT_KEY',
    'X-Leetify-Api-Key': 'YOUR_LEETIFY_KEY'
  }
});

const data = await response.json();
console.log(data);
```

### Using with Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'X-Steam-Api-Key': process.env.STEAM_API_KEY,
    'X-Faceit-Api-Key': process.env.FACEIT_API_KEY,
    'X-Leetify-Api-Key': process.env.LEETIFY_API_KEY
  }
});

const profile = await api.get('/profile/76561198012345678');
```

### Python Example

```python
import requests

headers = {
    'X-Steam-Api-Key': 'YOUR_STEAM_KEY',
    'X-Faceit-Api-Key': 'YOUR_FACEIT_KEY',
    'X-Leetify-Api-Key': 'YOUR_LEETIFY_KEY'
}

response = requests.get(
    'http://localhost:3001/api/profile/76561198012345678',
    headers=headers
)

data = response.json()
print(data)
```

---

## Response Format

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  requiresCaptcha?: boolean;
  timestamp: string;
}
```

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-01-02T12:00:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2026-01-02T12:00:00.000Z"
}
```

---

## Endpoints

### Health & Status

#### GET /health
Basic health check endpoint.

**Response:**
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2026-01-02T12:00:00.000Z",
  "version": "1.0.0"
}
```

#### GET /api/stats
Server statistics and health metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSearches": "1234",
    "server": {
      "uptime": 3600,
      "memory": {
        "rss": 104857600,
        "heapTotal": 67108864,
        "heapUsed": 45000000,
        "external": 2000000
      },
      "version": "1.0.0"
    }
  },
  "timestamp": "2026-01-02T12:00:00.000Z"
}
```

---

### Player Profiles

#### GET /api/profile/{id}
Get comprehensive player profile data aggregated from Steam, Faceit, and Leetify.

**Headers:**
```http
X-Steam-Api-Key: YOUR_STEAM_API_KEY (required)
X-Faceit-Api-Key: YOUR_FACEIT_API_KEY (optional)
X-Leetify-Api-Key: YOUR_LEETIFY_API_KEY (optional)
```

**Parameters:**
- `id` (path): Steam identifier (URL, SteamID64, SteamID32, or vanity name)
- `recaptcha_token` (query, optional): reCAPTCHA token for rate-limited requests

**Supported ID Formats:**
- Steam Profile URL: `https://steamcommunity.com/id/username`
- SteamID64: `76561198012345678`
- SteamID32: `STEAM_0:1:12345`
- Vanity Name: `username`

**Example Request:**
```bash
curl -H "X-Steam-Api-Key: YOUR_STEAM_KEY" \
     -H "X-Faceit-Api-Key: YOUR_FACEIT_KEY" \
     -H "X-Leetify-Api-Key: YOUR_LEETIFY_KEY" \
     "http://localhost:3001/api/profile/76561198012345678"
```

**Response:** See [Player Profile Response](#player-profile-response) below.

**Rate Limiting:** May require reCAPTCHA for excessive requests.

**Caching:** 5-minute cache with intelligent partial updates.

#### POST /api/profile/{id}/refresh
Force refresh of cached profile data.

**Parameters:**
- `id` (path): Steam identifier

**Rate Limiting:** 10-minute cooldown per profile.

**Response:**
```json
{
  "success": true,
  "message": "Cache invalidated. Refresh the page to fetch latest data.",
  "timestamp": "2026-01-02T12:00:00.000Z"
}
```

#### POST /api/profile/{id}/refresh-matches
Refresh only match history data (no cooldown).

**Parameters:**
- `id` (path): Steam identifier

**Response:**
```json
{
  "success": true,
  "message": "Match history refreshed successfully.",
  "timestamp": "2026-01-02T12:00:00.000Z"
}
```

#### GET /api/profile/job/{jobId}
Check status of background processing job.

**Parameters:**
- `jobId` (path): Job identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_123",
    "status": "processing",
    "progress": 50,
    "estimatedCompletion": "2026-01-02T12:05:00.000Z"
  },
  "timestamp": "2026-01-02T12:00:00.000Z"
}
```

---

### Match Details

#### GET /api/matches/{dataSource}/{dataSourceId}
Get detailed match information including full scoreboard with player stats.

**Headers:**
```http
X-Steam-Api-Key: YOUR_STEAM_API_KEY (required)
X-Leetify-Api-Key: YOUR_LEETIFY_API_KEY (required)
```

**Parameters:**
- `dataSource` (path): Data source identifier (e.g., "matchmaking", "faceit", "premier")
- `dataSourceId` (path): Match ID from the data source

**Example Request:**
```bash
curl -H "X-Steam-Api-Key: YOUR_STEAM_KEY" \
     -H "X-Leetify-Api-Key: YOUR_LEETIFY_KEY" \
     "http://localhost:3001/api/matches/matchmaking/3123456789012345678"
```

**Response:** See [Match Details Response](#match-details-response) below.

**Caching:** 5-minute cache with player avatar enrichment.

---

## Data Structures

### Player Profile Response

```typescript
interface UserProfile {
  steam: SteamProfile;
  faceit?: FaceitStats | null;
  leetify?: LeetifyStats | null;
  premier?: PremierStats | null;
  competitive?: CompetitiveStats | null;
  wingman?: WingmanStats | null;
  risk: RiskAssessment;
}
```

#### SteamProfile
```typescript
interface SteamProfile {
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
```

#### FaceitStats
```typescript
interface FaceitStats {
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
```

#### LeetifyStats
```typescript
interface LeetifyStats {
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
```

#### RiskAssessment
```typescript
interface RiskAssessment {
  totalScore: number;  // 0-100
  level: 'low' | 'medium' | 'high' | 'critical';
  flags: RiskFlag[];
  calculatedAt: Date | string;
}

interface RiskFlag {
  flag: string;
  weight: number;
  reason: string;
  detected?: boolean;
}
```

### Match Details Response

```typescript
interface MatchDetails {
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
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid Steam ID, etc.) |
| 404 | Not Found (profile/match not found) |
| 429 | Rate Limited (requires reCAPTCHA) |
| 500 | Internal Server Error |
| 503 | Service Unavailable (Redis down) |

---

## Rate Limiting

- **Per-client limiting** based on IP + user agent + forwarded headers
- **Automatic CAPTCHA** integration for excessive requests
- **Redis-backed** for distributed rate limiting
- **Configurable** limits and windows

---

## Caching Strategy

- **Profile data:** 5 minutes TTL
- **Match details:** 5 minutes TTL
- **Partial updates:** Intelligent cache invalidation for fresh data
- **Background refresh:** Async cache warming

---

## Development

### Environment Variables

```env
# External API Keys (required for functionality)
STEAM_API_KEY=your_steam_key
FACEIT_API_KEY=your_faceit_key
LEETIFY_API_KEY=your_leetify_key

# Server Configuration
API_PORT=3001
API_HOST=localhost

# Database & Cache
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password  # Optional

# Security (optional)
RECAPTCHA_SECRET_KEY=your_recaptcha_secret
```

**Note for Self-Hosted Deployment:**
- Set these environment variables on your server
- Keys are read from `.env` file or environment
- Both backend and Next.js frontend can use same keys

**Note for API Consumers:**
- Get your own API keys from Steam, Faceit, and Leetify
- Pass them via headers with each request
- Keys are not stored by the server

### Running the API

```bash
# Development
npm run dev:api

# Production build
npm run build:api
npm run start:api
```

---

## SDKs & Examples

### JavaScript/Node.js

```javascript
const API_BASE = 'http://localhost:3001';
const API_KEYS = {
  steam: process.env.STEAM_API_KEY,
  faceit: process.env.FACEIT_API_KEY,
  leetify: process.env.LEETIFY_API_KEY
};

async function getPlayerProfile(steamId) {
  const response = await fetch(`${API_BASE}/api/profile/${steamId}`, {
    headers: {
      'X-Steam-Api-Key': API_KEYS.steam,
      'X-Faceit-Api-Key': API_KEYS.faceit,
      'X-Leetify-Api-Key': API_KEYS.leetify
    }
  });
  
  const data = await response.json();

  if (data.success) {
    console.log('Risk Score:', data.data.risk.totalScore);
    console.log('Risk Level:', data.data.risk.level);
    return data.data;
  } else {
    throw new Error(data.error);
  }
}
```

### Python

```python
import requests
import os

API_BASE = 'http://localhost:3001'
API_KEYS = {
    'X-Steam-Api-Key': os.getenv('STEAM_API_KEY'),
    'X-Faceit-Api-Key': os.getenv('FACEIT_API_KEY'),
    'X-Leetify-Api-Key': os.getenv('LEETIFY_API_KEY')
}

API_BASE = 'http://localhost:3001'
API_KEYS = {
    'X-Steam-Api-Key': os.getenv('STEAM_API_KEY'),
    'X-Faceit-Api-Key': os.getenv('FACEIT_API_KEY'),
    'X-Leetify-Api-Key': os.getenv('LEETIFY_API_KEY')
}

def get_player_profile(steam_id):
    response = requests.get(
        f'{API_BASE}/api/profile/{steam_id}',
        headers=API_KEYS
    )
    data = response.json()

    if data['success']:
        profile = data['data']
        print(f"Risk Score: {profile['risk']['totalScore']}")
        print(f"Risk Level: {profile['risk']['level']}")
        return profile
    else:
        raise Exception(data['error'])
```

### cURL

```bash
# Basic profile lookup
curl -H "X-Steam-Api-Key: YOUR_STEAM_KEY" \
     -H "X-Faceit-Api-Key: YOUR_FACEIT_KEY" \
     -H "X-Leetify-Api-Key: YOUR_LEETIFY_KEY" \
     "http://localhost:3001/api/profile/76561198012345678"

# Get match details
curl -H "X-Steam-Api-Key: YOUR_STEAM_KEY" \
     -H "X-Leetify-Api-Key: YOUR_LEETIFY_KEY" \
     "http://localhost:3001/api/matches/matchmaking/3123456789012345678"

# With Steam only (partial data)
curl -H "X-Steam-Api-Key: YOUR_STEAM_KEY" \
     "http://localhost:3001/api/profile/76561198012345678"
```

---

## Error Handling

### Common Error Codes

| Status Code | Description | Cause |
|------------|-------------|-------|
| 400 | Bad Request | Invalid Steam ID format or missing parameters |
| 404 | Not Found | Player profile not found or doesn't exist |
| 429 | Rate Limited | Too many requests, reCAPTCHA required |
| 500 | Server Error | Internal server error or external API failure |
| 503 | Service Unavailable | Redis connection failed or rate limiting unavailable |

### Error Response Examples

**Missing API Key:**
```json
{
  "success": false,
  "error": "STEAM_API_KEY required. Please provide your Steam API key.",
  "timestamp": "2026-01-02T12:00:00.000Z"
}
```

**Rate Limited:**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please complete reCAPTCHA to continue.",
  "requiresCaptcha": true,
  "timestamp": "2026-01-02T12:00:00.000Z"
}
```

**Player Not Found:**
```json
{
  "success": false,
  "error": "Steam profile not found",
  "timestamp": "2026-01-02T12:00:00.000Z"
}
```

---

## Best Practices

### Security
- 🔐 **Never hardcode API keys** in your source code
- 📦 Use environment variables or secure vaults for key storage
- 🚫 Don't commit `.env` files to version control
- 🔄 Rotate API keys regularly
- ⚠️ Monitor API key usage for anomalies

### Performance
- 💾 **Cache responses** on your end to reduce API calls
- ⚡ Use the built-in caching (5 min TTL) for frequently accessed profiles
- 🔢 Batch requests when possible
- 📊 Monitor rate limits and implement backoff strategies

### Rate Limiting
- ⏱️ Default: 10 requests per minute per IP
- 🤖 Implement exponential backoff for 429 responses
- 🔐 Use reCAPTCHA tokens when rate limited
- 📈 Contact for increased rate limits if needed

### Error Handling
```javascript
async function getProfileWithRetry(steamId, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${API_BASE}/api/profile/${steamId}`, {
        headers: {
          'X-Steam-Api-Key': API_KEYS.steam,
          'X-Faceit-Api-Key': API_KEYS.faceit,
          'X-Leetify-Api-Key': API_KEYS.leetify
        }
      });
      
      if (response.status === 429) {
        // Rate limited - wait and retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      
      const data = await response.json();
      if (data.success) return data.data;
      throw new Error(data.error);
      
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

---

## Support & Resources

- **Documentation**: [Full Documentation](../README.md)
- **Security**: [Security Implementation](SECURITY.md)
- **Examples**: [Code Examples](examples-sdks.md)
- **API Status**: Check `/health` endpoint
- **Issues**: Report bugs via GitHub Issues

---

## Changelog

### v1.0.0 (Current)
- ✅ User-provided API keys via headers
- ✅ Multi-source data aggregation (Steam, Faceit, Leetify)
- ✅ Risk assessment algorithm
- ✅ Redis-based caching and rate limiting
- ✅ reCAPTCHA anti-spam protection
- ✅ Comprehensive error handling
        raise Exception(data['error'])
```

---

## Changelog

### v1.0.0
- Initial API release
- Core profile aggregation (Steam, Faceit, Leetify)
- Risk assessment scoring
- Rate limiting and anti-spam
- Redis caching
- Match details endpoint

---

## Support

For API issues or questions:
- Check the [Quick Start Guide](../QUICKSTART.md)
- Review [Troubleshooting](../README.md#troubleshooting)
- Open an issue on GitHub

---

## License

This API is part of the Vantage platform. See [LICENSE](../LICENSE) for terms.</content>
<parameter name="filePath">c:\Users\drwn\Downloads\vantage-main\docs\api.md