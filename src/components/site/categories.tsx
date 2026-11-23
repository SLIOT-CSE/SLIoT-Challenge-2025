"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { categories, type Category } from "@/content/categories";
import { routes } from "@/content/navigation";
import { TEAM_SIZE } from "@/lib/team-rules";
import { Button } from "@/components/ui/button";
import { gsap, useGSAP, PIN_QUERY } from "@/lib/motion/gsap";
import { useLenis } from "@/lib/motion/smooth-scroll";
import { cn } from "@/lib/utils";

/**
 * Categories: a sticky list beside a stack of cards (desktop). Each card sticks under the
 * nav and the previous one sinks back as the next arrives. Phones get a plain list of cards.
 */
export function Categories() {
  const scope = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Category["id"]>(categories[0].id);
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

  // Earlier cards sink back as the next one slides over them
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(PIN_QUERY, () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-category-card]");
        // Cards stay opaque (so the card below never shows through); a shade inside darkens them
        cards.slice(0, -1).forEach((card, i) => {
          const trigger = { trigger: cards[i + 1], start: "top 85%", end: "top 30%", scrub: true };
          gsap.to(card, { scale: 0.94, ease: "none", scrollTrigger: trigger });
          gsap.to(card.querySelector("[data-card-shade]"), { opacity: 0.6, ease: "none", scrollTrigger: trigger });
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
    <section id="categories" aria-labelledby="categories-title" className="relative py-20 md:py-28">
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

        <div className="mt-12 grid gap-6 md:mt-16 md:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] md:gap-12 lg:gap-20">
          <nav aria-label="Categories" className="hidden md:block">
            <ul className="sticky top-32 flex flex-col gap-1">
              {categories.map((c) => {
                const isActive = active === c.id;
                return (
                  <li key={c.id}>
                    <a
                      href={`#category-${c.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        jumpTo(c.id);
                      }}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "group flex items-start gap-4 rounded-panel px-4 py-4 transition-colors duration-300 ease-out-quart",
                        isActive ? "bg-night" : "hover:bg-night/50",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-3 size-2.5 shrink-0 rounded-full transition-all duration-300 ease-out-quart",
                          isActive ? "bg-aqua shadow-signal" : "bg-ocean",
                        )}
                      />
                      <span className="flex flex-col gap-1">
                        <span
                          className={cn(
                            "font-display text-[clamp(2rem,3.4vw,2.75rem)] leading-none transition-colors duration-300",
                            isActive ? "text-foam" : "text-haze group-hover:text-foam",
                          )}
                        >
                          {c.name}
                        </span>
                        <span className="text-small text-haze">{c.summary}</span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex flex-col gap-6 md:gap-0">
            {categories.map((c, i) => (
              <CategoryCard key={c.id} category={c} last={i === categories.length - 1} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ category: c, last }: { category: Category; last: boolean }) {
  return (
    <article
      id={`category-${c.id}`}
      data-category-card
      aria-labelledby={`category-${c.id}-title`}
      className={cn(
        "relative flex min-h-[25rem] origin-top flex-col gap-6 overflow-hidden rounded-panel bg-night p-6 ring-1 ring-ocean sm:p-10",
        "md:sticky md:top-28",
        !last && "md:mb-[28vh]",
      )}
    >
      {/* Darkens the card as the next one slides over it (animated on desktop) */}
      <span data-card-shade aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 bg-abyss opacity-0" />

      {/* Giant outlined name as texture, bleeding off the corner */}
      <span
        aria-hidden="true"
        className="text-outline pointer-events-none absolute -bottom-[0.3em] -right-[0.06em] select-none font-display text-[clamp(6rem,18vw,13rem)] leading-none opacity-30"
      >
        {c.name}
      </span>

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <h3 id={`category-${c.id}-title`} className="font-display text-display-md text-foam">
          {c.name}
        </h3>
        <TeamStrip institutions={c.institutions} />
      </div>

      <p className="relative max-w-[48ch] text-pretty text-body-lg text-haze">{c.who}</p>

      <ul className="relative flex flex-col gap-3">
        {c.rules.map((rule) => (
          <li key={rule} className="flex items-center gap-3 text-body text-foam">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-mint/12 text-mint">
              <Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
            </span>
            {rule}
          </li>
        ))}
      </ul>

      <div className="relative mt-auto pt-2">
        <Button
          asChild
          variant="secondary"
          trailingIcon={<ArrowUpRight className="size-4" strokeWidth={1.75} />}
        >
          <Link href={`${routes.register}?category=${c.id}`}>{c.cta}</Link>
        </Button>
      </div>
    </article>
  );
}

/** Five seats: one colour for one school or one university, two colours when teams can mix */
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
          <span key={i} className={cn("size-6 rounded-full ring-[3px] ring-night", seat(i), i === 0 && "outline-2 outline-offset-1 outline-foam/70")} />
        ))}
      </span>
      <span className="text-caption text-haze">{caption}</span>
    </div>
  );
}
