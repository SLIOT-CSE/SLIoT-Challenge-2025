"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/motion/gsap";

// Same conditions as the CSS `scene:` and `diag:` variants in globals.css
const SCENE_QUERY = "(min-width: 48rem) and (prefers-reduced-motion: no-preference)";
const DIAG_QUERY = "(max-width: 47.999rem) and (prefers-reduced-motion: no-preference)";

type ArrowSegment = {
  base: SVGPathElement | null;
  fill: SVGPathElement;
  head: SVGPathElement;
  length: number;
};

/**
 * Computes cubic Bezier curves from each visible milestone card box directly into the next card box.
 * Using (boxRect - trackRect) cancels any active GSAP (x, y) translation on `track`.
 */
function buildArrowSegments(track: HTMLElement, mode: "horizontal" | "diagonal"): ArrowSegment[] {
  const trackRect = track.getBoundingClientRect();
  const cardBoxes = [...track.querySelectorAll<HTMLElement>("[data-timeline-card]")]
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0)
    .map((r) => ({
      left: r.left - trackRect.left,
      top: r.top - trackRect.top,
      right: r.right - trackRect.left,
      bottom: r.bottom - trackRect.top,
      width: r.width,
      height: r.height,
    }));

  const segments: ArrowSegment[] = [];
  const groups = [...track.querySelectorAll<SVGGElement>("[data-arrow-seg]")];

  groups.forEach((group, i) => {
    const a = cardBoxes[i];
    const b = cardBoxes[i + 1];
    const base = group.querySelector<SVGPathElement>("[data-arrow-base]");
    const fill = group.querySelector<SVGPathElement>("[data-arrow-fill]");
    const head = group.querySelector<SVGPathElement>("[data-arrow-head]");
    if (!a || !b || !fill || !head) return;

    let d: string;

    if (mode === "horizontal") {
      // Odd index cards sit above and curve down-right into the next lower card's left edge;
      // even index cards sit below and curve up-right into the next upper card's left edge.
      const fromTop = i % 2 === 0;
      const x1 = a.left + a.width * 0.52;
      const y1 = fromTop ? a.bottom + 4 : a.top - 4;
      const x2 = b.left - 8;
      const y2 = fromTop ? b.top + b.height * 0.44 : b.top + b.height * 0.56;
      const dx = Math.max(40, x2 - x1);
      const dy = y2 - y1;
      const c1x = x1;
      const c1y = y1 + dy * 0.68;
      const c2x = x2 - dx * 0.52;
      const c2y = y2;
      d = `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    } else {
      // Mobile 45° SE track: curve cleanly through the open gap from Card i bottom edge into Card i+1 left edge.
      const x2 = b.left - 8;
      const x1 = Math.min(a.left + a.width * 0.48, x2 - 44);
      const y1 = a.bottom + 4;
      const y2 = b.top + b.height * 0.48;
      const dx = Math.max(44, x2 - x1);
      const dy = Math.max(40, y2 - y1);
      const c1x = x1;
      const c1y = y1 + dy * 0.66;
      const c2x = x2 - dx * 0.52;
      const c2y = y2;
      d = `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }

    if (base) base.setAttribute("d", d);
    fill.setAttribute("d", d);
    const length = fill.getTotalLength();
    fill.style.strokeDasharray = `${length}`;
    fill.style.strokeDashoffset = `${length}`;

    segments.push({ base, fill, head, length });
  });

  return segments;
}

/**
 * Syncs scroll progress (0..1) across the bottom progress bar and draws curved
 * box-to-box arrows sequentially with their arrowhead chevron riding the active tip.
 */
function syncArrowProgress(progress: number, segments: ArrowSegment[]) {
  const p = Math.min(1, Math.max(0, progress));
  gsap.set("[data-timeline-progress]", { scaleX: p });

  const total = Math.max(1, segments.length);
  segments.forEach((seg, i) => {
    const segP = Math.min(1, Math.max(0, p * total - i));
    seg.fill.style.strokeDashoffset = `${(seg.length * (1 - segP)).toFixed(2)}`;

    if (segP <= 0.015) {
      seg.fill.style.opacity = "0";
      seg.head.style.opacity = "0";
      return;
    }

    seg.fill.style.opacity = "1";
    const dist = seg.length * segP;
    const pt = seg.fill.getPointAtLength(dist);
    const prev = seg.fill.getPointAtLength(Math.max(0, dist - 2));
    const angle = (Math.atan2(pt.y - prev.y, pt.x - prev.x) * 180) / Math.PI;
    seg.head.style.opacity = "1";
    seg.head.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
  });
}

