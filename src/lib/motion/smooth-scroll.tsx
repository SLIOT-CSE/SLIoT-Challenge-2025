"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode, type RefObject } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";
import { usePrefersReducedMotion } from "./use-reduced-motion";

// App screens scroll natively: forms, tables and dialogs should never feel floaty
const NATIVE_SCROLL_PREFIXES = ["/register", "/team", "/admin"];

const LenisContext = createContext<RefObject<Lenis | null>>({ current: null });

/**
 * Ref to the active Lenis instance (null when native scrolling is in use). Read it inside
 * event handlers, e.g. lenis.current?.scrollTo("#timeline") ?? element.scrollIntoView().
 */
export function useLenis(): RefObject<Lenis | null> {
  return useContext(LenisContext);
}

/**
 * Site-wide smooth scrolling (same feel as the original site: 1.2s, exponential ease).
 * Lenis is driven by GSAP's ticker and reports every scroll to ScrollTrigger, so pinned
 * and scrubbed scenes stay in step. Off under reduced motion and on the app screens.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();
  const enabled = !reducedMotion && !NATIVE_SCROLL_PREFIXES.some((p) => pathname.startsWith(p));
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const instance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      // Same-page #anchor links scroll smoothly (and account for the fixed nav via scroll-margin)
      anchors: true,
    });

    const onTick = (time: number) => instance.raf(time * 1000);
    instance.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);
    lenisRef.current = instance;

    return () => {
      gsap.ticker.remove(onTick);
      instance.destroy();
      lenisRef.current = null;
    };
  }, [enabled]);

  return <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>;
}
