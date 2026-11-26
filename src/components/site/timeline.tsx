import Image from "next/image";
import type { CSSProperties } from "react";
import { ArrowDown, Check } from "lucide-react";
import { timelineBackdrop } from "@/assets";
import { timeline, type TimelineEvent } from "@/content/timeline";
import { dateParts } from "@/lib/competition";
import { TimelineScene } from "@/components/site/timeline-scene";
import { cn } from "@/lib/utils";

type Status = "past" | "next" | "future";

/**
 * The road to the finale (Option 3: Alternating Chronology Spine).
 * - Desktop full-motion (`scene:`): height-safe 100svh pinned sideways scroll with Double-Bezel
 *   milestone cards alternating above and below a graduated central spine over the corridor backdrop.
 * - Mobile / tablet full-motion (`diag:`): 100svh pinned camera gliding 1:1 along a 45° SE diagonal rail.
 * - Reduced motion: clean static left-rail vertical stack of the same cards.
 */
export function Timeline({ now }: { now: Date }) {
  const nextIndex = timeline.findIndex((e) => Date.parse(e.at) >= now.getTime());
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

        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-3 px-4 pt-20 sm:gap-5 sm:px-8 md:pt-24 diag:pt-0 scene:pt-0">
          <div className="flex max-w-3xl flex-col gap-2.5 diag:gap-1 scene:gap-1">
            <h2
              id="timeline-title"
              className="font-display text-display-lg text-foam diag:text-[clamp(2rem,5.4svh,3rem)] diag:leading-[0.9] scene:text-[clamp(2.125rem,5.4svh,4.25rem)] scene:leading-[0.9]"
            >
              The road to the finale
            </h2>
            <p className="max-w-[56ch] text-pretty text-body-lg text-haze diag:text-[clamp(0.8125rem,1.8svh,1rem)] diag:leading-snug scene:text-[clamp(0.875rem,1.8svh,1.0625rem)] scene:leading-snug">
              {timeline.length} dates from registration to the grand finale. All times are Sri Lanka time.
            </p>
          </div>
          <a
            href="#prizes"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-night/75 px-4 py-2 text-small font-semibold text-haze ring-1 ring-edge/40 transition-colors duration-200 hover:text-foam hover:ring-mint/50 diag:min-h-9 diag:px-3.5 diag:py-1.5 diag:text-caption"
          >
            Skip timeline
            <ArrowDown className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </a>
        </div>

        {/* Diagonal 45° SE track on mobile/tablet (`diag:`), horizontal alternating spine on desktop (`scene:`), plain stack when reduced-motion */}
        <div
          data-timeline-viewport
          className="mt-10 pb-20 md:pb-24 diag:relative diag:mt-2 diag:min-h-0 diag:flex-1 diag:overflow-hidden diag:pb-0 scene:mt-[clamp(0.5rem,1.6svh,1.5rem)] scene:overflow-x-auto scene:pb-0"
        >
          <ol
            data-timeline-track
            className="relative mx-auto flex max-w-3xl flex-col px-4 sm:px-8 diag:mx-0 diag:block diag:h-full diag:w-full diag:max-w-none diag:px-0 scene:mx-0 scene:w-max scene:max-w-none scene:flex-row scene:items-stretch scene:px-[max(2rem,calc((100vw-80rem)/2+2rem))]"
          >
            {timeline.map((event, i) => {
              const s = status(i);
              const { day, month } = dateParts(event.at);
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
                    "diag:absolute diag:left-[calc(var(--diag-ox,28px)+var(--i)*var(--diag-step,240px))] diag:top-[calc(var(--diag-oy,32px)+var(--i)*var(--diag-step,240px))] diag:w-[var(--diag-card-w,17rem)] diag:p-0",
                    "scene:grid scene:w-[22.5rem] scene:shrink-0 scene:grid-rows-[1fr_clamp(1.5rem,3.4svh,2.25rem)_1fr] scene:pb-0 scene:pl-0 xl:scene:w-[24.5rem]",
                  )}
                >
                  {/* Reduced-motion mobile vertical rail */}
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute bottom-0 left-[13px] top-6 w-px diag:hidden scene:hidden",
                        s === "past" ? "bg-mint" : "bg-ocean",
                      )}
                    />
                  )}

                  {/* Reduced-motion mobile left node */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute left-0 top-1 grid size-[27px] place-items-center rounded-full border-2 bg-abyss diag:hidden scene:hidden",
                      s === "past" && "border-mint text-mint",
                      s === "next" && "border-aqua shadow-signal",
                      s === "future" && "border-ocean",
                    )}
                  >
                    {s === "past" && <Check className="size-3.5" strokeWidth={3} />}
                    {s === "next" && <span className="size-2 rounded-full bg-aqua" />}
                  </span>

                  {/* Mobile / tablet 45° SE diagonal connector + graduated ticks (`diag:`) */}
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      style={{ width: "calc(var(--diag-step, 240px) * 1.4142)" }}
                      className={cn(
                        "pointer-events-none absolute -left-2 -top-2 z-0 hidden h-px origin-left rotate-45 diag:block",
                        s === "past" ? "bg-mint/85 shadow-[0_0_8px_rgb(115_218_190/0.45)]" : "bg-ocean",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 opacity-45 [background-image:repeating-linear-gradient(to_right,currentColor_0_1px,transparent_1px_10px)]",
                          s === "past" ? "text-mint" : "text-edge",
                        )}
                      />
                    </span>
                  )}

                  {/* Mobile / tablet 45° corner node (`diag:`) */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute -left-5 -top-5 z-20 hidden size-6 place-items-center rounded-full border-2 bg-abyss diag:grid",
                      s === "past" && "border-mint text-mint",
                      s === "next" && "border-aqua shadow-signal",
                      s === "future" && "border-ocean",
                    )}
                  >
                    {s === "past" && <Check className="size-3" strokeWidth={3} />}
                    {s === "next" && <span className="size-2 rounded-full bg-aqua" />}
                  </span>

                  {/* Desktop Row 1 (top lane: odd milestones 01, 03, 05, 07, 09) */}
                  <div className="hidden scene:flex scene:flex-col scene:justify-end scene:pr-4 xl:scene:pr-5">
                    {isTopLane && (
                      <>
                        <MilestoneCard
                          event={event}
                          day={day}
                          month={month}
                          stepNum={stepNum}
                          total={timeline.length}
                          status={s}
                        />
                        <div className="flex justify-center">
                          <span
                            aria-hidden="true"
                            className={cn(
                              "h-[clamp(0.5rem,1.4svh,1rem)] w-px",
                              s === "past" ? "bg-mint/70" : s === "next" ? "bg-aqua" : "bg-ocean",
                            )}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Desktop Row 2 (central graduated telemetry spine + crosshair node) */}
                  <div aria-hidden="true" className="relative hidden items-center justify-center scene:flex">
                    <span
                      className={cn(
                        "absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 opacity-45 [background-image:repeating-linear-gradient(to_right,currentColor_0_1px,transparent_1px_10px)]",
                        s === "past" ? "text-mint" : "text-edge",
                      )}
                    />
                    <span
                      className={cn(
                        "absolute top-1/2 h-px -translate-y-1/2",
                        i === 0 ? "left-1/2 right-0" : isLast ? "left-0 right-1/2" : "inset-x-0",
                        s === "past" ? "bg-mint shadow-[0_0_10px_rgb(115_218_190/0.5)]" : "bg-ocean",
                      )}
                    />
                    <span
                      className={cn(
                        "relative z-10 grid size-7 place-items-center rounded-full border-2 bg-abyss",
                        s === "past" && "border-mint text-mint",
                        s === "next" && "size-8 border-aqua shadow-signal",
                        s === "future" && "border-ocean",
                      )}
                    >
                      {s === "past" && <Check className="size-3.5" strokeWidth={3} />}
                      {s === "next" && <span className="size-2.5 rounded-full bg-aqua" />}
                    </span>
                  </div>

                  {/* Desktop Row 3 (bottom lane: even milestones 02, 04, 06, 08) */}
                  <div className="hidden scene:flex scene:flex-col scene:justify-start scene:pr-4 xl:scene:pr-5">
                    {!isTopLane && (
                      <>
                        <div className="flex justify-center">
                          <span
                            aria-hidden="true"
                            className={cn(
                              "h-[clamp(0.5rem,1.4svh,1rem)] w-px",
                              s === "past" ? "bg-mint/70" : s === "next" ? "bg-aqua" : "bg-ocean",
                            )}
                          />
                        </div>
                        <MilestoneCard
                          event={event}
                          day={day}
                          month={month}
                          stepNum={stepNum}
                          total={timeline.length}
                          status={s}
                        />
                      </>
                    )}
                  </div>

                  {/* Mobile / tablet card (for both 45° `diag:` and reduced-motion stack) */}
                  <div className="relative z-10 scene:hidden">
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

        {/* Scroll progress through the track (both desktop `scene:` and mobile 45° `diag:`) */}
        <div
          aria-hidden="true"
          className="mx-auto mt-3 hidden w-full max-w-7xl px-4 sm:px-8 diag:mt-2 diag:block scene:mt-[clamp(0.5rem,1.6svh,1.25rem)] scene:block"
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
      className={cn(
        "rounded-2xl p-1.5 transition-[box-shadow,border-color] duration-300 scene:p-[clamp(0.25rem,0.45svh,0.375rem)]",
        isNext
          ? "bg-mint/14 ring-1 ring-aqua/65 shadow-[0_0_28px_-8px_rgb(133_255_240/0.35)]"
          : isPast
            ? "bg-foam/[0.04] ring-1 ring-mint/25"
            : "bg-foam/[0.04] ring-1 ring-edge/30",
      )}
    >
      <div
        className={cn(
          "relative flex flex-col gap-1.5 overflow-hidden rounded-[calc(1rem-0.375rem)] p-4 shadow-[inset_0_1px_0_rgb(221_247_239/0.12)] sm:p-5 diag:gap-1 diag:p-3.5 scene:gap-[clamp(0.1875rem,0.5svh,0.375rem)] scene:p-[clamp(0.65rem,1.4svh,1.15rem)]",
          isNext ? "bg-gradient-to-b from-deep/90 via-night/95 to-abyss/95" : "bg-gradient-to-b from-night/92 to-abyss/95",
        )}
      >
        {/* Oversized ghosted step numeral */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute right-3.5 top-2 select-none font-display text-[3.5rem] leading-none tabular-nums diag:text-[2.75rem] scene:text-[clamp(2.25rem,4.5svh,3.25rem)]",
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
          <time dateTime={event.at} className="flex items-baseline gap-2">
            <span
              className={cn(
                "text-[clamp(2.5rem,4.4vw,3.5rem)] diag:text-[2.25rem] scene:text-[clamp(1.75rem,3.6svh,2.75rem)]",
                isPast ? "text-haze" : isNext ? "text-aqua" : "text-foam",
              )}
            >
              {day}
            </span>
            <span
              className={cn(
                "text-[clamp(1.25rem,2.1vw,1.75rem)] diag:text-[1.2rem] scene:text-[clamp(1rem,2svh,1.45rem)]",
                isPast ? "text-haze" : "text-mint",
              )}
            >
              {month}
            </span>
          </time>
        </p>

        <h3 className="text-body-lg font-semibold leading-snug text-foam diag:text-body scene:text-[clamp(0.95rem,1.9svh,1.125rem)]">
          {event.title}
        </h3>
        <p className="max-w-[36ch] text-pretty text-small text-haze diag:text-[0.8125rem] diag:leading-snug scene:text-[clamp(0.75rem,1.5svh,0.875rem)] scene:leading-[1.45]">
          {event.body}
        </p>
      </div>
    </article>
  );
}
