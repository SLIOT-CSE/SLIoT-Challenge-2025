"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * True when the visitor asked for less motion. Follows changes to the OS setting live.
 * Server render assumes no preference; scenes must still read correctly without motion.
 * (Motion components can use motion/react's own useReducedMotion; this one is for GSAP
 * scenes, Lenis and plain CSS decisions.)
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
