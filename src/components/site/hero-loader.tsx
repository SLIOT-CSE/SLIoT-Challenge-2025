"use client";

import { useEffect, useRef, useState } from "react";
import { logo } from "@/assets";
import { HERO_LOADER_KEY, heroReadiness } from "@/lib/hero-readiness";
import { cn } from "@/lib/utils";

const SAFETY_TIMEOUT_MS = 5000;
const RING_RADIUS = 76;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * First-visit full-screen preloader curtain for `/`.
 * Displays while HeroAvatar WebGL textures, QuantumNebula warmup, and portal rings load
 * in the background, then lifts smoothly and triggers the Hero intro choreography.
 * Skipped automatically on repeat visits in the same session (`sessionStorage`) and under
 * `prefers-reduced-motion: reduce`.
 */
export function HeroLoader() {
  const [phase, setPhase] = useState<"active" | "exiting" | "done">("active");
  const [percent, setPercent] = useState(0);

  const arcRef = useRef<SVGCircleElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const isActive = html.dataset.heroLoading === "true";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!isActive || reduced) {
      delete html.dataset.heroLoading;
      const doneTimer = window.setTimeout(() => setPhase("done"), 0);
      return () => window.clearTimeout(doneTimer);
    }

    let raf = 0;
    let holdTimer = 0;
    let exitTimer = 0;
    let finished = false;
    let displayed = 0;

    const safetyTimer = window.setTimeout(() => {
      heroReadiness.forceComplete();
    }, SAFETY_TIMEOUT_MS);

    const paint = (val: number) => {
      const clamped = Math.min(100, Math.max(0, val));
      const ratio = clamped / 100;
      const rounded = Math.round(clamped);

      if (arcRef.current) {
        arcRef.current.style.strokeDashoffset = `${(RING_CIRCUMFERENCE * (1 - ratio)).toFixed(2)}`;
      }
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${ratio.toFixed(4)})`;
      }
      if (pctRef.current) {
        pctRef.current.textContent = String(rounded).padStart(2, "0");
      }
    };

    const tick = () => {
      const snap = heroReadiness.getSnapshot();
      const target = snap.ready ? 100 : snap.progress;
      const diff = target - displayed;

      if (Math.abs(diff) < 0.35) {
        displayed = target;
      } else {
        displayed += diff * (snap.ready ? 0.24 : 0.14);
      }

      paint(displayed);

      if (snap.ready && displayed >= 99.6 && !finished) {
        finished = true;
        paint(100);
        setPercent(100);
        try {
          window.sessionStorage.setItem(HERO_LOADER_KEY, "1");
        } catch {
          // Ignore storage restrictions in private browsing
        }
        holdTimer = window.setTimeout(() => {
          delete html.dataset.heroLoading;
          setPhase("exiting");
          exitTimer = window.setTimeout(() => setPhase("done"), 520);
        }, 140);
        return;
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(safetyTimer);
      window.clearTimeout(holdTimer);
      window.clearTimeout(exitTimer);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      id="hero-preloader"
      data-exiting={phase === "exiting" ? "true" : undefined}
      role="status"
      aria-live="polite"
      aria-label={`Loading SLIoT Challenge 2027, ${percent}%`}
      className={cn(
        "hero-preloader fixed inset-0 z-tooltip flex-col items-center justify-center bg-abyss px-6 transition-[opacity,transform] duration-500 ease-out-expo",
        phase === "exiting" && "pointer-events-none scale-[1.02] opacity-0",
      )}
    >
      {/* Subtle aurora core glow behind the orbital ring */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(48%_44%_at_50%_48%,rgb(11_90_109/0.32),rgb(1_18_37/0.45)_46%,transparent_100%)]"
      />
      <div aria-hidden="true" className="grain absolute inset-0" />

      <div className="relative flex flex-col items-center gap-7">
        {/* Option A: Orbital IoT sensor signal ring framing the SLIoT logo */}
        <div className="relative grid size-40 place-items-center sm:size-44">
          <svg
            aria-hidden="true"
            viewBox="0 0 180 180"
            className="pointer-events-none absolute inset-0 size-full"
          >
            {/* Outer delicate dashed telemetry ring */}
            <circle
              cx="90"
              cy="90"
              r="85"
              fill="none"
              stroke="rgb(58 143 151 / 0.28)"
              strokeWidth="1"
              strokeDasharray="3 6"
              className="hero-loader-orbit origin-center"
            />
            {/* Base progress circle */}
            <circle
              cx="90"
              cy="90"
              r={RING_RADIUS}
              fill="none"
              stroke="rgb(11 90 109 / 0.55)"
              strokeWidth="1.5"
            />
            {/* Cardinal sensor ticks */}
            <g stroke="rgb(115 218 190 / 0.45)" strokeWidth="1.5" strokeLinecap="round">
              <line x1="90" y1="7" x2="90" y2="14" />
              <line x1="173" y1="90" x2="166" y2="90" />
              <line x1="90" y1="173" x2="90" y2="166" />
              <line x1="7" y1="90" x2="14" y2="90" />
            </g>
            {/* Sweeping aqua progress arc */}
            <circle
              ref={arcRef}
              cx="90"
              cy="90"
              r={RING_RADIUS}
              fill="none"
              stroke="#85fff0"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE}
              transform="rotate(-90 90 90)"
              className="drop-shadow-[0_0_10px_rgb(133_255_240/0.7)]"
            />
          </svg>

          <img
            src={logo}
            alt=""
            width={1518}
            height={813}
            className="relative h-10 w-auto select-none sm:h-11"
          />
        </div>

        {/* Condensed Bebas percentage readout + hairline GPU progress track */}
        <div className="flex flex-col items-center gap-3">
          <p className="flex items-baseline gap-1 font-display leading-none tabular-nums">
            <span ref={pctRef} className="text-[clamp(2.5rem,5vw,3.25rem)] text-foam">
              00
            </span>
            <span className="text-[clamp(1.5rem,3vw,2rem)] text-aqua">%</span>
          </p>

          <div
            aria-hidden="true"
            className="h-[2px] w-48 overflow-hidden rounded-full bg-ocean/60 sm:w-56"
          >
            <div
              ref={barRef}
              className="h-full w-full origin-left scale-x-0 bg-aqua shadow-[0_0_12px_rgb(133_255_240/0.85)]"
            />
          </div>

          <p className="text-caption uppercase tracking-[0.22em] text-haze">
            SLIoT Challenge 2027
          </p>
        </div>
      </div>
    </div>
  );
}
