# NostalgiaNet++ — Complete Vercel Deploy Guide (₹0 / Free Tier)

Follow these steps exactly. No prior deploy experience needed.

---

## BEFORE YOU START

You need these free accounts:
1. **GitHub** — [github.com](https://github.com) (sign up if you don't have one)
2. **Vercel** — [vercel.com](https://vercel.com) (sign up with your GitHub account)
3. **Resend** — [resend.com](https://resend.com) (for unlock-day emails — optional but recommended)

Total cost: **$0/month**

**One thing to know:** Vercel's free "Hobby" plan is meant for personal,
non-commercial projects — Vercel's terms don't allow using it for a site
that generates revenue. Your app currently mentions future paid plans
("Keeper $3 / Family $6" starting Jan 2027). That's fine for now since
nothing's actually paid yet — but once you start charging real money,
you'll need to upgrade to a paid Vercel plan (Pro starts around $20/month)
to stay within their terms. Worth keeping in mind, not something to fix today.

---

## STEP 1: Push your code to GitHub

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `nostalgianet`
3. Choose **Private** (or Public if you want it visible)
4. **Don't** add README, .gitignore, or license (we already have them)
5. Click **Create repository**
6. Copy the commands GitHub shows you. They look like this:

```bash
cd /path/to/your/project   # wherever you downloaded/extracted this project
git init
git add .
git commit -m "NostalgiaNet++ — initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nostalgianet.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

If git asks for credentials, use a Personal Access Token (GitHub → Settings → Developer Settings → Personal Access Tokens → Generate new token with `repo` scope).

---

## STEP 2: Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Find your `nostalgianet` repo and click **Import**
3. Vercel auto-detects Next.js — keep all defaults
4. **DON'T click Deploy yet** — we need to set env vars first (Step 3)

---

## STEP 3: Set up a Postgres database (free)

Vercel retired its own managed Postgres in Dec 2024 — databases now come
through the Marketplace (Neon is the closest free equivalent, still $0).

1. In your Vercel project dashboard, click **Storage** tab
2. Click **Connect Database** (or **Create Database**, wording varies)
3. Under **Marketplace Database Providers**, choose **Neon**
4. Follow the prompts, keep the free tier defaults
5. Click **Connect to Project** — this auto-injects `DATABASE_URL` (and
   sometimes `DIRECT_URL`) as env vars
6. You don't need to copy anything manually — it's already set

---

## STEP 4: Set up Vercel Blob (free file storage — CRITICAL)

**This step is non-negotiable.** Without it, uploaded photos will disappear.

1. In Vercel project dashboard, click **Storage** tab again
2. Click **Create Database**
3. Choose **Blob**
4. Name it `nostalgianet-blob`
5. Click **Create**
6. Click **Connect to Project**
7. Vercel auto-injects `BLOB_READ_WRITE_TOKEN` — you don't type anything

---

## STEP 5: Push the database schema

After Steps 3-4, you need to create the tables in Postgres.

1. In your Vercel project, go to **Settings → Environment Variables**
2. Find `DATABASE_URL` — copy its value (starts with `postgres://`)
3. Open a terminal on your computer and run:

```bash
cd /path/to/your/project

# Temporarily set the production DATABASE_URL
export DATABASE_URL="postgres://...paste-the-value-here..."

# Push the schema to create all tables.
# Use whichever you have installed — npm works everywhere,
# bun is faster if you already have it (npm install -g bun).
npx prisma db push --accept-data-loss
# or: bun run db:push

# Create the admin account.
# Option A — set your own email/password (recommended):
export ADMIN_EMAIL="you@example.com"
export ADMIN_PASSWORD="pick-a-strong-password-here"
node scripts/seed-admin.cjs

# Option B — skip the exports above and just run:
#   node scripts/seed-admin.cjs
# This auto-generates a random password and prints it ONCE to your
# terminal. Copy it immediately — it is not saved anywhere.
```

The admin password is never written to any file in this repo. Whatever
you use, log in once and change it via Settings → Change password —
and clear `ADMIN_EMAIL`/`ADMIN_PASSWORD` from your shell history/env
afterward if you set them.

If you see `✓ Created admin account`, you're done with the database.

---

## STEP 6: Set the remaining environment variables

In Vercel project → **Settings → Environment Variables**, add each of these:

### 6a. NEXTAUTH_SECRET (required)
Generate a random secret:
```bash
openssl rand -base64 32
```
Copy the output. In Vercel:
- Name: `NEXTAUTH_SECRET`
- Value: paste the generated string
- Environments: check all (Production, Preview, Development)
- Click **Save**

### 6b. NEXTAUTH_URL (required)
- Name: `NEXTAUTH_URL`
- Value: `https://YOUR_PROJECT_NAME.vercel.app` (replace with your actual Vercel URL — you'll see it after the first deploy. For now, use `https://nostalgianet.vercel.app` or whatever Vercel shows as your project name)
- Environments: Production only
- Click **Save**

### 6c. GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (optional — for Google login)

Skip this if you don't want Google login yet. Users can sign up with email/password.

To enable Google login:
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable Google+ API
3. Go to APIs & Services → Credentials → Create Credentials → OAuth client ID
4. Application type: Web application
5. Authorized redirect URIs:
   - `https://YOUR_PROJECT_NAME.vercel.app/api/auth/callback/google`
6. Copy Client ID and Client Secret
7. In Vercel, add:
   - `GOOGLE_CLIENT_ID` = your client ID
   - `GOOGLE_CLIENT_SECRET` = your client secret

### 6d. RESEND_API_KEY (optional — for unlock-day emails)

Skip this if you don't want email notifications. The app still works without it.

To enable emails:
1. Go to [resend.com](https://resend.com) → sign up → API Keys → Create API Key
2. In Vercel, add:
   - `RESEND_API_KEY` = your API key
   - `EMAIL_FROM` = `onboarding@resend.dev` (pre-verified sender, only sends to your own email)

### 6e. CRON_SECRET (required — for daily unlock checks)
Generate another random string:
```bash
openssl rand -base64 32
```
In Vercel:
- Name: `CRON_SECRET`
- Value: paste the generated string
- Click **Save**

### 6f. PUBLIC_URL
- Name: `PUBLIC_URL`
- Value: `https://YOUR_PROJECT_NAME.vercel.app`
- Click **Save**

---

## STEP 7: Deploy!

1. Go back to your Vercel project dashboard
2. Click **Deploy** (or push a new commit to GitHub — Vercel auto-deploys)
3. Wait 2-3 minutes for the build to finish
4. You'll see a green ✅ when it's live
5. Visit your URL: `https://YOUR_PROJECT_NAME.vercel.app`

---

## STEP 8: Verify everything works

Open your live URL and test:

1. **Sign up** with email/password → should land on dashboard ✓
2. **Create a TimeVault** → upload a photo → seal it → should show in list ✓
3. **Check the photo** → should NOT be broken ✓
4. **Go to Settings** → pick a theme → should change instantly ✓
5. **Click "Rate NostalgiaNet++"** → submit a 5-star review ✓
6. **Sign out** → should go to landing page (NOT localhost) ✓
7. **Sign in as admin** — use whatever `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set (or the auto-generated password printed to your terminal in Step 5) →
   - Should see Admin Panel in sidebar ✓
8. **Go to Admin Panel → Reviews** → approve your review ✓
9. **Go to landing page** → scroll to reviews section → your review should show in the slider ✓

---

## STEP 9: Change the admin password (IMPORTANT!)

1. Sign in as admin with the credentials from Step 5
2. Go to Settings → Change password
3. Enter current password + new password
4. Click Update

---

## STEP 10: Set up Vercel Cron (daily unlock checks)

The `vercel.json` file already declares the cron. After deploy:

1. Go to Vercel project → **Settings → Cron Jobs**
2. You should see `/api/cron/check-unlocks` running daily at 08:00 UTC
3. The cron automatically calls the endpoint with `CRON_SECRET` as Bearer token
4. Test it manually:
```bash
curl "https://YOUR_PROJECT_NAME.vercel.app/api/cron/check-unlocks?secret=YOUR_CRON_SECRET"
```
Should return `{"ok":true,"checked":0,...}`

---

## TROUBLESHOOTING

### Build fails with Prisma error
- Make sure `DATABASE_URL` is set in Vercel env vars (Step 3)
- Make sure you ran `npx prisma db push --accept-data-loss` (or `bun run db:push`) with the production DATABASE_URL (Step 5)
- If you see "provider mismatch", make sure `prisma/schema.prisma` says `provider = "postgresql"`

### Photos disappear after a day
- You skipped Step 4 (Vercel Blob). Go back and set it up.
- The upload route checks for `BLOB_READ_WRITE_TOKEN` — if it's not set, it falls back to base64 (which works but is limited to 2 MB)

### Signout redirects to localhost
- This is already fixed. The code uses `window.location.origin + "/"` which works on any domain.

### Google login doesn't work
- Make sure you set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Vercel env vars (Step 6c)
- Make sure the redirect URI in Google Cloud Console matches your Vercel URL

### "No account found" when trying to login as admin
- You forgot to run `node scripts/seed-admin.cjs` in Step 5
- Run it with the production DATABASE_URL set

### Emails not sending
- You need `RESEND_API_KEY` set in Vercel env vars (Step 6d)
- With `onboarding@resend.dev` as sender, emails only go to YOUR verified email
- To send to anyone, verify your own domain at resend.com/domains

---

## ENVIRONMENT VARIABLES SUMMARY

| Variable | Required? | How to get it |
|----------|-----------|---------------|
| `DATABASE_URL` | YES | Auto-injected by Neon (via Vercel Marketplace, Step 3) |
| `BLOB_READ_WRITE_TOKEN` | YES | Auto-injected by Vercel Blob (Step 4) |
| `NEXTAUTH_SECRET` | YES | `openssl rand -base64 32` (Step 6a) |
| `NEXTAUTH_URL` | YES | `https://YOUR_PROJECT.vercel.app` (Step 6b) |
| `CRON_SECRET` | YES | `openssl rand -base64 32` (Step 6e) |
| `PUBLIC_URL` | YES | `https://YOUR_PROJECT.vercel.app` (Step 6f) |
| `GOOGLE_CLIENT_ID` | Optional | Google Cloud Console (Step 6c) |
| `GOOGLE_CLIENT_SECRET` | Optional | Google Cloud Console (Step 6c) |
| `RESEND_API_KEY` | Optional | resend.com (Step 6d) |
| `EMAIL_FROM` | Optional | `onboarding@resend.dev` (Step 6d) |

---

## COST BREAKDOWN (all free tier)

| Service | Free tier | Your usage |
|---------|-----------|-----------|
| Vercel Hobby | 100 GB bandwidth, 1000 builds | ~5% |
| Neon Postgres (via Marketplace) | ~500 MB storage (free tier) | Plenty |
| Vercel Blob | 1 GB storage | Plenty |
| Vercel Cron | Daily jobs free | 1 job |
| Google OAuth | Free | Free |
| Resend | 3,000 emails/month | Plenty |

**Total monthly cost: $0**
