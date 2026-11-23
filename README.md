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

## Project layout

The 2027 site is being rebuilt as a single page (see `docs/workload.md` for progress). The old 2025 components are still in the repository until their replacements land; they are no longer rendered on `/`.

```
src/
  app/                Routes (App Router)
    layout.tsx        Root layout: fonts, metadata, smooth scroll
    page.tsx          The one-page site (new 2027 sections)
    globals.css       Tailwind 4 theme (2027 tokens in @theme) and site-wide CSS
    fonts.ts          next/font setup (Bebas Neue + Montserrat for 2027; old fonts until step L)
    design-system/    Dev-only reference pages (tokens, contrast, callout states); 404 in production
  components/
    site/             2027 sections (nav, hero, live callout, kinetic band, ...)
    ui/               Primitives (button, field, input) and old 2025 UI pieces
  content/            2027 copy and data: site, navigation, socials, deadlines
  lib/
    competition.ts    Competition stage and countdowns from the key dates
    motion/           GSAP + ScrollTrigger, Lenis provider, reduced-motion hook, eases
    utils.ts          cn() class-name helper (knows the custom token names)
  views/, constants/  Old 2025 site (removed in step L)
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
| Key dates (drive the live callout, hero chip and countdowns) | `src/content/deadlines.ts` |
| Colours, type scale, motion tokens | `@theme` blocks in `src/app/globals.css` (check `/design-system` in development) |

Placeholders that still need real 2027 content are marked `TODO(2027)` in the code.

### Images

Put image files in `public/images/` and reference them by path, usually through an export in `src/assets/index.ts`.

### Gallery (old 2025 site, replaced by Memories in step L)

Gallery photos live in `public/images/gallery/<folder>/` and are numbered `1.jpg`, `2.jpg`, ... with no gaps. To add an event:

1. Copy the photos into a new folder, numbered from 1.
2. In `src/constants/index.ts`, build the list with `galleryImages("<folder>", <count>)` (pass `"jpeg"` as a third argument if the files are `.jpeg`).
3. Add an entry to `currentSLIoTShowcases` or `previousSLIoTShowcases` with `img`, `imageArray` and a `sizes` hint matching the tile's grid span (see the existing entries).

Gallery tiles and the lightbox use `next/image`, so visitors get resized AVIF/WebP versions automatically. Large originals are fine.

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
