import { render, toPlainText } from "@react-email/render";
import type { ReactElement } from "react";
import type { EmailTemplate } from "@/lib/data/types";
import type { CategoryId } from "@/lib/team-rules";
import {
  CodeReminder,
  Finalist,
  ProposalReceived,
  PrototypeReceived,
  PrototypeReminder,
  RegistrationConfirmed,
  Semifinalist,
  Shortlisted,
} from "./templates";

// Turns an outbox row (template name + props) into the subject, HTML and plain text to send.
// Rendered at send time, so a fixed template also fixes emails still waiting to retry.

export interface RenderContext {
  siteUrl: string;
  /** Shown in emails, already formatted in Sri Lanka time */
  prototypeDue: string;
  finale: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function toCategory(value: string | undefined): CategoryId {
  return value === "school" || value === "university" || value === "open" ? value : "open";
}

function build(template: EmailTemplate, props: Record<string, string>, ctx: RenderContext): { subject: string; element: ReactElement } {
  const teamName = props.teamName ?? "your team";
  const code = props.code ?? "";
  const category = toCategory(props.category);
  const { siteUrl } = ctx;
  switch (template) {
    case "registration_confirmed":
      return {
        subject: "Your SLIoT journey begins! Here's your team code",
        element: <RegistrationConfirmed teamName={teamName} code={code} category={category} siteUrl={siteUrl} />,
      };
    case "code_reminder":
      return {
        subject: "Your SLIoT team code is here",
        element: <CodeReminder teamName={teamName} code={code} siteUrl={siteUrl} />,
      };
    case "proposal_received":
      return {
        subject: "Your idea is in! SLIoT proposal received",
        element: <ProposalReceived teamName={teamName} siteUrl={siteUrl} />,
      };
    case "shortlisted":
      return {
        subject: "Your idea has made it through! The journey continues.",
        element: <Shortlisted teamName={teamName} prototypeDue={ctx.prototypeDue} siteUrl={siteUrl} />,
      };
    case "prototype_received":
      return {
        subject: "Your prototype is in! Video received",
        element: <PrototypeReceived teamName={teamName} siteUrl={siteUrl} />,
      };
    case "prototype_reminder":
      return {
        subject: "Your prototype submission is still pending!",
        element: <PrototypeReminder teamName={teamName} siteUrl={siteUrl} />,
      };
    case "semifinalist":
      return {
        subject: "You're through to the Semi Finals! SLIoT Challenge 2027",
        element: <Semifinalist teamName={teamName} siteUrl={siteUrl} />,
      };
    case "finalist":
      return {
        subject: "The arena awaits! You're a Grand Finalist.",
        element: <Finalist teamName={teamName} finale={ctx.finale} siteUrl={siteUrl} />,
      };
  }
}

export async function renderEmail(template: EmailTemplate, props: Record<string, string>, ctx: RenderContext): Promise<RenderedEmail> {
  const { subject, element } = build(template, props, ctx);
  const html = await render(element);
  return { subject, html, text: toPlainText(html) };
}
