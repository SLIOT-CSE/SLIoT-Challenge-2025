"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { prizesBackdrop } from "@/assets";
import { categories } from "@/content/categories";
import { placings, prizeNote, prizes, specialAwards, type Placing } from "@/content/prizes";
import type { CategoryId } from "@/lib/team-rules";
import { gsap, useGSAP, FULL_MOTION_QUERY } from "@/lib/motion/gsap";
import { EASE_OUT_EXPO, EASE_OUT_QUART } from "@/lib/motion/ease";
import { cn } from "@/lib/utils";

const lkr = new Intl.NumberFormat("en-LK");

// Podium order on desktop: 2nd, 1st (raised center), 3rd. Phones: 1st full-width above 2nd and 3rd.
const LAYOUT: Record<Placing, string> = {
  first: "col-span-2 lg:col-span-1 lg:order-2",
  second: "lg:order-1",
  third: "lg:order-3",
};

const HEIGHT: Record<Placing, string> = {
  first: "min-h-64 sm:min-h-72 lg:min-h-[24rem]",
  second: "min-h-56 sm:min-h-64 lg:min-h-[19.5rem]",
  third: "min-h-56 sm:min-h-64 lg:min-h-[17rem]",
};

/**
 * Prizes: one stage-lit podium per category, switched with tabs.
 * On first view the columns rise from the stage horizon (3rd -> 2nd -> 1st)
 * and announced amounts count up; unannounced tiers read "TBA".
 */
