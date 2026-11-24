# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

The official website of the SLIoT Challenge (Sri Lanka's national IoT competition, run by CSE, University of Moratuwa). The 2027 site is built with Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4, GSAP + Lenis and Motion. It is one scrolling public page plus three app screens: `/register`, `/team` (the team portal) and `/admin` (the organizer dashboard).

## Read the docs before planning

The `docs/` folder holds the plan, and the code follows it. Read the relevant files **before planning or starting any step**, and whenever a task touches behaviour they describe:

- `docs/workload.md`: every step A–Z with substeps and status, and what is done or waiting for review. Start here to find the current step and what it includes. Update it when a step or substep changes status.
- `docs/architecture.md`: the target backend (SQLite + Litestream, data model, email outbox, Google Drive/Sheets, security, backups, deployment), the feature flows (registration, team login, uploads, shortlisting, finalists, exports), the decisions log and open questions.
- `docs/frontend-plan.md`: design direction, tokens, motion system, a spec for each section of the one-page site, the app screen specs (§6) and accessibility rules.
- `PRODUCT.md`: audience, brand personality, anti-references and design principles. Read it before any UI or copy work.

If a change alters a documented flow or decision, update the matching doc in the same change.

## Commands

The package manager is pnpm (version pinned in `packageManager`). Node 20.9 or later.

```bash
pnpm dev                 # dev server on http://localhost:3000
pnpm build               # production build
pnpm lint                # ESLint
pnpm typecheck           # tsc --noEmit
pnpm test                # Vitest, all tests
pnpm test:watch
pnpm vitest run src/lib/data/api.test.ts      # one file
pnpm vitest run -t "name of the test"         # tests matching a name
```

- Tests are `src/**/*.test.ts` only (node environment, no DOM or component tests), so put testable logic in plain `.ts` modules next to the components (for example `shortlist-logic.ts`, `teams-view.ts`).
- After adding routes, a stale `.next/types` can make `pnpm typecheck` fail. Run `pnpm build` once, then typecheck again.
- `.claude/launch.json` defines `next-dev` (port 3000) and `next-prod` (port 3100) for the preview tools. The user often has their own dev server running on 3000.

## Branches and deploys

- Every push to `main` deploys to production (sliot.cse.mrt.ac.lk) through `.github/workflows/deploy.yml` on a self-hosted runner: `pnpm install --frozen-lockfile`, `pnpm build`, `pm2 reload`.
- The rebuild happens on `full-site`. **Never merge `full-site` into `main` before launch (step Y).**
- The user reviews and commits themselves. Don't commit unless asked.

## Architecture

### Routes (`src/app/`)

- `page.tsx`: the public one-page site. Its sections live in `src/components/site/`, and the page changes with the competition stage (`src/lib/competition.ts` works out the stage and countdowns from the key dates).
- `(app)/`: route group for `/register`, `/team` and `/admin`. Its layout adds the dev-only sample-data switcher (`src/components/dev/`). Admin is split into `admin/login/` (outside the shell) and `admin/(shell)/` (signed-in pages with a role-aware sidebar).
- `design-system/`: dev-only reference pages (tokens, contrast, callouts, prizes, sample data, admin UI gallery). They return 404 in production.
- Route files stay thin. Screens live in `src/components/{register,team,admin}/`.

### Content is separate from code

All public-page copy and data lives in `src/content/*.ts` (dates in `deadlines.ts`, prizes, FAQ, people/partners, memories albums and so on). The README has a table of which file holds what. Placeholders still waiting for real 2027 content are marked `TODO(2027)`. Images go in `public/images/` and are usually referenced through `src/assets/index.ts`.

### Sample-data layer (`src/lib/data/`): the frontend/backend seam

The app screens run on a client-side sample backend until the real backend arrives (steps R–V):

- `index.ts` exports the functions screens call (`registerTeam`, `loginWithCode`, `listTeams`, `finaliseShortlist`, `adminLogin`, `listAuditLog`, ...). They are bound to a `Store` saved in **sessionStorage**, with a pretend delay. In the backend steps this file is meant to export the same names backed by the server, so screens must import only from `@/lib/data`.
- `api.ts` holds the business rules: deadlines, roles (super admin vs admin are enforced here, not only in the UI), shortlist and finalist state, audit entries. Calls return `Result` objects with `DataError` codes. A failed transport throws `NetworkError`.
- During server prerendering the store is a throwaway in-memory copy, so **screens read data in effects or on user action, never during render**.
- The store has a `schemaVersion`. Bump it when the stored shape changes so old sessionStorage state is reseeded.
- `dev.ts` holds dev-only controls (stage switching, sample teams, the shortlist Draft/Finalised override) used by the sample switcher. These may bypass rules the real API enforces.
- Zod schemas shared by the forms and the data layer live in `src/lib/schemas/`.

Rules enforced in the sample layer must also be enforced in the real backend. When you add one, note it in `docs/workload.md` or `docs/architecture.md`.

### Competition process (affects shortlist and finalist code)

Proposals are shortlisted once, all at the same time. Shortlisted teams then submit prototypes. Finalists are chosen once, from teams with a prototype. `reopenShortlist` is refused once any prototype exists. Plain admins don't see draft shortlist ticks, including in the audit log.

### UI conventions

- There is no form library. Forms use local state plus the Zod schemas.
- Primitives live in `src/components/ui/` (shadcn-style, built on Radix Dialog for `Dialog` and `Drawer`, with `cva`). Use `cn()` from `src/lib/utils.ts`, which knows the custom token class names.
- Design tokens (aurora palette, Bebas Neue + Montserrat type scale, motion) live in the `@theme` blocks in `src/app/globals.css`.
- Motion helpers (GSAP/ScrollTrigger registration, the Lenis provider, the reduced-motion hook, eases) live in `src/lib/motion/`. Every animation must respect `prefers-reduced-motion`: continuous motion stops and entrances become plain fades.
- The admin Teams table uses **TanStack Table v9** (`useTable`, `tableFeatures`, `createColumnHelper<features, Row>`), whose API differs from v8. See the skills in `node_modules/@tanstack/react-table/skills`. TanStack handles sorting and column visibility only; filtering and row expansion are custom, and filter state lives in the URL.
- Every horizontally scrolling table box needs `relative`, or `sr-only` content inside it widens the page on phones.
- Design for phones first. Pages must work from 320 px wide and meet WCAG 2.2 AA.

## Session memory

`memory.md` in the project root holds the latest session handoff (used with `/remember save` and `/remember restore`). It can lag behind git, so check `git log` before trusting its "uncommitted" notes.
