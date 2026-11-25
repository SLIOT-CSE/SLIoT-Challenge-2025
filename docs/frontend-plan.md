# SLIoT Challenge 2027: Frontend Implementation Plan

Status: plan, to be confirmed before the build. Last updated 2026-11-23.
Companion to [architecture.md](architecture.md). This plan covers the **frontend only**: every screen, working against sample data. The backend (database, email, Drive, sessions) plugs in later without redesigning the screens.

## 1. What we are building

The full SLIoT 2027 site in the **2027 aurora theme** already used by the coming-soon page, made more energetic through scroll-driven motion and bolder use of the palette:

- **The one-page public site** (`/`): hero, live round callout, about, categories, how to take part, timeline, prizes, memories, sponsors, FAQ, contact.
- **The registration form** (`/register`): multi-step, with full validation.
- **The team portal** (`/team`): code login, status, proposal upload, prototype link.
- **The admin dashboard** (`/admin`): team table, team detail, shortlisting, exports, settings, admin accounts, audit log.

All app screens run on typed sample data through one data-access layer, so wiring the real backend later means replacing that layer, not the screens.

## 2. Design direction

**Scene.** A school student or undergraduate opens a link from the SLIoT WhatsApp channel on a mid-range Android phone, at night after classes, in a dim room, on mobile data. They want to know in seconds whether they can enter, what the prize is and what to do next. That forces a **dark** surface, a phone-first layout and a light page.

**Colour strategy: Committed.** The aurora navy carries the whole surface; mint and aqua carry energy (big type, filled CTAs, live states). No second accent colour (decision). Energy comes from motion, scale and contrast, not from more colours.

**Aesthetic lane: "night aurora, live signal".** The aurora night sky meets IoT signals: nodes that light up, pulses that travel along circuit traces, data that counts up. It must not turn into gamer neon (an anti-reference in `PRODUCT.md`): glows are reserved for things that are live (the countdown, "you are here", the active step).

**Anchor references and what we take from each:**

