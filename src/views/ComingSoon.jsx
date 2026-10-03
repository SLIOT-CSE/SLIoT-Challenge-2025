import MockSite from "@/components/coming-soon/MockSite";
import HeroFigure from "@/components/HeroFigure";
import SocialLinks from "@/components/coming-soon/SocialLinks";
import { logo } from "@/assets";
import { edition } from "@/config/site.mjs";

// Teaser page shown at "/" while COMING_SOON is on (src/config/site.mjs).
// Layers, back to front: aurora light, a blurred mock of the full site, a vignette,
// film grain, then one frosted-glass card with everything that matters.
// The hero figure (cut off on its right and bottom edges) breaks out of the card:
// - stacked (phones, tablets): above the card, taking whatever height is left; its cut
//   right edge runs off the screen edge and its cut bottom edge fades into the card;
// - side by side (lg, and landscape phones): in the card's bottom-right corner, cut
//   edges flush with the card's edges, helmet rising above the card's top edge.
// Always exactly one screen tall (never scrolls); on short screens the copyright
// (short: < 700px tall) and the first sentence (shorter: < 600px) are dropped.
// Same sizes on both figures, so the browser fetches one file
const FIGURE_SIZES = "(min-width: 1024px) 820px, (max-height: 500px) 300px, 400px";

const ComingSoon = () => {
  return (
    <main className="cs-page relative isolate h-[100dvh] overflow-hidden bg-cs-abyss font-montserrat text-cs-aqua">
      {/* Aurora light, the colours of the reference image */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div className="cs-aurora cs-aurora-a" />
        <div className="cs-aurora cs-aurora-b" />
        <div className="cs-aurora cs-aurora-c" />
        <div className="cs-aurora cs-aurora-d" />
      </div>

      <MockSite />

      {/* Pulls the eye to the centre and keeps the mock quiet */}
      <div aria-hidden="true" className="cs-vignette absolute inset-0" />
      <div aria-hidden="true" className="cs-grain absolute inset-0" />

      <div className="relative z-2 mx-auto flex h-full w-full max-w-[66rem] flex-col justify-center lg:max-w-[78rem] px-4 py-4 sm:px-6 land:py-3">
        {/* Stacked layout: the figure row absorbs the leftover height and runs to the
            screen's right edge (-mr matches the page padding) */}
        <div className="relative z-3 -mb-12 -mr-4 flex max-h-[280px] min-h-[96px] flex-1 justify-end sm:-mr-6 sm:max-h-[380px] lg:hidden land:hidden">
          <HeroFigure className="cs-figure-in cs-figure-top pointer-events-none relative h-full" sizes={FIGURE_SIZES} priority />
        </div>

        {/* Only transform animates on this wrapper; opacity or filter here would
            switch off the backdrop blur of the glass inside it */}
        <section
          aria-labelledby="cs-title"
          className="cs-card relative shrink-0 lg:[--cs-text-w:33rem] land:[--cs-fig-rise:2rem] land:[--cs-text-w:33rem]"
        >
          <div className="cs-glass cs-fade-in relative grid rounded-[2rem] px-6 pb-6 pt-6 sm:px-10 sm:pb-10 sm:pt-9 lg:grid-cols-[minmax(0,29rem)_1fr] lg:gap-8 lg:px-12 lg:pb-12 lg:pt-10 short:pt-5 short:sm:pb-8 short:sm:pt-7 land:grid-cols-[minmax(0,30rem)_1fr] land:gap-4 land:px-7 land:pb-4 land:pt-4">
            <div>
              <div className="lg:flex lg:items-center lg:gap-5 land:flex land:items-center land:gap-4">
                <img
                  src={logo}
                  alt="SLIoT"
                  width={1518}
                  height={813}
                  className="cs-rise h-auto w-[76px] sm:w-[96px] short:w-[70px] land:w-[60px]"
                  style={{ "--cs-delay": "0.2s" }}
                />

                <p
                  className="cs-rise mt-5 inline-flex items-center gap-2.5 rounded-full bg-cs-aqua/10 py-1.5 pl-3 pr-3.5 text-xs font-medium uppercase tracking-[0.14em] text-cs-aqua ring-1 ring-inset ring-cs-aqua/30 sm:mt-8 short:mt-4 lg:mt-0 land:mt-0"
                  style={{ "--cs-delay": "0.3s" }}
                >
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="cs-ping absolute inline-flex h-full w-full rounded-full bg-cs-aqua" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-cs-aqua" />
                  </span>
                  {edition.status}
                </p>
              </div>

              <h1 id="cs-title" className="mt-4 lg:mt-8 font-bebas font-normal uppercase leading-[0.88] sm:mt-5 short:mt-3 land:mt-3">
                <span className="block overflow-hidden pt-[0.06em]">
                  <span
                    className="cs-line block text-[clamp(2rem,min(10.5vw,8.5dvh),4.75rem)] tracking-[0.01em] text-cs-aqua"
                    style={{ "--cs-delay": "0.35s" }}
                  >
                    {edition.name}
                  </span>
                </span>
                <span className="block overflow-hidden pt-[0.04em]">
                  <span
                    className="cs-line block text-[clamp(3.25rem,min(19.5vw,15dvh),7.25rem)] tracking-[0.02em] text-cs-aqua"
                    style={{ "--cs-delay": "0.48s" }}
                  >
                    {edition.year}
                  </span>
                </span>
              </h1>

              <p
                className="cs-rise mt-3 max-w-[44ch] text-pretty text-[0.9375rem] leading-[1.65] text-cs-aqua sm:mt-5 sm:text-base short:leading-relaxed land:mt-2 land:text-sm"
                style={{ "--cs-delay": "0.65s" }}
              >
                <span className="shorter:hidden">
                  Sri Lanka&apos;s biggest IoT competition returns for school students, university
                  undergraduates and innovators across the island.{" "}
                </span>
                <span className="font-medium text-cs-aqua">{edition.tagline}</span>
              </p>

              <SocialLinks className="mt-5 sm:mt-8 short:mt-4 land:mt-3" />
            </div>
          </div>

          {/* Side-by-side layout: sits in the card's bottom-right corner, inside a frame
              that spans the room beside the text (see .cs-figure-frame) */}
          <div className="cs-figure-frame z-3 hidden lg:flex land:flex">
            <HeroFigure className="cs-figure-in cs-figure-side relative" sizes={FIGURE_SIZES} priority />
          </div>
        </section>

        <p className="cs-rise mt-5 shrink-0 text-center text-xs leading-relaxed text-cs-aqua/70 short:hidden" style={{ "--cs-delay": "1.2s" }}>
          &copy; {new Date().getFullYear()} SLIoT Challenge &middot; CSE, University of Moratuwa
        </p>
      </div>
    </main>
  );
};

export default ComingSoon;
