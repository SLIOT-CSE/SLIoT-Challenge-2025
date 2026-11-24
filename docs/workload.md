# SLIoT Challenge 2027: Workload

Every step of the project from A to Z, split into substeps. Last updated 2026-11-24.

- `[x]` done · `[ ]` to do · **(now)** in progress
- Details live in [architecture.md](architecture.md) (backend, security, backups) and [frontend-plan.md](frontend-plan.md) (design, sections, screens).
- Work happens on the `full-site` branch. Every push to `main` deploys to sliot.cse.mrt.ac.lk, and the coming-soon teaser is being removed, so **`full-site` must not be merged into `main` until step Y (launch)**.

## Progress at a glance

| Step | What | Status                        |
|---|---|-------------------------------|
| A | Planning and architecture | Done                          |
| B | Vite → Next.js migration | Done                          |
| C | Production deployment | Done (two server checks open) |
| D | Coming-soon page | Done (removed in H)           |
| E | TypeScript migration | Done                          |
| F | Tailwind CSS 4 upgrade | Done                          |
| G | Design foundations | Done                          |
| H | Remove coming-soon mode | Done                          |
| I | Sections 1: nav, hero, live callout, kinetic band | Done                          |
| J | Sections 2: about map, categories, how to take part | Done                          |
| K | Sections 3: timeline, prizes | Done                          |
| L | Sections 4: memories, sponsors, FAQ, contact, footer | Done                          |
| M | Sample-data layer for the app screens | Done                          |
| N | Registration screen (`/register`) | Done                          |
| O | Team portal screens (`/team`) | Done                          |
| P | Admin dashboard screens (`/admin`) | To do                         |
| Q | Frontend polish and verification | To do                         |
| R | Accounts and access (department) | To do                         |
| S | Database layer | To do                         |
| T | Email system | To do                         |
| U | Registration and team portal backend | To do                         |
| V | Admin and shortlisting backend | To do                         |
| W | Security hardening | To do                         |
| X | Backups and operations | To do                         |
| Y | Testing, content and launch | To do                         |
| Z | After launch | To do                         |

---

## A. Planning and architecture

- [x] A1. Write `PRODUCT.md` (users, purpose, brand personality, anti-references, design principles)
- [x] A2. Agree the full-site architecture in `docs/architecture.md`: stack, data model, flows, email, security, backups (decisions D1–D15)
- [x] A3. Agree team rules: 1–5 members, leader is member 1, School / University / Open, one team per person, NIC for university students
- [x] A4. Study reference sites (hackX, SpiritX, MoraXtreme) and agree the frontend plan in `docs/frontend-plan.md`
- [x] A5. Create this workload file

## B. Vite → Next.js migration

- [x] B1. Move Vite + React 18 to Next.js 16 (App Router, Turbopack), React 19, pnpm 11
- [x] B2. Routes in `src/app/`, views in `src/views/`, fonts via `next/font`, images in `public/images`
- [x] B3. Match the old site exactly (parity screenshots against the Vite production build)
- [x] B4. Fix the globe NaN warning (`pointsData([])`)

## C. Production deployment

- [x] C1. PM2 process `sliot-web` (`ecosystem.config.cjs`, `next start --hostname 127.0.0.1`, port 3000)
- [x] C2. nginx example config (`deploy/nginx.conf.example`)
- [x] C3. GitHub Actions deploy on push to `main` (self-hosted runner, health check)
- [x] C4. Fix the post-deploy 502 (`RUNNER_TRACKING_ID=""` before the PM2 restart; PM2 as a systemd service)
- [ ] C5. Confirm on the server: `systemctl is-enabled pm2-hpc-16; systemctl is-active pm2-hpc-16`
- [ ] C6. Confirm the latest deploy's "Complete job" log no longer lists "Terminate orphan process"

## D. Coming-soon page

- [x] D1. Aurora theme teaser: glass card over a blurred mock of the site, Bebas Neue + Montserrat
- [x] D2. SLIoT hero figure, social links (WhatsApp channel first), one-screen layout at every size
- [x] D3. Verified at 11 viewports, reduced motion and contrast; deployed and live
- [x] D4. Superseded: removed in step H (decision 2026-11-23)

