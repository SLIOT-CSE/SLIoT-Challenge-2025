import { COASTLINE, DISTRICT_NODES, HUB, MAP_HEIGHT, MAP_WIDTH } from "./geometry";
import { cn } from "@/lib/utils";

// A gentle curve from a district to the hub, bowing away from the island's centre line
function linkPath(x: number, y: number) {
  const mx = (x + HUB.x) / 2;
  const my = (y + HUB.y) / 2;
  const dx = HUB.x - x;
  const dy = HUB.y - y;
  const bow = 0.18;
  return `M${x},${y} Q${(mx - dy * bow).toFixed(1)},${(my + dx * bow).toFixed(1)} ${HUB.x},${HUB.y}`;
}

/**
 * Sri Lanka with its 25 district capitals linked to the University of Moratuwa.
 * Renders fully drawn; the About scene animates it (data-map-* hooks) when motion is allowed.
 */
export function IslandMap({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role="img"
      aria-label="Map of Sri Lanka: all 25 districts linked to the University of Moratuwa"
      className={cn("h-auto w-full overflow-visible", className)}
    >
      <defs>
        <radialGradient id="island-fill" cx="45%" cy="60%" r="60%">
          <stop offset="0%" stopColor="#0b5a6d" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#023649" stopOpacity="0.15" />
        </radialGradient>
        <filter id="node-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <path d={COASTLINE} fill="url(#island-fill)" data-map-fill />
      <path
        d={COASTLINE}
        fill="none"
        stroke="#73dabe"
        strokeWidth="1.4"
        strokeLinejoin="round"
        pathLength={1}
        data-map-coast
      />

      <g fill="none" stroke="#85fff0" strokeOpacity="0.38" strokeWidth="0.8" strokeLinecap="round">
        {DISTRICT_NODES.map((n) => (
          <path key={n.name} d={linkPath(n.x, n.y)} pathLength={1} data-map-link />
        ))}
      </g>

      <g>
        {DISTRICT_NODES.map((n) => (
          <g key={n.name} data-map-node style={{ transformOrigin: `${n.x}px ${n.y}px` }}>
            <title>{n.name}</title>
            <circle cx={n.x} cy={n.y} r="6" fill="#85fff0" opacity="0.18" filter="url(#node-glow)" />
            <circle cx={n.x} cy={n.y} r="3.4" fill="#010610" stroke="#52baa5" strokeWidth="1.4" />
            <circle cx={n.x} cy={n.y} r="1.4" fill="#85fff0" />
          </g>
        ))}
      </g>

      <g data-map-hub>
        <circle cx={HUB.x} cy={HUB.y} r="14" fill="#85fff0" opacity="0.25" filter="url(#node-glow)" />
        <circle cx={HUB.x} cy={HUB.y} r="7" fill="#010610" stroke="#85fff0" strokeWidth="2" />
        <circle cx={HUB.x} cy={HUB.y} r="3" fill="#85fff0" />
        <text x={HUB.x + 14} y={HUB.y + 4} fill="#ddf7ef" fontSize="13" fontFamily="var(--nf-montserrat), sans-serif" fontWeight="600">
          University of Moratuwa
        </text>
      </g>
    </svg>
  );
}
