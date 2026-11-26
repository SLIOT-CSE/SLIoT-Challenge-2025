"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, ScrollTrigger, PIN_QUERY } from "@/lib/motion/gsap";

const FULL_MOTION = "(prefers-reduced-motion: no-preference)";

/**
 * The About scroll scene.
 * The island, the 25 district nodes and the Moratuwa hub are always shown. When the map scrolls
 * into view the signal lines play once on their own clock, so they never wait on the scroll:
 * each line draws from the hub out to its district (nearest first) while the count runs to 25.
 * - Desktop, full motion: the section also pins and the beats brighten in turn as you scroll.
 * - Reduced motion: nothing moves; the map is shown complete.
 */
export function AboutScene({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      const links = Array.from(root.querySelectorAll<SVGPathElement>("[data-map-link]"));
      const beats = q("[data-about-beat]");
      const count = root.querySelector<HTMLElement>("[data-about-count]");
      const target = Number(count?.textContent ?? 25);

      const counter = { value: 0 };
      const writeCount = () => {
        if (count) count.textContent = String(Math.round(counter.value));
      };

      const mm = gsap.matchMedia();

      // The network: plays once when the map comes into view (desktop and phone)
      mm.add(FULL_MOTION, () => {
        // Paths use pathLength={1}, so a dash of 1 covers each whole line (independent of scaling).
        // Slightly over 1 so no sliver shows at the start.
        // autoRound: false, or GSAP rounds these sub-pixel values and the line pops in whole.
        gsap.set(links, { strokeDasharray: "1 1.02", strokeDashoffset: 1.01, autoRound: false });
        counter.value = 0;
        writeCount();

        const dists = links.map((l) => Number(l.dataset.dist ?? 0));
        const maxDist = Math.max(...dists, 1);
        const SPREAD = 1.2; // seconds between the nearest and farthest line starting
        const DRAW = 1.1; // seconds for one line to draw

        const tl = gsap.timeline({
          paused: true,
          scrollTrigger: { trigger: q("figure")[0], start: "top 85%", once: true },
        });
        links.forEach((link, i) => {
          const at = (dists[i] / maxDist) * SPREAD;
          tl.to(link, { strokeDashoffset: 0, autoRound: false, duration: DRAW, ease: "power1.inOut" }, at);
        });
        tl.to(counter, { value: target, duration: tl.duration(), ease: "none", onUpdate: writeCount }, 0);

        return () => {
          counter.value = target;
          writeCount();
        };
      });

      // Desktop: pin the section while the beats brighten in turn
      mm.add(PIN_QUERY, () => {
        gsap.set(beats.slice(1), { opacity: 0.5 });
        gsap.set("[data-about-rail]", { scaleY: 0 });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root, start: "top top", end: "+=150%", pin: true, scrub: 0.6, anticipatePin: 1 },
        });
        tl.to(beats[0], { opacity: 0.5, duration: 0.2 }, 1)
          .to(beats[1], { opacity: 1, duration: 0.2 }, 1)
          .to(beats[1], { opacity: 0.5, duration: 0.2 }, 2)
          .to(beats[2], { opacity: 1, duration: 0.2 }, 2)
          .to("[data-about-rail]", { scaleY: 1, duration: 3, ease: "none" }, 0);
      });

      ScrollTrigger.refresh();
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} className="relative bg-abyss">
      {children}
    </div>
  );
}
