import { daysUntil, formatDayMonth, nextMilestone, relativeDays, type Stage } from "@/lib/competition";
import { deadlines } from "@/content/deadlines";
import { cn } from "@/lib/utils";

/** Pulsing aqua dot used wherever something is live */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("relative inline-flex size-2", className)}>
      <span className="live-ping absolute inset-0 rounded-full bg-aqua" />
      <span className="relative inline-flex size-2 rounded-full bg-aqua" />
    </span>
  );
}

/** "Registrations open in 48 days · 10 January": the next date that matters */
export function LiveChip({ stage, now, className }: { stage: Stage; now: Date; className?: string }) {
  const next = nextMilestone(stage, deadlines);
  if (!next) return null;
  const days = daysUntil(now, next.at);

  return (
    <p
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full bg-aqua/8 py-1.5 pl-3 pr-4 text-small text-foam shadow-signal backdrop-blur-sm",
        className,
      )}
    >
      <LiveDot />
      <span>
        <span className="font-semibold text-aqua">
          {next.label} {relativeDays(days)}
        </span>
        <span className="text-haze max-xxs:sr-only">, {formatDayMonth(next.at)}</span>
      </span>
    </p>
  );
}
