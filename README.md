# ⏳ NostalgiaNet++

**A digital time capsule for the moments that matter.**

Seal your photos, videos, and stories inside a locked vault. Set a future unlock date. Years later, the future-you will thank the present-you.

🔗 **Live app:** [nostalgia-net-silk.vercel.app](https://nostalgia-net-silk.vercel.app)

---

## ✨ What it does

NostalgiaNet++ lets you create **TimeVaults** — sealed digital capsules of photos, videos, and notes that stay locked until a date you choose. Think of it as a letter to your future self, but with media and friends included.

- 🔒 **Seal a vault** with photos/videos and an unlock date — days, months, or years out
- 👥 **Invite friends** to add their own memories to a shared vault before it seals — perfect for trip memories, birthdays, or milestones shared with a group
- 🌐 **Public or private** — share a vault publicly for anyone to discover, or keep it just for you and your friends
- 🔔 **Get notified** the day your capsule unlocks
- 📸 **Albums** for photo collections that don't need a lock date, and a **Journal** for day-to-day reflections
- 🎨 **7 color themes** with light/dark mode, so the app feels like home
- 🔗 **Shareable public links** with auto-generated social preview cards
- 🛡️ **Admin panel** for moderating users, vaults, and reviews

---

## 🧱 Tech stack

| Layer | Tech |
|---|---|
| Framework | [Next.js](https://nextjs.org/) (App Router) + TypeScript |
| Database | [PostgreSQL](https://www.postgresql.org/) via [Neon](https://neon.tech/) |
| ORM | [Prisma](https://www.prisma.io/) |
| Auth | [NextAuth.js](https://next-auth.js.org/) — credentials (bcrypt) + Google OAuth |
| File storage | [Vercel Blob](https://vercel.com/storage/blob) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Hosting | [Vercel](https://vercel.com/) |

Deployed entirely on free tiers — **$0/month** to run.

---

## 🚀 Getting started locally

### Prerequisites
- Node.js 18+ 
- A PostgreSQL database (e.g. free tier on [Neon](https://neon.tech/))

### Setup

```bash
# Clone the repo
git clone https://github.com/23f2003236/NostalgiaNet.git
cd NostalgiaNet

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in DATABASE_URL, NEXTAUTH_SECRET, etc. — see .env for what's required vs optional

# Push the database schema
npx prisma db push

# Run the dev server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Deploying to Vercel

See [`DEPLOY.md`](./DEPLOY.md) for a full step-by-step guide covering:
- Vercel project setup
- Neon Postgres connection
- Vercel Blob storage (required for persistent file uploads)
- Environment variables
- Admin account creation
- Cron setup for unlock notifications

---

## 📁 Project structure

```
src/
├── app/
│   ├── api/              # API routes (vaults, albums, auth, uploads, admin, etc.)
│   ├── discover/         # Public SEO-friendly discovery page
│   ├── v/[id]/           # Public shareable vault pages
│   └── join-vault/[token]/  # Collaborative vault invite pages
├── components/
│   └── nostalgia/        # App-specific UI components
├── lib/                  # Auth config, DB client, email, utilities
prisma/
└── schema.prisma         # Database schema
scripts/
├── seed-admin.cjs        # Create an admin account
└── smoke-test-upload.sh  # Verifies the upload route is alive after deploy
```

---

## 🔐 Security notes

- Passwords are hashed with bcrypt (12 salt rounds)
- Sealed vault content (cover images, memories) is redacted server-side for any viewer who isn't the owner or an invited contributor — enforced across every public and authenticated route
- File uploads are validated by both extension and byte signature, size-capped, and stored via Vercel Blob
- Admin credentials are never hardcoded — generated via environment variables at setup time, never committed to the repo

---

## 🗺️ Roadmap

- [ ] Payment integration for the Premium tier
- [ ] In-app help assistant with real answers
- [ ] More granular invite controls (expiry, revocation)
- [ ] Mobile app

---

## 🤝 Built with

This project was built as a solo, zero-budget effort, developed with the help of AI coding tools for implementation, and reviewed for architecture, security, and correctness along the way.

---

## 📄 License

This project is currently unlicensed / all rights reserved. If you'd like to use or reference this project, please reach out first.
