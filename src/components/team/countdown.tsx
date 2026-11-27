import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { countdownTone, formatCountdown, formatWhen } from "./portal";

const TONE = {
  calm: "bg-deep/60 text-haze ring-edge",
  soon: "bg-warning/10 text-warning ring-warning/50",
  urgent: "bg-danger/10 text-danger ring-danger/50",
  over: "bg-deep/60 text-haze ring-edge",
} as const;

/**
 * "Due 15 March, 11:59 pm" with the time left. The ticking part is hidden from screen readers
 * (a clock that talks every second would be unbearable); the due date is read once.
 */
export function Countdown({ dueAt, now }: { dueAt: string; now: number }) {
  const left = Date.parse(dueAt) - now;
  const tone = countdownTone(left);

  return (
    <p className={cn("inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full px-4 py-2 text-small ring-1 ring-inset", TONE[tone])}>
      <Clock aria-hidden="true" className="size-4 shrink-0" />
      <span className="font-semibold">
        {tone === "over" ? "Was due" : "Due"} {formatWhen(dueAt)}
      </span>
      <span aria-hidden="true" className={tone === "over" ? "font-semibold" : undefined}>
        {tone === "over" ? "Deadline passed" : `${formatCountdown(left)} left`}
      </span>
    </p>
  );
}
