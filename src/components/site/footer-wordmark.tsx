"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders the oversized footer wordmark and triggers `.dot-signal` as soon as it scrolls into view
 * so the aqua sweep starts immediately on `S` instead of catching a hidden mid-cycle dark pause.
 */
export function FooterWordmark({ label }: { label: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting);
      },
      { threshold: 0.02, rootMargin: "0px 0px 40px 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <p
      ref={ref}
      aria-hidden="true"
      data-active={active ? "true" : undefined}
      className="pointer-events-none relative z-10 mx-auto -mb-[0.22em] grid max-w-7xl select-none whitespace-nowrap px-4 text-center font-display text-[clamp(3.75rem,16vw,15.5rem)] leading-none sm:px-8 lg:-mt-6"
    >
      {/* Three copies stacked in one cell: dots, the light crossing them, then the outline.
          The dots thin out towards the bottom, where the word runs off the page */}
      <span className="grid [grid-area:1/1] [mask-image:linear-gradient(to_bottom,#000_40%,rgb(0_0_0/0.2)_80%)]">
        <span className="dot-fill [grid-area:1/1]">{label}</span>
        <span className="dot-signal [grid-area:1/1]">{label}</span>
      </span>
      <span className="text-outline opacity-60 [grid-area:1/1]">{label}</span>
    </p>
  );
}
