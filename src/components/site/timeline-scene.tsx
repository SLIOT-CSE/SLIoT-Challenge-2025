"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/motion/gsap";

// Same conditions as the CSS `scene:` and `diag:` variants in globals.css
const SCENE_QUERY = "(min-width: 64rem) and (prefers-reduced-motion: no-preference)";
const DIAG_QUERY = "(max-width: 63.999rem) and (prefers-reduced-motion: no-preference)";

/**
 * Syncs scroll progress (0..1) across the bottom progress bar, a beam fill element
 * (scaleX), an un-squished tick band (clip-path inset), and per-milestone node activation.
 */
function syncRailProgress(
  progress: number,
  options: {
    beam: HTMLElement | null;
    ticks: HTMLElement | null;
    nodes: HTMLElement[];
  },
) {
  const p = Math.min(1, Math.max(0, progress));
  const clipRight = `${((1 - p) * 100).toFixed(3)}%`;

  gsap.set("[data-timeline-progress]", { scaleX: p });
  if (options.beam) gsap.set(options.beam, { scaleX: p });
  if (options.ticks) options.ticks.style.clipPath = `inset(0 ${clipRight} 0 0)`;

  const segments = Math.max(1, options.nodes.length - 1);
  options.nodes.forEach((node, index) => {
    node.dataset.reached = p * segments >= index - 0.06 ? "true" : "false";
  });
}

function clearRailProgress(options: {
  beam: HTMLElement | null;
  ticks: HTMLElement | null;
  nodes: HTMLElement[];
}) {
  if (options.beam) gsap.set(options.beam, { clearProps: "scaleX" });
  if (options.ticks) options.ticks.style.removeProperty("clip-path");
  options.nodes.forEach((node) => {
    delete node.dataset.reached;
  });
}

/**
 * Responsive timeline scene:
 * - Desktop (`scene:`): pins at 100svh, slides the alternating track sideways, and sweeps color
 *   along the central telemetry spine, ticks, and nodes.
 * - Mobile / tablet (`diag:`): pins at 100svh, pans 1:1 at 45° SE, and progressively draws
 *   the hidden diagonal rail and corner nodes with scroll.
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
        const beam = root?.querySelector<HTMLElement>("[data-timeline-spine-fill]") ?? null;
        const ticks = root?.querySelector<HTMLElement>("[data-timeline-spine-ticks]") ?? null;
        const nodes = track ? [...track.querySelectorAll<HTMLElement>('[data-timeline-node="desktop"]')] : [];
        if (!root || !viewport || !track) return;

        // Measure exact center-to-center span between the first and last desktop spine nodes.
        // Using getBoundingClientRect() difference cancels out horizontal GSAP translation.
        const layoutDesktopSpine = () => {
          if (nodes.length < 2) return;
          const trackRect = track.getBoundingClientRect();
          const firstRect = nodes[0]!.getBoundingClientRect();
          const lastRect = nodes[nodes.length - 1]!.getBoundingClientRect();
          const left = firstRect.left - trackRect.left + firstRect.width / 2;
          const width = lastRect.left + lastRect.width / 2 - (firstRect.left + firstRect.width / 2);
          track.style.setProperty("--spine-left", `${left}px`);
          track.style.setProperty("--spine-width", `${Math.max(0, width)}px`);
        };

        gsap.set(viewport, { overflowX: "hidden" });
        layoutDesktopSpine();
        syncRailProgress(0, { beam, ticks, nodes });

        ScrollTrigger.addEventListener("refreshInit", layoutDesktopSpine);
        const ro = new ResizeObserver(() => {
          layoutDesktopSpine();
          ScrollTrigger.refresh();
        });
        ro.observe(viewport);

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
            onUpdate: (self) => syncRailProgress(self.progress, { beam, ticks, nodes }),
          },
        });

        return () => {
          ro.disconnect();
          ScrollTrigger.removeEventListener("refreshInit", layoutDesktopSpine);
          tween.scrollTrigger?.kill();
          gsap.set(viewport, { clearProps: "overflowX" });
          gsap.set(track, { clearProps: "x" });
          track.style.removeProperty("--spine-left");
          track.style.removeProperty("--spine-width");
          clearRailProgress({ beam, ticks, nodes });
        };
      });

      mm.add(DIAG_QUERY, () => {
        const root = scope.current;
        const viewport = root?.querySelector<HTMLElement>("[data-timeline-viewport]");
        const track = root?.querySelector<HTMLElement>("[data-timeline-track]");
        const beam = root?.querySelector<HTMLElement>("[data-diag-rail-fill]") ?? null;
        const ticks = root?.querySelector<HTMLElement>("[data-diag-rail-ticks]") ?? null;
        const items = track ? [...track.querySelectorAll<HTMLElement>("[data-timeline-item]")] : [];
        const nodes = track ? [...track.querySelectorAll<HTMLElement>('[data-timeline-node="mobile"]')] : [];
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
        syncRailProgress(0, { beam, ticks, nodes });
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
            onUpdate: (self) => syncRailProgress(self.progress, { beam, ticks, nodes }),
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
          clearRailProgress({ beam, ticks, nodes });
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
