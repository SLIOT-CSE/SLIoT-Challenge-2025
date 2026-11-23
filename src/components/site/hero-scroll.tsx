"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, ScrollTrigger, PIN_QUERY } from "@/lib/motion/gsap";

/**
 * Scroll behaviour of the hero (desktop, full motion only): as the page scrolls away,
 * the figure drifts up slower than the text and the aurora fades into the next section.
 */
export function HeroScroll({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(PIN_QUERY, () => {
        const trigger = { trigger: scope.current, start: "top top", end: "bottom top", scrub: true };
        gsap.to("[data-hero-figure]", { yPercent: -10, ease: "none", scrollTrigger: trigger });
        gsap.to("[data-hero-aurora]", { opacity: 0.25, yPercent: 12, ease: "none", scrollTrigger: trigger });
      });
      ScrollTrigger.refresh();
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} className="relative">
      {children}
    </div>
  );
}
