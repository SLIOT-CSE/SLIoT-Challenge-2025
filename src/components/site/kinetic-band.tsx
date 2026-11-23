"use client";

import { Fragment, useRef } from "react";
import { bandWords } from "@/content/site";
import { gsap, useGSAP, ScrollTrigger, FULL_MOTION_QUERY } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

/**
 * One marquee band between the callout and About: huge Bebas words, outlined and filled
 * in turn, joined by sensor-node glyphs. It drifts on its own, speeds up with scroll
 * velocity and follows the scroll direction. Static under reduced motion. Decorative.
 */
export function KineticBand() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(FULL_MOTION_QUERY, () => {
        // The track holds the words twice, so moving it by half loops seamlessly
        const loop = gsap.to("[data-band-track]", { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
        let direction = 1;

        const trigger = ScrollTrigger.create({
          trigger: scope.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            if (self.direction !== direction) direction = self.direction;
            // Faster while scrolling, easing back to the resting speed afterwards
            const boost = Math.min(Math.abs(self.getVelocity()) / 220, 6);
            gsap.to(loop, { timeScale: direction * (1 + boost), duration: 0.25, overwrite: true });
            gsap.to(loop, { timeScale: direction, duration: 1.2, delay: 0.25, ease: "power2.out" });
          },
        });

        return () => trigger.kill();
      });
      return () => mm.revert();
    },
    { scope },
  );

  const words = (copy: number) =>
    bandWords.map((word, i) => (
      <Fragment key={`${copy}-${word}`}>
        <span className={cn("shrink-0", i % 2 === 0 ? "text-outline" : "text-mint")}>{word}</span>
        <NodeGlyph />
      </Fragment>
    ));

  return (
    <div
      ref={scope}
      aria-hidden="true"
      className="relative overflow-hidden border-y border-ocean/60 py-6 sm:py-8 [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]"
    >
      <div
        data-band-track
        className="flex w-max items-center gap-[0.35em] whitespace-nowrap font-display text-[clamp(3.75rem,11vw,9.5rem)] leading-[0.9] will-change-transform"
      >
        {words(0)}
        {words(1)}
        {words(2)}
        {words(3)}
      </div>
    </div>
  );
}

/** A sensor node: aqua dot inside a ring */
function NodeGlyph() {
  return (
    <span className="relative grid size-[0.32em] shrink-0 place-items-center rounded-full ring-2 ring-aqua/50">
      <span className="size-[0.11em] rounded-full bg-aqua shadow-[0_0_12px_rgb(133_255_240/0.9)]" />
    </span>
  );
}
