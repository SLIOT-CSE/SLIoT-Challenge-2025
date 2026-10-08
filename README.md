# SLIoT Challenge website

The official website of the SLIoT Challenge, the annual IoT competition organized by the Department of Computer Science & Engineering, University of Moratuwa, with SLT-MOBITEL and IESL.

Built with Next.js (App Router), React 19, Tailwind CSS 3 and Framer Motion. JavaScript only.

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
| `pnpm lint` | ESLint (Next.js rules) |

## Project layout

```
src/
  app/              Routes (App Router). Each page.jsx renders a view.
    layout.jsx      Root layout: fonts, metadata, smooth scroll, footer
    fonts.js        next/font setup (Alexandria, Audiowide, Poppins, Roboto Mono, NicoMoji)
    icon.png        Favicon
  views/            Full-page views used by routes (Home, InnovationTour, ...)
  components/       Page sections and UI components
    ui/             Reusable UI pieces (BentoGrid, MovingBorders, Globe, ...)
  config/site.mjs   Coming-soon switch, edition name/year, teaser copy and social links
  constants/        Site content: navigation, socials, about, gallery, spotlight videos, partners
  assets/index.js   Image paths (files live in public/images)
  lib/utils.js      cn() class-name helper
public/
  images/           All site images, served as-is
  *.pdf, *.docx     Downloadable documents
deploy/             Server configuration examples
ecosystem.config.cjs  PM2 process definition
```

Routes: `/`, `/guidelines`, `/faqs`, `/finalists`, `/innovation-tour`, `/session_1`, and a 404 page.

## Coming-soon mode

Between editions the site can show a single teaser page instead of the full site.

It is controlled by `COMING_SOON` in `src/config/site.mjs`:

- `true`: `/` shows the coming-soon page (`src/views/ComingSoon.jsx`, always exactly one screen tall with no scrolling: the robot scales to the space left, and very short screens drop the copyright line and the first sentence), every other page redirects to `/` with a temporary (307) redirect, unknown URLs show the teaser with a 404 status, and the full site's header and footer are hidden.
- `false`: the full site is back exactly as before.

Change the flag, commit and push; the deploy picks it up. The same file holds the edition name and year, the status text, the tagline and the social links shown on the teaser.

The link-preview image for WhatsApp/Facebook is `public/images/og-coming-soon.jpg` (1200x630). Replace it when the edition or artwork changes.

## Updating content

Most yearly updates are data edits; no component changes are needed.

| What | Where |
|---|---|
| Navigation items | `navigation` in `src/constants/index.js` |
| Social links (footer) | `socials` in `src/constants/index.js` |
| About text | `aboutGridItems` in `src/constants/index.js` |
| Proposal guideline cards | `guidelines` in `src/constants/index.js` |
| Spotlight videos | `spotlight` in `src/constants/index.js` (YouTube embed links) |
| Partner logos | `organizers` in `src/constants/index.js` + `src/assets/index.js` |
| Timeline | `events` in `src/components/design/TimeLine.jsx` |
| Prizes | `prizes` in `src/components/section/Prizes.jsx` |
| FAQs | `faqData` in `src/components/Rules.jsx` |
| Contact people | `src/components/ContactUs.jsx`, photos in `public/images/people` |
| Finalists | `teams` in `src/views/SelectedTeams.jsx` |
| Registration / proposal links | `src/components/JoinNow.jsx`, `src/components/SubmissionGuidelines.jsx` |
| Page title | `metadata` in `src/app/layout.jsx` (coming-soon title and share tags in `src/app/page.jsx`) |
| Coming-soon page text and social links | `src/config/site.mjs` |

### Images

Put image files in `public/images/` and reference them by path (for example `/images/robot.png`), usually through an export in `src/assets/index.js`. Components use plain `<img>` tags, except the gallery.

### Gallery

Gallery photos live in `public/images/gallery/<folder>/` and are numbered `1.jpg`, `2.jpg`, ... with no gaps. To add an event:

1. Copy the photos into a new folder, numbered from 1.
2. In `src/constants/index.js`, build the list with `galleryImages("<folder>", <count>)` (pass `"jpeg"` as a third argument if the files are `.jpeg`).
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
