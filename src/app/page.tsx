import { SiteNav } from "@/components/site/site-nav";
import { HeroLoader } from "@/components/site/hero-loader";
import { Hero } from "@/components/site/hero";
import { HERO_LOADER_KEY } from "@/lib/hero-readiness";
import { LiveCallout } from "@/components/site/live-callout";
import { About } from "@/components/site/about";
import { Categories } from "@/components/site/categories";
import { HowItWorks } from "@/components/site/how-it-works";
import { Timeline } from "@/components/site/timeline";
import { Prizes } from "@/components/site/prizes";
import { Memories } from "@/components/site/memories";
import { Sponsors } from "@/components/site/sponsors";
import { Faq } from "@/components/site/faq";
import { Contact } from "@/components/site/contact";
import { SiteFooter } from "@/components/site/site-footer";
import { showsTeamLogin, stageAt } from "@/lib/competition";
import { publicDeadlines } from "@/server/public-deadlines";

const HERO_PREPAINT_SCRIPT = `try{if(!window.location.hash&&window.scrollY<40&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&window.sessionStorage.getItem('${HERO_LOADER_KEY}')!=='1'){document.documentElement.dataset.heroLoading='true';}}catch{}`;

// The stage, the navigation buttons and every date are worked out on the server for each visit,
// so a deadline saved in /admin/settings shows here at once.
export default async function HomePage() {
  const deadlines = await publicDeadlines();
  const now = new Date();
  const stage = stageAt(now, deadlines);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: HERO_PREPAINT_SCRIPT }} />
      <HeroLoader />
      <a
        href="#main"
        className="sr-only z-tooltip rounded-full bg-mint px-5 py-3 font-semibold text-abyss focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <SiteNav showTeamLogin={showsTeamLogin(stage)} />
      <main id="main" tabIndex={-1} className="outline-hidden">
        <Hero />
        <LiveCallout stage={stage} now={now} deadlines={deadlines} />
        <About />
        <Categories />
        <HowItWorks deadlines={deadlines} />
        <Timeline now={now} deadlines={deadlines} />
        <Prizes />
        <Memories />
        <Sponsors />
        <Faq deadlines={deadlines} />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
