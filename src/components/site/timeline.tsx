import { ArrowDown, Check } from "lucide-react";
import { timeline } from "@/content/timeline";
import { dateParts, daysUntil, formatTime, relativeDays } from "@/lib/competition";
import { LiveDot } from "@/components/site/live-chip";
import { TimelineScene } from "@/components/site/timeline-scene";
import { cn } from "@/lib/utils";

type Status = "past" | "next" | "future";

/**
 * The road to the finale. A vertical list with a rail on the left; on desktop with full
 * motion (the `scene:` variant) it becomes a track that slides sideways while the section
 * is pinned. "You are here" sits between the last date passed and the next one.
 */
export function Timeline({ now }: { now: Date }) {
  const nextIndex = timeline.findIndex((e) => Date.parse(e.at) >= now.getTime());
  const status = (i: number): Status => (nextIndex === -1 || i < nextIndex ? "past" : i === nextIndex ? "next" : "future");

  return (
    <section id="timeline" aria-labelledby="timeline-title" className="relative overflow-x-clip">
      <TimelineScene>
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-6 px-4 pt-20 sm:px-8 md:pt-28 scene:pt-0">
          <div className="flex max-w-3xl flex-col gap-4">
            <h2 id="timeline-title" className="font-display text-display-lg text-foam">
              The road to the finale
            </h2>
            <p className="max-w-[56ch] text-pretty text-body-lg text-haze">
              {timeline.length} dates from registration to the grand finale. All times are Sri Lanka time.
            </p>
          </div>
          <a
            href="#prizes"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-small font-semibold text-haze ring-1 ring-foam/15 transition-colors duration-200 hover:text-foam hover:ring-foam/40"
          >
            Skip timeline
            <ArrowDown className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </a>
        </div>

        {/* Natively scrollable sideways if the scene never starts; the scene takes over the scrolling */}
        <div data-timeline-viewport className="mt-12 pb-20 md:pb-28 scene:mt-16 scene:overflow-x-auto scene:pb-0">
          <ol
            data-timeline-track
            className="relative mx-auto flex max-w-7xl flex-col px-4 sm:px-8 scene:mx-0 scene:w-max scene:max-w-none scene:flex-row scene:px-[max(2rem,calc((100vw-80rem)/2+2rem))]"
          >
            {timeline.map((event, i) => {
              const s = status(i);
              const { day, month } = dateParts(event.at);
              const isLast = i === timeline.length - 1;
              return (
                <li
                  key={event.title}
                  data-timeline-item
                  className="relative pb-12 pl-12 last:pb-0 scene:w-[min(25rem,32vw)] scene:pb-0 scene:pl-0 scene:pr-12"
                >
                  {/* Rail segment to the next date: lit once this date has passed */}
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute bottom-0 left-[13px] top-3 w-px scene:left-3 scene:right-0 scene:top-[13px] scene:h-px scene:w-auto",
                        s === "past" ? "bg-mint" : "bg-ocean",
                      )}
                    />
                  )}

                  {/* "You are here": between the last date passed and the next one */}
                  {s === "next" && (
                    <span className="absolute -top-9 left-[9px] flex items-center gap-2.5 text-caption font-semibold text-aqua scene:hidden">
                      <LiveDot />
                      You are here
                    </span>
                  )}

                  {/* Node */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute left-0 top-0 grid size-[27px] place-items-center rounded-full border-2 bg-abyss",
                      s === "past" && "border-mint text-mint",
                      s === "next" && "border-aqua shadow-signal",
                      s === "future" && "border-ocean",
                    )}
                  >
                    {s === "past" && <Check className="size-3.5" strokeWidth={3} />}
                    {s === "next" && <span className="size-2 rounded-full bg-aqua" />}
                  </span>

                  <article className="flex flex-col gap-2 scene:pt-12">
                    <p className="flex items-center gap-4 text-caption text-haze">
                      <span>
                        {String(i + 1).padStart(2, "0")} / {String(timeline.length).padStart(2, "0")}
                        {s === "past" && <span className="sr-only"> (done)</span>}
                      </span>
                      {/* Desktop: the marker rides on the next card, on the index line (the track clips anything outside it) */}
                      {s === "next" && (
                        <span className="hidden items-center gap-2.5 font-semibold text-aqua scene:inline-flex">
                          <LiveDot />
                          You are here
                        </span>
                      )}
                    </p>
                    <p className="flex items-baseline gap-2 font-display leading-[0.85]">
                      <time dateTime={event.at} className="flex items-baseline gap-2">
                        <span
                          className={cn(
                            "text-[clamp(3.5rem,6.4vw,6rem)]",
                            s === "past" ? "text-haze" : s === "next" ? "text-aqua" : "text-foam",
                          )}
                        >
                          {day}
                        </span>
                        <span className={cn("text-[clamp(1.75rem,2.8vw,2.5rem)]", s === "past" ? "text-haze" : "text-mint")}>
                          {month}
                        </span>
                      </time>
                    </p>
                    <h3 className="text-title font-semibold text-foam">{event.title}</h3>
                    <p className="max-w-[40ch] text-pretty text-small text-haze">{event.body}</p>
                    {s === "next" && (
                      <p className="mt-1 w-fit rounded-full bg-aqua/10 px-3 py-1 text-caption font-semibold text-aqua ring-1 ring-aqua/30">
                        {relativeDays(daysUntil(now, event.at)).replace(/^./, (c) => c.toUpperCase())}, {formatTime(event.at)}
                      </p>
                    )}
                  </article>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Scroll progress through the track (desktop scene only) */}
        <div aria-hidden="true" className="mx-auto mt-14 hidden w-full max-w-7xl px-8 scene:block">
          <div className="h-px w-full bg-ocean">
            <div data-timeline-progress className="h-px w-full origin-left scale-x-0 bg-aqua shadow-[0_0_8px_rgb(133_255_240/0.8)]" />
          </div>
        </div>
      </TimelineScene>
    </section>
  );
}
