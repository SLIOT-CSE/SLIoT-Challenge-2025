# SLIoT Challenge website

The official website of the SLIoT Challenge, the annual IoT competition organized by the Department of Computer Science & Engineering, University of Moratuwa, with SLT-MOBITEL and IESL.

Built with Next.js (App Router), React 19, Tailwind CSS 4 and Framer Motion, written in TypeScript (strict).

## Requirements

- Node.js 20.9 or later
- pnpm (the version is pinned in `package.json` under `packageManager`; run `corepack enable` once and it is picked up automatically)

## Local development

```bash
pnpm install
pnpm dev
```

The site runs at http://localhost:3000.

Other scripts:

| Command | What it does |
|---|---|
| `pnpm build` | Production build into `.next/` |
| `pnpm start` | Serve the production build (port 3000, or `PORT`) |
| `pnpm lint` | ESLint (Next.js + TypeScript rules) |
| `pnpm typecheck` | TypeScript check without building (`tsc --noEmit`) |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm db:migrate` | Apply database migrations (`./data/sliot.db` in development, `DATABASE_PATH` otherwise) |
| `pnpm db:seed` | Development only: wipe the local database and fill it with 20 test teams; prints the logins |
| `pnpm db:generate` | Write a migration after changing `src/server/db/schema.ts` |
| `pnpm db:studio` | Browse the database |
| `pnpm admin:create <user> "<Name>" [super_admin\|admin]` | Create an organizer account; prints its generated password once |
| `pnpm email:dev` | Preview the email templates (port 3200) |

### Database and settings

The app stores everything in one SQLite file: `./data/sliot.db` in development (created and migrated on first use), `DATABASE_PATH` in production. For test data, run `pnpm db:seed`. It writes 20 teams in the prototype round and prints the organizer logins and team codes. The test-data switcher in the corner of `/register`, `/team` and `/admin` (development only) moves the competition clock, signs in as any team or organizer, and reseeds.

Outside services are configured with environment variables, listed with notes in `.env.example`. Copy it to `.env.local` in development, or to `/etc/sliot/sliot.env` linked as `.env.production.local` on the server. Until a service's variables are set:

- **Email (SMTP):** emails wait in the outbox as pending.
- **Drive (OAuth):** proposal uploads are refused with a clear message.
- **Sheets:** the export button explains, and the CSV download still works.
- **Turnstile:** the registration form shows a placeholder (development only).

Production refuses to start without email, Drive and Turnstile.

## Project layout

The 2027 site is a single scrolling page (see `docs/workload.md` for progress). Registration, the team portal and the admin dashboard come next.

```
src/
  app/                Routes (App Router)
    layout.tsx        Root layout: fonts, metadata, smooth scroll
    page.tsx          The one-page site (new 2027 sections)
    globals.css       Tailwind 4 theme (2027 tokens in @theme) and site-wide CSS
    fonts.ts          next/font setup (Bebas Neue + Montserrat)
    design-system/    Dev-only reference pages (tokens, contrast, callout states, prizes preview); 404 in production
  components/
    site/             The page's sections (nav, hero, callout, about, categories, timeline, prizes, memories, partners, FAQ, contact, footer)
    ui/               Primitives (button, field, input)
    HeroFigure.tsx    The SLIoT figure (cut edges must sit on an edge or fade out)
  content/            All copy and data for the page (see the table below)
  lib/
    competition.ts    Competition stage and countdowns from the key dates
    motion/           GSAP + ScrollTrigger, Lenis provider, reduced-motion hook, eases
    utils.ts          cn() class-name helper (knows the custom token names)
public/images/        All site images, served as-is
docs/                 architecture.md, frontend-plan.md, workload.md
deploy/               Server configuration examples
ecosystem.config.cjs  PM2 process definition
```

## Branches and deploys

Every push to `main` deploys to sliot.cse.mrt.ac.lk. The rebuild happens on the `full-site` branch, which must not be merged into `main` until launch (step Y in `docs/workload.md`).

## Updating content

| What | Where |
|---|---|
| Edition name, site title, description, hero copy, kinetic band words | `src/content/site.ts` |
| Navigation sections | `src/content/navigation.ts` |
| Social channels (WhatsApp first) | `src/content/socials.ts` |
| Key dates (live callout, hero chip, timeline, FAQ) and the proposal template link | `src/content/deadlines.ts` |
| Timeline events (sessions, workshops) | `src/content/timeline.ts` |
| About beats | `src/content/about.ts` |
| Categories and team rules | `src/content/categories.ts`, `src/lib/team-rules.ts` |
| "How to take part" steps | `src/content/steps.ts` |
| Prize amounts (null shows "TBA") and special awards | `src/content/prizes.ts` |
| Photo albums for Memories | `src/content/memories.ts` (files in `public/images/gallery/<folder>/`, numbered 1..n) |
| FAQ | `src/content/faq.ts` |
| Contact people, address, partners and tiers | `src/content/people.ts` |
| Colours, type scale, motion tokens | `@theme` blocks in `src/app/globals.css` (check `/design-system` in development) |

Placeholders that still need real 2027 content are marked `TODO(2027)` in the code.

### Images

Put image files in `public/images/` and reference them by path, usually through an export in `src/assets/index.ts`.

### Memories photos

Copy an event's photos into `public/images/gallery/<folder>/`, numbered `1.jpg`, `2.jpg`, ... with no gaps, then add an album (event name, folder, count, extension) to the right edition in `src/content/memories.ts`.

## Deployment

Pushing to `main` deploys automatically through `.github/workflows/deploy.yml` on the self-hosted runner in `/var/www/sliot/SLIoT-Challenge-2025`:

1. `git reset --hard origin/main`
2. `pnpm install --frozen-lockfile`
3. `pnpm build`
4. `pm2 reload ecosystem.config.cjs`
5. Health check on `http://127.0.0.1:3000/`

The Next.js server listens on `127.0.0.1:3000` and nginx proxies public traffic to it. See `deploy/nginx.conf.example`.

### One-time server setup

```bash
# Node.js 20.9+ and PM2
npm install -g pm2

# In /var/www/sliot/SLIoT-Challenge-2025, after the first successful build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # prints a sudo command: run it so PM2 runs as a systemd service and starts on boot
```

Start PM2 from an SSH session or systemd, never only from a workflow run. The self-hosted runner kills the processes a job started when the job ends, which takes the site down (502) right after a "successful" deploy. The workflow's restart step clears `RUNNER_TRACKING_ID` so the processes it reloads are left alone.

Then update the nginx site: replace the location that served the old `dist/` folder with the proxy blocks from `deploy/nginx.conf.example`, keep the existing redirect locations, and reload nginx (`sudo nginx -t && sudo systemctl reload nginx`).
