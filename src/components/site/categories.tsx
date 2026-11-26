"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { categoriesBackdrop, categoryArt } from "@/assets";
import { categories, type Category } from "@/content/categories";
import { routes } from "@/content/navigation";
import { TEAM_SIZE } from "@/lib/team-rules";
import { Button } from "@/components/ui/button";
import { gsap, useGSAP, ScrollTrigger, PIN_QUERY, FULL_MOTION_QUERY } from "@/lib/motion/gsap";
import { useLenis } from "@/lib/motion/smooth-scroll";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Categories: three gateways. A sticky list with a progress rail beside a stack of cards
 * (desktop); each card sticks under the nav and the previous one sinks back as the next arrives.
 * Every card is one rounded shell whose architectural gateway image runs right to the border and
 * drifts slowly with the scroll. Phones get a plain list of cards with the image on top.
 */
export function Categories() {
  const scope = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Category["id"]>(categories[0].id);
  const activeIndex = categories.findIndex((c) => c.id === active);
  const lenis = useLenis();

  // The card in the middle of the screen is the active one
  useEffect(() => {
    const cards = categories
      .map((c) => document.getElementById(`category-${c.id}`))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id.replace("category-", "") as Category["id"]);
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Each gateway image drifts slowly against its card
      mm.add(FULL_MOTION_QUERY, () => {
        gsap.utils.toArray<HTMLElement>("[data-category-card]").forEach((card) => {
          gsap.fromTo(
            card.querySelector("[data-card-art]"),
            { yPercent: -5 },
            {
              yPercent: 5,
              ease: "none",
              scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });
      });

      // Earlier cards sink back as the next one slides over them
      mm.add(PIN_QUERY, () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-category-card]");
        // Cards stay opaque (so the card below never shows through); a shade inside darkens them
        cards.slice(0, -1).forEach((card, i) => {
          const trigger = { trigger: cards[i + 1], start: "top 85%", end: "top 30%", scrub: true };
          gsap.to(card, { scale: 0.94, ease: "none", scrollTrigger: trigger });
          gsap.to(card.querySelector("[data-card-shade]"), { opacity: 0.65, ease: "none", scrollTrigger: trigger });
          // Once the next card sits on top of it, hide it so no edge can peek out when the stack scrolls away
          ScrollTrigger.create({
            trigger: cards[i + 1],
            start: "top 113px",
            onEnter: () => gsap.set(card, { autoAlpha: 0 }),
            onLeaveBack: () => gsap.set(card, { autoAlpha: 1 }),
          });
        });
      });

      return () => mm.revert();
    },
    { scope },
  );

  const jumpTo = (id: string) => {
    const el = document.getElementById(`category-${id}`);
    if (!el) return;
    if (lenis.current) lenis.current.scrollTo(el, { offset: -112 });
    else el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="categories" aria-labelledby="categories-title" className="relative isolate overflow-x-clip py-20 md:py-28">
      {/* Three-gateway hall, masked into abyss at top and bottom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_12%,#000_88%,transparent)]"
      >
        <Image
          src={categoriesBackdrop}
          alt=""
          fill
          sizes="100vw"
          quality={75}
          className="object-cover object-top opacity-45 sm:opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-abyss/30 via-abyss/70 to-abyss/90" />
        <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_20%_14%,rgb(1_6_16/0.7),transparent_100%)]" />
        <div className="grain absolute inset-0" />
      </div>

      <div ref={scope} className="mx-auto max-w-7xl px-4 sm:px-8">
        <header className="flex max-w-3xl flex-col gap-4">
          <h2 id="categories-title" className="font-display text-display-lg text-foam">
            Pick your category
          </h2>
          <p className="max-w-[56ch] text-pretty text-body-lg text-haze">
            Three ways to enter. Your category decides who can be on your team; every team has {TEAM_SIZE.min} to{" "}
            {TEAM_SIZE.max} members, and the leader is member one.
          </p>
        </header>

        <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-6 md:mt-16 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] md:gap-10 lg:gap-16">
          <nav aria-label="Categories" className="hidden md:block">
            <div className="sticky top-32">
              <ul className="relative flex flex-col gap-2">
                {/* Progress rail: fills to the active category */}
                <span aria-hidden="true" className="absolute bottom-9 left-[1.3rem] top-9 w-px bg-ocean" />
                <span
                  aria-hidden="true"
                  className="absolute left-[1.3rem] top-9 w-px bg-aqua shadow-[0_0_10px_rgb(133_255_240/0.7)] motion-safe:transition-[height] motion-safe:duration-500 motion-safe:ease-out-quart"
                  style={{ height: `calc((100% - 4.5rem) * ${activeIndex / (categories.length - 1)})` }}
                />
                {categories.map((c) => {
                  const isActive = active === c.id;
                  return (
                    <li key={c.id} className="relative">
                      <a
                        href={`#category-${c.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          jumpTo(c.id);
                        }}
                        aria-current={isActive ? "true" : undefined}
                        className={cn(
                          "group flex items-center gap-4 rounded-panel py-3 pl-4 pr-3 transition-colors duration-300 ease-out-quart",
                          isActive ? "bg-night/85 ring-1 ring-edge/40" : "hover:bg-night/50",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "relative z-10 size-3 shrink-0 rounded-full border-2 transition-all duration-300 ease-out-quart",
                            isActive ? "border-aqua bg-aqua shadow-signal" : "border-edge bg-abyss",
                          )}
                        />
                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                          <span
                            className={cn(
                              "font-display text-[clamp(2rem,3.2vw,2.75rem)] leading-none transition-colors duration-300",
                              isActive ? "text-foam" : "text-haze group-hover:text-foam",
                            )}
                          >
                            {c.name}
                          </span>
                          <span className="text-small text-haze">{c.summary}</span>
                        </span>
                        {/* The category's gateway, lit when active */}
                        <span
                          aria-hidden="true"
                          className={cn(
                            "relative hidden h-12 w-20 shrink-0 overflow-hidden rounded-lg ring-1 transition-all duration-300 ease-out-quart lg:block",
                            isActive ? "opacity-100 ring-aqua/70" : "opacity-40 ring-ocean group-hover:opacity-70",
                          )}
                        >
                          <Image src={categoryArt[c.id]} alt="" fill sizes="80px" className="object-cover object-right" />
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>

          <div className="flex flex-col gap-6 md:gap-0">
            {categories.map((c, i) => (
              <CategoryCard key={c.id} category={c} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ category: c, index }: { category: Category; index: number }) {
  return (
    <article
      id={`category-${c.id}`}
      data-category-card
      aria-labelledby={`category-${c.id}-title`}
      className={cn(
        // Single shell: the gateway image runs right to the border, with no inner frame gap
        "relative origin-top rounded-[1.75rem] bg-night ring-1 ring-edge/45 shadow-[0_18px_40px_-16px_rgb(1_6_16/0.95),0_10px_48px_-12px_rgb(133_255_240/0.28)]",
        // Every card, the last included, keeps the same margin: a sticky card's margin must fit inside
        // the column, so equal margins hold the second card until the last one has covered it
        "md:sticky md:top-28 md:mb-[28vh]",
      )}
    >
      <div className="relative flex flex-col overflow-hidden rounded-[1.75rem] bg-night shadow-[inset_0_1px_0_rgb(221_247_239/0.16)] md:min-h-[28rem]">
        {/* Gateway image: a banner on phones, the whole card behind the text from md up */}
        <div aria-hidden="true" className="relative aspect-[16/9] overflow-hidden md:absolute md:inset-0 md:aspect-auto">
          <div data-card-art className="absolute inset-[-8%_0]">
            <Image
              src={categoryArt[c.id]}
              alt=""
              fill
              sizes="(min-width: 768px) 56vw, 100vw"
              quality={75}
              className="object-cover object-[70%_50%]"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-night via-night/20 to-transparent md:hidden" />
          {/* Solid behind the text column, clearing towards the gateway on the right */}
          <div className="absolute inset-0 hidden bg-[linear-gradient(to_right,var(--color-night)_20%,rgb(1_18_37/0.78)_46%,rgb(1_18_37/0.1)_78%)] md:block" />
          <div className="absolute inset-0 hidden bg-gradient-to-t from-night/70 via-transparent to-transparent md:block" />
        </div>

        {/* Outlined index, as on the step cards */}
        <span
          aria-hidden="true"
          className="text-outline pointer-events-none absolute right-5 top-4 z-[1] select-none font-display text-[clamp(3.5rem,7vw,5.5rem)] leading-none opacity-60 sm:right-7 sm:top-5"
        >
          {pad(index + 1)}
        </span>

        <div className="relative z-[1] -mt-10 flex flex-1 flex-col gap-5 p-6 sm:p-8 md:mt-0 md:max-w-[34rem] md:gap-6 md:p-10">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-deep/90 px-3 py-1 text-caption text-foam ring-1 ring-edge/40">
            Category {pad(index + 1)} / {pad(categories.length)}
          </p>

          <h3 id={`category-${c.id}-title`} className="font-display text-display-md leading-none text-foam">
            {c.name}
          </h3>

          <p className="max-w-[44ch] text-pretty text-body-lg text-haze">{c.who}</p>

          <ul className="flex flex-col gap-3">
            {c.rules.map((rule) => (
              <li key={rule} className="flex items-center gap-3 text-body text-foam">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-mint/12 text-mint ring-1 ring-mint/25">
                  <Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
                </span>
                {rule}
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-5 pt-2">
            <Button
              asChild
              variant="secondary"
              // The longest label is wider than a 320 px card, so let it wrap there
              className="h-auto min-h-12 max-w-full whitespace-normal py-2.5 text-left"
              trailingIcon={<ArrowUpRight className="size-4" strokeWidth={1.75} />}
            >
              <Link href={`${routes.register}?category=${c.id}`}>{c.cta}</Link>
            </Button>
            <TeamStrip institutions={c.institutions} />
          </div>
        </div>

        {/* Darkens the card as the next one slides over it (animated on desktop) */}
        <span data-card-shade aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 bg-abyss opacity-0" />
      </div>
    </article>
  );
}

/** Five seats with the leader as seat one: one colour for one school or university, two when teams mix */
function TeamStrip({ institutions }: { institutions: Category["institutions"] }) {
  const seat = (i: number) =>
    institutions === "same-school"
      ? "bg-lagoon"
      : institutions === "same-university"
        ? "bg-aqua"
        : i % 2 === 0
          ? "bg-lagoon"
          : "bg-aqua";
  const caption =
    institutions === "same-school" ? "One school" : institutions === "same-university" ? "One university" : "Mixed";

  return (
    <div aria-hidden="true" className="flex items-center gap-3">
      <span className="flex -space-x-1.5">
        {Array.from({ length: TEAM_SIZE.max }, (_, i) => (
          <span
            key={i}
            className={cn(
              "grid size-7 place-items-center rounded-full text-[0.7rem] font-bold text-abyss ring-[3px] ring-night",
              seat(i),
              i >= TEAM_SIZE.min && "opacity-55",
            )}
          >
            {i === 0 ? "1" : null}
          </span>
        ))}
      </span>
      <span className="flex flex-col text-caption leading-tight">
        <span className="font-semibold text-foam">
          {TEAM_SIZE.min}–{TEAM_SIZE.max} members
        </span>
        <span className="text-haze">{caption}</span>
      </span>
    </div>
  );
}
