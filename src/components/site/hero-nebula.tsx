"use client";

import dynamic from "next/dynamic";

// The hero's cosmic particle layer. three.js is large, so it loads on the client after the
// page is up and fades in; until then (and without WebGL) the aurora alone carries the hero.
const QuantumNebula = dynamic(() => import("@/components/ui/quantum-nebula"), { ssr: false });

export function HeroNebula() {
  return <QuantumNebula className="nebula-mask" />;
}
