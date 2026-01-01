# VANTAGE

> See what they're hiding.

Vantage is a real-time Intelligence Platform for CS2 players. Consolidate data from Steam, Faceit, and Leetify to calculate a proprietary Trust Variance (Risk Factor) score and gain tactical insights into your teammates and opponents.

## Documentation

- [Quick Start Guide](QUICKSTART.md) - Detailed setup instructions
- [License](LICENSE) - Terms and conditions

---

## Key Features

- Universal Player Lookup - Search by Steam URL, SteamID64, SteamID32, or vanity name
- Multi-Source Intelligence - Aggregates data from Steam, Faceit, Leetify, and Premier
- Risk Assessment - AI-powered Trust Variance scoring (0-100)
- Real-Time Updates - Live data fetching with Redis caching
- Tactical UI - Radar-style scanning animations and professional dashboard
- Background Processing - BullMQ workers for efficient data scraping

## Screenshots

![Screenshot 1](./screeenshots/1.png)
![Screenshot 2](./screeenshots/2.png)
![Screenshot 3](./screeenshots/3.png)
![Screenshot 4](./screeenshots/4.png)

---

## Architecture

```
vantage/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Fastify backend
├── packages/
│   └── shared/       # Shared types, utilities, risk calculator
├── prisma/           # Database schema
└── docker-compose.yml
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Fastify, TypeScript, BullMQ |
| Database | PostgreSQL (Prisma ORM) |
| Cache | Redis |
| APIs | Steam Web API, Faceit Data API, Leetify API |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- API Keys:
  - Steam Web API Key
  - Faceit API Key
  - Leetify API Key (optional)

### Automated Setup (Recommended)

For first-time setup, run the automated script:

```bash
./setup.sh
```

This will:
- Create `.env` file from template
- Start Docker services (PostgreSQL + Redis)
- Generate Prisma client
- Push database schema

### Manual Setup

If you prefer manual setup, follow these steps:

### 1. Clone and Install

```bash
cd vantage
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Database
DATABASE_URL="postgresql://vantage:vantage_dev@localhost:5432/vantage?schema=public"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# Steam API
STEAM_API_KEY="your_steam_api_key_here"

# Faceit API
FACEIT_API_KEY="your_faceit_api_key_here"

# Leetify API
LEETIFY_API_KEY="your_leetify_api_key_here"

# Server
API_PORT=3001
API_HOST="localhost"

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:3001"

# reCAPTCHA (disabled in development)
RECAPTCHA_SECRET_KEY="your_recaptcha_secret_key_here"
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="your_recaptcha_site_key_here"
```

### 3. Start Services

Start PostgreSQL and Redis:

```bash
npm run docker:up
```

### 4. Database Setup

Generate Prisma client and push schema:

```bash
npm run db:generate
npm run db:push
```

### 5. Run Development Servers

Start both frontend and backend:

```bash
npm run dev
```

Or run individually:

```bash
# Backend API
npm run dev:api

# Frontend
npm run dev:web

# Worker (optional, for background jobs)
npm run worker
```

### 6. Access the Platform

- Frontend: http://localhost:3000
- API: http://localhost:3001
- Prisma Studio: `npm run db:studio`

---

## Usage

### Search for Players

The search accepts multiple formats:

1. Steam Profile URL:
   ```
   https://steamcommunity.com/id/username
   https://steamcommunity.com/profiles/76561198...
   ```

2. SteamID64: `76561198012345678`

3. SteamID32: `STEAM_0:1:12345`

4. Vanity Name: `username`

### Understanding the Risk Score

The Trust Variance score (0-100) is calculated based on weighted red flags:

| Flag | Weight | Trigger Condition |
|------|--------|------------------|
| New Account | +30 | Account < 1 year old |
| Private Profile | +10 | Profile visibility set to private |
| VAC Ban | +40 | Active VAC ban on record |
| Game Ban | +25 | Active game ban on record |
| No Prime | +15 | No Prime status |
| Inconsistent Stats | +25 | High aim (>90) but low positioning (<30) on Leetify |
| High K/D, Low Matches | +20 | K/D > 1.5 with < 50 matches on Faceit |

Risk Levels:
- Low (0-29): Trustworthy player
- Medium (30-49): Some concerns
- High (50-69): Multiple red flags
- Critical (70-100): High-risk account

---

## API Endpoints

### Health Check
```http
GET /health
```

### Get Player Profile
```http
GET /api/profile/:id
```

Parameters:
- `id` - Steam URL, SteamID64, SteamID32, or vanity name

Response:
```json
{
  "success": true,
  "data": {
    "steam": { ... },
    "faceit": { ... },
    "leetify": { ... },
    "risk": {
      "totalScore": 45,
      "level": "medium",
      "flags": [ ... ],
      "calculatedAt": "2026-01-01T12:00:00.000Z"
    }
  },
  "timestamp": "2026-01-01T12:00:00.000Z"
}
```

---

## Development

### Project Structure

```
apps/web/src/
├── components/       # React components
├── pages/           # Next.js pages
└── styles/          # Global styles

apps/api/src/
├── routes/          # API routes
├── services/        # Business logic (Steam, Faceit, etc.)
├── index.ts         # Server entry
└── worker.ts        # BullMQ worker

packages/shared/src/
├── types.ts         # TypeScript interfaces
├── steam-resolver.ts    # Steam ID resolution
└── risk-calculator.ts   # Risk scoring logic
```

### Adding New Risk Flags

Edit `packages/shared/src/risk-calculator.ts`:

```typescript
// Add new flag
if (condition) {
  const weight = 20;
  flags.push({
    flag: 'NEW_FLAG_NAME',
    weight,
    reason: 'Description of why this is risky',
    detected: true
  });
  totalScore += weight;
}
```

### Database Migrations

```bash
# Create migration
npx prisma migrate dev --name your_migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (caution!)
npx prisma migrate reset
```

---

## Docker Commands

```bash
# Start services
npm run docker:up

# Stop services
npm run docker:down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart postgres
docker-compose restart redis
```

---

## Security Notes

1. Never commit API keys - Always use environment variables
2. Rate Limiting - Steam API: 100,000 calls/day; Faceit: varies by plan
3. Cache Strategy - Profiles cached for 5 minutes to reduce API calls
4. Data Privacy - Only public profile data is accessed

---

## Roadmap

- Steam Game Coordinator integration for Premier ratings
- Historical match analysis
- Player comparison tool
- Discord bot integration
- Public API with authentication
- Mobile app (React Native)
- Advanced analytics dashboard

---

## License

This project is for educational purposes only. The author is not responsible for any misuse of this software or any violations of terms of service from third-party platforms.

Ensure compliance with:
- Steam Web API Terms
- Faceit API Terms
- Leetify API Terms

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## Troubleshooting

### "Steam profile not found"
- Verify the Steam API key is valid
- Check if the profile is public
- Ensure the SteamID64 is correct

### Database connection errors
- Confirm PostgreSQL is running: `docker-compose ps`
- Check `DATABASE_URL` in `.env`
- Try resetting: `npm run db:push`

### Redis connection errors
- Verify Redis is running: `docker-compose ps`
- Check `REDIS_HOST` and `REDIS_PORT` in `.env`

### API rate limiting
- Implement exponential backoff
- Increase cache TTL
- Use BullMQ worker for batch processing

---

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

Built with by the Vantage Team

See what they're hiding.

---

## Author

[k6w](https://github.com/k6w)
