import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveCallout } from "@/components/site/live-callout";
import { deadlines } from "@/content/deadlines";
import { STAGES, stageAt, type Stage } from "@/lib/competition";

export const metadata: Metadata = { title: "Callout states", robots: { index: false, follow: false } };

// A moment inside each stage, so every state of the live callout can be reviewed at once
const SAMPLE_NOW: Record<Stage, string> = {
  "before-registration": "2026-11-25T10:00:00+05:30",
  registration: "2026-12-15T10:00:00+05:30",
  proposal: "2027-01-09T10:00:00+05:30",
  shortlisting: "2027-01-15T10:00:00+05:30",
  prototype: "2027-01-28T10:00:00+05:30",
  finale: "2027-02-20T10:00:00+05:30",
  over: "2027-04-01T10:00:00+05:30",
};

export default function CalloutStatesPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-4 py-16">
      <h1 className="px-4 font-display text-display-md sm:px-8">Live callout: every stage</h1>
      {STAGES.map((stage) => {
        const now = new Date(SAMPLE_NOW[stage]);
        // Guard against the sample dates drifting out of their stage
        const actual = stageAt(now, deadlines);
        return (
          <div key={stage} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-4 px-4 text-caption text-haze sm:px-8">
              <span className="font-semibold text-foam">{stage}</span>
              {actual !== stage && <span className="text-danger">sample date is in {actual}</span>}
            </div>
            <LiveCallout stage={stage} now={now} deadlines={deadlines} />
          </div>
        );
      })}
    </main>
  );
}
