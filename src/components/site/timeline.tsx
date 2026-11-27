import Image from "next/image";
import type { CSSProperties } from "react";
import { ArrowDown, Check } from "lucide-react";
import { timelineBackdrop } from "@/assets";
import type { Deadlines } from "@/content/deadlines";
import { timelineFor, type TimelineEvent } from "@/content/timeline";
import { dateParts } from "@/lib/competition";
import { TimelineScene } from "@/components/site/timeline-scene";
import { cn } from "@/lib/utils";

type Status = "past" | "next" | "future";

/**
 * The road to the finale (Option 3: Alternating Chronology + Curved Box-to-Box Arrows).
 * - Full-motion (`motion-safe:`, all viewports): 100svh pinned sideways scroll with
 *   alternating Double-Bezel milestone cards linked by self-drawing curved SVG arrows.
 * - Reduced motion: clean static left-rail vertical stack of the same cards.
 */
export function Timeline({ now, deadlines }: { now: Date; deadlines: Deadlines }) {
  const timeline = timelineFor(deadlines);
  const nextIndex = timeline.findIndex((e) => e.dateTba || Date.parse(e.at) >= now.getTime());
  const status = (i: number): Status => (nextIndex === -1 || i < nextIndex ? "past" : i === nextIndex ? "next" : "future");

  return (
    <section id="timeline" aria-labelledby="timeline-title" className="relative overflow-x-clip">
      <TimelineScene>
        {/* Architectural dark light-corridor backdrop masked smoothly into abyss */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_14%,#000_86%,transparent)]"
        >
          <Image
            src={timelineBackdrop}
            alt=""
            fill
            sizes="100vw"
            quality={75}
            className="object-cover object-center opacity-70 sm:opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-abyss/60 via-abyss/20 to-abyss/65" />
          <div className="absolute inset-0 bg-[radial-gradient(58%_45%_at_22%_16%,rgb(1_6_16/0.68),transparent_100%)]" />
          <div className="grain absolute inset-0" />
        </div>

        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-3 px-4 pt-20 sm:gap-5 sm:px-8 md:pt-24 motion-safe:pt-0">
          <div className="flex max-w-3xl flex-col gap-2.5 motion-safe:gap-1">
            <h2
              id="timeline-title"
              className="font-display text-display-lg text-foam motion-safe:text-[clamp(1.85rem,4.6svh,3rem)] motion-safe:leading-[0.9] md:motion-safe:text-[clamp(2.125rem,5.4svh,4.25rem)]"
            >
              The road to the finale
            </h2>
          </div>
          <a
            href="#prizes"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-night/75 px-4 py-2 text-small font-semibold text-haze ring-1 ring-edge/40 transition-colors duration-200 hover:text-foam hover:ring-mint/50 motion-safe:min-h-9 motion-safe:px-3.5 motion-safe:py-1.5 motion-safe:text-caption md:motion-safe:min-h-11 md:motion-safe:px-4 md:motion-safe:py-2 md:motion-safe:text-small"
          >
            Skip timeline
            <ArrowDown className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </a>
        </div>

        {/* Horizontal alternating track across all full-motion viewports (`motion-safe:`), plain stack when reduced-motion */}
        <div
          data-timeline-viewport
          className="mt-10 pb-20 md:pb-24 motion-safe:mt-[clamp(0.4rem,1.2svh,1.5rem)] motion-safe:min-h-0 motion-safe:flex-1 motion-safe:overflow-x-auto motion-safe:pb-0"
        >
          <ol
            data-timeline-track
            className="relative mx-auto flex max-w-3xl flex-col px-4 sm:px-8 motion-safe:mx-0 motion-safe:h-full motion-safe:w-max motion-safe:max-w-none motion-safe:flex-row motion-safe:items-stretch md:motion-safe:px-[max(2rem,calc((100vw-80rem)/2+2rem))]"
          >
            {/* Dynamic curved SVG box-to-box arrows rendered inside the horizontal track */}
            <li aria-hidden="true" className="pointer-events-none hidden list-none motion-safe:block">
              <svg
                data-timeline-arrows
                width="1"
                height="1"
                className="pointer-events-none absolute left-0 top-0 z-10 overflow-visible"
              >
                {timeline.slice(0, -1).map((event, i) => (
                  <g key={event.title} data-arrow-seg={i}>
                    <path
                      data-arrow-base
                      fill="none"
                      stroke="rgb(58 143 151 / 0.28)"
                      strokeWidth="1.5"
                      strokeDasharray="3 5"
                    />
                    <path
                      data-arrow-draw=""
                      data-arrow-fill
                      fill="none"
                      stroke="#85fff0"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      className="drop-shadow-[0_0_8px_rgb(133_255_240/0.6)]"
                    />
                    <path
                      data-arrow-head
                      d="M -8 -4.5 L 1 0 L -8 4.5"
                      fill="none"
                      stroke="#85fff0"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-0 drop-shadow-[0_0_8px_rgb(133_255_240/0.8)]"
                    />
                  </g>
                ))}
              </svg>
            </li>

            {timeline.map((event, i) => {
              const s = status(i);
              const { day, month } = dateParts(event.at, "long");
              const isLast = i === timeline.length - 1;
              const isTopLane = i % 2 === 0;
              const stepNum = String(i + 1).padStart(2, "0");

              return (
                <li
                  key={event.title}
                  data-timeline-item
                  style={{ "--i": i } as CSSProperties}
                  className={cn(
                    "relative pb-6 pl-11 last:pb-0 sm:pl-12",
                    "motion-safe:grid motion-safe:w-[16.75rem] motion-safe:shrink-0 motion-safe:grid-rows-[1fr_clamp(1.5rem,3.5svh,3.25rem)_1fr] motion-safe:pb-0 motion-safe:pl-0 sm:motion-safe:w-[18.25rem] md:motion-safe:w-[19.5rem] md:motion-safe:grid-rows-[1fr_clamp(2rem,5svh,3.25rem)_1fr] lg:motion-safe:w-[22rem] xl:motion-safe:w-[24rem]",
                  )}
                >
                  {/* Reduced-motion vertical rail */}
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute bottom-0 left-[13px] top-6 w-px motion-safe:hidden",
                        s === "past" ? "bg-mint" : "bg-ocean",
                      )}
                    />
                  )}

                  {/* Reduced-motion left node */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute left-0 top-1 grid size-[27px] place-items-center rounded-full border-2 bg-abyss motion-safe:hidden",
                      s === "past" && "border-mint text-mint",
                      s === "next" && "border-aqua shadow-signal",
                      s === "future" && "border-ocean",
                    )}
                  >
                    {s === "past" && <Check className="size-3.5" strokeWidth={3} />}
                    {s === "next" && <span className="size-2 rounded-full bg-aqua" />}
                  </span>

                  {/* Row 1 (top lane: odd milestones 01, 03, 05, ...) */}
                  <div className="hidden motion-safe:flex motion-safe:flex-col motion-safe:justify-end motion-safe:pr-3 md:motion-safe:pr-4 xl:motion-safe:pr-5">
                    {isTopLane && (
                      <MilestoneCard
                        event={event}
                        day={day}
                        month={month}
                        stepNum={stepNum}
                        total={timeline.length}
                        status={s}
                      />
                    )}
                  </div>

                  {/* Row 2 (open central channel for curved box-to-box arrows) */}
                  <div aria-hidden="true" className="hidden motion-safe:block" />

                  {/* Row 3 (bottom lane: even milestones 02, 04, 06, ...) */}
                  <div className="hidden motion-safe:flex motion-safe:flex-col motion-safe:justify-start motion-safe:pr-3 md:motion-safe:pr-4 xl:motion-safe:pr-5">
                    {!isTopLane && (
                      <MilestoneCard
                        event={event}
                        day={day}
                        month={month}
                        stepNum={stepNum}
                        total={timeline.length}
                        status={s}
                      />
                    )}
                  </div>

                  {/* Reduced-motion vertical stack card */}
                  <div className="relative z-10 motion-safe:hidden">
                    <MilestoneCard
                      event={event}
                      day={day}
                      month={month}
                      stepNum={stepNum}
                      total={timeline.length}
                      status={s}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Scroll progress through the horizontal track */}
        <div
          aria-hidden="true"
          className="mx-auto mt-3 hidden w-full max-w-7xl px-4 sm:px-8 motion-safe:mt-[clamp(0.35rem,1.2svh,1.25rem)] motion-safe:block"
        >
          <div className="h-px w-full bg-ocean/80">
            <div data-timeline-progress className="h-px w-full origin-left scale-x-0 bg-aqua shadow-[0_0_8px_rgb(133_255_240/0.8)]" />
          </div>
        </div>
      </TimelineScene>
    </section>
  );
}

