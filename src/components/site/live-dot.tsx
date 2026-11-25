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
