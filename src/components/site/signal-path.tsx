"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, ScrollTrigger, FULL_MOTION_QUERY } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

const DESKTOP = "(min-width: 1024px)";
const NODE_ON = "0 0 0 1px rgb(133 255 240 / 0.35), 0 0 22px rgb(133 255 240 / 0.28)";

/**
 * The circuit trace behind "How to take part". A dim base trace runs through every step
 * node; a lit trace with a glowing pulse head grows along it as the section scrolls, and
 * each node switches on as the pulse reaches it. Full motion only: otherwise every node
 * stays lit and the trace is shown complete.
 */
export function SignalPath({ children, className }: { children: ReactNode; className?: string }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ desktop: DESKTOP, motion: FULL_MOTION_QUERY }, (ctx) => {
        if (!ctx.conditions?.motion) return;
        const horizontal = Boolean(ctx.conditions.desktop);
        const nodes = gsap.utils.toArray<HTMLElement>("[data-step-node]");
        const steps = gsap.utils.toArray<HTMLElement>("[data-step]");
        // The lit trace is revealed with a clip (so its glow is not squashed); the head moves on its own
        const hidden = horizontal ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 100% 0%)";
        const along = horizontal ? "left" : "top";

        gsap.set(nodes, { opacity: 0.35, scale: 0.85, boxShadow: "none" });
        gsap.set(steps, { opacity: 0.5 });
        gsap.set("[data-trace-lit]", { clipPath: hidden });
        gsap.set("[data-trace-head]", { [along]: "0%", opacity: 1 });

        const tl = gsap.timeline({ defaults: { ease: "none" } });
        tl.to("[data-trace-lit]", { clipPath: "inset(0% 0% 0% 0%)" }, 0).to("[data-trace-head]", { [along]: "100%" }, 0);

        const setNode = (i: number, on: boolean) => {
          const node = nodes[i];
          if (node.dataset.on === String(on)) return;
          node.dataset.on = String(on);
          gsap.to(node, { opacity: on ? 1 : 0.35, scale: on ? 1 : 0.85, boxShadow: on ? NODE_ON : "none", duration: 0.4, ease: "power2.out" });
          gsap.to(steps[i], { opacity: on ? 1 : 0.5, duration: 0.4 });
        };

        ScrollTrigger.create({
          animation: tl,
          trigger: scope.current,
          start: horizontal ? "top 65%" : "top 70%",
          end: horizontal ? "bottom 75%" : "bottom 60%",
          scrub: 0.5,
          onUpdate: (self) => {
            // Light every node the pulse has passed
            const reached = Math.floor(self.progress * nodes.length + 0.15);
            nodes.forEach((_, i) => setNode(i, i < reached));
          },
        });
      });
      return () => mm.revert();
    },
    { scope },
  );

  // Node centres sit 18px from the list's top-left (36px nodes). The trace runs through them:
  // down the left edge on phones, across the top from lg, ending at the last column's node.
  const trace =
    "absolute left-[17.5px] top-[18px] bottom-10 w-px lg:bottom-auto lg:left-[18px] lg:right-[calc((100%-6rem)/5-18px)] lg:h-px lg:w-auto";

  return (
    <div ref={scope} className={cn("relative", className)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span className={cn(trace, "bg-ocean")} />
        <span data-trace-lit className={cn(trace, "bg-aqua shadow-[0_0_12px_rgb(133_255_240/0.8)]")} />
        {/* Pulse head: rides the end of the lit trace (hidden until the scroll scene runs) */}
        <span className={trace}>
          <span
            data-trace-head
            className="absolute left-1/2 size-2.5 -translate-1/2 rounded-full bg-aqua opacity-0 shadow-[0_0_14px_4px_rgb(133_255_240/0.7)] lg:top-1/2"
          />
        </span>
      </div>
      {children}
    </div>
  );
}
