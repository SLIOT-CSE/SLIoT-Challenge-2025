"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/motion/gsap";

// Same conditions as the CSS `scene:` and `diag:` variants in globals.css
const SCENE_QUERY = "(min-width: 48rem) and (prefers-reduced-motion: no-preference)";
const DIAG_QUERY = "(max-width: 47.999rem) and (prefers-reduced-motion: no-preference)";

type StairGeometry = {
  basePath: SVGPathElement | null;
  fillPath: SVGPathElement | null;
  riserPolygon: SVGPolygonElement | null;
  head: SVGCircleElement | null;
  length: number;
};

/**
 * Builds the architectural stepped tread-and-riser path across the 6 visible stair cards.
 * Using (cardRect - trackRect) cancels any active GSAP translation on `track`.
 */
function buildStairGeometry(track: HTMLElement): StairGeometry {
  const trackRect = track.getBoundingClientRect();
  const boxes = [...track.querySelectorAll<HTMLElement>("[data-stair-card]")]
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

  const basePath = track.querySelector<SVGPathElement>("[data-stair-line-base]");
  const fillPath = track.querySelector<SVGPathElement>("[data-stair-line-fill]");
  const riserPolygon = track.querySelector<SVGPolygonElement>("[data-stair-riser-fill]");
  const head = track.querySelector<SVGCircleElement>("[data-stair-head]");

  if (boxes.length === 0 || !fillPath) {
    return { basePath, fillPath, riserPolygon, head, length: 0 };
  }

  const treadDrop = 10;
  const pts: Array<[number, number]> = [];

  boxes.forEach((box, i) => {
    const treadY = box.bottom + treadDrop;
    const startX = box.left - 10;
    const nextBox = boxes[i + 1];
    const endX = nextBox ? nextBox.left - 12 : box.right + 14;

    if (i === 0) {
      pts.push([startX, treadY]);
    } else {
      pts.push([box.left - 12, treadY]);
    }
    pts.push([endX, treadY]);
  });

  const pathD = pts
    .map(([x, y], idx) => `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");

  if (basePath) basePath.setAttribute("d", pathD);
  fillPath.setAttribute("d", pathD);

  if (riserPolygon) {
    const first = pts[0];
    const last = pts[pts.length - 1];
    // Stepped underside parallel to the tread path (avoids a rectangular box cutoff at the summit)
    const underPts = [...pts]
      .reverse()
      .map(([x, y]) => [x, y + 64] as [number, number]);
    const polyPts = [
      ...pts,
      [last[0], last[1] + 64],
      ...underPts.slice(1),
      [first[0], first[1] + 64],
    ]
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ");
    riserPolygon.setAttribute("points", polyPts);
  }

  const length = fillPath.getTotalLength();
  fillPath.style.strokeDasharray = `${length}`;
  fillPath.style.strokeDashoffset = `${length}`;

  return { basePath, fillPath, riserPolygon, head, length };
}

/**
 * Syncs scroll progress (0..1) across the staircase climb:
 * - draws the illuminated aqua tread/riser path
 * - updates the riding climber pulse node
 * - sets `data-stair-state` ("climbed" | "active" | "upcoming") on each stair item
 * - updates the bottom progress bar and `01 / 06` step counter
 */
function syncStairProgress(
  progress: number,
  geometry: StairGeometry,
  items: HTMLElement[],
  counterEl: HTMLElement | null,
) {
  const p = Math.min(1, Math.max(0, progress));
  gsap.set("[data-stair-progress]", { scaleX: p });

  const count = items.length;
  const activeIdx = Math.min(count - 1, Math.max(0, Math.round(p * (count - 1))));

  items.forEach((item, i) => {
    const state = i < activeIdx ? "climbed" : i === activeIdx ? "active" : "upcoming";
    if (item.dataset.stairState !== state) {
      item.dataset.stairState = state;
    }
  });

  if (counterEl) {
    counterEl.textContent = `${String(activeIdx + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;
  }

  const { fillPath, head, length } = geometry;
  if (!fillPath || length <= 0) return;

  const drawP = Math.min(1, Math.max(0.03, p));
  fillPath.style.strokeDashoffset = `${(length * (1 - drawP)).toFixed(2)}`;

  if (head) {
    const pt = fillPath.getPointAtLength(length * drawP);
    head.setAttribute("cx", pt.x.toFixed(1));
    head.setAttribute("cy", pt.y.toFixed(1));
    head.style.opacity = "1";
  }
}

function clearStairGeometry(geometry: StairGeometry, items: HTMLElement[], counterEl: HTMLElement | null) {
  geometry.basePath?.removeAttribute("d");
  geometry.fillPath?.removeAttribute("d");
  geometry.fillPath?.style.removeProperty("stroke-dasharray");
  geometry.fillPath?.style.removeProperty("stroke-dashoffset");
  geometry.riserPolygon?.removeAttribute("points");
  if (geometry.head) {
    geometry.head.removeAttribute("cx");
    geometry.head.removeAttribute("cy");
    geometry.head.style.removeProperty("opacity");
  }
  items.forEach((item) => {
    delete item.dataset.stairState;
  });
  if (counterEl) {
    counterEl.textContent = `01 / ${String(items.length).padStart(2, "0")}`;
  }
}

/**
 * Responsive pinned staircase climb scene:
 * - Tablet & Desktop (`scene:`, >= 768px) and Mobile (`diag:`, < 768px): pins at 100svh,
 *   glides the camera up-right from Step 01 at the foot of the stairs to Step 06 at the summit,
 *   shifts the architectural staircase backdrop in parallax, and lights each tread along the climb.
 * - Reduced motion: renders as a plain static vertical stack without pinning.
 */
export function StaircaseScene({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      const setupClimb = (isDesktop: boolean) => {
        const root = scope.current;
        const viewport = root?.querySelector<HTMLElement>("[data-stair-viewport]");
        const track = root?.querySelector<HTMLElement>("[data-stair-track]");
        const backdrop = root?.querySelector<HTMLElement>("[data-stair-backdrop]");
        const counterEl = root?.querySelector<HTMLElement>("[data-stair-counter]") ?? null;
        const items = track ? [...track.querySelectorAll<HTMLElement>("[data-stair-item]")] : [];
        if (!root || !viewport || !track || items.length === 0) return;

        let totalX = 0;
        let totalY = 0;
        let geometry: StairGeometry = {
          basePath: null,
          fillPath: null,
          riserPolygon: null,
          head: null,
          length: 0,
        };
        let lastProgress = 0;

        const layoutStairs = () => {
          const vpW = viewport.clientWidth;
          const vpH = viewport.clientHeight;
          const count = items.length;

          const cardW = isDesktop
            ? Math.min(372, Math.max(288, Math.round(vpW * 0.27)))
            : Math.min(312, Math.max(236, Math.round(vpW - 52)));

          track.style.setProperty("--stair-card-w", `${cardW}px`);
          const maxCardH = items.reduce((max, item) => Math.max(max, item.offsetHeight), 184);

          const ox = isDesktop
            ? Math.max(32, Math.round((vpW - cardW) * 0.1))
            : Math.max(20, Math.round((vpW - cardW) / 2));

          const oy = isDesktop
            ? Math.max(28, Math.round(vpH - maxCardH - Math.max(28, vpH * 0.12)))
            : Math.max(24, Math.round((vpH - maxCardH) * 0.54));

          const stepX = isDesktop
            ? Math.round(cardW + Math.max(72, vpW * 0.06))
            : Math.max(cardW + 44, Math.round(vpW * 0.96));

          const stepY = isDesktop
            ? Math.max(96, Math.min(156, Math.round((vpH - maxCardH) * 0.44)))
            : Math.max(Math.round(maxCardH * 0.58), 124);

          track.style.setProperty("--stair-ox", `${ox}px`);
          track.style.setProperty("--stair-oy", `${oy}px`);
          track.style.setProperty("--stair-sx", `${stepX}px`);
          track.style.setProperty("--stair-sy", `${stepY}px`);

          // On desktop, stop slightly right/above the origin at the summit so Stairs 04 & 05 trail down-left.
          const endShiftX = isDesktop ? Math.min(Math.round(vpW * 0.24), Math.round(vpW - ox - cardW - 32)) : 0;
          const endShiftY = isDesktop ? Math.max(0, Math.round(oy - Math.max(20, vpH * 0.2))) : 0;

          totalX = Math.max(0, stepX * (count - 1) - Math.max(0, endShiftX));
          totalY = Math.max(0, stepY * (count - 1) - endShiftY);

          geometry = buildStairGeometry(track);
          syncStairProgress(lastProgress, geometry, items, counterEl);
        };

        layoutStairs();
        ScrollTrigger.addEventListener("refreshInit", layoutStairs);

        const ro = new ResizeObserver(() => {
          layoutStairs();
          ScrollTrigger.refresh();
        });
        ro.observe(viewport);

        const scrollLength = () => Math.max(totalX, totalY, 960);

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: () => `+=${scrollLength()}`,
            pin: true,
            scrub: isDesktop ? 0.55 : true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              lastProgress = self.progress;
              syncStairProgress(self.progress, geometry, items, counterEl);
            },
          },
        });

        tl.to(
          track,
          {
            x: () => -totalX,
            y: () => totalY,
          },
          0,
        );

        if (backdrop) {
          tl.fromTo(
            backdrop,
            { scale: 1.06, xPercent: 2, yPercent: -2 },
            { scale: 1.14, xPercent: -3, yPercent: 3 },
            0,
          );
        }

        return () => {
          ro.disconnect();
          ScrollTrigger.removeEventListener("refreshInit", layoutStairs);
          tl.scrollTrigger?.kill();
          tl.kill();
          gsap.set(track, { clearProps: "x,y" });
          if (backdrop) gsap.set(backdrop, { clearProps: "scale,xPercent,yPercent" });
          track.style.removeProperty("--stair-card-w");
          track.style.removeProperty("--stair-ox");
          track.style.removeProperty("--stair-oy");
          track.style.removeProperty("--stair-sx");
          track.style.removeProperty("--stair-sy");
          clearStairGeometry(geometry, items, counterEl);
        };
      };

      mm.add(SCENE_QUERY, () => setupClimb(true));
      mm.add(DIAG_QUERY, () => setupClimb(false));

      ScrollTrigger.refresh();
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div
      ref={scope}
      className="relative isolate overflow-hidden bg-abyss diag:flex diag:h-[100svh] diag:flex-col diag:justify-between diag:pt-[4.75rem] sm:diag:pt-[5.25rem] diag:pb-[clamp(0.75rem,2.5svh,1.25rem)] scene:flex scene:h-[100svh] scene:flex-col scene:justify-between scene:pt-[clamp(5rem,8.5svh,5.5rem)] scene:pb-[clamp(0.75rem,2.5svh,1.75rem)]"
    >
      {children}
    </div>
  );
}
