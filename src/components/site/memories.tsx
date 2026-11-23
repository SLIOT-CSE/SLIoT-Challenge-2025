"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Images } from "lucide-react";
import { editionPhotos, editions, mixedPhotos, photoAlt, type Photo } from "@/content/memories";
import { PhotoViewer } from "@/components/site/photo-viewer";
import { Button } from "@/components/ui/button";
import { gsap, useGSAP, PIN_QUERY } from "@/lib/motion/gsap";
import { EASE_OUT_EXPO, EASE_OUT_QUART } from "@/lib/motion/ease";
import { cn } from "@/lib/utils";

const WALL_SIZE = 24;
type Tab = "all" | number;

/**
 * Memories: photos from past editions.
 * Desktop: a tilted wall that straightens as it scrolls in. Phones: a swipeable strip.
 * Edition tabs filter the photos; any photo opens the full-screen viewer.
 */
export function Memories() {
  const scope = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [viewer, setViewer] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const tabs: { id: Tab; label: string }[] = [{ id: "all", label: "All" }, ...editions.map((e) => ({ id: e.year, label: String(e.year) }))];
  const photos = useMemo<Photo[]>(
    () => (tab === "all" ? mixedPhotos() : editionPhotos(editions.find((e) => e.year === tab)!)),
    [tab],
  );
  const wall = photos.slice(0, WALL_SIZE);

  // The wall starts tilted back and straightens as it scrolls into view (desktop, full motion)
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(PIN_QUERY, () => {
        gsap.fromTo(
          "[data-wall]",
          { rotateX: 32, rotateZ: -7, scale: 0.84, yPercent: 4 },
          {
            rotateX: 0,
            rotateZ: 0,
            scale: 1,
            yPercent: 0,
            ease: "none",
            scrollTrigger: { trigger: "[data-wall-stage]", start: "top 85%", end: "center 60%", scrub: 0.6 },
          },
        );
      });
      return () => mm.revert();
    },
    { scope },
  );

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = tabs[(i + delta + tabs.length) % tabs.length];
    setTab(next.id);
    tabRefs.current[String(next.id)]?.focus();
  };

  const fade = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0 },
        transition: { duration: 0.45, ease: EASE_OUT_EXPO },
      };

  return (
    <section id="memories" aria-labelledby="memories-title" className="relative overflow-x-clip py-20 md:py-28">
      <div ref={scope}>
        <header className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-8 px-4 sm:px-8">
          <div className="flex max-w-3xl flex-col gap-4">
            <h2 id="memories-title" className="font-display text-display-lg text-foam">
              Moments from past editions
            </h2>
            <p className="max-w-[54ch] text-pretty text-body-lg text-haze">
              Finales, semi-finals and workshops since 2019. Tap any photo to see it full size.
            </p>
          </div>
          <div role="tablist" aria-label="Edition" className="flex flex-wrap rounded-full bg-night p-1 ring-1 ring-ocean">
            {tabs.map((t, i) => {
              const selected = t.id === tab;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[String(t.id)] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`memories-tab-${t.id}`}
                  aria-selected={selected}
                  aria-controls="memories-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setTab(t.id)}
                  onKeyDown={(e) => onTabKey(e, i)}
                  className={cn(
                    "relative h-11 rounded-full px-4 text-small font-semibold transition-colors duration-200 sm:px-5",
                    selected ? "text-abyss" : "text-haze hover:text-foam",
                  )}
                >
                  {selected && (
                    <motion.span
                      layoutId="memories-tab"
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-mint"
                      transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: EASE_OUT_EXPO }}
                    />
                  )}
                  <span className="relative">{t.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        <div id="memories-panel" role="tabpanel" aria-labelledby={`memories-tab-${tab}`} className="mt-12 md:mt-16">
          {/* Desktop wall */}
          <div data-wall-stage className="mx-auto hidden max-w-7xl px-8 [perspective:1600px] md:block">
            <div data-wall className="origin-top will-change-transform [transform-style:preserve-3d]">
              <AnimatePresence mode="wait">
                <motion.ul key={String(tab)} className="grid grid-cols-4 gap-3 lg:grid-cols-6" {...fade}>
                  {wall.map((p, i) => (
                    <li key={p.src}>
                      <PhotoButton photo={p} onOpen={() => setViewer(i)} sizes="(min-width: 1024px) 16vw, 25vw" />
                    </li>
                  ))}
                </motion.ul>
              </AnimatePresence>
            </div>
          </div>

          {/* Phone strip */}
          <AnimatePresence mode="wait">
            <motion.ul
              key={String(tab)}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-4 [scrollbar-width:none] md:hidden"
              aria-label="Photos"
              {...fade}
            >
              {wall.map((p, i) => (
                <li key={p.src} className="w-[72vw] max-w-[20rem] shrink-0 snap-start">
                  <PhotoButton photo={p} onOpen={() => setViewer(i)} sizes="72vw" />
                </li>
              ))}
            </motion.ul>
          </AnimatePresence>

          <div className="mx-auto mt-8 flex max-w-7xl flex-wrap items-center gap-4 px-4 sm:px-8">
            <Button variant="secondary" onClick={() => setViewer(0)} className="gap-2">
              <Images className="size-4" strokeWidth={1.75} aria-hidden="true" />
              View all {photos.length} photos
            </Button>
            {photos.length > WALL_SIZE && (
              <p className="text-small text-haze">
                Showing {WALL_SIZE} of {photos.length}
              </p>
            )}
          </div>
        </div>
      </div>

      <PhotoViewer photos={photos} index={viewer} onIndexChange={setViewer} onClose={() => setViewer(null)} />
    </section>
  );
}

function PhotoButton({ photo, onOpen, sizes }: { photo: Photo; onOpen: () => void; sizes: string }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open photo: ${photoAlt(photo)}`}
      className="group relative block aspect-[4/3] w-full overflow-hidden rounded-photo bg-deep ring-1 ring-foam/10"
    >
      <Image
        src={photo.src}
        alt=""
        fill
        sizes={sizes}
        quality={60}
        className="object-cover transition-[transform,filter] duration-500 ease-out-quart group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-abyss/85 to-transparent px-3 pb-2 pt-8 text-left text-caption font-semibold text-foam opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
        style={{ transitionTimingFunction: `cubic-bezier(${EASE_OUT_QUART.join(",")})` }}
      >
        {photo.event}, {photo.year}
      </span>
    </button>
  );
}
