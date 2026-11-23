"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/motion/gsap";

// Same condition as the CSS `scene:` variant in globals.css
const SCENE_QUERY = "(min-width: 64rem) and (prefers-reduced-motion: no-preference)";

/**
 * Desktop timeline scene: the section pins and vertical scrolling slides the track sideways
 * until the last date is in view; a thin bar shows how far along you are.
 * Below lg or with reduced motion the timeline is a plain vertical list.
 */
export function TimelineScene({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(SCENE_QUERY, () => {
        const root = scope.current;
        const viewport = root?.querySelector<HTMLElement>("[data-timeline-viewport]");
        const track = root?.querySelector<HTMLElement>("[data-timeline-track]");
        if (!root || !viewport || !track) return;

        // The scene drives the movement, so the native sideways scrollbar goes away
        gsap.set(viewport, { overflowX: "hidden" });
        const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => gsap.set("[data-timeline-progress]", { scaleX: self.progress }),
          },
        });

        return () => {
          tween.scrollTrigger?.kill();
          gsap.set(viewport, { clearProps: "overflowX" });
        };
      });
      ScrollTrigger.refresh();
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} className="relative bg-abyss scene:flex scene:min-h-[100svh] scene:flex-col scene:justify-center">
      {children}
    </div>
  );
}
