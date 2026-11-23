"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { categories } from "@/content/categories";
import { placings, prizeNote, prizes, specialAwards, type Placing } from "@/content/prizes";
import type { CategoryId } from "@/lib/team-rules";
import { gsap, useGSAP, FULL_MOTION_QUERY } from "@/lib/motion/gsap";
import { EASE_OUT_EXPO } from "@/lib/motion/ease";
import { cn } from "@/lib/utils";

const lkr = new Intl.NumberFormat("en-LK");

// Podium order on desktop: 2nd, 1st (raised), 3rd. Phones: 1st across the top, then 2nd and 3rd.
const LAYOUT: Record<Placing, string> = {
  first: "col-span-2 lg:col-span-1 lg:order-2",
  second: "lg:order-1",
  third: "lg:order-3",
};
const HEIGHT: Record<Placing, string> = {
  first: "min-h-56 lg:min-h-80",
  second: "min-h-48 lg:min-h-64",
  third: "min-h-48 lg:min-h-56",
};

/**
 * Prizes: one podium per category, switched with tabs. On first view the blocks rise from
 * the baseline (3rd, then 2nd, then 1st) and the amounts count up; amounts not announced
 * yet read "TBA". Static under reduced motion.
 */
/** `amounts` overrides the content file (only the dev preview passes it) */
export function Prizes({ amounts = prizes }: { amounts?: typeof prizes } = {}) {
  const scope = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState<CategoryId>("university");
  const reduceMotion = useReducedMotion();
  const tabs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Rise in once, from the baseline
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
    <section id="prizes" aria-labelledby="prizes-title" className="relative overflow-x-clip py-20 md:py-28">
      <div ref={scope} className="mx-auto max-w-7xl px-4 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-8">
          <div className="flex max-w-3xl flex-col gap-4">
            <h2 id="prizes-title" className="font-display text-display-lg text-foam">
              Prizes
            </h2>
            <p className="max-w-[52ch] text-pretty text-body-lg text-haze">{prizeNote}</p>
          </div>

          <div role="tablist" aria-label="Category" className="flex rounded-full bg-night p-1 ring-1 ring-ocean">
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
                    "relative h-11 rounded-full px-5 text-small font-semibold transition-colors duration-200",
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
          {/* Soft light behind the champions' block */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 size-[34rem] -translate-x-1/2 -translate-y-1/4 rounded-full bg-[radial-gradient(closest-side,rgb(115_218_190/0.14),transparent)]"
          />
          <div data-podium-row className="relative grid grid-cols-2 items-end gap-3 overflow-hidden sm:gap-4 lg:grid-cols-3">
            {placings.map((p) => (
              <div key={p.id} className={cn("flex flex-col items-center", LAYOUT[p.id])}>
                <Image
                  src={p.medal}
                  alt=""
                  width={500}
                  height={500}
                  sizes="(min-width: 1024px) 128px, 96px"
                  className={cn("relative z-10 -mb-8 h-auto drop-shadow-[0_10px_18px_rgb(1_6_16/0.7)]", p.id === "first" ? "w-28 lg:w-32" : "w-20 lg:w-24")}
                />
                <div
                  data-podium={p.id}
                  className={cn(
                    "flex w-full flex-col items-center justify-start gap-2 rounded-t-panel bg-night px-4 pb-8 pt-12 text-center ring-1 ring-ocean",
                    HEIGHT[p.id],
                    p.id === "first" && "bg-deep/70 ring-mint/40",
                  )}
                >
                  <p className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-none text-foam">{p.label}</p>
                  <p className="text-small font-semibold text-haze">{p.title}</p>
                  <Amount value={amounts[category][p.id]} highlight={p.id === "first"} />
                </div>
              </div>
            ))}
          </div>
          {/* The podium stands on a lit baseline */}
          <div aria-hidden="true" className="h-px w-full bg-gradient-to-r from-transparent via-mint/60 to-transparent" />
        </div>

        {specialAwards.length > 0 && (
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {specialAwards.map((a) => (
              <li key={a.title} className="rounded-panel bg-night p-5 ring-1 ring-ocean">
                <p className="text-body font-semibold text-foam">{a.title}</p>
                <p className="mt-1 text-small text-haze">{a.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
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
      <p className="mt-auto flex flex-col items-center gap-0.5">
        <span className={cn("font-display text-[clamp(2rem,4vw,3rem)] leading-none", highlight ? "text-mint" : "text-foam")}>
          TBA
        </span>
        <span className="text-caption text-haze">Prize to be announced</span>
      </p>
    );
  }

  return (
    <p className="mt-auto flex items-baseline gap-2 font-display leading-none">
      <span className="text-[clamp(1.25rem,2vw,1.75rem)] text-haze">LKR</span>
      <span ref={ref} className={cn("text-[clamp(2rem,4vw,3rem)] tabular-nums", highlight ? "text-mint" : "text-foam")}>
        {lkr.format(value)}
      </span>
    </p>
  );
}
