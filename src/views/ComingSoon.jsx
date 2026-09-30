import { Spotlight } from "@/components/ui/Spotlight";
import RobotStage from "@/components/coming-soon/RobotStage";
import SocialLinks from "@/components/coming-soon/SocialLinks";
import LaunchMarquee from "@/components/coming-soon/LaunchMarquee";
import { logo } from "@/assets";
import { edition } from "@/config/site.mjs";

// Teaser page shown at "/" while COMING_SOON is on (src/config/site.mjs).
// Always exactly one screen tall (never scrolls): the robot takes whatever height is
// left, the title scales with width and height, and on short screens the copyright
// (short: < 700px tall) and the first sentence (shorter: < 600px) are dropped.
// Phones: logo, title, robot, copy + links, banner. Desktop and landscape phones: text
// left, robot right.
const ComingSoon = () => {
  return (
    <main className="cs-page relative isolate flex h-[100dvh] flex-col overflow-hidden font-alexandria">
      {/* Same three light beams as the home hero */}
      <div aria-hidden="true">
        <Spotlight className="h-screen -top-40 -left-10 md:-left-32 md:-top-20" fill="white" />
        <Spotlight className="sm:top-10 left-full h-screen sm:w-[50vw]" fill="#73C72A" />
        <Spotlight className="sm:top-10 md:top-28 left-80 h-screen sm:w-[50vw]" fill="blue" />
      </div>

      <header className="relative z-2 mx-auto flex w-full max-w-7xl shrink-0 items-center justify-between px-5 pt-5 md:px-10 md:pt-8 short:pt-3">
        <img
          src={logo}
          alt="SLIoT"
          width={1518}
          height={813}
          className="cs-rise h-auto w-[92px] md:w-[116px] short:w-[84px]"
          style={{ "--cs-delay": "0s" }}
        />
        <p
          className="cs-rise inline-flex items-center gap-2 rounded-full border border-[#77FF00]/35 bg-[#77FF00]/10 px-3.5 py-1.5 text-xs text-[#d9ffb8] sm:text-sm"
          style={{ "--cs-delay": "0.1s" }}
        >
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="cs-ping absolute inline-flex h-full w-full rounded-full bg-[#77FF00]" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#77FF00]" />
          </span>
          {edition.status}
        </p>
      </header>

      <div
        className={[
          "relative z-2 mx-auto grid min-h-0 w-full max-w-7xl flex-1 gap-x-10 gap-y-3 px-5 py-3 md:px-10 md:py-6 short:py-2",
          // Stacked: the robot row absorbs the leftover height (floor 110px)
          "grid-rows-[auto_minmax(110px,1fr)_auto] [grid-template-areas:'title''robot''rest']",
          // Side by side: the text block is centred as one unit between two spacer rows,
          // and the robot spans the full height of the right column
          "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:grid-rows-[minmax(0,1fr)_auto_auto_minmax(0,1fr)] lg:[grid-template-areas:'._robot''title_robot''rest_robot''._robot']",
          "land:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] land:grid-rows-[minmax(0,1fr)_auto_auto_minmax(0,1fr)] land:[grid-template-areas:'._robot''title_robot''rest_robot''._robot'] land:gap-y-2",
        ].join(" ")}
      >
        <h1 className="self-end font-audiowide uppercase [grid-area:title]">
          <span
            className="cs-rise block text-[clamp(2.25rem,min(13vw,10dvh),6rem)] leading-[0.95] tracking-wide text-neutral-200"
            style={{ "--cs-delay": "0.15s" }}
          >
            SLIoT
          </span>
          <span
            className="cs-rise mt-2 block text-[clamp(1.1rem,min(5.6vw,4.5dvh),3rem)] leading-tight text-[#29FF08] short:mt-1"
            style={{ "--cs-delay": "0.28s" }}
          >
            Challenge {edition.year}
          </span>
        </h1>

        <div className="min-h-0 [grid-area:robot]">
          <RobotStage />
        </div>

        <div className="self-start [grid-area:rest] lg:mt-4 land:mt-0">
          <p
            className="cs-rise max-w-[44ch] text-pretty text-base leading-relaxed text-neutral-200 md:text-lg short:text-sm short:leading-normal"
            style={{ "--cs-delay": "0.45s" }}
          >
            <span className="shorter:hidden">
              Sri Lanka&apos;s biggest IoT competition returns for school students, university
              undergraduates and innovators across the island.{" "}
            </span>
            <span className="text-white">{edition.tagline}</span>
          </p>
          <SocialLinks className="mt-5 md:mt-8 short:mt-3" />
        </div>
      </div>

      <footer className="relative z-2 mt-3 shrink-0 pb-7 md:pb-9 short:mt-1 short:pb-6">
        <LaunchMarquee />
        <p className="mx-auto mt-8 w-full max-w-7xl px-5 text-xs text-neutral-400 md:px-10 short:hidden">
          &copy; {new Date().getFullYear()} SLIoT Challenge. Department of Computer Science &amp;
          Engineering, University of Moratuwa.
        </p>
      </footer>
    </main>
  );
};

export default ComingSoon;
