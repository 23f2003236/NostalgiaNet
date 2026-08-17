# Deploying NostalgiaNet on Vercel (Free Tier)

This guide walks you through deploying NostalgiaNet to Vercel's free tier with all features working.

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free)
- A [GitHub account](https://github.com) to push your code
- A [Google Cloud account](https://console.cloud.google.com) for Google OAuth
- A [Resend account](https://resend.com) for unlock-day emails (3,000 free/month)

## Step 1: Push your code to GitHub

```bash
git init
git add .
git commit -m "NostalgiaNet — initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nostalgianet.git
git push -u origin main
```

## Step 2: Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Vercel auto-detects Next.js — keep defaults
4. **Do not deploy yet** — first set environment variables

## Step 3: Get Google OAuth credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (e.g. "NostalgiaNet")
3. Enable the **Google+ API** (or **People API**)
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
5. Application type: **Web application**
6. Authorized JavaScript origins:
   - `http://localhost:3000` (for dev)
   - `https://YOUR_APP_NAME.vercel.app` (replace with your Vercel domain)
7. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR_APP_NAME.vercel.app/api/auth/callback/google`
8. Copy the **Client ID** and **Client Secret**

## Step 4: Get Resend API key

1. Go to [resend.com/api-keys](https://resend.com/api-keys)
2. Create a new API key
3. (Optional) Verify your own domain at [resend.com/domains](https://resend.com/domains) — otherwise use the pre-verified `onboarding@resend.dev` sender (only sends to your own email)

## Step 5: Generate NEXTAUTH_SECRET

Run this locally and copy the output:

```bash
openssl rand -base64 32
```

## Step 6: Set Vercel environment variables

In your Vercel project dashboard, go to **Settings → Environment Variables** and add:

| Name | Value |
|------|-------|
| `DATABASE_URL` | (See Step 7 below — Vercel Postgres or external Postgres URL) |
| `NEXTAUTH_SECRET` | (your generated secret from Step 5) |
| `NEXTAUTH_URL` | `https://YOUR_APP_NAME.vercel.app` |
| `GOOGLE_CLIENT_ID` | (from Step 3) |
| `GOOGLE_CLIENT_SECRET` | (from Step 3) |
| `RESEND_API_KEY` | (from Step 4) |
| `EMAIL_FROM` | `onboarding@resend.dev` or `noreply@yourdomain.com` |
| `PUBLIC_URL` | `https://YOUR_APP_NAME.vercel.app` |
| `CRON_SECRET` | (generate another `openssl rand -base64 32`) |

## Step 7: Set up the database (free)

### Option A: Vercel Postgres (recommended, free up to 256 MB)

1. In your Vercel dashboard, go to **Storage → Create Database**
2. Choose **Postgres (Serverless)** — free tier
3. After creation, click **Connect to project**
4. Vercel auto-injects `DATABASE_URL` — **BUT** we use Prisma with SQLite locally, so we need to switch to Postgres.

### Switching to Postgres

1. Edit `prisma/schema.prisma` and change the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Run `bun run db:push` locally with the production `DATABASE_URL` to create tables.
3. Commit and push to GitHub. Vercel auto-deploys.

### Option B: Use a free external Postgres (Neon, Supabase)

- [Neon](https://neon.tech): free 0.5 GB Postgres, instant branching
- [Supabase](https://supabase.com): free 500 MB Postgres + auth
- [Turso](https://turso.tech): free 9 GB libSQL (SQLite-compatible, no schema change needed)

Create a database, copy the connection URL, and paste into Vercel's `DATABASE_URL`.

## Step 7b: Set up Vercel Blob storage (CRITICAL — otherwise uploads vanish)

**This step is non-negotiable.** Vercel's serverless filesystem is ephemeral and read-only at runtime except `/tmp`. If you skip this, every uploaded photo will silently disappear on the next cold start or redeploy.

The `/api/upload` route checks for `BLOB_READ_WRITE_TOKEN` at runtime:
- **Present (Vercel + Blob connected):** uploads go to Vercel Blob, persist forever
- **Absent (local dev):** uploads fall back to `public/uploads/` on disk (same as before)

### Setup (one click in Vercel dashboard)

1. In your Vercel project dashboard, go to **Storage → Create Database**
2. Choose **Blob**
3. Click **Connect to project**
4. Done — Vercel auto-injects `BLOB_READ_WRITE_TOKEN` as an env var. **You do not type anything.**

That's it. No env var typing, no code change. The upload route will automatically start using Blob storage on the next deploy.

### Verify it's working after deploy

1. Sign in, create a vault, upload a photo
2. Open browser DevTools → Network → look for the `POST /api/upload` response
3. The returned `url` should start with `https://...public.blob.vercel-storage.com/...` (not `/uploads/...`)
4. If you see `/uploads/...`, the Blob token isn't being injected — recheck Step 7b

## Step 8: Deploy

1. Click **Deploy** in Vercel
2. Wait for the build to finish (~2-3 minutes)
3. Visit your live URL: `https://YOUR_APP_NAME.vercel.app`

## Step 9: Enable Vercel Cron (daily unlock checks)

The `vercel.json` file already declares the cron. After deploy:

1. Go to Vercel project → **Settings → Cron Jobs** — you should see `/api/cron/check-unlocks` running daily at 08:00 UTC
2. The cron calls `/api/cron/check-unlocks` with the `CRON_SECRET` as a Bearer token automatically

## Step 10: Test the full flow

1. Visit your deployed site
2. Sign up with email/password OR click "Continue with Google"
3. Create a TimeVault with a future unlock date
4. Create a Journal entry with mood/weather
5. Visit Friends page, invite someone by email
6. Create a public capsule, visit Discover page to see it
7. Create a photo Album
8. Sign in on another browser/device as a different user and accept the friend invite
9. Share a vault with the new friend — they should see the notification in the bell icon

## Cost breakdown (free tier)

| Service | Free tier | Likely usage |
|---------|-----------|--------------|
| Vercel | 100 GB bandwidth, 1000 builds | ~5% |
| Vercel Postgres | 256 MB | Plenty |
| Vercel Cron | Daily jobs free | 1 job |
| Google OAuth | Free | Free |
| Resend | 3,000 emails/month | Plenty |

**Total monthly cost: $0**

## Troubleshooting

### "signIn() received an undefined result"
Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in Vercel.

### Google OAuth redirect mismatch
Add your exact Vercel domain to authorized redirect URIs in Google Cloud Console.

### Cron not running
Verify `CRON_SECRET` matches in Vercel env. Manually trigger:
```bash
curl "https://YOUR_APP.vercel.app/api/cron/check-unlocks?secret=YOUR_CRON_SECRET"
```

### Emails not sending
- Verify `RESEND_API_KEY` is set
- Check Resend logs at [resend.com/emails](https://resend.com/emails)
- If using `onboarding@resend.dev`, you can only send to your own verified email
- To send to anyone, verify your own domain at resend.com/domains

### Database connection issues
- Vercel Postgres: connection string starts with `postgres://`
- Make sure `provider = "postgresql"` in `prisma/schema.prisma` for production
- Run `bun run db:push` with the prod `DATABASE_URL` once after deploy

### Uploaded photos disappear after a day / after redeploy
- This means Vercel Blob isn't connected (Step 7b was skipped)
- Vercel's filesystem is ephemeral — anything written to `public/uploads/` at runtime is wiped on every cold start or redeploy
- Fix: go to Vercel dashboard → Storage → Create Database → Blob → Connect to project, then redeploy
- The upload route automatically switches to Blob storage when `BLOB_READ_WRITE_TOKEN` is present (no code change needed)

## What works without any external setup

You can run the app **locally** without Google OAuth, Resend, or Postgres — just `bun run dev`. All features work:

- Email/password signup + login (always works)
- "Explore as demo" button (always works)
- Vaults, albums, journals, friends, calendar, share — all work locally
- Google OAuth requires Step 3-6 above
- Email notifications require Step 4 above (otherwise logged to console)
- Cron requires Step 9 above (otherwise hit the endpoint manually)
- **Vercel Blob requires Step 7b above** — otherwise uploaded photos vanish on every redeploy (uses local `public/uploads/` fallback in dev)
