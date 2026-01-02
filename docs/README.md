# Vantage API Documentation

This directory contains comprehensive documentation for the Vantage API backend.

## Files

- **[api.md](api.md)** - Complete API reference with endpoints, data structures, examples, and usage guides
- **[risk-assessment.md](risk-assessment.md)** - Detailed documentation of the risk scoring algorithm and flags
- **[examples-sdks.md](examples-sdks.md)** - Code examples and SDK implementations in multiple languages
- **[README.md](README.md)** - This overview file

## API Overview

The Vantage API is a specialized REST service for Counter-Strike 2 player intelligence gathering. It aggregates data from:

- **Steam Web API** - Player profiles, ban history, game stats
- **Faceit Data API** - Competitive matchmaking data, ELO ratings, match history
- **Leetify API** - Advanced performance analytics, teammate tracking
- **CS2 Game Coordinator** - Premier, Competitive, and Wingman rankings

### Key Features

- **Risk Assessment**: Proprietary algorithm calculating trust scores (0-100)
- **Multi-Source Aggregation**: Intelligent data merging with conflict resolution
- **Rate Limiting**: Redis-backed per-client limiting with CAPTCHA integration
- **Caching**: Smart caching with partial updates and background refresh
- **Real-time Updates**: Background job processing for fresh data

## Quick Start

1. **Setup Environment**
   ```bash
   cp .env.example .env
   # Add your API keys (Steam, Faceit, Leetify)
   ```

2. **Start Services**
   ```bash
   npm run docker:up  # PostgreSQL + Redis
   npm run db:push    # Database setup
   npm run dev:api    # Start API server
   ```

3. **Test API**
   ```bash
   curl http://localhost:3001/health
   curl "http://localhost:3001/api/profile/76561198012345678"
   ```

## Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/stats` | GET | Server statistics |
| `/api/profile/{id}` | GET | Get player profile |
| `/api/profile/{id}/refresh` | POST | Force profile refresh |
| `/api/profile/{id}/refresh-matches` | POST | Refresh match history |
| `/api/matches/{source}/{id}` | GET | Get match details |

## Data Sources

### Steam Web API
- Player profiles and avatars
- Ban history (VAC, Game, Community)
- Account age and Prime status
- Basic CS2 statistics

### Faceit Data API
- Competitive ELO and level
- Match history and statistics
- Ban tracking
- Team information

### Leetify API
- Advanced performance metrics
- Teammate analysis
- Detailed match breakdowns
- Rating systems (Aim, Positioning, etc.)

### CS2 Game Coordinator
- Premier mode ratings
- Competitive rankings
- Wingman statistics
- Official matchmaking data

## Risk Assessment Algorithm

The risk scoring system evaluates players based on weighted red flags:

| Risk Factor | Weight | Condition |
|-------------|--------|-----------|
| New Account | +30 | Account < 1 year old |
| Private Profile | +10 | Steam profile set to private |
| VAC Ban | +40 | Active VAC ban detected |
| Game Ban | +25 | Active game ban detected |
| No Prime | +15 | Missing Prime status |
| Inconsistent Stats | +25 | Statistical anomalies |
| High K/D, Low Matches | +20 | Suspicious performance patterns |

**Risk Levels:**
- **Low (0-29)**: Trustworthy player
- **Medium (30-49)**: Some concerns
- **High (50-69)**: Multiple red flags
- **Critical (70-100)**: High-risk account

## Architecture

```
vantage/
├── apps/api/              # Fastify backend
│   ├── src/
│   │   ├── index.ts       # Server setup
│   │   ├── routes/        # API endpoints
│   │   └── services/      # Business logic
├── packages/shared/       # Shared types/utilities
├── prisma/               # Database schema
└── docker-compose.yml    # Infrastructure
```

### Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify (high-performance web framework)
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for caching and rate limiting
- **Queue**: BullMQ for background processing
- **Validation**: Built-in Fastify validation

## Security & Rate Limiting

- **Per-Client Limiting**: Based on IP, User-Agent, and X-Forwarded-For headers
- **CAPTCHA Integration**: Automatic reCAPTCHA for rate-limited requests
- **Redis Backend**: Distributed rate limiting across multiple instances
- **Fail-Safe**: Service degradation when Redis is unavailable

## Development

### Environment Setup

```env
# API Keys (required)
STEAM_API_KEY=your_steam_key
FACEIT_API_KEY=your_faceit_key
LEETIFY_API_KEY=your_leetify_key

# Server Config
API_PORT=3001
API_HOST=localhost

# Database
DATABASE_URL=postgresql://vantage:vantage_dev@localhost:5432/vantage

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
RECAPTCHA_SECRET_KEY=your_recaptcha_secret
```

### Available Scripts

```bash
# Development
npm run dev:api          # Start API with hot reload
npm run dev              # Start all services

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:studio        # Open database UI

# Docker
npm run docker:up        # Start PostgreSQL + Redis
npm run docker:down      # Stop services

# Production
npm run build:api        # Build API
npm run start:api        # Start production server
```

## Deployment

### Docker Deployment

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f api
```

### Manual Deployment

```bash
# Install dependencies
npm ci --production

# Build application
npm run build:api

# Start server
npm run start:api
```

## Monitoring & Troubleshooting

### Health Checks

```bash
# API health
curl http://localhost:3001/health

# Database connectivity
npm run db:studio

# Redis connectivity
redis-cli ping
```

### Common Issues

- **Redis Connection Failed**: Ensure Redis is running (`docker-compose ps`)
- **Database Errors**: Check PostgreSQL status and connection string
- **API Key Issues**: Verify keys are set in `.env` and valid
- **Rate Limiting**: Check Redis for rate limit data

### Logs

```bash
# View API logs
docker-compose logs -f api

# View all service logs
docker-compose logs -f
```

## Contributing

1. **Code Style**: Follow existing TypeScript patterns
2. **Testing**: Add tests for new endpoints/services
3. **Documentation**: Update API docs for new features
4. **Security**: Ensure proper input validation and rate limiting

## License

See [LICENSE](../LICENSE) for terms and conditions.

## Support

- **Issues**: [GitHub Issues](https://github.com/k6w/vantage/issues)
- **Discussions**: [GitHub Discussions](https://github.com/k6w/vantage/discussions)
- **Documentation**: [Quick Start](../QUICKSTART.md)</content>
<parameter name="filePath">c:\Users\drwn\Downloads\vantage-main\docs\README.md