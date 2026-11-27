import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveDot } from "@/components/site/live-dot";
import { RegistrationCountdown } from "@/components/site/registration-countdown";
import { SocialIcon } from "@/components/site/social-icon";
import { proposalTemplateUrl, type Deadlines } from "@/content/deadlines";
import { routes } from "@/content/navigation";
import { whatsappChannel } from "@/content/socials";
import {
  countsDownToRegistrationClose,
  dateParts,
  daysUntil,
  formatDayMonth,
  formatTime,
  type Stage,
} from "@/lib/competition";

type Action = { label: string; href: string; kind: "primary" | "secondary"; icon?: "arrow" | "download" | "whatsapp"; external?: boolean };
type CalloutContent = { status: string; date: string; headline: string; body: string; actions: Action[] };
type LaterStage = Exclude<Stage, "before-registration" | "registration">;

const whatsapp: Action = {
  label: "Follow on WhatsApp",
  href: whatsappChannel.url,
  kind: "primary",
  icon: "whatsapp",
  external: true,
};
const template: Action = { label: "Download proposal template", href: proposalTemplateUrl, kind: "secondary", icon: "download" };

/** What the callout says once registration has closed (before that it is a countdown) */
export function calloutContent(stage: LaterStage, d: Deadlines): CalloutContent {
  switch (stage) {
    case "proposal":
      return {
        status: "Proposal round is live",
        date: d.proposalDue,
        headline: `Proposal submissions close ${formatDayMonth(d.proposalDue)}, ${formatTime(d.proposalDue)}`,
        body: "Upload your proposal as one PDF from the team portal. You can replace it until the deadline; the latest version is the one judged.",
        actions: [{ label: "Submit proposal", href: routes.teamPortal, kind: "primary", icon: "arrow" }, template],
      };
    case "shortlisting":
      return {
        status: "Proposals are in",
        date: d.shortlistAnnounced,
        headline: `Shortlist announced on ${formatDayMonth(d.shortlistAnnounced)}`,
        body: "The judges are reading every proposal. Shortlisted teams get an email, then submit a prototype.",
        actions: [whatsapp],
      };
    case "prototype":
      return {
        status: "Prototype round",
        date: d.prototypeDue,
        headline: `Shortlisted teams: prototypes due ${formatDayMonth(d.prototypeDue)}`,
        body: "Put a demo video on YouTube (public or unlisted) and submit the link from the team portal.",
        actions: [{ label: "Submit prototype", href: routes.teamPortal, kind: "primary", icon: "arrow" }],
      };
    case "finale":
      return {
        status: "Finalists announced",
        date: d.finale,
        headline: `Grand finale on ${formatDayMonth(d.finale)}`,
        body: "Grand finalists present their finished IoT innovations to the judges at the University of Moratuwa, followed by the awarding ceremony.",
        actions: [whatsapp],
      };
    case "over":
      return {
        status: "That's a wrap",
        date: d.finale,
        headline: "See you at SLIoT 2028",
        body: "Thank you to every team that took part. Relive this year's finale in Memories.",
        actions: [{ label: "Browse memories", href: "#memories", kind: "primary" }],
      };
  }
}

const ICONS: Record<NonNullable<Action["icon"]>, ReactNode> = {
  arrow: <ArrowUpRight className="size-4" strokeWidth={1.75} />,
  download: <Download className="size-4" strokeWidth={1.75} />,
  whatsapp: <SocialIcon id="whatsapp" className="size-4" />,
};

/**
 * The live round panel under the hero. It changes with the competition stage, so a
 * visitor always sees the one thing to do now and the date it has to happen by.
 */
export function LiveCallout({ stage, now, deadlines }: { stage: Stage; now: Date; deadlines: Deadlines }) {
  if (countsDownToRegistrationClose(stage)) {
    return (
      <RegistrationCountdown
        opensAt={deadlines.registrationOpens}
        closesAt={deadlines.registrationCloses}
        serverNow={now.getTime()}
      />
    );
  }

  const c = calloutContent(stage, deadlines);
  const { day, month } = dateParts(c.date);
  const days = daysUntil(now, c.date);
  const isLive = stage !== "over";

  return (
    <section id="live" aria-labelledby="live-title" className="relative px-4 py-10 sm:px-8 lg:py-14">
      <div className="relative mx-auto grid max-w-6xl gap-6 overflow-hidden rounded-panel bg-night p-6 ring-1 ring-ocean sm:p-8 md:grid-cols-[auto_minmax(0,1fr)] md:gap-10 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:p-10">
        {/* Soft aqua light in the corner, behind the date */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-28 size-72 rounded-full bg-[radial-gradient(closest-side,rgb(133_255_240/0.14),transparent)]"
        />

        <div className="relative flex items-end gap-4 md:flex-col md:items-start md:gap-2">
          <p className="flex items-baseline gap-2 font-display leading-none text-foam" aria-hidden="true">
            <span className="text-display-lg">{day}</span>
            <span className="text-[clamp(1.5rem,3vw,2.25rem)] text-mint">{month}</span>
          </p>
          {isLive && (
            <p className="pb-1 text-small text-haze md:pb-0">
              {days === 0 ? "Today" : days === 1 ? "1 day to go" : `${days} days to go`}
            </p>
          )}
        </div>

        <div className="relative flex flex-col gap-3">
          <p className="inline-flex items-center gap-2.5 text-small font-semibold text-aqua">
            {isLive && <LiveDot />}
            {c.status}
          </p>
          <h2 id="live-title" className="text-balance font-body text-title font-semibold text-foam sm:text-[1.625rem] sm:leading-tight">
            {c.headline}
          </h2>
          <p className="max-w-[60ch] text-pretty text-body text-haze">{c.body}</p>
        </div>

        <div className="relative flex flex-wrap gap-3 md:col-span-2 lg:col-span-1 lg:flex-col lg:items-stretch">
          {c.actions.map((a) => {
            const icon = a.icon ? ICONS[a.icon] : undefined;
            const inner = a.external ? (
              <a href={a.href} target="_blank" rel="noopener noreferrer">
                {a.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : a.href.startsWith("#") || a.href.endsWith(".docx") ? (
              <a href={a.href}>{a.label}</a>
            ) : (
              <Link href={a.href}>{a.label}</Link>
            );
            return (
              <Button
                key={a.label}
                asChild
                variant={a.kind}
                trailingIcon={a.kind === "primary" ? icon : undefined}
                className={a.kind === "secondary" ? "gap-2" : undefined}
              >
                {a.kind === "secondary" && icon ? (
                  <a href={a.href}>
                    {icon}
                    {a.label}
                  </a>
                ) : (
                  inner
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