/** `amounts` overrides the content file (only the dev preview passes it) */
export function Prizes({ amounts = prizes }: { amounts?: typeof prizes } = {}) {
  const scope = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState<CategoryId>("university");
  const reduceMotion = useReducedMotion();
  const tabs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Rise in once, from the stage horizon baseline
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(FULL_MOTION_QUERY, () => {
        const blocks = ["third", "second", "first"].map((p) => `[data-podium="${p}"]`);
        gsap.from(blocks, {
          yPercent: 100,
          duration: 1.1,
          stagger: 0.14,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-podium-row]", start: "top 80%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope },
  );

  // Arrow keys move between tabs (WAI-ARIA tabs pattern)
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = categories[(index + delta + categories.length) % categories.length];
    setCategory(next.id);
    tabs.current[next.id]?.focus();
  };

  return (
    <section id="prizes" aria-labelledby="prizes-title" className="relative isolate overflow-x-clip py-20 md:py-28">
      {/* Stage-lit arena backdrop masked smoothly into abyss at top and bottom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_12%,#000_88%,transparent)]"
      >
        <Image
          src={prizesBackdrop}
          alt=""
          fill
          sizes="100vw"
          quality={85}
          className="object-cover object-center opacity-75 sm:opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-abyss/40 via-transparent to-abyss/50" />
        <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_22%_16%,rgb(1_6_16/0.62),transparent_100%)]" />
        <div className="grain absolute inset-0" />
      </div>

      <div ref={scope} className="mx-auto max-w-7xl px-4 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-6 sm:gap-8">
          <div className="flex max-w-3xl flex-col gap-4">
            <h2 id="prizes-title" className="font-display text-display-lg text-foam">
              Prizes
            </h2>
            <p className="max-w-[52ch] text-pretty text-body-lg text-haze">{prizeNote}</p>
          </div>

          <div role="tablist" aria-label="Category" className="flex rounded-full bg-night/90 p-1 ring-1 ring-ocean">
            {categories.map((c, i) => {
              const selected = c.id === category;
              return (
                <button
                  key={c.id}
                  ref={(el) => {
                    tabs.current[c.id] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`prize-tab-${c.id}`}
                  aria-selected={selected}
                  aria-controls="prize-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setCategory(c.id)}
                  onKeyDown={(e) => onTabKey(e, i)}
                  className={cn(
                    "relative h-11 rounded-full px-3.5 text-caption font-semibold transition-colors duration-200 sm:px-5 sm:text-small",
                    selected ? "text-abyss" : "text-haze hover:text-foam",
                  )}
                >
                  {selected && (
                    <motion.span
                      layoutId="prize-tab"
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-mint"
                      transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: EASE_OUT_EXPO }}
                    />
                  )}
                  <span className="relative">{c.name}</span>
                </button>
              );
            })}
          </div>
        </header>

        <div
          id="prize-panel"
          role="tabpanel"
          aria-labelledby={`prize-tab-${category}`}
          className="relative mt-14 md:mt-20"
        >
          {/* Ambient overhead stage glow centered behind the 1st Champions column */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 size-[32rem] -translate-x-1/2 -translate-y-1/4 rounded-full bg-[radial-gradient(closest-side,rgb(133_255_240/0.14),rgb(11_90_109/0.08)_55%,transparent)]"
          />

          <div data-podium-row className="relative grid grid-cols-2 items-end gap-3 overflow-hidden pt-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
            {placings.map((p) => {
              const isFirst = p.id === "first";
              return (
                <div key={p.id} className={cn("flex flex-col items-stretch", LAYOUT[p.id])}>
                  <div
                    data-podium={p.id}
                    className={cn(
                      "rounded-t-2xl p-1.5 pb-0",
                      isFirst
                        ? "bg-mint/10 ring-1 ring-mint/45"
                        : "bg-foam/[0.04] ring-1 ring-foam/12",
                    )}
                  >
                    <div
                      className={cn(
                        "relative flex w-full flex-col items-center justify-between gap-4 rounded-t-[calc(1rem-0.375rem)] px-3 pb-7 pt-6 text-center shadow-[inset_0_1px_0_rgb(221_247_239/0.12)] sm:px-6 sm:pb-8 sm:pt-7",
                        HEIGHT[p.id],
                        isFirst
                          ? "bg-gradient-to-b from-deep/90 via-night/95 to-abyss/95"
                          : "bg-gradient-to-b from-night/95 to-abyss/95",
                      )}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <PrizeEmblem medal={p.medal} placing={p.id} />

                        <div className="flex flex-col items-center gap-0.5">
                          <p
                            className={cn(
                              "font-display leading-none",
                              isFirst
                                ? "text-[clamp(2.75rem,5.5vw,4.25rem)] text-foam"
                                : "text-[clamp(2.25rem,4.5vw,3.5rem)] text-foam/90",
                            )}
                          >
                            {p.label}
                          </p>
                          <p className={cn("text-small font-semibold", isFirst ? "text-mint" : "text-haze")}>
                            {p.title}
                          </p>
                        </div>
                      </div>

                      <div aria-hidden="true" className="h-px w-14 bg-gradient-to-r from-transparent via-edge/60 to-transparent" />

                      <AnimatePresence initial={false} mode="wait">
                        <motion.div
                          key={`${category}-${p.id}`}
                          initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                          transition={{ duration: reduceMotion ? 0.1 : 0.28, ease: EASE_OUT_QUART }}
                          className="mt-auto"
                        >
                          <Amount value={amounts[category][p.id]} highlight={isFirst} />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lit stage horizon baseline anchoring the podium */}
          <div aria-hidden="true" className="relative h-px w-full bg-gradient-to-r from-transparent via-mint/70 to-transparent" />
        </div>

        {specialAwards.length > 0 && (
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {specialAwards.map((a) => (
              <li key={a.title} className="rounded-2xl bg-foam/[0.04] p-1.5 ring-1 ring-foam/12">
                <div className="h-full rounded-[calc(1rem-0.375rem)] bg-night/95 p-5 shadow-[inset_0_1px_0_rgb(221_247_239/0.08)]">
                  <p className="text-body font-semibold text-foam">{a.title}</p>
                  <p className="mt-1 text-small text-haze">{a.body}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** Precision-machined rank emblem seated cleanly inside each podium plate */
function PrizeEmblem({ medal, placing }: { medal: string; placing: Placing }) {
  const isFirst = placing === "first";
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-full bg-abyss shadow-lift ring-1",
        isFirst ? "size-24 sm:size-28 ring-aqua/50" : "size-20 sm:size-22 ring-foam/20",
      )}
    >
      <Image
        src={medal}
        alt=""
        fill
        sizes={isFirst ? "7rem" : "5.5rem"}
        quality={88}
        className="scale-[1.18] object-cover select-none"
        draggable={false}
      />
    </div>
  );
}

/** Prize amount in LKR, counting up when it appears or changes; "TBA" until announced */
function Amount({ value, highlight }: { value: number | null; highlight: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || value === null) return;
    if (reduceMotion) {
      el.textContent = lkr.format(value);
      return;
    }
    const counter = { n: 0 };
    let started = false;
    const run = () => {
      if (started) return;
      started = true;
      gsap.to(counter, {
        n: value,
        duration: 1.4,
        ease: "power3.out",
        onUpdate: () => {
          el.textContent = lkr.format(Math.round(counter.n / 1000) * 1000);
        },
        onComplete: () => {
          el.textContent = lkr.format(value);
        },
      });
    };
    // Count when the amount scrolls into view (or straight away if it already is)
    const observer = new IntersectionObserver((entries) => entries[0].isIntersecting && run(), { threshold: 0.6 });
    observer.observe(el);
    return () => {
      observer.disconnect();
      gsap.killTweensOf(counter);
    };
  }, [value, reduceMotion]);

  if (value === null) {
    return (
      <p className="flex flex-col items-center gap-0.5">
        <span className={cn("font-display text-[clamp(2rem,4vw,3rem)] leading-none", highlight ? "text-mint" : "text-foam")}>
          TBA
        </span>
        <span className="text-caption text-haze">Prize to be announced</span>
      </p>
    );
  }

  return (
    <p className="flex items-baseline gap-1.5 font-display leading-none sm:gap-2">
      <span className="text-[clamp(1.1rem,2vw,1.75rem)] text-haze">LKR</span>
      <span ref={ref} className={cn("text-[clamp(1.75rem,4vw,3rem)] tabular-nums", highlight ? "text-mint" : "text-foam")}>
        {lkr.format(value)}
      </span>
    </p>
  );
}
