import Image from "next/image";
import type { CSSProperties } from "react";
import { ArrowDown } from "lucide-react";
import { howStaircaseBackdrop } from "@/assets";
import { steps, type Step } from "@/content/steps";
import { StaircaseScene } from "@/components/site/staircase-scene";
import { cn } from "@/lib/utils";

/**
 * How to take part: a 6-step architectural staircase ascent.
 * - Full motion (`diag:` & `scene:`): 100svh pinned camera climb from Step 01 at the foot
 *   of the stairs up-right to Step 06 at the summit, with each stair tread lighting up as you reach it.
 * - Reduced motion: clean static vertical staircase stack with full readability.
 */
export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="relative overflow-x-clip">
      <StaircaseScene>
        {/* Dark-aurora monumental architectural staircase backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_14%,#000_86%,transparent)]"
        >
          <div data-stair-backdrop className="absolute inset-[-4%]">
            <Image
              src={howStaircaseBackdrop}
              alt=""
              fill
              sizes="100vw"
              quality={75}
              className="object-cover object-center opacity-60 sm:opacity-70"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-abyss/80 via-abyss/35 to-abyss/85" />
          <div className="absolute inset-0 bg-[radial-gradient(62%_52%_at_18%_18%,rgb(1_6_16/0.82),transparent_100%)]" />
          <div className="grain absolute inset-0" />
        </div>

        {/* Section heading + Skip control */}
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-3 px-4 pt-20 sm:gap-5 sm:px-8 md:pt-24 diag:pt-0 scene:pt-0">
          <div className="flex max-w-3xl flex-col gap-2.5 diag:gap-1 scene:gap-1">
            <h2
              id="how-title"
              className="font-display text-display-lg text-foam diag:text-[clamp(2rem,5.4svh,3rem)] diag:leading-[0.9] scene:text-[clamp(2.125rem,5.4svh,4.25rem)] scene:leading-[0.9]"
            >
              How to take part
            </h2>
            <p className="max-w-[56ch] text-pretty text-body-lg text-haze diag:text-[clamp(0.8125rem,1.8svh,1rem)] diag:leading-snug scene:text-[clamp(0.875rem,1.8svh,1.0625rem)] scene:leading-snug">
              Six steps from registration to the finale. Everything after registration happens in the team portal, with your team code.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              data-stair-counter
              aria-hidden="true"
              className="hidden font-display text-title leading-none tracking-wide text-aqua tabular-nums diag:inline-block scene:inline-block"
            >
              01 / {String(steps.length).padStart(2, "0")}
            </span>
            <a
              href="#timeline"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-night/75 px-4 py-2 text-small font-semibold text-haze ring-1 ring-edge/40 transition-colors duration-200 hover:text-foam hover:ring-mint/50 diag:min-h-9 diag:px-3.5 diag:py-1.5 diag:text-caption"
            >
              Skip steps
              <ArrowDown className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Ascending 6-stair viewport */}
        <div
          data-stair-viewport
          className="mt-10 pb-20 md:pb-24 diag:relative diag:mt-2 diag:min-h-0 diag:flex-1 diag:overflow-hidden diag:pb-0 scene:relative scene:mt-[clamp(0.5rem,1.6svh,1.25rem)] scene:min-h-0 scene:flex-1 scene:overflow-hidden scene:pb-0"
        >
          <ol
            data-stair-track
            className="relative mx-auto flex max-w-3xl flex-col gap-6 px-4 sm:px-8 diag:mx-0 diag:block diag:h-full diag:w-full diag:max-w-none diag:px-0 scene:mx-0 scene:block scene:h-full scene:w-full scene:max-w-none scene:px-0"
          >
            {/* Architectural SVG stair risers + glowing climb rail across Steps 01 -> 06 */}
            <li aria-hidden="true" className="pointer-events-none hidden list-none diag:block scene:block">
              <svg
                data-stair-geometry
                width="1"
                height="1"
                className="pointer-events-none absolute left-0 top-0 z-0 overflow-visible"
              >
                <defs>
                  <linearGradient id="stair-riser-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(2 54 73 / 0.42)" />
                    <stop offset="55%" stopColor="rgb(1 18 37 / 0.55)" />
                    <stop offset="100%" stopColor="rgb(1 6 16 / 0)" />
                  </linearGradient>
                </defs>
                <polygon data-stair-riser-fill fill="url(#stair-riser-grad)" />
                <path
                  data-stair-line-base
                  fill="none"
                  stroke="rgb(58 143 151 / 0.42)"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  data-stair-line-fill
                  fill="none"
                  stroke="#85fff0"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-[0_0_8px_rgb(133_255_240/0.65)]"
                />
                <circle
                  data-stair-head
                  r="4.5"
                  fill="#85fff0"
                  className="opacity-0 drop-shadow-[0_0_10px_rgb(133_255_240/0.95)]"
                />
              </svg>
            </li>

            {steps.map((step, i) => {
              const stepNum = String(i + 1).padStart(2, "0");

              return (
                <li
                  key={step.title}
                  data-stair-item
                  style={{ "--i": i } as CSSProperties}
                  className={cn(
                    "group relative",
                    "diag:absolute diag:left-[calc(var(--stair-ox,20px)+var(--i)*var(--stair-sx,240px))] diag:top-[calc(var(--stair-oy,160px)-var(--i)*var(--stair-sy,128px))] diag:w-[var(--stair-card-w,17rem)]",
                    "scene:absolute scene:left-[calc(var(--stair-ox,48px)+var(--i)*var(--stair-sx,300px))] scene:top-[calc(var(--stair-oy,240px)-var(--i)*var(--stair-sy,136px))] scene:w-[var(--stair-card-w,23rem)]",
                  )}
                >
                  <StairStepCard
                    step={step}
                    stepNum={stepNum}
                    index={i}
                    total={steps.length}
                  />
                </li>
              );
            })}
          </ol>
        </div>

        {/* Ascent progress indicator */}
        <div
          aria-hidden="true"
          className="mx-auto mt-3 hidden w-full max-w-7xl px-4 sm:px-8 diag:mt-2 diag:block scene:mt-[clamp(0.5rem,1.5svh,1rem)] scene:block"
        >
          <div className="h-px w-full bg-ocean/80">
            <div
              data-stair-progress
              className="h-px w-full origin-left scale-x-0 bg-aqua shadow-[0_0_8px_rgb(133_255_240/0.8)]"
            />
          </div>
        </div>
      </StaircaseScene>
    </section>
  );
}

