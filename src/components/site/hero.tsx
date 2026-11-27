import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import HeroAvatar from "@/components/HeroAvatar";
import { Button } from "@/components/ui/button";
import { HeroNebula } from "@/components/site/hero-nebula";
import { HeroPortalRings } from "@/components/site/hero-rings";
import { HeroScroll } from "@/components/site/hero-scroll";
import { hero, site } from "@/content/site";
import { routes } from "@/content/navigation";
import { cn } from "@/lib/utils";

/**
 * Hero: the SLIoT avatar and the title carry the brand (PRODUCT.md principle 1).
 * Centred at every width: the title at the top over the avatar's head, the avatar
 * floating behind it (its cloth waves, see HeroAvatar), the lead and actions below.
 * The load sequence is CSS (intro-* classes), so it plays before JavaScript arrives.
 */
export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      <HeroScroll>
        <Backdrop />

        <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col items-center px-4 pb-10 pt-24 text-center sm:px-8 lg:pb-14 lg:pt-28">
          <h1 id="hero-title" className="font-display text-display-xl text-foam [text-shadow:0_4px_32px_rgb(1_6_16/0.6)]">
            <span className="sr-only">{hero.titleLines.flat().join(" ")}</span>
            <span aria-hidden="true">
              {hero.titleLines.map((words, line) => (
                <span key={line} className={cn("block", line === hero.titleLines.length - 1 && "text-aqua")}>
                  {words.map((word, i) => (
                    <span
                      key={word}
                      className={cn("inline-block overflow-hidden pb-[0.04em] align-top", i < words.length - 1 && "mr-[0.22em]")}
                    >
                      <span className="intro-line inline-block" style={{ "--delay": `${0.2 + (line + i) * 0.11}s` }}>
                        {word}
                      </span>
                    </span>
                  ))}
                </span>
              ))}
            </span>
          </h1>

          {/* The avatar floats centred with its head over the aqua title line and runs past the
              bottom of the hero, fading out. Paint order is DOM order: the title (earlier) goes
              under it, the lead and actions (later) go over it. */}
          <div
            data-hero-figure
            className="intro-figure pointer-events-none absolute inset-x-0 top-[16svh] flex justify-center sm:top-[16svh] lg:top-[22svh]"
          >
            <HeroAvatar priority className="fig-fade-bottom h-[min(88svh,48rem)] sm:h-[min(100svh,58rem)] lg:h-[min(108svh,72rem)]" />
          </div>

          {/* Pushes the lead and actions below the avatar's chest; a soft dark pool keeps them readable over the fabric */}
          <div className="relative isolate mt-auto flex max-w-[40rem] flex-col items-center gap-5 pt-[min(30svh,16rem)] sm:gap-6 lg:pt-[min(28svh,18rem)]">
            <div className="absolute inset-x-0 bottom-0 top-[min(30svh,16rem)] lg:top-[min(28svh,18rem)]" aria-hidden="true">
              <div className="absolute -inset-x-16 -inset-y-12 -z-10 rounded-[50%] bg-[radial-gradient(closest-side,rgb(1_6_16/0.92),rgb(1_6_16/0.7)_55%,transparent)]" />
            </div>
            <p className="intro-rise max-w-[46ch] text-pretty text-body text-foam/85 max-sm:order-2 sm:text-body-lg [--delay:0.55s]">{hero.lead}</p>

            <div className="intro-rise flex flex-wrap items-center justify-center gap-2.5 max-sm:order-1 sm:gap-3 [--delay:0.7s]">
              <Button
                asChild
                size="lg"
                className="max-sm:h-11 max-sm:px-4 max-sm:text-small max-sm:[&>span:last-child]:-mr-2 max-sm:[&>span:last-child]:size-8"
                trailingIcon={<ArrowUpRight className="size-4 sm:size-[1.125rem]" strokeWidth={1.75} />}
              >
                <Link href={routes.register}>Register</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="max-sm:h-11 max-sm:px-4 max-sm:text-small">
                <a href="#how-it-works">How it works</a>
              </Button>
            </div>

            <p className="intro-rise max-w-[50ch] text-caption text-haze max-sm:order-3 [--delay:0.85s]">{site.credit}</p>
          </div>
        </div>
      </HeroScroll>
    </section>
  );
}

// Sensor nodes scattered over the sky; a few linked by faint traces. Decorative.
const NODES: [x: number, y: number, delay: number][] = [
  [8, 22, 0.2], [17, 64, 2.1], [26, 12, 3.4], [34, 48, 1.2], [44, 26, 4.1], [52, 70, 0.8],
  [58, 14, 2.9], [66, 40, 1.7], [74, 20, 3.8], [82, 58, 0.5], [90, 30, 2.4], [94, 74, 4.4],
  [12, 86, 3.1], [38, 84, 1.9], [70, 86, 0.1],
];
const TRACES: [a: number, b: number][] = [
  [0, 2], [2, 4], [4, 6], [6, 8], [8, 10], [3, 4], [7, 9], [1, 3],
];

function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      {/* The intro fade sits on a wrapper: a filled CSS animation would override GSAP's scroll fade */}
      <div className="intro-fade absolute inset-0">
        <div data-hero-aurora className="absolute inset-0">
          <div className="aurora-band aurora-a" />
          <div className="aurora-band aurora-b" />
          <div className="aurora-band aurora-c" />
        </div>
      </div>
      {/* Faint drifting particle nebula for a cosmic depth; kept dim so it never competes */}
      <HeroNebula />
      {/* Portal rings: one centred on each side edge, so half of each shows, turning slowly in
          opposite directions, each with a glowing portal in its opening */}
      <HeroPortalRings />
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        {TRACES.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={NODES[a][0]}
            y1={NODES[a][1]}
            x2={NODES[b][0]}
            y2={NODES[b][1]}
            stroke="rgb(133 255 240 / 0.07)"
            strokeWidth="0.12"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {NODES.map(([x, y, delay]) => (
        <span
          key={`${x}-${y}`}
          className="signal-node absolute size-1 -translate-1/2 rounded-full bg-aqua shadow-[0_0_8px_rgb(133_255_240/0.8)]"
          style={{ left: `${x}%`, top: `${y}%`, "--delay": `${delay}s` }}
        />
      ))}
      <div className="grain absolute inset-0" />
      {/* Darkens toward the bottom so the hero hands over to the next section */}
      <div data-hero-shade className="absolute inset-0 bg-gradient-to-b from-abyss/20 via-transparent to-abyss" />
    </div>
  );
}
