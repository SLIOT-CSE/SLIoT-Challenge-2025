import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Deadlines } from "@/content/deadlines";
import { formatDayMonth, formatTime } from "@/lib/competition";

/** /team before proposal submissions open: no login form, only the date it opens */
export function PortalClosed({ deadlines }: { deadlines: Deadlines }) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8">
      <h1 className="font-display text-display-lg text-foam">Team portal</h1>
      <div className="flex flex-col items-start gap-5 rounded-panel bg-night/60 p-5 ring-1 ring-edge ring-inset sm:p-8">
        <h2 className="text-title font-semibold text-foam">The portal isn&apos;t open yet</h2>
        <p className="text-body text-haze">
          It opens on{" "}
          <strong className="font-semibold text-foam">
            {formatDayMonth(deadlines.proposalOpens)} at {formatTime(deadlines.proposalOpens)}
          </strong>
          , when proposal submissions start. Keep your team code safe until then.
        </p>
        <Button asChild>
          <Link href="/">Back to the home page</Link>
        </Button>
      </div>
    </div>
  );
}
