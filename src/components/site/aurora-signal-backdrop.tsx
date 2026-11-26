import { HeroNebula } from "@/components/site/hero-nebula";

// Sensor nodes scattered over the section; a few linked by faint traces. Decorative.
const NODES: [x: number, y: number, delay: number][] = [
  [8, 22, 0.2], [17, 64, 2.1], [26, 12, 3.4], [34, 48, 1.2], [44, 26, 4.1], [52, 70, 0.8],
  [58, 14, 2.9], [66, 40, 1.7], [74, 20, 3.8], [82, 58, 0.5], [90, 30, 2.4], [94, 74, 4.4],
  [12, 86, 3.1], [38, 84, 1.9], [70, 86, 0.1],
];

const TRACES: [a: number, b: number][] = [
  [0, 2], [2, 4], [4, 6], [6, 8], [8, 10], [3, 4], [7, 9], [1, 3],
];

/**
 * Section backdrop matching the hero's cosmic particle nebula (QuantumNebula),
 * drifting aurora bands, blinking sensor nodes, and film grain, masked cleanly at top and bottom.
 */
export function AuroraSignalBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_18%,#000_82%,transparent)]"
    >
      <div className="absolute inset-0 opacity-65">
        <div className="aurora-band aurora-a" />
        <div className="aurora-band aurora-b" />
        <div className="aurora-band aurora-c" />
      </div>

      <HeroNebula />

      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        {TRACES.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={NODES[a][0]}
            y1={NODES[a][1]}
            x2={NODES[b][0]}
            y2={NODES[b][1]}
            stroke="rgb(133 255 240 / 0.08)"
            strokeWidth="0.12"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {NODES.map(([x, y, delay]) => (
        <span
          key={`${x}-${y}`}
          className="signal-node absolute size-1 -translate-1/2 rounded-full bg-aqua shadow-[0_0_8px_rgb(133_255_240/0.8)]"
          style={{ left: `${x}%`, top: `${y}%`, "--delay": `${delay}s` }}
        />
      ))}

      <div className="grain absolute inset-0" />
    </div>
  );
}
