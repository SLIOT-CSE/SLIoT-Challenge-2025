"use client";

import { useEffect, useState } from "react";

/**
 * A clock that keeps going from `baseNow`: the server's (or the sample) time when the page
 * loaded, plus what has elapsed since. Redraws every `tickMs`. In the sample, `baseNow` is
 * the switcher's fixed time, so the countdown moves from there at the real speed.
 */
export function useLiveNow(baseNow: number, tickMs: number): number {
  const [run, setRun] = useState({ base: baseNow, elapsed: 0 });

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => setRun({ base: baseNow, elapsed: Date.now() - start }), tickMs);
    return () => clearInterval(timer);
  }, [baseNow, tickMs]);

  // A new base (the clock was moved) starts counting again from zero
  return baseNow + (run.base === baseNow ? run.elapsed : 0);
}
