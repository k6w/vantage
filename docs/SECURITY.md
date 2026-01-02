# API Security Implementation

This document explains the security architecture that keeps your Steam, Faceit, and Leetify API keys secure and prevents them from being exposed to users' browsers.

## Architecture Overview

```
Client Browser (No API Keys)
     ↓
Next.js Frontend (Public Pages)
     ↓
Next.js API Routes (Server-side .env)
     ↓ [X-Steam-Api-Key, X-Faceit-Api-Key, X-Leetify-Api-Key Headers]
Backend API
     ↓
External APIs (Steam, Faceit, Leetify)
```

## Security Features

### 1. Server-Side API Key Storage

**How it works**:
- API keys stored in `.env` file (server-side only)
- Next.js API routes read keys from environment variables
- Keys are added to request headers when calling backend
- Browser never sees or has access to API keys

**Why it's secure**:
- `.env` file never deployed to browser
- No `NEXT_PUBLIC_*` prefix = not exposed to client
- Keys only exist in Node.js server memory
- Users can't inspect or extract keys from browser

### 2. Next.js API Routes as Proxy

**Purpose**: Act as a secure intermediary between frontend and backend.

**Implementation**:
- Frontend makes requests to `/api/*` endpoints (local to Next.js)
- Next.js API routes (server-side) read API keys from `.env`
- Requests forwarded to backend with keys in headers
- Backend extracts keys from headers and calls external APIs
- Responses returned to client (without exposing keys)

**Routes**:
- `/api/profile/[...profilePath]` - All profile-related requests
- `/api/matches/[...matchPath]` - All match-related requests
- `/api/stats` - Stats endpoint

### 3. Environment Variables

**Single `.env` file at project root**:
```bash
# External API Keys (NEVER use NEXT_PUBLIC_ prefix)
STEAM_API_KEY="your_steam_key"
FACEIT_API_KEY="your_faceit_key"
LEETIFY_API_KEY="your_leetify_key"

# Backend configuration
API_PORT=3001
API_HOST="localhost"
BACKEND_API_URL="http://localhost:3001"

# Database & Redis
DATABASE_URL="postgresql://..."
REDIS_HOST="localhost"
REDIS_PORT=6379
```

**Important**: 
- ❌ Never use `NEXT_PUBLIC_` prefix for API keys (exposes to browser)
- ✅ Backend and Next.js both read from same `.env` file
- ✅ Keys are only accessible server-side

## Setup Instructions

### 1. Configure Environment Variables

Copy the example file:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```bash
STEAM_API_KEY="your_actual_steam_key"
FACEIT_API_KEY="your_actual_faceit_key"
LEETIFY_API_KEY="your_actual_leetify_key"
```

Get your API keys from:
- **Steam**: https://steamcommunity.com/dev/apikey
- **Faceit**: https://developers.faceit.com/
- **Leetify**: Contact Leetify for API access

### 2. Start Services

```bash
# Start backend and frontend together
npm run dev

# Or separately:
cd apps/api && npm run dev    # Backend on :3001
cd apps/web && npm run dev    # Frontend on :3000
```

### 3. Verify Setup

**Test frontend** (keys automatically included):
- Visit http://localhost:3000
- Search for a profile
- Should work without any additional configuration

**Check browser console**:
- Open DevTools → Network tab
- Search for a profile
- Click on API requests
- Verify NO API keys visible in request headers or payload

## Security Benefits

✅ **API Keys Never Exposed**: Steam, Faceit, and Leetify keys stay on server  
✅ **No Browser Access**: Keys only in Node.js server memory, never in browser  
✅ **Simple Setup**: One `.env` file with all configuration  
✅ **Rate Limiting Preserved**: All existing security features work  
✅ **Production Ready**: Industry-standard security practices  

## Testing

### Verify API Keys Are Hidden

1. **Open browser DevTools** (F12)
2. **Go to Network tab**
3. **Search for a profile** on http://localhost:3000
4. **Click on any API request** to `/api/profile` or `/api/matches`
5. **Check Headers tab** - You should NOT see:
   - `X-Steam-Api-Key`
   - `X-Faceit-Api-Key`
   - `X-Leetify-Api-Key`
6. **Check Response** - Should contain profile data

### Test Backend Directly (Optional)

Backend accepts API keys in headers:
```bash
curl -H "X-Steam-Api-Key: YOUR_KEY" \
     -H "X-Faceit-Api-Key: YOUR_KEY" \
     -H "X-Leetify-Api-Key: YOUR_KEY" \
     http://localhost:3001/api/profile/76561198012345678
```

### Test Without Keys (Should Fail)

Backend will use fallback from `.env`, but if not set:
```bash
curl http://localhost:3001/api/profile/76561198012345678
# Should return error: "STEAM_API_KEY required"
```

## Production Deployment

### Environment Variables Checklist

