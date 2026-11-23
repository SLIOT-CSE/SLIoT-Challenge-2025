"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, ScrollTrigger, PIN_QUERY } from "@/lib/motion/gsap";

const PHONE_FULL_MOTION = "(max-width: 767px) and (prefers-reduced-motion: no-preference)";

/**
 * The About scroll scene.
 * - Desktop, full motion: the section pins while the map assembles in three acts that
 *   follow the three beats (coastline draws, nodes light up, signal lines connect).
 * - Phone, full motion: the same sequence plays once when the map comes into view.
 * - Reduced motion: nothing moves; the map is shown complete.
 */
export function AboutScene({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      const coast = root.querySelector<SVGPathElement>("[data-map-coast]");
      const links = Array.from(root.querySelectorAll<SVGPathElement>("[data-map-link]"));
      const nodes = q("[data-map-node]");
      const beats = q("[data-about-beat]");
      const count = root.querySelector<HTMLElement>("[data-about-count]");
      const target = Number(count?.textContent ?? 25);

      // Shared starting state: nothing drawn yet
      const prepare = () => {
        // Paths use pathLength={1}, so a dash of 1 covers each whole line (independent of scaling).
        // Slightly over 1 so no sliver shows at the start.
        gsap.set([coast, ...links], { strokeDasharray: "1 1.02", strokeDashoffset: 1.01 });
        gsap.set(nodes, { scale: 0, opacity: 0 });
        gsap.set("[data-map-fill]", { opacity: 0 });
        gsap.set("[data-map-hub]", { opacity: 0 });
      };

      const counter = { value: 0 };
      const writeCount = () => {
        if (count) count.textContent = String(Math.round(counter.value));
      };

      // The three acts, one per beat
      const build = (tl: gsap.core.Timeline) => {
        tl.addLabel("coast")
          .to(coast, { strokeDashoffset: 0, duration: 1, ease: "none" }, "coast")
          .to("[data-map-fill]", { opacity: 1, duration: 0.6 }, "coast+=0.5")
          .addLabel("nodes")
          .to(nodes, { scale: 1, opacity: 1, duration: 0.25, stagger: 0.03, ease: "back.out(2)" }, "nodes")
          .addLabel("links")
          .to("[data-map-hub]", { opacity: 1, duration: 0.2 }, "links")
          .to(links, { strokeDashoffset: 0, duration: 0.5, stagger: 0.02, ease: "power1.inOut" }, "links")
          .to(counter, { value: target, duration: 0.9, ease: "none", onUpdate: writeCount }, "links");
        return tl;
      };

      const mm = gsap.matchMedia();

      mm.add(PIN_QUERY, () => {
        prepare();
        counter.value = 0;
        writeCount();
        gsap.set(beats.slice(1), { opacity: 0.5 });
        gsap.set("[data-about-rail]", { scaleY: 0 });

        const tl = gsap.timeline({
          scrollTrigger: { trigger: root, start: "top top", end: "+=180%", pin: true, scrub: 0.6, anticipatePin: 1 },
        });
        build(tl);
        // Beats brighten in step with their act; the rail fills alongside
        tl.to(beats[0], { opacity: 0.5, duration: 0.2 }, "nodes")
          .to(beats[1], { opacity: 1, duration: 0.2 }, "nodes")
          .to(beats[1], { opacity: 0.5, duration: 0.2 }, "links")
          .to(beats[2], { opacity: 1, duration: 0.2 }, "links")
          .to("[data-about-rail]", { scaleY: 1, duration: tl.duration(), ease: "none" }, 0);

        return () => {
          counter.value = target;
          writeCount();
        };
      });

      mm.add(PHONE_FULL_MOTION, () => {
        prepare();
        gsap.set("[data-about-rail]", { scaleY: 1 });
        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: { trigger: q("figure")[0], start: "top 75%", once: true },
        });
        build(tl).timeScale(0.55);
        return () => {
          counter.value = target;
          writeCount();
        };
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