## E. TypeScript migration

- [x] E1. TypeScript 6.0 (strict), `tsconfig.json`, type packages, `pnpm typecheck`
- [x] E2. All 52 source files renamed and typed (206 errors fixed); `next.config.ts`, `eslint.config.ts`, `site.ts`
- [x] E3. TypeScript ESLint rules on, `allowJs` off
- [x] E4. Screenshots identical to the old build in both modes

## F. Tailwind CSS 4 upgrade

- [x] F1. Theme moved into `@theme` in `globals.css`; `tailwind.config.js` removed
- [x] F2. Height breakpoints as `@custom-variant`; `@tailwindcss/postcss`, `tw-animate-css`, `tailwind-merge` v3
- [x] F3. `prizes.scss` → plain CSS; `sass` removed; shadcn set up for Tailwind 4
- [x] F4. Fixed the v4 behaviour changes (unlayered reset, line heights, newly active classes, container)
- [x] F5. Screenshots identical to the old build in both modes

## G. Design foundations

- [x] G1. 2027 tokens: colours (abyss … foam, haze, edge, success, warning, danger), type scale, eases, radii, shadows, z-index utilities
- [x] G2. Montserrat 700; `font-display` / `font-body`
- [x] G3. Motion helpers in `src/lib/motion/` (GSAP + ScrollTrigger + `useGSAP`, Lenis provider, reduced-motion hook, eases)
- [x] G4. `framer-motion` → `motion`, `@studio-freight/lenis` → `lenis`
- [x] G5. `Button`, `Field`, `Input`, `Textarea` primitives; `cn()` taught the custom token names
- [x] G6. Dev-only `/design-system` page: all 26 colour pairs pass WCAG 2.2 AA

## H. Remove coming-soon mode

- [x] H1. Delete the teaser: `src/views/ComingSoon.tsx`, `src/components/coming-soon/`, its CSS (`cs-*` classes and colour aliases), `og-coming-soon.jpg`
- [x] H2. Remove the `COMING_SOON` flag, its redirects in `next.config.ts` and its branches in `page.tsx`, `layout.tsx`, `not-found.tsx`
- [x] H3. Keep what the new site reuses: `HeroFigure`, the figure glow and edge-fade styles, the social links list (moves to `src/content/`)
- [x] H4. `/` renders the new sections only; old 2025 components stay unused until step L deletes them; new themed 404 page
- [x] H5. Update README and `PRODUCT.md` (no coming-soon mode any more)

## I. Sections 1: nav, hero, live callout, kinetic band

- [x] I1. Content files: `src/content/site.ts` (edition, hero copy, band words), `navigation.ts`, `socials.ts`, `deadlines.ts`; stage logic in `src/lib/competition.ts`
- [x] I2. Floating pill nav: active section indicator, Team login + Register, hide on scroll down, full-screen phone menu with focus trap
- [x] I3. Hero: figure and title, assembling load sequence, live "next deadline" chip, aurora background, parallax on scroll
- [x] I4. Live round callout that changes with the competition stage (seven states, previewable at `/design-system/callouts`), driven by sample dates in `src/content/deadlines.ts`
- [x] I5. Kinetic band (single marquee reacting to scroll velocity)
- [x] I6. Phone layouts (title and Register button on the first screen down to 320px), reduced-motion versions, screenshots for review

## J. Sections 2: about map, categories, how to take part

- [x] J1. SVG outline of Sri Lanka (Natural Earth 1:10m, generated into `island-map/geometry.ts`) with 25 district nodes and signal lines to the University of Moratuwa
- [x] J2. About: pinned three-beat story on desktop; coastline draws, nodes light up, editions count up; phone version plays once
- [x] J3. Categories: sticky list + swapping card stack (School / University / Open with team rules)
- [x] J4. How to take part: five numbered steps on a circuit trace with a travelling pulse; proposal template download
- [x] J5. Remove the three.js globe and its packages (`three`, `@react-three/fiber`, `drei`, `three-globe`)
- [x] J6. Phone layouts, reduced-motion versions, screenshots for review

