# Barid — Daily AI SMS Digest

A free web app that sends you a personalized daily text about news and Islamic updates, powered by Duke's AI Gateway and Twilio.

## How it works

1. **Setup** — Enter your phone and topics, then **Seal & Save**
2. **Automatic scheduling** — Vercel Cron runs once daily at 8:00 AM Texas (Central) time
3. **News fetching** — Pulls headlines from RSS feeds (BBC, Reuters, Al Jazeera, etc.)
4. **AI personalization** — Duke AI Gateway writes a warm, concise daily digest
5. **SMS delivery** — Twilio sends the message to your phone

## Stack (all free tiers)

| Service | Purpose |
|---------|---------|
| Vercel | Host app, API, and built-in cron |
| Duke AI Gateway | Generate personalized messages |
| Twilio | Send SMS (~$15 free trial credit) |
| Upstash Redis | Store settings (10k commands/day free) |

## Setup

### 1. Clone and install

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

- **DUKE_AI_API_KEY** — Get from [Duke AI Dashboard](https://dashboard.ai.duke.edu/api-keys)
- **TWILIO_*** — From [Twilio Console](https://console.twilio.com)
- **CRON_SECRET** — Any random string (e.g. `openssl rand -hex 32`). Vercel sends this automatically to cron invocations.
- **UPSTASH_REDIS_*** — From [Upstash](https://upstash.com) (free tier)

Multi-user settings are stored per phone number in Upstash (`barid:subscriber:+1…`). The daily cron sends to all subscribers.

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Local dev does not run the daily scheduler — deploy to Vercel for automatic delivery.

### 4. Deploy to Vercel

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new)
2. **Framework Preset:** Next.js (auto-detected)
3. **Output Directory:** leave **empty** — do not set `public` (Next.js uses `.next`, not a static `public` build output)
4. Add all env vars from `.env.example`
5. Deploy

If you see *"No Output Directory named public found"*, go to **Project Settings → Build & Development Settings** and clear the **Output Directory** field, then redeploy.

```bash
npx vercel
```

## API endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/settings` | GET/POST | Read/write user settings |
| `/api/test` | POST | Send a test SMS now |
| `/api/send` | POST | Generate + send (requires `CRON_SECRET`) |
| `/api/cron` | GET | Scheduled delivery check (Vercel Cron + `CRON_SECRET`) |

Rate limits (per IP, via Upstash): settings read 60/hr, settings save 15/hr, test SMS 5/hr.

## Security notes

- Never commit API keys or `.env.local`
- Rotate any keys that were shared in chat or logs
- Protect `/api/cron` and `/api/send` with `CRON_SECRET`
