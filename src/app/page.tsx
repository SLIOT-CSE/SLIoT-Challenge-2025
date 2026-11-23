import { SiteNav } from "@/components/site/site-nav";
import { Hero } from "@/components/site/hero";
import { LiveCallout } from "@/components/site/live-callout";
import { KineticBand } from "@/components/site/kinetic-band";
import { deadlines } from "@/content/deadlines";
import { stageAt } from "@/lib/competition";

// The stage, countdowns and "days to go" are worked out on the server. Regenerating the
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
      <SiteNav />
      <main id="main">
        <Hero stage={stage} now={now} />
        <LiveCallout stage={stage} now={now} />
        <KineticBand />
      </main>
    </>
  );
}
