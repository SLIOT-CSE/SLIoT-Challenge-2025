"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/motion/gsap";

// Same conditions as the CSS `scene:` and `diag:` variants in globals.css
const SCENE_QUERY = "(min-width: 64rem) and (prefers-reduced-motion: no-preference)";
const DIAG_QUERY = "(max-width: 63.999rem) and (prefers-reduced-motion: no-preference)";

/**
 * Responsive timeline scene:
 * - Desktop (`scene:`): pins at 100svh and slides the alternating chronology track horizontally.
 * - Mobile / tablet (`diag:`): pins at 100svh and glides 1:1 along a 45-degree South-East diagonal rail.
 * - Reduced motion: renders as a plain static vertical rail without pinning.
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

        // The scene drives horizontal travel, so suppress the native scrollbar.
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
          gsap.set(track, { clearProps: "x" });
        };
      });

      mm.add(DIAG_QUERY, () => {
        const root = scope.current;
        const viewport = root?.querySelector<HTMLElement>("[data-timeline-viewport]");
        const track = root?.querySelector<HTMLElement>("[data-timeline-track]");
        const items = track ? [...track.querySelectorAll<HTMLElement>("[data-timeline-item]")] : [];
        if (!root || !viewport || !track || items.length === 0) return;

        let step = 240;

        const layoutDiagonal = () => {
          const vpW = viewport.clientWidth;
          const vpH = viewport.clientHeight;
          const cardW = Math.min(312, Math.max(228, Math.round(vpW - 64)));

          track.style.setProperty("--diag-card-w", `${cardW}px`);
          const maxCardH = items.reduce((max, item) => Math.max(max, item.offsetHeight), 156);

          const ox = Math.max(32, Math.round((vpW - cardW) / 2));
          const oy = Math.max(20, Math.round((vpH - maxCardH) / 2));
          step = Math.max(maxCardH + 34, Math.round(cardW * 0.78));

          track.style.setProperty("--diag-ox", `${ox}px`);
          track.style.setProperty("--diag-oy", `${oy}px`);
          track.style.setProperty("--diag-step", `${step}px`);
        };

        layoutDiagonal();
        ScrollTrigger.addEventListener("refreshInit", layoutDiagonal);

        const ro = new ResizeObserver(() => {
          layoutDiagonal();
          ScrollTrigger.refresh();
        });
        ro.observe(viewport);

        const totalTravel = () => step * Math.max(0, items.length - 1);

        // 1:1 (-x, -y) track motion pans the viewport at a 45-degree South-East trajectory.
        const tween = gsap.to(track, {
          x: () => -totalTravel(),
          y: () => -totalTravel(),
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: () => `+=${totalTravel()}`,
            pin: true,
            scrub: 0.55,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => gsap.set("[data-timeline-progress]", { scaleX: self.progress }),
          },
        });

        return () => {
          ro.disconnect();
          ScrollTrigger.removeEventListener("refreshInit", layoutDiagonal);
          tween.scrollTrigger?.kill();
          gsap.set(track, { clearProps: "x,y" });
          track.style.removeProperty("--diag-card-w");
          track.style.removeProperty("--diag-ox");
          track.style.removeProperty("--diag-oy");
          track.style.removeProperty("--diag-step");
        };
      });

      ScrollTrigger.refresh();
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div
      ref={scope}
      className="relative isolate overflow-hidden bg-abyss diag:flex diag:h-[100svh] diag:flex-col diag:justify-between diag:pt-[4.75rem] sm:diag:pt-[5.25rem] diag:pb-[clamp(0.75rem,2.5svh,1.25rem)] scene:flex scene:h-[100svh] scene:flex-col scene:justify-between scene:pt-[clamp(1.25rem,6svh,4.75rem)] scene:pb-[clamp(0.75rem,2.5svh,1.75rem)]"
    >
      {children}
    </div>
  );
}
