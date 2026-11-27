"use client";

import { useState } from "react";
import { PartyPopper, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CompetitionState, TeamDetail } from "@/lib/data";
import { logout } from "@/lib/data";
import { ProposalPanel } from "./proposal-panel";
import { PrototypePanel } from "./prototype-panel";
import { formatWhen, proposalPanel, prototypePanel } from "./portal";
import { StatusTracker } from "./status-tracker";
import { TeamCard } from "./team-card";
import { useLiveNow } from "./use-live-now";

/** The logged-in team's page: progress, the two submission panels and the team card */
export function Dashboard({ team, comp }: { team: TeamDetail; comp: CompetitionState }) {
  // The clock keeps moving from the time the page loaded, so countdowns and locks stay current
  const now = useLiveNow(comp.now, 1000);
  const live: CompetitionState = { ...comp, now };
  const [loggingOut, setLoggingOut] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-display-md text-foam">Team portal</h1>
          <p className="text-body-lg text-haze">
            Welcome back, <strong className="font-semibold text-foam">{team.name}</strong>.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={loggingOut}
          onClick={async () => {
            setLoggingOut(true);
            await logout().catch(() => setLoggingOut(false));
          }}
        >
          {loggingOut ? "Logging out…" : "Log out"}
        </Button>
      </div>

      <div className="rounded-panel bg-night/60 p-5 ring-1 ring-edge ring-inset sm:p-8">
        <StatusTracker stage={team.stage} finaleAt={comp.deadlines.finale} />
      </div>

      <StageBanner team={team} comp={comp} />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-6">
          <ProposalPanel state={proposalPanel(team, live)} now={now} />
          <PrototypePanel state={prototypePanel(team, live)} now={now} />
        </div>
        <div className="lg:sticky lg:top-6">
          <TeamCard team={team} />
        </div>
      </div>
    </div>
  );
}

/** One line of good news for the stages that earn it */
function StageBanner({ team, comp }: { team: TeamDetail; comp: CompetitionState }) {
  if (team.stage === "finalist") {
    return (
      <Banner icon={<PartyPopper aria-hidden="true" className="size-6 shrink-0 text-mint" />} title="You're a finalist">
        See you at the grand finale on <strong className="font-semibold">{formatWhen(comp.deadlines.finale)}</strong>.
        Congratulations!
      </Banner>
    );
  }
  if (team.stage === "shortlisted") {
    return (
      <Banner icon={<Sparkles aria-hidden="true" className="size-6 shrink-0 text-mint" />} title="Your team is shortlisted">
        Next, show us your working prototype in a video. It&apos;s due{" "}
        <strong className="font-semibold">{formatWhen(comp.deadlines.prototypeDue)}</strong>.
      </Banner>
    );
  }
  return null;
}

function Banner({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 rounded-panel bg-mint/10 p-5 ring-1 ring-mint/40 ring-inset sm:p-6">
      {icon}
      <div className="flex flex-col gap-1">
        <h2 className="text-title font-semibold text-foam">{title}</h2>
        <p className="text-body text-haze">{children}</p>
      </div>
    </div>
  );
}