function MilestoneCard({
  event,
  day,
  month,
  stepNum,
  total,
  status,
}: {
  event: TimelineEvent;
  day: string;
  month: string;
  stepNum: string;
  total: number;
  status: Status;
}) {
  const isPast = status === "past";
  const isNext = status === "next";

  return (
    <article
      data-timeline-card
      className={cn(
        "rounded-2xl p-1.5 transition-[box-shadow,border-color] duration-300 motion-safe:p-1 md:motion-safe:p-[clamp(0.3rem,0.5svh,0.425rem)]",
        isNext
          ? "bg-mint/14 ring-1 ring-aqua/65 shadow-[0_0_28px_-8px_rgb(133_255_240/0.35)]"
          : isPast
            ? "bg-foam/[0.04] ring-1 ring-mint/25"
            : "bg-foam/[0.04] ring-1 ring-edge/30",
      )}
    >
      <div
        className={cn(
          "relative flex flex-col gap-1.5 overflow-hidden rounded-[calc(1rem-0.375rem)] p-4 shadow-[inset_0_1px_0_rgb(221_247_239/0.12)] sm:p-5 motion-safe:gap-1 motion-safe:p-3 md:motion-safe:gap-[clamp(0.25rem,0.6svh,0.45rem)] md:motion-safe:p-[clamp(0.85rem,1.9svh,1.4rem)]",
          isNext ? "bg-gradient-to-b from-deep/90 via-night/95 to-abyss/95" : "bg-gradient-to-b from-night/92 to-abyss/95",
        )}
      >
        {/* Oversized ghosted step numeral */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute right-3.5 top-2 select-none font-display text-[3.5rem] leading-none tabular-nums motion-safe:text-[2.25rem] md:motion-safe:text-[clamp(2.5rem,5.2svh,3.75rem)]",
            isNext ? "text-aqua/18" : "text-foam/[0.08]",
          )}
        >
          {stepNum}
        </span>

        <p className="flex flex-wrap items-center gap-2.5 pr-12 text-caption text-haze">
          <span className="tabular-nums">
            {stepNum} / {String(total).padStart(2, "0")}
            {isPast && <span className="sr-only"> (done)</span>}
          </span>
        </p>

        <p className="flex items-baseline gap-2 pr-12 font-display leading-[0.88]">
          {event.dateTba ? (
            <span
              className={cn(
                "text-[clamp(2.5rem,4.4vw,3.5rem)] motion-safe:text-[clamp(1.65rem,3.6svh,2.25rem)] md:motion-safe:text-[clamp(2rem,4.4svh,3.25rem)]",
                isPast ? "text-haze" : isNext ? "text-aqua" : "text-foam",
              )}
            >
              TBA
            </span>
          ) : (
            <time dateTime={event.at} className="flex flex-wrap items-baseline gap-x-2">
              <span
                className={cn(
                  "text-[clamp(2.5rem,4.4vw,3.5rem)] motion-safe:text-[clamp(1.65rem,3.6svh,2.25rem)] md:motion-safe:text-[clamp(2rem,4.4svh,3.25rem)]",
                  isPast ? "text-haze" : isNext ? "text-aqua" : "text-foam",
                )}
              >
                {day}
              </span>
              <span
                className={cn(
                  "text-[clamp(1.25rem,2.1vw,1.75rem)] motion-safe:text-[clamp(0.95rem,1.9svh,1.2rem)] md:motion-safe:text-[clamp(1.05rem,2.2svh,1.55rem)]",
                  isPast ? "text-haze" : "text-mint",
                )}
              >
                {month}
              </span>
            </time>
          )}
        </p>

        <h3 className="text-body-lg font-semibold leading-snug text-foam motion-safe:text-[0.9375rem] motion-safe:leading-tight md:motion-safe:text-[clamp(1rem,2.1svh,1.225rem)] md:motion-safe:leading-snug">
          {event.title}
        </h3>
        <p className="max-w-[38ch] text-pretty text-small text-haze motion-safe:text-[0.75rem] motion-safe:leading-snug md:motion-safe:text-[clamp(0.8125rem,1.65svh,0.9375rem)] md:motion-safe:leading-[1.5]">
          {event.body}
        </p>
      </div>
    </article>
  );
}
