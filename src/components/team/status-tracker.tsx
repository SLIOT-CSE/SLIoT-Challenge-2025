import { Check, Minus, X } from "lucide-react";
import { formatDayMonth } from "@/lib/competition";
import type { TeamStage } from "@/lib/team-rules";
import { cn } from "@/lib/utils";
import { trackerFor, type TrackerStatus } from "./portal";

const STATUS_TEXT: Record<TrackerStatus, string> = {
  done: "Done",
  current: "You are here",
  upcoming: "Coming up",
  stopped: "Not this time",
  off: "",
};

/** Registered → Proposal → Shortlist → Prototype → Finals, with the team's place glowing */
export function StatusTracker({ stage, finaleAt }: { stage: TeamStage; finaleAt: string }) {
  const steps = trackerFor(stage);

  return (
    <nav aria-label="Your progress">
      <ol className="grid grid-cols-5 gap-1 sm:gap-3">
        {steps.map((step, i) => {
          const note =
            step.id === "finals" && step.status === "upcoming" ? `Finale ${formatDayMonth(finaleAt)}` : STATUS_TEXT[step.status];
          return (
            <li
              key={step.id}
              aria-current={step.status === "current" ? "step" : undefined}
              className="relative flex flex-col items-center gap-2 text-center"
            >
              {/* The rail between this node and the next */}
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-5 left-1/2 h-px w-full",
                    step.status === "done" ? "bg-mint/60" : "bg-edge/60",
                  )}
                />
              )}
              <span
                aria-hidden="true"
                className={cn(
                  "relative z-10 grid size-10 place-items-center rounded-full text-small font-semibold ring-1 ring-inset transition-shadow duration-300 motion-reduce:transition-none",
                  step.status === "done" && "bg-mint/20 text-mint ring-mint/50",
                  step.status === "current" && "bg-mint text-abyss ring-mint shadow-signal",
                  step.status === "upcoming" && "bg-night text-haze ring-edge",
                  step.status === "stopped" && "bg-warning/15 text-warning ring-warning/60",
                  step.status === "off" && "bg-night text-haze/50 ring-edge/50",
                )}
              >
                {step.status === "done" ? (
                  <Check className="size-5" />
                ) : step.status === "stopped" ? (
                  <X className="size-5" />
                ) : step.status === "off" ? (
                  <Minus className="size-4" />
                ) : (
                  i + 1
                )}
              </span>
              {/* Five labels don't fit across a phone: there, only where the team is gets its label */}
              <span
                className={cn(
                  "text-caption leading-tight font-semibold sm:text-small",
                  step.status === "current" || step.status === "stopped"
                    ? "max-sm:-mx-4 max-sm:whitespace-nowrap"
                    : "max-sm:sr-only",
                  step.status === "current" ? "text-foam" : step.status === "off" ? "text-haze/60" : "text-haze",
                )}
              >
                {step.label}
              </span>
              <span className="hidden text-caption text-haze/80 sm:block">{note}</span>
              <span className="sr-only">{note ? `, ${note}` : ""}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
