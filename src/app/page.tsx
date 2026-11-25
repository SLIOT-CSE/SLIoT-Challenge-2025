import { SiteNav } from "@/components/site/site-nav";
import { Hero } from "@/components/site/hero";
import { LiveCallout } from "@/components/site/live-callout";
import { KineticBand } from "@/components/site/kinetic-band";
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
import { deadlines } from "@/content/deadlines";
import { showsTeamLogin, stageAt } from "@/lib/competition";

// The stage, the navigation buttons and "days to go" are worked out on the server. Regenerating the
// page every hour keeps them current without making every request dynamic.
export const revalidate = 3600;

export default function HomePage() {
  const now = new Date();
  const stage = stageAt(now, deadlines);

  return (
    <>
      <a
        href="#main"
        className="sr-only z-tooltip rounded-full bg-mint px-5 py-3 font-semibold text-abyss focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <SiteNav showTeamLogin={showsTeamLogin(stage)} />
      <main id="main" tabIndex={-1} className="outline-hidden">
        <Hero />
        <LiveCallout stage={stage} now={now} />
        <KineticBand />
        <About />
        <Categories />
        <HowItWorks />
        <Timeline now={now} />
        <Prizes />
        <Memories />
        <Sponsors />
        <Faq />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