function clearArrows(segments: ArrowSegment[]) {
  segments.forEach((seg) => {
    seg.base?.removeAttribute("d");
    seg.fill.removeAttribute("d");
    seg.fill.style.removeProperty("stroke-dasharray");
    seg.fill.style.removeProperty("stroke-dashoffset");
    seg.fill.style.removeProperty("opacity");
    seg.head.style.removeProperty("opacity");
    seg.head.removeAttribute("transform");
  });
}

/**
 * Responsive timeline scene:
 * - Tablet & Desktop (`scene:`, >= 768px): pins at 100svh, slides the alternating cards horizontally,
 *   and draws curved box-to-box arrows progressively between adjacent cards.
 * - Mobile (`diag:`, < 768px): pins at 100svh, glides 1:1 at 45° SE, and draws curved box-to-box
 *   arrows between cards immediately as scroll begins (`scrub: true`).
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

        let segments: ArrowSegment[] = [];
        let lastProgress = 0;

        const rebuild = () => {
          segments = buildArrowSegments(track, "horizontal");
          syncArrowProgress(lastProgress, segments);
        };

        gsap.set(viewport, { overflowX: "hidden" });
        rebuild();

        ScrollTrigger.addEventListener("refreshInit", rebuild);
        const ro = new ResizeObserver(() => {
          rebuild();
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
            scrub: 0.55,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              lastProgress = self.progress;
              syncArrowProgress(self.progress, segments);
            },
          },
        });

        return () => {
          ro.disconnect();
          ScrollTrigger.removeEventListener("refreshInit", rebuild);
          tween.scrollTrigger?.kill();
          gsap.set(viewport, { clearProps: "overflowX" });
          gsap.set(track, { clearProps: "x" });
          clearArrows(segments);
        };
      });

      mm.add(DIAG_QUERY, () => {
        const root = scope.current;
        const viewport = root?.querySelector<HTMLElement>("[data-timeline-viewport]");
        const track = root?.querySelector<HTMLElement>("[data-timeline-track]");
        const items = track ? [...track.querySelectorAll<HTMLElement>("[data-timeline-item]")] : [];
        if (!root || !viewport || !track || items.length === 0) return;

        let step = 224;
        let segments: ArrowSegment[] = [];
        let lastProgress = 0;

        const layoutDiagonal = () => {
          const vpW = viewport.clientWidth;
          const vpH = viewport.clientHeight;
          const cardW = Math.min(308, Math.max(232, Math.round(vpW - 56)));

          track.style.setProperty("--diag-card-w", `${cardW}px`);
          const maxCardH = items.reduce((max, item) => Math.max(max, item.offsetHeight), 156);

          // Center Card 01 cleanly inside the mobile viewport so curved arrows sweep across open center space.
          const ox = Math.max(24, Math.round((vpW - cardW) / 2));
          const oy = Math.max(12, Math.round((vpH - maxCardH) / 2));
          step = Math.max(maxCardH + 46, Math.round(cardW * 0.74));

          track.style.setProperty("--diag-ox", `${ox}px`);
          track.style.setProperty("--diag-oy", `${oy}px`);
          track.style.setProperty("--diag-step", `${step}px`);

          segments = buildArrowSegments(track, "diagonal");
          syncArrowProgress(lastProgress, segments);
        };

        layoutDiagonal();
        ScrollTrigger.addEventListener("refreshInit", layoutDiagonal);

        const ro = new ResizeObserver(() => {
          layoutDiagonal();
          ScrollTrigger.refresh();
        });
        ro.observe(viewport);

        const totalTravel = () => step * Math.max(0, items.length - 1);

        // `scrub: true` gives immediate 1:1 tracking with Lenis so curved arrows draw with zero delay.
        const tween = gsap.to(track, {
          x: () => -totalTravel(),
          y: () => -totalTravel(),
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: () => `+=${totalTravel()}`,
            pin: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              lastProgress = self.progress;
              syncArrowProgress(self.progress, segments);
            },
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
          clearArrows(segments);
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
