import { Spotlight } from "@/components/ui/Spotlight";
import RobotStage from "@/components/coming-soon/RobotStage";
import SocialLinks from "@/components/coming-soon/SocialLinks";
import LaunchMarquee from "@/components/coming-soon/LaunchMarquee";
import { logo } from "@/assets";
import { edition } from "@/config/site.mjs";

// Teaser page shown at "/" while COMING_SOON is on (src/config/site.mjs).
// Phones: logo, title, robot, copy + links, banner. Desktop: text left, robot right.
const ComingSoon = () => {
  return (
    <main className="relative isolate flex min-h-[100dvh] flex-col overflow-hidden font-alexandria">
      {/* Same three light beams as the home hero */}
      <div aria-hidden="true">
        <Spotlight className="h-screen -top-40 -left-10 md:-left-32 md:-top-20" fill="white" />
        <Spotlight className="sm:top-10 left-full h-screen sm:w-[50vw]" fill="#73C72A" />
        <Spotlight className="sm:top-10 md:top-28 left-80 h-screen sm:w-[50vw]" fill="blue" />
      </div>

      <header className="relative z-2 mx-auto flex w-full max-w-7xl items-center justify-between px-5 pt-5 md:px-10 md:pt-8">
        <img
          src={logo}
          alt="SLIoT"
          width={1518}
          height={813}
          className="cs-rise h-auto w-[92px] md:w-[116px]"
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

      <div className="relative z-2 mx-auto grid w-full max-w-7xl flex-1 items-center gap-x-10 gap-y-2 px-5 py-4 [grid-template-areas:'title''robot''rest'] md:px-10 md:py-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:[grid-template-areas:'title_robot''rest_robot'] lg:content-center">
        <h1 className="self-end font-audiowide uppercase [grid-area:title]">
          <span
            className="cs-rise block text-[clamp(3.25rem,13vw,6rem)] leading-[0.95] tracking-wide text-neutral-200"
            style={{ "--cs-delay": "0.15s" }}
          >
            SLIoT
          </span>
          <span
            className="cs-rise mt-2 block text-[clamp(1.45rem,5.6vw,3rem)] leading-tight text-[#29FF08]"
            style={{ "--cs-delay": "0.28s" }}
          >
            Challenge {edition.year}
          </span>
        </h1>

        <div className="[grid-area:robot] lg:py-6">
          <RobotStage />
        </div>

        <div className="self-start [grid-area:rest] lg:mt-6">
          <p
            className="cs-rise max-w-[44ch] text-pretty text-base leading-relaxed text-neutral-200 md:text-lg"
            style={{ "--cs-delay": "0.45s" }}
          >
            Sri Lanka&apos;s biggest IoT competition returns for school students, university
            undergraduates and innovators across the island.{" "}
            <span className="text-white">{edition.tagline}</span>
          </p>
          <SocialLinks className="mt-6 md:mt-8" />
        </div>
      </div>

      <footer className="relative z-2 mt-4 pb-7 md:pb-9">
        <LaunchMarquee />
        <p className="mx-auto mt-8 w-full max-w-7xl px-5 text-xs text-neutral-400 md:px-10">
          &copy; {new Date().getFullYear()} SLIoT Challenge. Department of Computer Science &amp;
          Engineering, University of Moratuwa.
        </p>
      </footer>
    </main>
  );
};

export default ComingSoon;