| Reference | What we borrow | Where it goes |
|---|---|---|
| [SpiritX 2.0](https://spiritx.moraspirit.com/) | "Proposal round is live" callout with date, days left and actions; pinned sideways timeline with huge dates and progress dots; floating pill nav with active section + Team login + Register; photo wall that unfurls on scroll; sticky list + card stack | Live round callout, Timeline, Nav, Memories, Categories |
| [hackX 11.0](https://hackx.lk/) | A mascot carrying the hero (their astronaut, our SLIoT figure); prize podium with 1st raised; mascot beside the FAQ | Hero, Prizes, FAQ |
| [MoraXtreme 11.0](https://www.moraxtreme.lk/) | A line across a map connecting content; count-up numbers over a Sri Lanka outline | About ("connected island"), Prizes count-up |

**What we deliberately don't take:** hackX's AI chat widget and full-scene illustrations (no assets, heavy), MoraXtreme's monospace all-caps nav (costume for a non-terminal brand), identical card grids, and an eyebrow label above every section.

**One memorable thing per section, with quiet sections between them.** Hero, About, Timeline and Memories are the big scroll moments. Categories, How to take part and Prizes are medium. Sponsors, FAQ and Contact are calm on purpose, so the big moments land.

## 3. Design tokens

Defined once in `globals.css` under `@theme` (Tailwind 4), shared by the site, the app screens and the React Email templates.

### Colour (existing `cs-*` aurora palette, extended)

| Token | Value | Role |
|---|---|---|
| `abyss` | `#010610` | Page background |
| `night` | `#011225` | Raised surfaces, app background |
| `deep` | `#023649` | Panels, table header, input background |
| `ocean` | `#0B5A6D` | Decorative borders and dividers, hover surfaces (below 3:1, so never the only edge of a control) |
| `reef` | `#14676F` | Secondary fills (named reef because Tailwind 4.3 ships a default `teal` scale) |
| `edge` | `#3A8F97` | Input and control borders: at least 3:1 on every surface (added after the contrast check) |
| `lagoon` | `#52BAA5` | Secondary text accents, inactive nodes |
| `mint` | `#73DABE` | Primary accent: CTAs, active states, links |
| `aqua` | `#85FFF0` | Live signal: countdown, glowing nodes, focus ring |
| `foam` | `#DDF7EF` | Primary text |
| `haze` | `#A9C7CC` | Secondary text (named haze because Tailwind 4.3 ships a default `mist` scale) |

Added semantic tokens: `success` (`#73DABE`), `warning` (`#F2C46D`, used only for form warnings in the app, never as decoration), `danger` (`#FF9B9B`, errors and destructive buttons). Every text/background pair is measured on the development page `/design-system`, which reads the values straight from the CSS; all 26 pairs pass WCAG 2.2 AA. The coming-soon `cs-*` names now point at these tokens.

### Type

| Role | Font | Notes |
|---|---|---|
| Display (hero, section titles, big dates, prize amounts) | **Bebas Neue** | Already the 2027 display face. Condensed, so the hero title can go to `clamp(3.5rem, 10vw, 7.5rem)` with the visual weight of a 6rem grotesk. Letter-spacing 0 to 0.01em |
| Text (body, UI, forms, tables) | **Montserrat** 400 / 500 / 600 / 700 | 700 added for buttons and table headers. Body 16–18px, line-height 1.6 (light-on-dark gets extra room), max 65ch |

Scale: modular, ratio 1.333, fluid `clamp()` for headings. `text-wrap: balance` on headings, `pretty` on paragraphs. Utilities: `font-display`, `font-body`, `text-display-xl/lg/md`, `text-title`, `text-body-lg`, `text-body`, `text-small`, `text-caption`. Audiowide, Alexandria, Poppins, Roboto Mono and Nico Moji are removed together with the last old-site component that uses them.

### Space, radius, depth, motion

- **Section rhythm:** varied on purpose: big scenes get `min-h-[100dvh]` or pinned scroll lengths, calm sections `py-20 md:py-28`.
- **Radius:** buttons and chips full pill; panels 12–16px; photos 8–12px. No 24px+ cards.
- **Depth:** either a solid 1px `ocean` border or a tinted shadow of at most 8px blur, never both. Glass (`backdrop-filter`) only on the fixed nav and dialogs.
- **Z-index scale:** utilities `z-nav` (40), `z-dropdown` (50), `z-overlay` (60), `z-dialog` (70), `z-toast` (80), `z-tooltip` (90).
- **Easing:** `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)` for entrances, `--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1)` for UI. No bounce or elastic.
- **Durations:** UI feedback 150–250ms, reveals 600–900ms, scroll scenes follow the scroll.

## 4. Motion system

| Library | Job | Notes |
|---|---|---|
| **GSAP 3 + ScrollTrigger** (installed) | Scroll scenes: pinning, scrubbing, the timeline's sideways scroll, the island network drawing, the photo wall | Each scene in its own client component, created in `gsap.context()` and reverted on unmount (`useGSAP` from `@gsap/react`) |
| **Lenis** (rename `@studio-freight/lenis` → `lenis`) | Smooth scrolling, synced to ScrollTrigger | Off for reduced motion and inside the app screens |
| **Motion** (`framer-motion` → `motion`, v12) | Component interactions: menu, accordion, form steps, tabs, dialogs, toasts, layout changes in tables | Never on the same element as GSAP |

Rules:

1. **Content is visible by default.** Animations enhance a page that already reads correctly. Nothing waits for a class to appear.
2. **Only `transform`, `opacity`, `clip-path` and SVG stroke properties animate.** No layout properties, no blur on scrolling content.
3. **Reduced motion:** `gsap.matchMedia()` gives every scene a static layout. Pins are off, the timeline becomes a vertical list, entrances become 200ms fades, Lenis is off, and continuous loops stop.
4. **Phones get their own versions of the big scenes**, not shrunk desktop ones: pins only from `md` (768px) up, the timeline turns vertical, the photo wall becomes a swipeable strip.
5. **One orchestrated load sequence** (the hero), not the same fade-up on every section. Each reveal fits what it reveals.
6. **Performance budget for `/` on a mid-range Android over 4G:** LCP < 2.5s, CLS < 0.05, INP < 200ms, under ~180 KB of JS (gzip) for the first view. Removing three.js (decision) is what makes this reachable.

## 5. The one-page site, section by section

The header links jump to section anchors; the URL hash updates as you scroll.

### 5.1 Navigation (floating pill), from SpiritX

- **Desktop:** a floating pill detached from the top. Logo on the left; section links in the middle, with a mint pill sliding under the active section (Motion `layoutId`); **Team login** (ghost, from the proposal round on) and **Register** (filled mint) on the right. The pill hides on scroll down and returns on scroll up.
- **Team login:** hidden before registration opens and while it is open; shown from the moment registration closes (the proposal round) to the end of the edition, here and in the phone menu (`showsTeamLogin` in `src/lib/competition.ts`). Teams can still reach `/team` directly during registration.
- **Phone:** logo + Register + menu button. The menu opens full screen: links stagger up from a mask, the icon morphs from bars to an X, and focus is trapped inside.
- **Glass:** blur only here and in dialogs.

### 5.2 Hero: "the figure and the title", from hackX

- **Layout desktop:** asymmetric. The title on the left, the SLIoT figure large on the right, rising past the fold line.
- **Layout phone:** the figure on top, bleeding off the right edge (the coming-soon treatment), with the title and CTAs below, all within the first screen.
- **Content:**
  - Title: "Build the connected island"
  - One sentence: "Sri Lanka's national IoT competition for school students, undergraduates and innovators."
  - Buttons: **Register** and **How it works**, the same at every stage
  - No countdown line: the countdown and the next date are in the live callout below
- **Background:** the aurora. Slow-moving gradient bands (CSS, GPU-cheap), with a sparse field of sensor dots that blink in sequence.
- **Load sequence:** the aurora fades up. The title lines rise out of a mask, one after another. The figure resolves from blur with its breathing glow (coming-soon motion). Total about 1.4s.
- **On scroll:** the figure drifts up slower than the text (parallax), and the aurora darkens toward the next section.

### 5.3 Live round callout, from SpiritX

A wide band right under the hero. **It changes with the competition's state**, read from the deadlines in settings (sample settings for now):

| State | Headline | Actions |
|---|---|---|
| Before registration | Registration ends in (countdown), with the opening and closing dates | Register |
| Registration open | Registration ends in (countdown), with the closing date | Register |
| Proposal round | Proposal round is live: due 30 July, 11:59 PM | Submit proposal (→ team portal) · Download template |
| Shortlisting | Proposals are in. Shortlist announced on 20 August | Follow on WhatsApp |
| Prototype round | Shortlisted teams: prototypes due 30 September | Submit prototype (→ team portal) |
| After the finale | See you at SLIoT 2028 | Browse memories |

Until registration closes there is **no panel**: the countdown sits straight on the page over a soft aurora bloom. A heading and one **Register** button, then days, hours, minutes and seconds in very large Bebas (sensor-node colons, digits roll as they change, the seconds glow aqua as the live part), then a signal trace from the opening date to the closing date, lit up to now. Reduced motion swaps the digits without rolling; screen readers get the dates, not the ticking digits. From the proposal round on it is a panel with the date large in Bebas and a days-left counter. A small pulsing aqua dot marks "live".

### 5.4 Kinetic band

A single marquee band between the callout and About: "Sense · Connect · Act · Build" in huge outlined Bebas. Its speed and direction react to scroll velocity. It is the only marquee on the page, and it stops under reduced motion.

### 5.5 About: "the connected island", from MoraXtreme

- **Layout:** pinned scene on desktop. The story on the left, in three short beats:
  - what SLIoT is
  - who runs it (CSE, University of Moratuwa, with SLT-MOBITEL and IESL)
  - the years of editions
- **The visual:** an SVG outline of Sri Lanka on the right. As you scroll through the beats:
  1. The coastline draws itself.
  2. Sensor nodes light up in districts across the island.
  3. Signal lines connect them back to Colombo.
  4. The editions count up.
- **Phone:** not pinned. The map sits above the text and plays its draw once when it scrolls into view.
- **Replaces:** the three.js globe and its four 3D libraries.

### 5.6 Categories, from SpiritX's sticky list + card stack

- **Desktop:** the three categories (School / University / Open) as a sticky list on the left. On the right, a stack of three cards that swaps as you scroll; the active name brightens to mint.
- **Each card:** who can enter, team size (1–5), and the institution rule. "All members from the same school", "same university", or "mix school and university students".
- **Phone:** the three cards stacked, each with its own short reveal.

### 5.7 How to take part: "signal path"

- **The steps:** a real sequence, so numbered:
  1. Register your team
  2. Submit your proposal
  3. Get shortlisted
  4. Build and submit your prototype
  5. Pitch at the finale
- **The animation:** a circuit trace runs through the five steps, and a bright aqua pulse travels along it as you scroll, lighting each step's node as it arrives.
- **Download:** the proposal template sits beside step 2.
- **Phone:** the trace runs vertically down the left edge.

### 5.8 Timeline: "the road to the finale", from SpiritX

- **Desktop:** pinned. Vertical scroll moves the events sideways.
  - Each event shows a huge Bebas date ("30 JUL"), its title and one line of detail.
  - A progress rail with dots fills as you go. The current event is marked **"You are here"** in aqua, worked out from today's date.
- **Skip timeline:** a link jumps past the pinned length.
- **Phone and reduced motion:** a vertical list with a rail on the left, the same "you are here" marker, no pin.
- **Data:** the registration, proposal and prototype dates come from settings, so the timeline and the deadline locks never disagree.

### 5.9 Prizes: podium, from hackX

- **Layout:** three columns, with 2nd on the left, 1st raised in the centre, and 3rd on the right. The prize graphics we already have sit on top.
- **Motion:** the LKR amounts count up when the podium enters the view, and the podium rises from the baseline in order 3rd → 2nd → 1st.
- **Other awards:** listed in a quiet row below (category awards, best school team, and so on, to be supplied).
- **Phone:** 1st first, then 2nd and 3rd side by side.

### 5.10 Memories: photo wall, from SpiritX

- **Desktop:** a tilted 3D wall of past-edition photos. On scroll it straightens and zooms toward the viewer while the title "Moments from past editions" fades through.
- **Edition tabs:** All, 2025, 2023, 2022, 2019. They filter the wall with a layout animation.
- **Photo viewer:** clicking a photo opens a full-screen dialog with arrows, swipe, Esc to close, and captions (event and year).
- **Phone:** a swipeable strip per edition, with the same viewer.
- **Images:** the existing 116 photos, through `next/image` (AVIF/WebP, lazy, sized per breakpoint). Only the first wall's photos load early.

### 5.11 Sponsors (calm)

Organizers first (CSE, University of Moratuwa), then partners by tier (SLT-MOBITEL, IESL ...), as large logos on a quiet panel. Logos are shown in their own colours on a light chip where they need it, never forced to white. A slow logo marquee appears only if there are more than 6 partners.

### 5.12 FAQ (calm), mascot from hackX

- **Content:** the questions are grouped by registration, proposal, prototype and finals.
- **Layout:** an accordion on the left and a smaller SLIoT figure on the right.
- **Accordion:** one item open at a time, animated height via Motion. Answers are always in the DOM, so they're searchable with Ctrl+F.
- **Contact link:** at the end, "Still unsure? Contact the organizers" links to Contact.

### 5.13 Contact (calm)

- **People:** organizer cards with photo, role, email and a WhatsApp button. There are 3 photos today; anyone without a photo gets an initials tile in aurora tones.
- **Below the cards:** the department address and the social links, with WhatsApp first.

### 5.14 Footer

- **Desktop layout:** Three-zone monumental stage — logo and one-line description on the left, centered SLIoT robot figure framed by an SVG concentric IoT circuit ring in the middle, and organizer credit with partner logos on the right — flowing into the giant outlined `SLIoT 2027` wordmark and a bottom hairline bar (copyright and circular social icons).
- **Wordmark:** The thin outline holds a fine grid of round dots that thins out towards the cut-off bottom. One soft aqua light crosses the dots every 9 seconds; with reduced motion it rests over the year.
- **Phone layout:** The robot figure and circuit ring sit centered behind a dark contrast scrim with the logo, description, organizer credit, partner logos, `SLIoT 2027`, copyright/links, and social icons stacked cleanly.
- **Back to top:** A button with scroll progress shown as a ring around it.

## 6. App screens (product register, sample data)

These follow the product side of the design system: same tokens and fonts, calmer, denser, no scroll scenes. Motion only answers actions (steps, saves, dialogs).

### 6.1 `/register`: multi-step form

| Step | Content |
|---|---|
| 1. Team | Team name, category (three large selectable tiles with one-line rules) |
| 2. Institution | School teams: school name. University teams: university dropdown + **Other** reveals a text field. Skipped for Open teams |
| 3. Members | Member 1 is labelled **Team leader**. "Add member" up to 5; each member card: full name, WhatsApp number, email, NIC (shown for university students). Open teams: each member picks School / University and names it |
| 4. Review | Read-only summary with "Edit" links per step, Turnstile placeholder (no consent checkbox: removed in step N) |

- **Validation:** zod schemas from `src/lib/schemas/` (shared with the future backend).
  - Errors appear inline, below the field, after the first blur.
  - On submit, the form moves focus to the first error.
  - Phone and NIC formats are explained in helper text before anyone gets them wrong.
- **Progress:** a step rail at the top. Steps slide sideways (Motion), and the form keeps its values if you go back.
- **Success screen:** the team code is revealed character by character, as large Bebas. Next to it: a copy button, "We've emailed this to {leader email}", and next steps with the proposal deadline.
- **States:** registration closed (with the next date), submitting, duplicate email or NIC (names the member to fix), network error (keeps everything typed).

### 6.2 `/team`: team portal

- **Login:** one field for the team code, formatted as you type (`SL27-XXXX-XXXX`). Plus "Forgot your code?", which asks for the leader email and gives the same neutral reply whether or not it exists.
- **Dashboard:**
  - **Status tracker:** Registered → Proposal → Shortlist → Prototype → Finals, with the current stage glowing. A not-shortlisted team's tracker stops at Shortlist. Finals lights up for `finalist` teams and is otherwise an upcoming milestone with the finale date.
  - **Team card:** members and institution.
  - **Proposal panel:**
    - A drag-and-drop zone that only accepts PDFs of at most 10 MB.
    - Upload progress.
    - The current file with version and time, plus earlier versions.
    - The deadline countdown.
    - It locks after the deadline.
  - **Prototype panel:**
    - Locked with an explanation until the team is shortlisted.
    - Once shortlisted: a YouTube link field with a live preview thumbnail when the link is valid, and its own deadline.
- **States:** before the proposal round, uploading, upload failed, file too big or not a PDF, deadline passed, not shortlisted (a kind message with no prototype panel), shortlisted.

### 6.3 `/admin`: dashboard

- **Login:** username + password, rate-limit message state.
- **Shell:** a sidebar with Teams, Shortlist (super admins), Settings (super admins), Admins (super admins) and Audit log (super admins), plus the signed-in name and role.
- **Teams:**
  - **Table:** a TanStack table of 200 sample teams with sticky header, sorting, and filters for category, stage and institution. Search covers team, member name, email and NIC. You can pick columns, and expanding a row shows its members.
  - **Exports:** "Download CSV" and "Export to Sheets" buttons, with toasts in place of the real work for now.
  - **Team detail:** opens in a side drawer (`?team=<code>`, so a team can be linked to) with members, submissions history, audit trail and edit mode. Edit mode fixes the name, institution and member details with the same rules as registration; it asks before discarding edits.
  - **Filters and columns:** search and the category, stage and institution filters are kept in the address; the column choice is kept in the browser.
- **Shortlist:**
  - **Marking:** the list of teams with proposals, with checkboxes and bulk tick by category. A sticky summary bar shows counts per category.
  - **Finalise:** a dialog where you type `FINALISE` to confirm.
  - **After finalising:** a "finalised" banner with a **Reopen** button, and the finalisation history.
- **Settings:** the three deadline pickers in Sri Lanka time, each showing how long until it.
- **Admins:**
  - **List:** every account with its role, status and last login.
  - **Create admin:** a dialog that shows the generated password once, with a copy button and a warning that it won't be shown again.
  - **Reset password:** the same reveal.
  - **Disable:** with a confirmation step.
- **Audit log:** a filterable list by actor, action and date.
- **States:** a skeleton matching each table's layout while loading, empty states that say how to populate, an error state with retry, and a "Sample data" badge on every app screen until the backend is connected.

### 6.4 Sample data layer

- **Data access:** `src/lib/data/` exposes typed functions (`getTeams()`, `getTeam(code)`, `uploadProposal()`, `finaliseShortlist()` ...). Today they're backed by `src/lib/mock/`; later they become server actions and route handlers with the same signatures.
- **Sample teams:** 200 generated from curated lists of Sri Lankan names, schools and universities, with a fixed seed so screenshots are stable. They span every stage: no proposal, multiple versions, shortlisted, not shortlisted, prototype submitted.
- **Mock behaviour:** kept in memory per browser session, so the flows can be clicked through end to end. Register → get a code → log in → upload → (admin) shortlist → finalise → submit prototype.
- **A demo switcher** (development only) sets the competition state, to preview every callout and portal state.
- **Coming-soon:** while `COMING_SOON` is on, `/register` and `/team` stay redirected in production. `/admin` stays reachable (architecture decision), but shows the sample-data badge until the backend lands.

## 7. Copy

- **Voice:** direct and encouraging to young innovators, never corporate (`PRODUCT.md`). Sentence case. Plain verbs. No "elevate", "seamless", "unleash", "next-gen". No emoji.
- **One name per action, everywhere:**

| Action | Button | Confirmation |
|---|---|---|
| Register | Register your team | "You're registered. Your team code is SL27-…" |
| Log in | Log in to team portal | — |
| Upload proposal | Submit proposal | "Proposal submitted (v2)." |
| Prototype | Submit prototype | "Prototype submitted." |
| Shortlist | Finalise shortlist | "Shortlist finalised. 48 teams emailed." |

- **Error pattern:** what happened + how to fix. For example:
  - "This email is already in team SL27-7KQ4-M9XD. Use a different email for Member 3."
  - "That file is 14 MB. Proposals can be up to 10 MB. Compress the PDF and try again."
- **Empty states:** what this is + why it's empty + the next step. For example: "No proposal yet. Upload your team's PDF before 30 July, 11:59 PM."
- **Section copy:** written in `src/content/*.ts`, starting from the 2025 content and refreshed for 2027. Real prize amounts, dates, FAQs and contacts are still to be supplied; placeholders are marked `TODO(2027)` so none ship by accident.

## 8. Components

Built on shadcn/ui (Radix) where it gives accessibility for free, restyled to the aurora tokens:

- **Site:** `Nav`, `MobileMenu`, `Button` (primary filled mint, secondary outline, ghost), `LiveDot`, `Countdown`, `SectionTitle`, `Marquee`, `IslandMap`, `CategoryStack`, `SignalPath`, `TimelineRail`, `Podium`, `PhotoWall`, `Lightbox`, `Accordion`, `PersonCard`, `LogoWall`, `BackToTop`.
- **Forms:** `Field` (label above, helper, error below), `Input`, `Select`, `UniversitySelect` (+ Other), `PhoneInput`, `NicInput`, `CodeInput`, `Stepper`, `Dropzone`, `YouTubeField`.
- **App:** `AppShell`, `DataTable`, `Drawer`, `Dialog`, `ConfirmByTyping`, `StatusTracker`, `Badge`, `Toast`, `Skeleton`, `EmptyState`, `PasswordReveal`.
- **Icons:** lucide-react (already installed) at a single 1.5 stroke width.

Folder layout: `src/components/site/`, `src/components/app/`, `src/components/ui/` (primitives), `src/content/`, `src/lib/{data,mock,schemas,motion}/`.

## 9. Accessibility

- WCAG 2.2 AA. Contrast is measured for every token pair, and the focus ring is a visible 2px aqua.
- A skip link to the main content. Every pinned scene has a "Skip" link, and all its content stays in the DOM in reading order.
- Touch targets of at least 44px. Everything works from 320px wide.
- Dialogs, the menu and the photo viewer trap focus and restore it on close. Esc closes them.
- Form fields have labels, `aria-describedby` for helper and error text, and errors announced politely.
- Reduced motion is honoured everywhere (section 4).
- The island map and decorative layers are `aria-hidden`. Photos have real alt text (event, year).

## 10. Build order

Prerequisites from [architecture.md](architecture.md): **step 1, TypeScript migration** and **step 2, Tailwind 4 upgrade**, done first.

| # | Step | Done when |
|---|---|---|
| 1 | **Foundations** (done): tokens in `@theme static`, Montserrat 700, motion helpers in `src/lib/motion/` (`gsap.ts` with `useGSAP`, `smooth-scroll.tsx` Lenis provider synced to ScrollTrigger, `use-reduced-motion.ts`, `ease.ts`), `Button`/`Field`/`Input` primitives in `src/components/ui/`, `framer-motion` → `motion`, `@studio-freight/lenis` → `lenis`, `cn()` taught the custom token names. The old fonts and the three.js packages stay until the old components using them are replaced (steps 4–6), so the old site keeps working meanwhile | Lint, typecheck and build pass; `/design-system` shows every colour pair passing contrast |
| 2 | **Content and data layer:** `src/content/*.ts`, zod schemas, sample-data generator, data-access functions, demo state switcher | Sample teams cover every stage; schemas have unit tests |
| 3 | **Nav + Hero + Live callout + Kinetic band** | Load sequence smooth on a throttled phone profile; every callout state previewable |
| 4 | **About island map + Categories + How to take part** | Map draws and nodes connect on scroll; phone and reduced-motion versions checked |
| 5 | **Timeline + Prizes** | Pinned timeline on desktop, vertical on phone; "you are here" correct for sample dates |
| 6 | **Memories + Sponsors + FAQ + Contact + Footer** | Photo wall and viewer work with keyboard and swipe; old pages and unused components deleted |
| 7 | **`/register`** | All four steps, every error state, success screen with code reveal |
| 8 | **`/team`** | Login, forgot code, every portal state from the demo switcher |
| 9 | **`/admin`** | Teams table with 200 rows, drawer, shortlist draft → finalise → reopen, settings, admins, audit log |
| 10 | **Polish and verification** | Playwright screenshots at the 11 viewports used before (no overflow or overlap), reduced-motion run, axe scan clean, Lighthouse mobile within the budget in section 4, `/impeccable audit` and `polish` pass |

Each step ends with screenshots shared for review before the next one starts.

## 11. Out of scope for this build

Database, email sending, Google Drive and Sheets, real sessions and passwords, Turnstile verification, rate limits and backups. All of these are in [architecture.md](architecture.md) and plug into the data layer from section 6.4.

## 12. Assumptions and open items

- **Placeholder content:** 2025 content stands in for the 2027 prize amounts, dates, FAQs, partner tiers and contact people until you supply them, marked `TODO(2027)`.
- **Headline:** "Build the connected island" is the proposed hero headline, taken from the coming-soon mock.
- **Gallery captions:** taken from the folder names (edition and event: finals, semi-finals, school workshop, university workshop).
- **Not in this plan:** the share image `og-coming-soon.jpg` still needs regenerating; that's a separate task.
