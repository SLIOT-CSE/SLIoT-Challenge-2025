import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDayMonth, formatTime } from "@/lib/competition";
import type { Deadlines } from "@/content/deadlines";
import { routes } from "@/content/navigation";
import { CodeReveal } from "./code-reveal";

/** Shown after a successful registration: the code, where it was emailed and what happens next */
export function SuccessScreen({
  code,
  teamName,
  leaderEmail,
  deadlines,
  portalOpen,
}: {
  code: string;
  teamName: string;
  leaderEmail: string;
  deadlines: Deadlines;
  portalOpen: boolean;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h2 tabIndex={-1} data-step-heading className="text-title font-semibold text-foam outline-hidden">
          You&apos;re registered
        </h2>
        <p className="text-body text-haze">
          <strong className="font-semibold text-foam">{teamName}</strong> is in. This is your team code. It&apos;s the
          only thing you need to log in to the team portal.
        </p>
      </div>

      <CodeReveal code={code} />

      <p className="rounded-control bg-deep/60 p-4 text-small text-haze ring-1 ring-edge ring-inset">
        We&apos;ve emailed this code to <strong className="font-semibold text-foam">{leaderEmail}</strong>. Keep it
        safe: anyone with the code can upload for your team.
      </p>

      <section aria-labelledby="next-steps" className="flex flex-col gap-4">
        <h3 id="next-steps" className="text-small font-semibold tracking-wide text-haze uppercase">
          What happens next
        </h3>
        <ol className="flex flex-col gap-3 text-body text-foam">
          <li className="flex gap-3">
            <Step n={1} />
            {portalOpen ? (
              "Log in to the team portal with your code."
            ) : (
              <span>
                The team portal opens on{" "}
                <strong className="font-semibold">
                  {formatDayMonth(deadlines.proposalOpens)} at {formatTime(deadlines.proposalOpens)}
                </strong>
                . Log in then with your code.
              </span>
            )}
          </li>
          <li className="flex gap-3">
            <Step n={2} />
            <span>
              Submit your project proposal by{" "}
              <strong className="font-semibold">
                {formatDayMonth(deadlines.proposalDue)}, {formatTime(deadlines.proposalDue)}
              </strong>
              .
            </span>
          </li>
          <li className="flex gap-3">
            <Step n={3} />
            <span>
              We announce the shortlist on{" "}
              <strong className="font-semibold">{formatDayMonth(deadlines.shortlistAnnounced)}</strong>.
            </span>
          </li>
        </ol>
      </section>

      <div className="flex flex-wrap gap-3">
        {portalOpen && (
          <Button asChild size="lg">
            <Link href={routes.teamPortal}>Go to the team portal</Link>
          </Button>
        )}
        <Button asChild variant={portalOpen ? "ghost" : "primary"} size="lg">
          <Link href="/">Back to the home page</Link>
        </Button>
      </div>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-7 shrink-0 place-items-center rounded-full bg-mint/15 text-small font-semibold text-mint ring-1 ring-mint/30 ring-inset"
    >
      {n}
    </span>
  );
}
