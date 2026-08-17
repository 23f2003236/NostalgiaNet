# Publishing NostalgiaNet++ from z.ai vs. Vercel

## Quick answer: Can you publish from z.ai's top-right "Publish" button?

**Yes, but with important caveats about the database.**

### What "Publish" from z.ai does
- Packages your Next.js app and deploys it to a preview URL
- Gives you a shareable link like `https://preview-<bot-id>.space-z.ai/`
- The app runs with the SAME SQLite database file (`db/custom.db`) that exists in your project

### ⚠️ Critical limitation: the database is NOT shared
The SQLite database lives at `db/custom.db` inside your project folder. When you publish from z.ai:
- **The preview URL uses a copy of your local database at publish time**
- New signups on the preview URL are saved to that preview's ephemeral database
- They are **NOT visible** in your local dev environment's database
- And vice versa — users who signed up locally won't appear on the published preview

### What you CAN see after publishing from z.ai
- The full app UI — all features work (themes, upload, vaults, etc.)
- Signups that happen ON the preview URL (stored in that preview's DB)
- But only until the preview is refreshed/redeployed (ephemeral)

### What you CANNOT see from z.ai publish
- Your local dev users (different database)
- Persistent data across redeploys (z.ai preview is ephemeral)
- Real Google OAuth (needs real GOOGLE_CLIENT_ID env var, not a placeholder)
- Real email sending (needs RESEND_API_KEY)
- File uploads won't persist (z.ai filesystem is ephemeral, just like Vercel — needs Vercel Blob)

---

## The proper way: Deploy to Vercel (recommended)

Follow `DEPLOY.md` in your project root. This gives you:
- **Persistent PostgreSQL database** (Vercel Postgres free tier, 256 MB)
- **Persistent file uploads** (Vercel Blob, auto-injected)
- **Real Google OAuth** (set GOOGLE_CLIENT_ID)
- **Real email notifications** (set RESEND_API_KEY)
- **Daily cron for unlock notifications** (Vercel Cron)
- **Your admin panel works** (create your own admin credentials via `scripts/seed-admin.cjs` — see DEPLOY.md Step 5)

### Admin access on Vercel
Once deployed, sign in with whatever `ADMIN_EMAIL` / `ADMIN_PASSWORD` you
set when running `scripts/seed-admin.cjs` (or the auto-generated password
it prints, if you didn't set one). Full instructions in `DEPLOY.md` Step 5.

You'll see the "Admin Panel" in the sidebar. From there you can:
- See all users who signed up
- See all vaults and their memories
- Delete any user, vault, or individual photo
- View stats (total users, vaults, memories, etc.)

**⚠️ Change the admin password after first deploy!**
The password is in `scripts/seed-admin.cjs`. After deploying, either:
1. Change the password in that file and re-run `node scripts/seed-admin.cjs`, OR
2. Better: sign in once, then change the password via the Settings page (once we add password change)

---

## Summary table

| Feature | z.ai Publish | Vercel Deploy |
|---------|-------------|---------------|
| App UI works | ✅ | ✅ |
| Signups visible | ⚠️ Ephemeral (lost on redeploy) | ✅ Persistent (Postgres) |
| File uploads persist | ❌ Ephemeral | ✅ Vercel Blob |
| Google OAuth | ❌ Needs env vars | ✅ Set env vars |
| Email notifications | ❌ Needs env vars | ✅ Set env vars |
| Admin panel | ✅ (on preview) | ✅ (persistent) |
| Cron (unlock checks) | ❌ | ✅ Vercel Cron |
| Custom domain | ❌ | ✅ |
| Cost | Free | Free (hobby tier) |

**Recommendation:** Use z.ai publish for quick demos/previews. Use Vercel for the real production deploy where data persists.
