"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { LiveDot } from "@/components/site/live-dot";
import { routes } from "@/content/navigation";
import { countdownParts, formatDayMonth, formatTime, progressBetween } from "@/lib/competition";
import { EASE_OUT_EXPO } from "@/lib/motion/ease";
import { cn } from "@/lib/utils";

const when = (at: string) => `${formatDayMonth(at)}, ${formatTime(at)}`;

/**
 * The live callout until registration closes. It sits straight on the page, with no panel:
 * the time left in very large digits, then a signal trace running from the opening date to
 * the closing date with a node at "now". The ticking digits are hidden from screen readers
 * (a clock that talks every second would be unbearable); the dates are read instead.
 */
export function RegistrationCountdown({
  opensAt,
  closesAt,
  serverNow,
}: {
  opensAt: string;
  closesAt: string;
  /** When the page was generated. It can be an hour old, so the browser's clock takes over */
  serverNow: number;
}) {
  const [now, setNow] = useState(serverNow);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    // The first reading comes right away, in a callback rather than the effect body
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  const left = countdownParts(Date.parse(closesAt) - now);
  const open = now >= Date.parse(opensAt);
  const progress = progressBetween(now, opensAt, closesAt);
  const units = [
    { label: "days", value: left.days },
    { label: "hours", value: left.hours },
    { label: "minutes", value: left.minutes },
    { label: "seconds", value: left.seconds },
  ];

  return (
    <section id="live" aria-labelledby="live-title" className="relative isolate overflow-hidden px-4 py-14 sm:px-8 sm:py-16 lg:py-20">
      {/* A low bloom of aurora light behind the digits, with no edges of its own */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_50%_52%,rgb(11_90_109/0.38),transparent_100%)]"
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-7 lg:gap-10">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="live-title" className="inline-flex items-center gap-3 text-title font-semibold text-foam sm:text-[1.75rem] sm:leading-tight">
            {!left.done && <LiveDot />}
            {left.done ? "Registration has closed" : "Registration ends in"}
          </h2>
          {!left.done && (
            <Button
              asChild
              size="lg"
              className="hidden sm:inline-flex"
              trailingIcon={<ArrowUpRight className="size-[1.125rem]" strokeWidth={1.75} />}
            >
              <Link href={routes.register}>Register</Link>
            </Button>
          )}
        </div>

        {!left.done && (
          <div aria-hidden="true" className="grid grid-cols-4">
            {units.map((unit, i) => {
              const live = i === units.length - 1;
              return (
                <div key={unit.label} className="relative flex min-w-0 flex-col items-center gap-2 sm:gap-3">
                  {/* Two sensor nodes stand in for the colon between units */}
                  {i > 0 && (
                    <span className="absolute left-0 top-[clamp(1rem,4.5vw,2.35rem)] flex -translate-x-1/2 flex-col gap-[clamp(0.5rem,2vw,1.15rem)]">
                      <span className="size-1 rounded-full bg-lagoon/70 sm:size-2" />
                      <span className="size-1 rounded-full bg-lagoon/70 sm:size-2" />
                    </span>
                  )}
                  <RollingNumber
                    value={String(unit.value).padStart(2, "0")}
                    className={cn(
                      "font-display text-[clamp(3.5rem,15vw,7.5rem)]",
                      live ? "text-aqua [text-shadow:0_0_40px_rgb(133_255_240/0.35)]" : "text-foam",
                    )}
                  />
                  <span className="text-caption text-haze sm:text-body">{unit.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {!left.done && (
          <div className="flex justify-center sm:hidden">
            <Button asChild size="lg" trailingIcon={<ArrowUpRight className="size-[1.125rem]" strokeWidth={1.75} />}>
              <Link href={routes.register}>Register</Link>
            </Button>
          </div>
        )}

        <div className="sr-only sm:not-sr-only sm:flex sm:flex-col sm:gap-4">
          {/* The registration window as a signal trace: lit up to now */}
          <div aria-hidden="true" className="relative mx-1.5 h-3">
            <span className="absolute inset-x-0 top-1/2 h-px bg-ocean" />
            <span
              className="absolute inset-x-0 top-1/2 h-0.5 origin-left -translate-y-1/2 bg-gradient-to-r from-reef to-aqua"
              style={{ scale: `${progress} 1` }}
            />
            <span className={cn("absolute -left-1.5 top-0 size-3 rounded-full", open ? "bg-reef" : "bg-abyss ring-2 ring-lagoon ring-inset")} />
            <span className={cn("absolute -right-1.5 top-0 size-3 rounded-full", left.done ? "bg-aqua" : "bg-abyss ring-2 ring-lagoon ring-inset")} />
            {open && !left.done && (
              <span className="absolute top-0 size-3 -translate-x-1/2 rounded-full bg-aqua shadow-signal" style={{ left: `${progress * 100}%` }} />
            )}
          </div>
          <p className="flex justify-between gap-6 text-small text-haze">
            <span>
              <span className="block font-semibold text-foam">{open ? "Opened" : "Opens"}</span>
              {when(opensAt)}
            </span>
            <span className="text-right">
              <span className="block font-semibold text-foam">{left.done ? "Closed" : "Closes"}</span>
              {when(closesAt)}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

/** Digits that roll upwards as they change. With reduced motion they simply swap */
function RollingNumber({ value, className }: { value: string; className: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <span className={cn("flex leading-none", className)}>
      {value.split("").map((digit, i) => (
        // Keyed from the right, so a column keeps its identity when the days lose a digit
        <span key={value.length - i} className="relative block h-[1em] w-[0.46em] overflow-hidden">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={digit}
              className="absolute inset-0 text-center"
              initial={reduceMotion ? false : { y: "100%" }}
              animate={{ y: "0%" }}
              exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { y: "-100%" }}
              transition={{ duration: reduceMotion ? 0 : 0.55, ease: EASE_OUT_EXPO }}
            >
              {digit}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}
