import Image from "next/image";
import { ArrowDown, Check } from "lucide-react";
import { timelineBackdrop } from "@/assets";
import { timeline, type TimelineEvent } from "@/content/timeline";
import { dateParts, daysUntil, formatTime, relativeDays } from "@/lib/competition";
import { LiveDot } from "@/components/site/live-dot";
import { TimelineScene } from "@/components/site/timeline-scene";
import { cn } from "@/lib/utils";

type Status = "past" | "next" | "future";

/**
 * The road to the finale (Option 3: Alternating Chronology Spine).
 * - Desktop full-motion (`scene:`): pinned sideways scroll with Double-Bezel milestone cards
 *   alternating above and below a graduated central telemetry spine over the corridor backdrop.
 * - Mobile / tablet / reduced motion: clean left-rail vertical stack of the same cards.
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

        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-4 px-4 pt-20 sm:gap-5 sm:px-8 md:pt-24 scene:pt-0">
          <div className="flex max-w-3xl flex-col gap-3 scene:gap-1.5">
            <h2 id="timeline-title" className="font-display text-display-lg text-foam">
              The road to the finale
            </h2>
            <p className="max-w-[56ch] text-pretty text-body-lg text-haze">
              {timeline.length} dates from registration to the grand finale. All times are Sri Lanka time.
            </p>
          </div>
          <a
            href="#prizes"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-night/75 px-4 py-2 text-small font-semibold text-haze ring-1 ring-edge/40 transition-colors duration-200 hover:text-foam hover:ring-mint/50"
          >
            Skip timeline
            <ArrowDown className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </a>
        </div>

        {/* Natively scrollable sideways if the scene never starts; GSAP takes over on `scene:` */}
        <div data-timeline-viewport className="mt-10 pb-20 md:pb-24 scene:mt-4 scene:overflow-x-auto scene:pb-0 xl:scene:mt-6">
          <ol
            data-timeline-track
            className="relative mx-auto flex max-w-3xl flex-col px-4 sm:px-8 scene:mx-0 scene:w-max scene:max-w-none scene:flex-row scene:items-stretch scene:px-[max(2rem,calc((100vw-80rem)/2+2rem))]"
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
                  className={cn(
                    "relative pb-6 pl-11 last:pb-0 sm:pl-12",
                    "scene:grid scene:w-[22.5rem] scene:shrink-0 scene:grid-rows-[1fr_2rem_1fr] scene:pb-0 scene:pl-0 xl:scene:w-[24rem]",
                  )}
                >
                  {/* Mobile left vertical rail */}
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute bottom-0 left-[13px] top-6 w-px scene:hidden",
                        s === "past" ? "bg-mint" : "bg-ocean",
                      )}
                    />
                  )}

                  {/* Mobile left node */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute left-0 top-1 grid size-[27px] place-items-center rounded-full border-2 bg-abyss scene:hidden",
                      s === "past" && "border-mint text-mint",
                      s === "next" && "border-aqua shadow-signal",
                      s === "future" && "border-ocean",
                    )}
                  >
                    {s === "past" && <Check className="size-3.5" strokeWidth={3} />}
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
                          now={now}
                        />
                        <div className="flex justify-center">
                          <span
                            aria-hidden="true"
                            className={cn("h-3.5 w-px xl:h-4", s === "past" ? "bg-mint/70" : s === "next" ? "bg-aqua" : "bg-ocean")}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Desktop Row 2 (central graduated telemetry spine + crosshair node) */}
                  <div aria-hidden="true" className="relative hidden items-center justify-center scene:flex">
                    {/* Horizontal graduated tick marks */}
                    <span
                      className={cn(
                        "absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 opacity-45 [background-image:repeating-linear-gradient(to_right,currentColor_0_1px,transparent_1px_10px)]",
                        s === "past" ? "text-mint" : "text-edge",
                      )}
                    />
                    {/* Continuous center rail line */}
                    <span
                      className={cn(
                        "absolute top-1/2 h-px -translate-y-1/2",
                        i === 0 ? "left-1/2 right-0" : isLast ? "left-0 right-1/2" : "inset-x-0",
                        s === "past" ? "bg-mint shadow-[0_0_10px_rgb(115_218_190/0.5)]" : "bg-ocean",
                      )}
                    />
                    {/* Crosshair node */}
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
                    {/* Active marker anchored on the spine */}
                    {s === "next" && (
                      <span
                        className={cn(
                          "absolute left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-night/95 px-3 py-1 text-caption font-semibold text-aqua ring-1 ring-aqua/45 shadow-lift",
                          isTopLane ? "top-full mt-2" : "bottom-full mb-2",
                        )}
                      >
                        <LiveDot />
                        You are here
                      </span>
                    )}
                  </div>

                  {/* Desktop Row 3 (bottom lane: even milestones 02, 04, 06, 08) */}
                  <div className="hidden scene:flex scene:flex-col scene:justify-start scene:pr-4 xl:scene:pr-5">
                    {!isTopLane && (
                      <>
                        <div className="flex justify-center">
                          <span
                            aria-hidden="true"
                            className={cn("h-3.5 w-px xl:h-4", s === "past" ? "bg-mint/70" : s === "next" ? "bg-aqua" : "bg-ocean")}
                          />
                        </div>
                        <MilestoneCard
                          event={event}
                          day={day}
                          month={month}
                          stepNum={stepNum}
                          total={timeline.length}
                          status={s}
                          now={now}
                        />
                      </>
                    )}
                  </div>

                  {/* Mobile / reduced-motion card */}
                  <div className="scene:hidden">
                    <MilestoneCard
                      event={event}
                      day={day}
                      month={month}
                      stepNum={stepNum}
                      total={timeline.length}
                      status={s}
                      now={now}
                      showMobileLiveBadge
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Scroll progress through the track (desktop scene only) */}
        <div aria-hidden="true" className="mx-auto mt-3.5 hidden w-full max-w-7xl px-8 scene:block xl:scene:mt-6">
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
  now,
  showMobileLiveBadge = false,
}: {
  event: TimelineEvent;
  day: string;
  month: string;
  stepNum: string;
  total: number;
  status: Status;
  now: Date;
  showMobileLiveBadge?: boolean;
}) {
  const isPast = status === "past";
  const isNext = status === "next";

  return (
    <article
      className={cn(
        "rounded-2xl p-1.5 transition-[box-shadow,border-color] duration-300",
        isNext
          ? "bg-mint/14 ring-1 ring-aqua/65 shadow-[0_0_28px_-8px_rgb(133_255_240/0.35)]"
          : isPast
            ? "bg-foam/[0.04] ring-1 ring-mint/25"
            : "bg-foam/[0.04] ring-1 ring-edge/30",
      )}
    >
      <div
        className={cn(
          "relative flex flex-col gap-1.5 overflow-hidden rounded-[calc(1rem-0.375rem)] p-4 shadow-[inset_0_1px_0_rgb(221_247_239/0.12)] sm:p-5 scene:gap-1 scene:p-3.5 xl:scene:p-5",
          isNext ? "bg-gradient-to-b from-deep/90 via-night/95 to-abyss/95" : "bg-gradient-to-b from-night/92 to-abyss/95",
        )}
      >
        {/* Oversized ghosted step numeral */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute right-3.5 top-2 select-none font-display text-[3.5rem] leading-none tabular-nums scene:text-[2.75rem] xl:scene:text-[3.25rem]",
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
          {showMobileLiveBadge && isNext && (
            <span className="inline-flex items-center gap-2 font-semibold text-aqua">
              <LiveDot />
              You are here
            </span>
          )}
        </p>

        <p className="flex items-baseline gap-2 pr-12 font-display leading-[0.88]">
          <time dateTime={event.at} className="flex items-baseline gap-2">
            <span
              className={cn(
                "text-[clamp(2.5rem,4.4vw,3.5rem)] scene:text-[2.35rem] xl:scene:text-[2.85rem]",
                isPast ? "text-haze" : isNext ? "text-aqua" : "text-foam",
              )}
            >
              {day}
            </span>
            <span
              className={cn(
                "text-[clamp(1.25rem,2.1vw,1.75rem)] scene:text-[1.25rem] xl:scene:text-[1.5rem]",
                isPast ? "text-haze" : "text-mint",
              )}
            >
              {month}
            </span>
          </time>
        </p>

        <h3 className="text-body-lg font-semibold leading-snug text-foam">{event.title}</h3>
        <p className="max-w-[36ch] text-pretty text-small text-haze">{event.body}</p>

        {isNext && (
          <p className="mt-1 w-fit rounded-full bg-aqua/10 px-3 py-1 text-caption font-semibold text-aqua ring-1 ring-aqua/35 scene:mt-0.5">
            {relativeDays(daysUntil(now, event.at)).replace(/^./, (c) => c.toUpperCase())}, {formatTime(event.at)}
          </p>
        )}
      </div>
    </article>
  );
}
