import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/components/team/portal";
import type { AuditEntryView, Member, Submission, TeamDetail } from "@/lib/data";
import { CATEGORY_LABELS } from "@/lib/team-rules";
import { StageBadge } from "../badges";
import { describeAudit } from "../describe-audit";
import { formatDateTime, formatDayYear } from "../format";
import { institutionLabel } from "./teams-table";

// The read-only half of the team drawer: who is in the team, what they submitted and what
// has happened to it.

export function TeamDetails({ team, trail }: { team: TeamDetail; trail: AuditEntryView[] }) {
  return (
    <div className="flex flex-col gap-8">
      <section aria-label="Summary" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StageBadge stage={team.stage} />
          <Badge>{CATEGORY_LABELS[team.category]}</Badge>
        </div>
        <dl className="grid gap-x-6 gap-y-3 text-small sm:grid-cols-2">
          <Item label="Team code">
            <code className="font-mono">{team.code}</code>
          </Item>
          <Item label="Institution">{institutionLabel(team)}</Item>
          <Item label="Registered">{formatDayYear(team.createdAt)}</Item>
          <Item label="Last changed">{formatDayYear(team.updatedAt)}</Item>
        </dl>
      </section>

      <Section title={`Members (${team.members.length})`}>
        <ul className="flex flex-col gap-3">
          {team.members.map((m) => (
            <MemberItem key={m.id} member={m} />
          ))}
        </ul>
      </Section>

      <Section title="Submissions">
        {team.submissions.length === 0 ? (
          <p className="text-small text-haze">Nothing submitted yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {team.submissions.map((s) => (
              <SubmissionItem key={s.id} submission={s} />
            ))}
          </ul>
        )}
      </Section>

      <Section title="Activity">
        {trail.length === 0 ? (
          <p className="text-small text-haze">No activity recorded for this team.</p>
        ) : (
          <ol className="flex flex-col gap-4 border-l border-edge pl-4">
            {trail.map((entry) => {
              const d = describeAudit(entry);
              return (
                <li key={entry.id} className="text-small">
                  <p className="text-foam">{d.text}</p>
                  {d.detail.length > 0 && (
                    <ul className="mt-1 flex flex-col gap-0.5 text-caption text-haze">
                      {d.detail.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-0.5 text-caption text-haze">{formatDateTime(entry.createdAt)}</p>
                </li>
              );
            })}
          </ol>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-body font-semibold text-foam">{title}</h3>
      {children}
    </section>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-caption text-haze">{label}</dt>
      <dd className="text-foam">{children}</dd>
    </div>
  );
}

function MemberItem({ member: m }: { member: Member }) {
  return (
    <li className="rounded-control bg-deep/40 p-4 text-small ring-1 ring-edge ring-inset">
      <p className="font-semibold text-foam">
        {m.fullName}
        {m.position === 1 && <span className="ml-2 text-caption font-normal text-mint">Team leader</span>}
      </p>
      <p className="break-all text-haze">{m.email}</p>
      <p className="text-haze">{m.whatsapp}</p>
      <p className="text-haze">
        {m.institutionName} · {m.institutionType === "school" ? "School student" : "University student"}
      </p>
      {m.nic && <p className="font-mono text-caption text-haze">NIC {m.nic}</p>}
    </li>
  );
}

function SubmissionItem({ submission: s }: { submission: Submission }) {
  const isProposal = s.kind === "proposal";
  const link = isProposal ? s.driveUrl : s.youtubeUrl;
  return (
    <li className="flex flex-col gap-1 rounded-control bg-deep/40 p-4 text-small ring-1 ring-edge ring-inset">
      <p className="flex flex-wrap items-center gap-2 font-semibold text-foam">
        {isProposal ? "Proposal" : "Prototype"} v{s.version}
        {s.isCurrent && <Badge tone="mint">Current</Badge>}
      </p>
      {isProposal && s.fileName && (
        <p className="break-all text-haze">
          {s.fileName}
          {s.sizeBytes ? ` · ${formatBytes(s.sizeBytes)}` : ""}
        </p>
      )}
      <p className="text-caption text-haze">Submitted {formatDateTime(s.submittedAt)}</p>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-1 inline-flex w-fit items-center gap-1.5 font-semibold text-mint hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
        >
          {isProposal ? "Open the file" : "Watch the video"}
          <ExternalLink aria-hidden="true" className="size-4" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
    </li>
  );
}