## K. Sections 3: timeline, prizes

- [x] K1. Timeline: pinned sideways scroll on desktop with huge dates, rail, scroll progress bar and "You are here"; vertical on phones and with reduced motion; skip link
- [x] K2. Timeline key dates read from `src/content/deadlines.ts` (sessions and workshops are sample dates, `TODO(2027)`)
- [x] K3. Prizes: category tabs, podium (2nd, 1st raised, 3rd) rising in, counting-up amounts ("TBA" until set; preview with sample figures at `/design-system/prizes`), special awards row (hidden while empty)
- [x] K4. Phone layouts, reduced-motion versions, screenshots for review

## L. Sections 4: memories, sponsors, FAQ, contact, footer (waiting for review)

- [x] L1. Memories: tilted photo wall that straightens on scroll, edition tabs, full-screen photo viewer (keyboard and swipe); phone strips
- [x] L2. Sponsors: organizers then partner tiers, logos in their own colours
- [x] L3. FAQ: grouped accordion with the figure; answers searchable with Ctrl+F
- [x] L4. Contact: organizer cards (photo or initials), email, WhatsApp, address, socials
- [x] L5. Footer: description, credit, socials, section links, back to top with progress ring (privacy link added with the privacy notice in Y4)
- [x] L6. Deleted the old pages (`/guidelines`, `/faqs`, `/finalists`, `/innovation-tour`, `/session_1`), old components, views and constants, `robot.png`, the old theme colours and the five old fonts; removed `scroll-lock`
- [x] L7. Full-page screenshots at all sizes for review

## M. Sample-data layer for the app screens (waiting for review)

- [x] M1. zod schemas in `src/lib/schemas/` (team, member, NIC, WhatsApp number, proposal, prototype link), shared with the backend later
- [x] M2. Sample data generator: 20 teams (7 School, 8 University, 5 Open) with Sri Lankan names, schools and universities, every team stage, fixed seed; fake emails (`@example.lk`) and NICs (`2099…`)
- [x] M3. Data-access functions in `src/lib/data/` backed by sample data (same signatures the backend will implement); writes return a `Result` with the field or member to fix
- [x] M4. In-session sample store (`sessionStorage`) so flows can be clicked through end to end
- [x] M5. Development-only switcher (`src/components/dev/sample-switcher.tsx`): competition stage, shortlist draft/finalised, log in as a sample team, reset. Mounted by `src/app/(app)/layout.tsx` for `/register`, `/team` and `/admin`; preview at `/design-system/sample-data`
- [x] M6. Vitest set up (`pnpm test`); tests for schemas, team codes, the generator and the data-layer rules (155 in total after step N, including the form logic)

## N. Registration screen (`/register`) (waiting for review)

- [x] N1. Step 1, team: name, category tiles (`?category=` from the home page preselects)
- [x] N2. Step 2, institution: school name, or university dropdown + Other (skipped for Open)
- [x] N3. Step 3, members: leader card + add up to 5; WhatsApp, email, NIC for university students; per-member institution for Open
- [x] N4. Step 4, review (read-only summary with Edit links and a "Back to review" shortcut), Turnstile placeholder; no consent checkbox (removed by decision)
- [x] N5. Success screen with the team code reveal and copy button
- [x] N6. Every state: closed (not yet open, closed), submitting, field errors from the server, duplicate email or NIC (names the member and field), network error (new "Simulate network errors" toggle in the dev switcher)
- Code: `src/components/register/` (form logic in `form.ts` with tests), `src/components/app/app-header.tsx`, `src/components/ui/select.tsx`, route `src/app/(app)/register/page.tsx`
- Not done here: the real Turnstile check and honeypot handling on the server (U1); `/team` link on the success screen 404s until step O

## O. Team portal screens (`/team`) (waiting for review)

