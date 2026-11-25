"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, ScrollTrigger, PIN_QUERY, FULL_MOTION_QUERY } from "@/lib/motion/gsap";

/**
 * Scroll behaviour of the hero. Full motion, every width: as the page scrolls away the portal
 * rings slide out sideways, left off the left edge and right off the right. Desktop also: the
 * figure drifts up slower than the text and the aurora fades into the next section.
 */
export function HeroScroll({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(FULL_MOTION_QUERY, () => {
        // Gone by the time 60% of the hero has scrolled past; scrubbed, so they return on the way up
        const trigger = { trigger: scope.current, start: "top top", end: "60% top", scrub: true };
        gsap.to('[data-portal-side="left"]', { xPercent: -60, ease: "power1.in", scrollTrigger: trigger });
        gsap.to('[data-portal-side="right"]', { xPercent: 60, ease: "power1.in", scrollTrigger: trigger });
      });
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