**Single `.env` file (or platform environment variables)**:
- [ ] `STEAM_API_KEY` - Your Steam API key
- [ ] `FACEIT_API_KEY` - Your Faceit API key  
- [ ] `LEETIFY_API_KEY` - Your Leetify API key
- [ ] `DATABASE_URL` - Production database URL
- [ ] `REDIS_HOST` - Production Redis host
- [ ] `REDIS_PORT` - Redis port (default: 6379)
- [ ] `API_PORT` - Backend port (e.g., 3001)
- [ ] `API_HOST` - Backend host (e.g., 0.0.0.0)
- [ ] `BACKEND_API_URL` - Full backend URL (e.g., https://api.yourdomain.com)
- [ ] `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` - reCAPTCHA site key (public, safe to expose)
- [ ] `RECAPTCHA_SECRET_KEY` - reCAPTCHA secret (keep private)

**Never set as NEXT_PUBLIC_***:
- ❌ `STEAM_API_KEY`
- ❌ `FACEIT_API_KEY`
- ❌ `LEETIFY_API_KEY`
- ❌ `RECAPTCHA_SECRET_KEY`
- ❌ `DATABASE_URL`

**Platform-Specific Notes**:

**Vercel**:
- Set all environment variables in project settings
- Both backend and frontend read from same environment
- Automatic deployments on push

**Railway/Render**:
- Set variables in service environment
- Ensure backend service is accessible via `BACKEND_API_URL`

**Docker**:
- Use `.env` file or `docker-compose.yml` environment section
- Mount `.env` file to containers if needed

## Troubleshooting

### Frontend shows "API key required" error

**Problem**: Next.js can't find API keys in environment.

**Solution**:
1. Verify `.env` file exists in project root
2. Check `STEAM_API_KEY`, `FACEIT_API_KEY`, `LEETIFY_API_KEY` are set
3. Restart Next.js dev server (`npm run dev:web`)
4. Ensure no `NEXT_PUBLIC_` prefix on API keys

### Backend returns "STEAM_API_KEY required"

**Problem**: Backend can't find API keys.

**Solution**:
1. Check `.env` file in project root
2. Verify backend is reading from correct `.env` path
3. Restart backend service (`npm run dev:api`)
4. Check backend logs for environment loading

### API keys visible in browser

**Problem**: Keys accidentally exposed with `NEXT_PUBLIC_` prefix.

**Solution**:
1. Remove `NEXT_PUBLIC_` prefix from ALL API keys
2. Rebuild: `npm run build`
3. Clear browser cache
4. Restart services

### External API calls failing

**Problem**: Steam/Faceit/Leetify returning errors.

**Solution**:
1. Verify API keys are valid and active
2. Check API key quotas haven't been exceeded
3. Test keys directly with curl
4. Review backend logs for specific API errors

## Code Changes Summary

### Backend Changes
- 🔧 Modified `apps/api/src/services/steam.ts` - Accept API key as parameter
- 🔧 Modified `apps/api/src/services/faceit.ts` - Accept API key as parameter
- 🔧 Modified `apps/api/src/services/leetify.ts` - Accept API key as parameter
- 🔧 Modified `apps/api/src/routes/profile.ts` - Extract API keys from headers
- 🔧 Modified `apps/api/src/routes/matches.ts` - Extract API keys from headers

### Frontend Changes
- ✨ Added `apps/web/src/pages/api/profile/[...profilePath].ts` - Profile proxy with API keys
- ✨ Added `apps/web/src/pages/api/matches/[...matchPath].ts` - Matches proxy with API keys
- ✨ Added `apps/web/src/pages/api/stats.ts` - Stats proxy
- 🔧 Modified `apps/web/src/pages/index.tsx` - Use proxy routes
- 🔧 Modified `apps/web/src/pages/profile/[id].tsx` - Use proxy routes
- 🔧 Modified `apps/web/src/components/MatchHistory.tsx` - Use proxy routes

### Configuration Changes
- 🔧 Updated `.env.example` - Simplified configuration, removed internal API key

## How It Works

1. **User visits website** → Frontend loads in browser (no keys)
2. **User searches for profile** → Frontend calls `/api/profile/steamid`
3. **Next.js API route** → Reads keys from `.env` (server-side)
4. **Adds headers** → `X-Steam-Api-Key`, `X-Faceit-Api-Key`, `X-Leetify-Api-Key`
5. **Calls backend** → `http://localhost:3001/api/profile/steamid` with headers
6. **Backend extracts keys** → From request headers
7. **Calls external APIs** → Steam, Faceit, Leetify with user's keys
8. **Returns data** → Through Next.js → To browser (no keys exposed)

## Security Guarantees

✅ API keys stored in `.env` file (never committed to git)  
✅ Keys only accessible in Node.js server environment  
✅ No keys in browser JavaScript or HTML  
✅ No keys in API request/response payloads visible to users  
✅ Keys not in environment variables with `NEXT_PUBLIC_` prefix  
✅ Frontend users cannot extract, view, or steal keys  

## Questions?

**Q: Where are the API keys stored?**  
A: In the `.env` file at the project root. Both backend and Next.js read from this file.

**Q: Can users see my API keys?**  
A: No. Keys are only accessible server-side in Node.js. Browser never receives them.

**Q: Do I need different .env files for backend and frontend?**  
A: No. Both read from the same `.env` file in the project root.

**Q: What if I deploy to Vercel/Railway/etc?**  
A: Set the same environment variables in your platform's settings. Both services will read from there.

**Q: Can I use different keys for different users?**  
A: Not currently. All users share the same API keys from your `.env` file.

**Q: What about rate limiting?**  
A: All existing rate limiting and anti-spam protection continues to work as before.

For more help, see:
- [api.md](api.md) - API documentation
- [README.md](../README.md) - General setup guide