function StairStepCard({
  step,
  stepNum,
  index,
  total,
}: {
  step: Step;
  stepNum: string;
  index: number;
  total: number;
}) {
  return (
    <article
      data-stair-card
      className={cn(
        "relative z-10 rounded-2xl p-1.5 transition-[transform,box-shadow,background-color,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        // Solid outer shell so background staircase lines never bleed behind card copy
        "bg-night/95 ring-1 ring-edge/45 shadow-[0_14px_30px_-14px_rgb(1_6_16/0.9)]",
        "group-data-[stair-state=active]:-translate-y-1.5 group-data-[stair-state=active]:bg-deep/75 group-data-[stair-state=active]:ring-aqua/85 group-data-[stair-state=active]:shadow-[0_18px_40px_-12px_rgb(133_255_240/0.35)]",
        "group-data-[stair-state=climbed]:bg-night/95 group-data-[stair-state=climbed]:ring-mint/45",
        "group-data-[stair-state=upcoming]:bg-abyss/95 group-data-[stair-state=upcoming]:ring-ocean/80",
      )}
    >
      <div
        className={cn(
          "relative flex flex-col gap-2 overflow-hidden rounded-[calc(1rem-0.375rem)] bg-night p-4 shadow-[inset_0_1px_0_rgb(221_247_239/0.16)] sm:p-5 diag:gap-1.5 diag:p-3.5 scene:gap-[clamp(0.35rem,0.8svh,0.55rem)] scene:p-[clamp(0.9rem,2svh,1.35rem)]",
          "bg-gradient-to-b from-deep/45 via-night to-abyss",
          "group-data-[stair-state=active]:from-deep group-data-[stair-state=active]:via-night group-data-[stair-state=active]:to-abyss",
          "group-data-[stair-state=upcoming]:from-night group-data-[stair-state=upcoming]:to-abyss",
        )}
      >
        {/* Ghosted Bebas step numeral on the stair tread */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute right-3.5 top-1.5 select-none font-display text-[3.5rem] leading-none tabular-nums transition-colors duration-300 diag:text-[2.75rem] scene:text-[clamp(2.5rem,5.2svh,3.75rem)]",
            "text-foam/[0.1] group-data-[stair-state=active]:text-aqua/25 group-data-[stair-state=climbed]:text-mint/15",
          )}
        >
          {stepNum}
        </span>

        <p className="flex items-center gap-2 pr-12 text-caption font-medium text-haze tabular-nums">
          <span>
            Step {stepNum} / {String(total).padStart(2, "0")}
          </span>
        </p>

        <h3 className="pr-10 text-title font-semibold leading-snug text-foam diag:text-body-lg scene:text-[clamp(1.0625rem,2.2svh,1.3rem)]">
          <span className="sr-only">Step {index + 1}: </span>
          {step.title}
        </h3>

        <p className="max-w-[38ch] text-pretty text-small text-haze diag:text-[0.8125rem] diag:leading-snug scene:text-[clamp(0.8125rem,1.65svh,0.9375rem)] scene:leading-[1.5]">
          {step.body}
        </p>
      </div>

      {/* Illuminated stair tread nosing strip */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none mt-1 block h-0.5 w-full rounded-full transition-colors duration-300",
          "bg-mint/55 group-data-[stair-state=active]:bg-aqua group-data-[stair-state=active]:shadow-[0_0_12px_rgb(133_255_240/0.85)] group-data-[stair-state=upcoming]:bg-ocean",
        )}
      />
    </article>
  );
}
