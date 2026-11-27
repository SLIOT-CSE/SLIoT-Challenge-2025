// Shared easing and timing for the 2027 site (docs/frontend-plan.md, section 3).
// The same curves exist as CSS tokens: ease-out-expo / ease-out-quart in globals.css.

/** Entrances and reveals. cubic-bezier(0.16, 1, 0.3, 1) */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
/** UI feedback (hover, press, toggles). cubic-bezier(0.25, 1, 0.5, 1) */
export const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const;

/** GSAP equivalents of the curves above */
export const GSAP_EASE = {
  outExpo: "expo.out",
  outQuart: "quart.out",
} as const;

/** Durations in seconds */
export const DURATION = {
  /** Hover, press, small state changes */
  ui: 0.2,
  /** Panels, menus, dialogs */
  panel: 0.35,
  /** Section reveals */
  reveal: 0.8,
  /** Reduced-motion fallback: a short crossfade */
  fade: 0.2,
} as const;
