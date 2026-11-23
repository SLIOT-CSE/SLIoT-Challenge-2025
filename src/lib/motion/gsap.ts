"use client";

// One place that sets up GSAP for the 2027 site. Import gsap, ScrollTrigger and useGSAP
// from here (never straight from "gsap"), so plugins are registered exactly once.
//
// Rules (docs/frontend-plan.md, section 4):
// - GSAP owns scroll scenes (pinning, scrubbing); Motion owns component interactions.
//   Never animate the same element with both.
// - Build every scene inside useGSAP(() => { ... }, { scope }) so it is reverted on unmount.
// - Give every scene a static layout under reduced motion, using gsap.matchMedia() with
//   REDUCED_MOTION_QUERY / FULL_MOTION_QUERY below.

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Media queries for gsap.matchMedia() conditions */
export const FULL_MOTION_QUERY = "(prefers-reduced-motion: no-preference)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
/** Pinned scenes only from md (768px) up; phones get their own simpler versions */
export const PIN_QUERY = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";

export { gsap, ScrollTrigger, useGSAP };
