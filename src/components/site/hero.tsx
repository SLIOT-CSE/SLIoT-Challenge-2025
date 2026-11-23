import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import HeroFigure from "@/components/HeroFigure";
import { Button } from "@/components/ui/button";
import { LiveChip } from "@/components/site/live-chip";
import { HeroScroll } from "@/components/site/hero-scroll";
import { hero, site } from "@/content/site";
import { routes } from "@/content/navigation";
import type { Stage } from "@/lib/competition";
import { cn } from "@/lib/utils";

/**
 * Hero: the SLIoT figure and the title carry the brand (PRODUCT.md principle 1).
 * Desktop: title left, figure right with its cut right edge on the screen edge.
 * Phone: figure on top bleeding off the right edge, title and actions below.
 * The load sequence is CSS (intro-* classes), so it plays before JavaScript arrives.
 */
export function Hero({ stage, now }: { stage: Stage; now: Date }) {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      <HeroScroll>
        <Backdrop />

        {/* Desktop figure: anchored to the section's right edge, bottom fades into the next section */}
        <div
          data-hero-figure
          className="intro-figure pointer-events-none absolute bottom-0 right-0 hidden h-[min(90svh,58rem)] lg:block"
        >
          <HeroFigure
            priority
            sizes="(min-width: 1024px) 55vw, 1px"
            className="fig-fade-bottom relative h-full"
          />
        </div>

        <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-4 pb-14 pt-24 sm:px-8 lg:pb-24 lg:pt-32">
          {/* Phone and tablet figure */}
          <div className="intro-figure pointer-events-none -mb-10 -mr-4 self-end sm:-mb-16 sm:-mr-8 lg:hidden">
            <HeroFigure
              priority
              sizes="(max-width: 1023px) 70vw, 1px"
              className="fig-fade-bottom relative h-[min(30svh,15rem)] sm:h-[min(38svh,26rem)]"
            />
          </div>

          <div className="relative flex max-w-[40rem] flex-col items-start gap-5 sm:gap-6 lg:gap-8">
            <LiveChip stage={stage} now={now} className="intro-rise [--delay:0.9s]" />

            <h1 id="hero-title" className="font-display text-display-xl text-foam">
              <span className="sr-only">{hero.titleLines.flat().join(" ")}</span>
              <span aria-hidden="true">
                {hero.titleLines.map((words, line) => (
                  <span key={line} className="block">
                    {words.map((word, i) => (
                      <span
                        key={word}
                        className={cn(
                          "inline-block overflow-hidden pb-[0.04em] align-top lg:block",
                          i < words.length - 1 && "mr-[0.22em] lg:mr-0",
                        )}
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

            <p className="intro-rise max-w-[46ch] text-pretty text-body text-haze max-sm:order-4 sm:text-body-lg [--delay:0.55s]">{hero.lead}</p>

            <div className="intro-rise flex flex-wrap items-center gap-3 max-sm:order-3 [--delay:0.7s]">
              <Button asChild size="lg" trailingIcon={<ArrowUpRight className="size-[1.125rem]" strokeWidth={1.75} />}>
                <Link href={routes.register}>Register your team</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <a href="#how-it-works">How it works</a>
              </Button>
            </div>

            <p className="intro-rise max-w-[50ch] text-caption text-haze max-sm:order-5 [--delay:0.85s]">{site.credit}</p>
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