- [x] O1. Code login (`SL27-` prefix, formatted as you type, a pasted full code is trimmed) and "Forgot your code?" (same reply for any email); states: wrong code, short code, too many tries (live countdown), network error
- [x] O2. Dashboard: status tracker (Registered → Proposal → Shortlist → Prototype → Finals; a not-shortlisted team stops at Shortlist; phones show only the current label), team card (code with copy button, members, no NIC or contacts), shortlisted and finalist banners, Log out
- [x] O3. Proposal panel: drag-and-drop PDF zone with a specific message per mistake (not a PDF, empty, over 10 MB, not really a PDF), real progress with Cancel, current version and earlier versions, live countdown, lock after the deadline or once decided, "upload failed, try again" and server-refusal states
- [x] O4. Prototype panel: waiting (shortlist date), not shortlisted (kind message, no form), open (YouTube link with thumbnail preview, replace until the deadline), closed, finalist (read-only)
- [x] O5. Every state from the demo switcher checked in the browser (stage × team × shortlist); phone and desktop layouts
- [x] O6. Added during step O: **finalist stage** (`finalist` team stage, `announceFinalists`, `unmarkFinalists`, finalist email, sample finalists), **upload progress and abort** (`uploadProposal(upload, { onProgress, signal })`), **login and reminder rate limit** (5 per 15 minutes, `rate_limited` with `retryAfterSeconds`)
- Code: `src/components/team/` (logic in `portal.ts` with tests), route `src/app/(app)/team/page.tsx`
- Not done here: the real upload over XMLHttpRequest (U3), the YouTube oEmbed check (U4), the real rate limit (U2); no admin screen for finalists yet (P4b)

## P. Admin dashboard screens (`/admin`)

- [ ] P1. Login screen and app shell with role-based sidebar
- [ ] P2. Teams table (20 sample rows): sort, filter, search, columns, expandable members; CSV and Sheets buttons
- [ ] P3. Team detail drawer with history, audit trail and edit mode
- [ ] P4. Shortlist page: draft marks, bulk tick, summary bar, finalise (type FINALISE), reopen, history
- [ ] P4b. Finalists page (super admins): tick teams that submitted a prototype, "Announce finalists" (type FINALISTS), un-mark to correct, uses `announceFinalists` and `unmarkFinalists`
- [ ] P5. Settings (deadlines in Sri Lanka time), admin accounts (generated password shown once), audit log
- [ ] P6. Loading skeletons, empty states, errors, "Sample data" badge

## Q. Frontend polish and verification

- [ ] Q1. Playwright screenshots at the 11 viewports: no overflow, clipping or overlap
- [ ] Q2. Reduced-motion run of every scene
- [ ] Q3. axe accessibility scan clean; keyboard walk-through of nav, menu, viewer, forms, dialogs
- [ ] Q4. Lighthouse mobile within budget (LCP < 2.5s, CLS < 0.05, INP < 200ms, first-view JS ≲ 180 KB gzip)
- [ ] Q5. `/impeccable audit` and `polish` passes; fix findings

## R. Accounts and access (department)

- [ ] R1. `sliot@cse.mrt.ac.lk` mailbox with 2-Step Verification and an app password (Workspace admin)
- [ ] R2. Google Cloud project with Drive and Sheets APIs; service account and JSON key
- [ ] R3. Shared Drive "SLIoT 2027" (service account as Content manager, judges as viewers)
- [ ] R4. Master Google Sheet shared with the service account
- [ ] R5. Cloudflare: R2 bucket `sliot-backups`, bucket-scoped token, Turnstile widget for sliot.cse.mrt.ac.lk, billing alert
- [ ] R6. healthchecks.io check for backups
- [ ] R7. Ask dept IT to add a DMARC record for `cse.mrt.ac.lk` (recommended, not blocking)

## S. Database layer

- [ ] S1. better-sqlite3 + Drizzle (allow its native build in `pnpm-workspace.yaml`)
- [ ] S2. Schema and first migration for all nine tables (architecture.md section 5)
- [ ] S3. Database client: WAL mode, foreign keys on, file at `/var/lib/sliot/sliot.db`
- [ ] S4. Settings helpers; `pnpm admin:create` prints a generated password
- [ ] S5. Replace the sample-data functions with real queries

