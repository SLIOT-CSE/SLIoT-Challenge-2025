import { describe, expect, it, vi } from "vitest";
import { createHeroReadiness } from "@/lib/hero-readiness";

describe("heroReadiness", () => {
  it("tracks weighted progress monotonically and becomes ready at 100", () => {
    const store = createHeroReadiness();
    expect(store.getSnapshot()).toEqual({
      avatar: 0,
      nebula: 0,
      rings: 0,
      progress: 0,
      ready: false,
    });

    store.setAvatar(0.5);
    expect(store.getSnapshot().progress).toBe(20);

    // Lower values do not regress progress
    store.setAvatar(0.2);
    expect(store.getSnapshot().avatar).toBe(0.5);

    store.setRings(1);
    expect(store.getSnapshot().progress).toBe(35);

    store.setNebula(1);
    expect(store.getSnapshot().progress).toBe(80);
    expect(store.getSnapshot().ready).toBe(false);

    store.setAvatar(1);
    expect(store.getSnapshot()).toEqual({
      avatar: 1,
      nebula: 1,
      rings: 1,
      progress: 100,
      ready: true,
    });
  });

  it("notifies subscribers and supports forceComplete safety fallback", () => {
    const store = createHeroReadiness();
    const listener = vi.fn();
    const unsub = store.subscribe(listener);

    store.setNebula(0.5);
    expect(listener).toHaveBeenCalledTimes(1);

    store.forceComplete();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot().ready).toBe(true);
    expect(store.getSnapshot().progress).toBe(100);

    unsub();
    store.forceComplete();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
