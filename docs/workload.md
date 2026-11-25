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
| P | Admin dashboard screens (`/admin`) | **Done, waiting for review** (all 4 slices) |
| Q | Frontend polish and verification | To do                         |
| R | Accounts and access (department) | In progress (R1–R4 done; R3d judges later) |
| S | Database layer | **Done, waiting for review**  |
| T | Email system | **Done, waiting for review** (T4: Gmail passed; Outlook and phone to do) |
| U | Registration and team portal backend | **Done, waiting for review** (Drive and Turnstile need their keys) |
| V | Admin and shortlisting backend | **Done, waiting for review** (V6 open) |
| W | Security hardening | **Code done**; nginx and server steps at deploy |
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

## P. Admin dashboard screens (`/admin`) (done, waiting for review)

Built in four slices, each checked in the browser before the next: (1) foundations, (2) shell, login and Teams (P1–P3), (3) Shortlist and Finalists (P4, P4b), (4) Settings, Admins, Audit log and polish (P5, P6). Review points after slices 2 and 4.

**Slice 1, foundations (done):**

- [x] Data layer (`src/lib/data/`), store `schemaVersion: 3`: seeded organizer accounts (`super`, `admin1`, `admin2`; invented sample passwords, only a fake hash is stored), `adminLogin` (5 tries per 15 minutes, same reply for a wrong password and a disabled account), `adminLogout`, `getCurrentAdmin`
- [x] Role checks live in the data layer: the five shortlist and finalist functions, settings, accounts and the audit log return `forbidden` for anyone but an active super admin
- [x] `updateTeam` (name, institution, member details; same rules as `/register`, one team per person; audit entry with old → new), `resendCode`, `exportTeamsCsv` (M1–M5 layout, UTF-8 BOM, formula-safe cells, result column once finalised), `exportToSheets` (pretend), `updateSettings` (registration < proposal < prototype), `listAdmins`, `createAdmin`, `resetAdminPassword`, `setAdminDisabled`, `setAdminRole` (not yourself, not the last active super admin), `listAuditLog` (filters, 100 per page); `getAuditLog` entries now carry `actorName`
- [x] Generated passwords: 16 characters, no look-alikes (`src/lib/admin-password.ts`)
- [x] UI primitives in `src/components/ui/`: `Dialog`, `Drawer` (shared shell in `overlay.tsx`, on the existing Radix Dialog), `ConfirmByTyping`, `PasswordReveal`, `Toast` (`ToastProvider`, `useToast`), `Checkbox`, `Badge`, `Skeleton`, `EmptyState`; gallery at `/design-system/admin-ui`
- [x] Dev switcher: sign in as a sample organizer
- [x] 251 tests (51 new), lint, typecheck and build pass; primitives checked in the browser at desktop and 375 px

**Slice 2, shell, login and Teams (done):**

