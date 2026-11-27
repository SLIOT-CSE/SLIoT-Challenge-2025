"use client";

import { useEffect, useState } from "react";

/**
 * Whole seconds until `until` (a wall-clock timestamp in ms), counting down once a second,
 * or 0 when there is none or it has passed.
 */
export function useSecondsLeft(until: number | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (until === null) return;
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, 1000);
    // Bring the first reading up to date right away, in a callback rather than the effect body
    const first = setTimeout(tick, 0);
    return () => {
      clearInterval(timer);
      clearTimeout(first);
    };
  }, [until]);

  return until === null ? 0 : Math.max(0, Math.ceil((until - now) / 1000));
}
