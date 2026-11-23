"use client";

import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "motion/react";
import { ArrowUp } from "lucide-react";
import { useLenis } from "@/lib/motion/smooth-scroll";
import { EASE_OUT_EXPO } from "@/lib/motion/ease";

const R = 21;
const CIRCUMFERENCE = 2 * Math.PI * R;

/** Floating "back to top" button; its ring fills with how far down the page you are */
export function BackToTop() {
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 40 });
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();
  const lenis = useLenis();

  useMotionValueEvent(scrollY, "change", (y) => setVisible(y > window.innerHeight * 1.2));

  const toTop = () => {
    if (lenis.current) lenis.current.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    document.getElementById("main")?.focus({ preventScroll: true });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={toTop}
          aria-label="Back to top"
          className="fixed bottom-5 right-5 z-nav grid size-12 place-items-center rounded-full bg-night/80 text-foam shadow-lift ring-1 ring-foam/15 backdrop-blur-md transition-colors hover:text-mint sm:bottom-8 sm:right-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.35, ease: EASE_OUT_EXPO }}
        >
          <svg aria-hidden="true" viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90">
            <circle cx="24" cy="24" r={R} fill="none" stroke="rgb(11 90 109)" strokeWidth="2" />
            <motion.circle
              cx="24"
              cy="24"
              r={R}
              fill="none"
              stroke="#85fff0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              style={{ pathLength: progress }}
            />
          </svg>
          <ArrowUp className="relative size-5" strokeWidth={1.75} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