- Routes: `/admin/login` (outside the shell) and the signed-in screens under `src/app/(app)/admin/(shell)/`. Shortlist, Finalists, Settings, Admins and Audit log are placeholders (`ComingNext`) behind the real `SuperOnly` gate, so the sidebar and the role check can be tried; slices 3 and 4 replace them
- Shell (`src/components/admin/`): `AdminShell` checks the session (skeleton while checking, redirect to login when signed out), role-aware sidebar on large screens and a scrolling tab row on phones, "Sample data" badge, signed-in name and role, sign out. Toasts live here
- Login: username and password with show/hide, the rate-limit message, a network error state, and in development a box that fills in the sample organizers
- Teams (`teams/`): TanStack Table v9 (`useTable` with `rowSortingFeature` and `columnVisibilityFeature`; the screen filters before the table and keeps expansion itself). Filters (search, category, stage, institution) live in the address, the open team is `?team=<code>`, the column choice is saved in localStorage (`columns-config.ts`, with try/catch). CSV downloads the teams as shown (filtered, sorted); Sheets shows when it last ran
- Team drawer: members, submissions (every version), activity in plain sentences (`describe-audit.ts`, reused by the Audit log in slice 4). Edit mode reuses the registration form's fields and rules (`MemberCard`, `validate`), shows server conflicts on the right field, asks before discarding edits and blocks closing while saving. "Email code again" sends at once, with a toast
- Dev: "Add teams (200)" in the sample panel; the panel now sits under modals so it can't cover a drawer's buttons
- 285 tests (34 new), lint, typecheck and build pass. Checked in the browser: sign-in, wrong password, the role-based sidebar and the super-only message, filters, sort, columns (saved across a reload), expand, drawer, edit (local and server errors, save, discard), CSV contents, resend, 375 px (no overflow, full-width drawer)
- Found and fixed: two filters changed quickly undid each other (the second was built from a stale address)
- Decisions to confirm: the first click on a number column sorts high to low (TanStack's default for numbers); "Email code again" has no confirm step; the team's activity hides draft shortlist ticks from plain admins (the backend's audit read should do the same, step R)
- Not covered yet: keyboard and screen-reader pass (step Q), reduced motion in a real browser

**Slice 3, Shortlist and Finalists (done):**

- `/admin/shortlist` (`shortlist/shortlist-screen.tsx`, rules in `shortlist-logic.ts` with tests): teams with a proposal, a tick each, category filter, "Tick all shown" / "Untick all shown", sticky summary of ticks per category, draft or finalised banner. Finalise needs typing FINALISE and says how many teams are shortlisted, how many leaders get an email (only teams not emailed before), how many teams will see "not shortlisted", and warns about teams told earlier that they were shortlisted and are now unticked (they get no correction email). Once finalised the ticks are locked, with Reopen (confirm) and the finalisation history
- `/admin/finalists`: "Ready to announce" (prototype in, not yet a finalist) with select-all, then FINALISTS to announce (counts newly emailed leaders); "Finalists" list with Remove (confirm, no email sent, says a sent email can't be taken back)
- Shared: `use-admin-data.ts` (loads teams, settings and history, refreshes when the store changes), `errors.ts`
- 291 tests (6 new), lint, typecheck and build pass. Checked in the browser: finalised view, reopen, ticking (including two quick ticks in a row), finalise dialog with warnings, FINALISE → toast and lock, announce 2 finalists, remove one, no console errors, 375 px
- Found and fixed: quick ticks in a row were ignored while a call was running; visually hidden text inside a scrolling table made the whole page wider on phones (every table scroll box is now positioned; this also fixed it for Teams)
- Decided: the shortlist is decided once, before prototypes. `reopenShortlist` is refused (`not_allowed`) as soon as any prototype exists, and the Shortlist screen shows why instead of the Reopen button. That removes the case where a second finalise could demote a team that already has a prototype or is a finalist. Tests: 305. The backend needs the same rule (step R). The dev switcher's Draft/Finalised control still bypasses it, for trying screens

**Slice 4, Settings, Admins, Audit log and polish (done, waiting for review):**

- `/admin/settings`: the three deadlines in native `datetime-local` boxes, always in Sri Lanka time (`deadline-input.ts` converts to and from `+05:30`), each with "in N days" or "N days ago". Only changed deadlines are sent; the data layer's order check lands on the right field. Discard changes, saved toast
- `/admin/admins`: every account with role, status and last sign-in. Create admin (name, username, role; a taken username shows on the field), reset password, enable or disable, change role, each with a confirm dialog. New and reset passwords go through `PasswordReveal` (shown once, never stored). No actions on your own row, so you can't lock yourself out; the data layer still refuses to disable or demote the last active super admin
- `/admin/audit`: newest first in plain sentences (`describe-audit.ts`), filters for who (anyone, teams, visitors, one organizer), what (action group) and a From/To day in Sri Lanka time (`audit-filter.ts`), a backwards range says so, 100 at a time with "Load 100 more". On a phone the person shows under the time so the sentence stays visible
- P6: every screen has a skeleton, an offline state with retry and an empty state; "Sample data" badge on all of them; `ComingNext` placeholder removed
- Finalists now lists only shortlisted teams with a prototype (stage "prototype_submitted"), so a team that was shortlisted out never appears
- 303 tests (12 new this slice), lint, typecheck and build pass. Checked in the browser: settings invalid and valid save, create admin (taken username, then success with the one-time password), disable, audit filter by group, 375 px on all three
- Known: the audit sentence for a disabled, enabled or reset account doesn't name the account (the stored entry only has its id); entries made at the sample clock sort below the seeded later-dated ones, which is a sample-data effect

**Screens:**

- [x] P1. Login screen and app shell with role-based sidebar
- [x] P2. Teams table (20 sample rows, 200 with the dev "Add teams" button): sort, filter, search, columns, expandable members; CSV and Sheets buttons
- [x] P3. Team detail drawer with history, audit trail and edit mode
- [x] P4. Shortlist page: draft marks, bulk tick, summary bar, finalise (type FINALISE), reopen, history
- [x] P4b. Finalists page (super admins): tick teams that submitted a prototype, "Announce finalists" (type FINALISTS), un-mark to correct, uses `announceFinalists` and `unmarkFinalists`
- [x] P5. Settings (deadlines in Sri Lanka time), admin accounts (generated password shown once), audit log
- [x] P6. Loading skeletons, empty states, errors, "Sample data" badge

## Q. Frontend polish and verification

- [ ] Q1. Playwright screenshots at the 11 viewports: no overflow, clipping or overlap
- [ ] Q2. Reduced-motion run of every scene
- [ ] Q3. axe accessibility scan clean; keyboard walk-through of nav, menu, viewer, forms, dialogs
- [ ] Q4. Lighthouse mobile within budget (LCP < 2.5s, CLS < 0.05, INP < 200ms, first-view JS ≲ 180 KB gzip)
- [ ] Q5. `/impeccable audit` and `polish` passes; fix findings

## R. Accounts and access (department)

- [x] R1. `sliot@cse.mrt.ac.lk` mailbox with 2-Step Verification and an app password (Workspace admin). App password "SL-IOT-Web" created 2026-11-24; SMTP sending still to be confirmed in step T3
- [x] R2. Google Cloud project with Drive and Sheets APIs; service account and JSON key (project `sliot-2027`, service account `sliot-website@sliot-2027.iam.gserviceaccount.com`; key stored privately, never in the repo)
- [ ] R3. Drive storage for proposals. Plan changed 2026-11-24: no permission to create a Shared Drive, so use a folder "SLIoT 2027 Proposals" in the `sliot@cse.mrt.ac.lk` My Drive, with uploads made through OAuth as that account (refresh token, scope `drive`), not the service account (service accounts have no storage quota). Judges get viewer access to the folder. The service account is still used for Sheets only
  - [x] R3a. Create the folder (folder ID `1YHcUQvkxhelSOxpg-lnk8S1D0mBGjao7`)
  - [x] R3b. OAuth consent screen (Internal if available, so the refresh token does not expire). Internal was available
  - [x] R3c. OAuth client (Web application) and refresh token via OAuth Playground. Done 2026-11-25; values in `.env.local`. Verified: token refresh works (scope `drive`), and the app's uploader put a test PDF in `SLIoT 2027 Proposals/School/`
  - [ ] R3d. Judges as viewers on the folder (can wait)
- [x] R4. Master Google Sheet "SLIoT 2027 Teams" shared with the service account as editor. Done 2026-11-25; verified with an export of the 20 seeded teams to the `Teams` tab
- [ ] R5. Cloudflare: R2 bucket `sliot-backups`, bucket-scoped token, Turnstile widget for sliot.cse.mrt.ac.lk, billing alert
  - [x] R5a. Turnstile widget "SLIoT registration" (Managed; hostnames sliot.cse.mrt.ac.lk and localhost). Keys in `.env.local`. Verified 2026-11-25: the real widget renders under the CSP, and a registration passed the check
  - [x] R5b. R2 bucket `sliot-backups` (private) and a token `sliot-backups-server` limited to it (Object Read & Write). Done 2026-11-25; keys in the password manager, for step X. Not yet tested with a write
  - [ ] R5c. Billing alert (deferred by the user; email sliot@cse.mrt.ac.lk above $1, or R2 storage above 5 GB)
- [x] R6. healthchecks.io check for backups (on sliot@, cron 30 2 * * * Asia/Colombo, 2 h grace; ping URL in the password manager for step X)
- [ ] R7. Ask dept IT to add a DMARC record for `cse.mrt.ac.lk` (recommended, not blocking)

## S. Database layer

- [x] S1. better-sqlite3 + Drizzle. better-sqlite3 13 ships prebuilt binaries for every platform, so its `node-gyp` build is **declined** in `pnpm-workspace.yaml` (it needs Visual Studio on Windows and isn't needed). Same for esbuild and `@node-rs/argon2`
- [x] S2. Schema and first migration for all nine tables (architecture.md section 5): `src/server/db/schema.ts`, migrations in `src/server/db/migrations/` (`pnpm db:generate`), CHECK constraints on every enum
- [x] S3. Database client: WAL mode, foreign keys on, file at `/var/lib/sliot/sliot.db` (`DATABASE_PATH`; development default `./data/sliot.db`). `src/server/db/client.ts`, `pnpm db:migrate`, env schema in `src/server/env.ts` with `.env.example`
- [x] S3a. Development test data: `pnpm db:seed` wipes the local database and writes a fixed data set (`src/server/db/seed-data.ts`): 20 teams in the prototype round (10 not shortlisted, 3 of them without a proposal; 6 shortlisted; 4 with a prototype), proposal versions, outbox, audit log, one finalisation, organizers `super` / `admin1` / `admin2`. Sets the dev-only `dev_now` setting so the app sits in the prototype round. Refuses to run in production
- [x] S4. Settings helpers (`src/server/settings.ts`); `pnpm admin:create <username> "<Display name>" [role]` prints a generated password; argon2id passwords (`@node-rs/argon2`); sessions in `src/server/auth/sessions.ts`
- [x] S5. Sample store removed. `src/server/backend/` (team + admin) keeps the same function names and `Result` shapes; `src/server/actions.ts` (server actions) and `POST /api/team/proposal`; `src/lib/data/index.ts` is now a thin client wrapper (NetworkError on no answer, `dataVersion` ticks after writes so screens refresh). Organizer identity comes from the session cookie, never the browser. Dev switcher and the login page's dev box use `src/server/dev-actions.ts` (refused in production). The dev clock (`dev_now`) keeps running from when it was set; sessions always use real time. Backend tests run on a seeded in-memory database

## T. Email system

- [x] T1. Outbox and background worker started from `src/instrumentation.ts` (`src/server/email/worker.ts`): one email every 2 s; retries at 1 min, 5 min, 30 min, 2 h, 12 h, then `failed`. Schedules by real time (new emails are due at once). Also deletes expired sessions daily
- [x] T2. React Email templates in `src/emails/` (react-email 6; inline styles from the aurora palette rather than its Tailwind wrapper, for client support): registration confirmed, code reminder, proposal received, shortlisted, prototype received, finalist. The header uses `/icon.png`, since Gmail doesn't show SVG. TODO(2027): a PNG wordmark
- [x] T3. nodemailer over Workspace SMTP (`src/server/email/transport.ts`); `pnpm email:dev` preview on port 3200. **Changed:** no console transport. Decided 2026-11-24: until the SMTP variables are set, emails wait in the outbox as `pending` with `last_error` "SMTP not configured"; production refuses to start without them
- [ ] T4. Test sends to real Gmail and Outlook inboxes on phone and desktop. Gmail desktop passed 2026-11-25 (inbox; SPF and DKIM pass, DMARC fails because the domain has no record, see R7; logo broken only with a localhost SITE_URL). Outlook skipped for now by the user; Outlook and phone checks still to do

## U. Registration and team portal backend

- [x] U1. Registration: Turnstile widget (`src/components/register/turnstile.tsx`, placeholder in development without keys) checked on the server, honeypot, 20 registrations per IP per hour (school labs share an address), validation, unique email and NIC (with a unique-index fallback), team code generator
- [x] U2. Team sessions (hashed token, 7 days, httpOnly cookie `sliot_team`), code login with 5 failures per IP per 15 min, "forgot your code" with the same reply either way
- [x] U3. Proposal upload route `POST /api/team/proposal`: Origin check, 10 MB, `%PDF-` check, SHA-256, upload to Drive **as sliot@cse.mrt.ac.lk through OAuth** into `<folder>/<Category>/` (R3 option B), versions. Fails with "not set up yet" until the Drive variables exist
- [x] U4. Prototype link: URL parsing, YouTube oEmbed check (accepted if YouTube itself is unreachable), versions; finalists can't replace it
- [x] U5. Deadline locks on the server (checked again after a slow upload); submission emails

## V. Admin and shortlisting backend

- [x] V1. Admin login (argon2, timing-equal for unknown users), roles, 12-hour sessions (`sliot_admin`), generated passwords, reset and disable end the account's sessions
- [x] V2. Teams queries, filters, edits with audit trail; optional `expectedUpdatedAt` refuses a stale edit (`edit_conflict`)
- [x] V3. CSV export (UTF-8 with BOM) and Sheets export through the service account (`GOOGLE_SERVICE_ACCOUNT_KEY_FILE`, `GOOGLE_SHEET_ID`; RAW values; creates the Teams tab if missing). Optional: without its settings the button explains
- [x] V4. Shortlist: draft marks, finalise transaction (state checked inside it), emails to newly shortlisted teams only, reopen (refused once a prototype exists), history
- [x] V4b. Finalists: announce (needs a prototype, email once via `finalist_emailed_at`), un-mark, audit entries
- [x] V5. Settings, admin accounts, audit log (draft ticks hidden from plain admins on the server)
- [ ] V6. Decide: correction email for a team removed after reopening (open question)

## W. Security hardening

- [x] W1. Security headers and Content-Security-Policy (`src/server/security-headers.ts`, applied in `next.config.ts`): own origin plus Turnstile and YouTube thumbnails; HSTS in production
- [x] W2. Rate limits in the app (audit-log based, per IP); nginx `limit_req` on POSTs to `/team`, `/admin/login`, `/register` and the upload route in `deploy/nginx.conf.example`. **To apply on the server**
- [x] W3. `Origin` checks on route handlers (`src/server/origin.ts`); server actions are checked by Next
- [x] W4. nginx `client_max_body_size 12m` on the upload route, 1m elsewhere (example file). **To apply on the server**
- [ ] W5. Secrets in `/etc/sliot/sliot.env` (mode 600, linked as `.env.production.local`), copies in the password manager (**server task**). Dependabot config added (`.github/dependabot.yml`, targets `full-site`); turn on alerts in the repo settings

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