## T. Email system

- [ ] T1. Outbox table and background worker in `instrumentation.ts` (retries 1 min → 12 h)
- [ ] T2. React Email templates: registration confirmed, code reminder, proposal received, shortlisted, prototype received, finalist
- [ ] T3. nodemailer over Workspace SMTP; console transport in development; `pnpm email:dev` preview
- [ ] T4. Test sends to real Gmail and Outlook inboxes on phone and desktop

## U. Registration and team portal backend

- [ ] U1. Registration action: Turnstile, honeypot, rate limit, validation, unique email and NIC, team code generator
- [ ] U2. Team sessions (hashed token, 7 days), code login with rate limit, "forgot your code"
- [ ] U3. Proposal upload route: 10 MB, PDF check, SHA-256, upload to the Shared Drive, versions
- [ ] U4. Prototype link: URL parsing, YouTube oEmbed check, versions
- [ ] U5. Deadline locks on the server; submission emails

## V. Admin and shortlisting backend

- [ ] V1. Admin login (argon2), roles, 12-hour sessions, generated passwords, reset
- [ ] V2. Teams queries, filters, edits with audit trail
- [ ] V3. CSV export (UTF-8 with BOM) and Sheets export (one master sheet, one-way refresh)
- [ ] V4. Shortlist: draft marks, finalise transaction, emails to newly shortlisted teams only, reopen, history
- [ ] V4b. Finalists: announce (needs a prototype, email once via `finalist_emailed_at`), un-mark, audit entries
- [ ] V5. Settings, admin accounts, audit log
- [ ] V6. Decide: correction email for a team removed after reopening (open question)

## W. Security hardening

- [ ] W1. Security headers and Content-Security-Policy (Turnstile allowed)
- [ ] W2. Rate limits in the app; nginx `limit_req` on login endpoints
- [ ] W3. `Origin` checks on route handlers
- [ ] W4. nginx `client_max_body_size 12m` on the upload route
- [ ] W5. Secrets in `/etc/sliot/` (mode 600), copies in the password manager; Dependabot on

## X. Backups and operations

- [ ] X1. Litestream service streaming to R2 (10-second interval, 7 days of history)
- [ ] X2. Nightly snapshot timer: sqlite3 backup → integrity check → gzip → age encrypt → rclone to R2
- [ ] X3. R2 lifecycle (90 days) and bucket lock on snapshots if available
- [ ] X4. healthchecks ping; `/api/health` with database and outbox checks
- [ ] X5. Deploy step: pre-migration snapshot, then `pnpm db:migrate`
- [ ] X6. First restore drill from R2 to a laptop

## Y. Testing, content and launch

- [ ] Y1. Playwright end to end: register → login → upload → shortlist → finalise → prototype
- [ ] Y2. Real 2027 content: dates, prize amounts, FAQs, partner tiers, contact people, university list, proposal template (replace every `TODO(2027)`)
- [ ] Y3. Metadata and share image for the full site (Open Graph 1200×630), favicon check
- [ ] Y4. Privacy notice page/text
- [ ] Y5. Final check on staging data: full run-through on phone and desktop
- [ ] Y6. Merge `full-site` into `main`; watch the deploy and health check
- [ ] Y7. Create the first super admin on the server; set the deadlines

## Z. After launch

- [ ] Z1. Monitor PM2 logs, outbox failures and backup pings in the first week
- [ ] Z2. Monthly restore drill during the competition
- [ ] Z3. Decide data retention: delete personal data and proposals after the edition (open question)
- [ ] Z4. Clean up: remove the `vite-baseline` launch entry and the `../sliot-vite-baseline` worktree
- [ ] Z5. Upgrade to TypeScript 7 once `typescript-eslint` supports it
- [ ] Z6. Update the Impeccable skill (v3.8.0 installed, newer available) when convenient
