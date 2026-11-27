// Coordinates readiness of the Hero's heavy client-side visuals so the first-visit
// preloader tracks real asset and WebGL warmup progress before revealing the page.

export const HERO_LOADER_KEY = "sliot:hero-loaded";

export type HeroReadinessSnapshot = {
  avatar: number;
  nebula: number;
  rings: number;
  /** Weighted overall progress (0..100) */
  progress: number;
  ready: boolean;
};

const WEIGHTS = {
  avatar: 0.4,
  nebula: 0.45,
  rings: 0.15,
} as const;

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

export function createHeroReadiness() {
  let avatar = 0;
  let nebula = 0;
  let rings = 0;
  const listeners = new Set<() => void>();

  let cached: HeroReadinessSnapshot = {
    avatar: 0,
    nebula: 0,
    rings: 0,
    progress: 0,
    ready: false,
  };

  const emit = () => {
    const raw = avatar * WEIGHTS.avatar + nebula * WEIGHTS.nebula + rings * WEIGHTS.rings;
    const ready = avatar >= 1 && nebula >= 1 && rings >= 1;
    const progress = ready ? 100 : Math.min(99, Math.round(raw * 100));
    cached = { avatar, nebula, rings, progress, ready };
    listeners.forEach((fn) => fn());
  };

  return {
    setAvatar(value: number) {
      const next = Math.max(avatar, clamp01(value));
      if (next === avatar) return;
      avatar = next;
      emit();
    },
    setNebula(value: number) {
      const next = Math.max(nebula, clamp01(value));
      if (next === nebula) return;
      nebula = next;
      emit();
    },
    setRings(value: number) {
      const next = Math.max(rings, clamp01(value));
      if (next === rings) return;
      rings = next;
      emit();
    },
    forceComplete() {
      if (avatar >= 1 && nebula >= 1 && rings >= 1) return;
      avatar = 1;
      nebula = 1;
      rings = 1;
      emit();
    },
    getSnapshot(): HeroReadinessSnapshot {
      return cached;
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const heroReadiness = createHeroReadiness();
