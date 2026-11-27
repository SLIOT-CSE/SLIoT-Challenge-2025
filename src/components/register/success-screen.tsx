import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CodeReveal } from "./code-reveal";

/** Shown after a successful registration: the code, where it was emailed, and why to keep it safe. */
export function SuccessScreen({
  code,
  teamName,
  leaderEmail,
}: {
  code: string;
  teamName: string;
  leaderEmail: string;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h2 tabIndex={-1} data-step-heading className="text-title font-semibold text-foam outline-hidden">
          You&apos;re registered
        </h2>
        <p className="text-body text-haze">
          <strong className="wrap-break-word font-semibold text-foam">{teamName}</strong> is in. Save this team
          code—you&apos;ll need it when submitting your proposals and prototypes.
        </p>
      </div>

      <CodeReveal code={code} />

      <p className="rounded-control bg-deep/60 p-4 text-small text-haze ring-1 ring-edge ring-inset">
        We&apos;ve emailed this code to <strong className="break-all font-semibold text-foam">{leaderEmail}</strong>.
        Keep it safe: anyone with the code can upload for your team.
      </p>

      <div>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/">Back to the home page</Link>
        </Button>
      </div>
    </div>
  );
}
