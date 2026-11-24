import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDayMonth, formatTime, type Stage } from "@/lib/competition";
import type { Deadlines } from "@/content/deadlines";
import { routes } from "@/content/navigation";

/** Replaces the form before registration opens and after it closes, with the date that matters */
export function ClosedScreen({ stage, deadlines }: { stage: Stage; deadlines: Deadlines }) {
  const notYetOpen = stage === "before-registration";

  return (
    <div className="flex flex-col items-start gap-6">
      <div className="flex flex-col gap-3">
        <h2 tabIndex={-1} data-step-heading className="text-title font-semibold text-foam outline-hidden">
          {notYetOpen ? "Registration hasn't opened yet" : "Registration has closed"}
        </h2>
        <p className="max-w-[52ch] text-body text-haze">
          {notYetOpen ? (
            <>
              Registrations open on{" "}
              <strong className="font-semibold text-foam">
                {formatDayMonth(deadlines.registrationOpens)} at {formatTime(deadlines.registrationOpens)}
              </strong>
              . Come back then to register your team.
            </>
          ) : (
            <>
              Registration closed on{" "}
              <strong className="font-semibold text-foam">
                {formatDayMonth(deadlines.registrationCloses)} at {formatTime(deadlines.registrationCloses)}
              </strong>
              . If your team is already registered, log in to the team portal with your team code.
            </>
          )}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {!notYetOpen && (
          <Button asChild size="lg">
            <Link href={routes.teamPortal}>Team login</Link>
          </Button>
        )}
        <Button asChild variant={notYetOpen ? "primary" : "ghost"} size="lg">
          <Link href="/">Back to the home page</Link>
        </Button>
      </div>
    </div>
  );
}
