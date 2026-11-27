"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

// The hero's cosmic particle layer. three.js is large, so it loads on the client after the
// page is up and fades in; until then (and without WebGL) the aurora alone carries the hero.
const QuantumNebula = dynamic(() => import("@/components/ui/quantum-nebula"), { ssr: false });

type HeroNebulaProps = {
  className?: string;
  /** Share of the hero's particle count, 0 to 1. Default 1 (the hero's look) */
  density?: number;
  /** Brightness multiplier, 0 to 1. Default 1 (the hero's look) */
  intensity?: number;
};

export function HeroNebula({ className, density, intensity }: HeroNebulaProps) {
  return <QuantumNebula className={cn("nebula-mask", className)} density={density} intensity={intensity} />;
}
