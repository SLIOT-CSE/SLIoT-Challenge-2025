"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { categories } from "@/content/categories";
import type { TeamDetail } from "@/lib/data";

/** The team at a glance: its code (with a copy button), category and members. No NICs or contact details. */
export function TeamCard({ team }: { team: TeamDetail }) {
  const category = categories.find((c) => c.id === team.category);
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(team.code);
      setCopied("copied");
      setTimeout(() => setCopied("idle"), 2500);
    } catch {
      setCopied("failed");
    }
  }

  return (
    <section aria-labelledby="team-card-title" className="flex flex-col gap-5 rounded-panel bg-night/60 p-5 ring-1 ring-edge ring-inset sm:p-6">
      <div className="flex flex-col gap-2">
        <h2 id="team-card-title" className="text-small font-semibold tracking-wide text-haze uppercase">
          Your team
        </h2>
        <p className="text-title font-semibold text-foam">{team.name}</p>
        <p className="flex flex-wrap items-center gap-2 text-small text-haze">
          <span className="rounded-full bg-mint/15 px-3 py-1 text-caption font-semibold text-mint ring-1 ring-mint/30 ring-inset">
            {category?.name} team
          </span>
          {team.institutionName && <span>{team.institutionName}</span>}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-control bg-deep/60 p-3 ring-1 ring-edge ring-inset">
        <div className="min-w-0">
          <p className="text-caption text-haze">Team code</p>
          <p className="truncate font-mono text-body font-semibold tracking-wider text-foam">{team.code}</p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 text-small font-semibold text-mint hover:bg-mint/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
        >
          {copied === "copied" ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
          {copied === "copied" ? "Copied" : "Copy"}
          <span className="sr-only"> team code</span>
        </button>
      </div>
      <p role="status" className="-mt-3 text-caption text-haze empty:hidden">
        {copied === "copied" && "Team code copied."}
        {copied === "failed" && "Couldn't copy. Select the code and copy it by hand."}
      </p>

      <div className="flex flex-col gap-3">
        <h3 className="text-small font-semibold tracking-wide text-haze uppercase">Members ({team.members.length})</h3>
        <ol className="flex flex-col divide-y divide-edge/60">
          {team.members.map((m) => (
            <li key={m.id} className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
              <p className="flex flex-wrap items-center gap-2 font-semibold text-foam">
                {m.fullName}
                {m.position === 1 && (
                  <span className="rounded-full bg-mint/15 px-2.5 py-0.5 text-caption text-mint ring-1 ring-mint/30 ring-inset">
                    Team leader
                  </span>
                )}
              </p>
              {team.category === "open" && (
                <p className="text-small text-haze">
                  {m.institutionType === "university" ? "University student" : "School student"}, {m.institutionName}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
