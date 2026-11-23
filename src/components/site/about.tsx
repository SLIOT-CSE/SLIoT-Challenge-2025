import { about } from "@/content/about";
import { IslandMap } from "@/components/site/island-map/island-map";
import { AboutScene } from "@/components/site/about-scene";

/**
 * About: three beats beside a map of Sri Lanka. Readable as is; on desktop the scene pins
 * and the map assembles as you scroll (coastline, district nodes, signal lines, count).
 */
export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="relative overflow-x-clip">
      <AboutScene>
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-8 md:min-h-[100svh] md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:gap-16 md:py-24 lg:gap-24">
          <div className="flex flex-col gap-10">
            <h2 id="about-title" className="text-balance font-display text-display-lg text-foam">
              {about.title}
            </h2>

            <ol className="relative flex flex-col gap-8 pl-8">
              {/* Progress rail: fills as the beats play */}
              <span aria-hidden="true" className="absolute bottom-2 left-[5px] top-2 w-px bg-ocean" />
              <span
                aria-hidden="true"
                data-about-rail
                className="absolute bottom-2 left-[5px] top-2 w-px origin-top bg-aqua shadow-[0_0_10px_rgb(133_255_240/0.7)]"
              />
              {about.beats.map((beat) => (
                <li key={beat.title} data-about-beat className="relative flex flex-col gap-2">
                  <span
                    aria-hidden="true"
                    className="absolute -left-8 top-1.5 size-[11px] rounded-full border-2 border-aqua bg-abyss"
                  />
                  <h3 className="text-title font-semibold text-foam">{beat.title}</h3>
                  <p className="max-w-[52ch] text-pretty text-body text-haze">{beat.body}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* The map (400x640) plus its caption fits the pinned screen: width follows the viewport height */}
          <figure className="relative mx-auto w-full max-w-[min(26rem,calc((100svh-9rem)*0.625))] md:max-w-[min(30rem,calc((100svh-11rem)*0.625))]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-[-12%] rounded-full bg-[radial-gradient(closest-side,rgb(11_90_109/0.45),transparent)]"
            />
            <IslandMap className="relative" />
            <figcaption className="relative mt-4 flex items-baseline justify-center gap-3 md:justify-start">
              <span data-about-count className="font-display text-display-md leading-none text-aqua">
                {about.stat.value}
              </span>
              <span className="text-small text-haze">{about.stat.label}</span>
            </figcaption>
          </figure>
        </div>
      </AboutScene>
    </section>
  );
}
