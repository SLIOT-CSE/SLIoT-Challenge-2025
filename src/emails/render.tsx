import { render, toPlainText } from "@react-email/render";
import type { ReactElement } from "react";
import type { EmailTemplate } from "@/lib/data/types";
import { CodeReminder, Finalist, ProposalReceived, PrototypeReceived, RegistrationConfirmed, Shortlisted } from "./templates";

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

function build(template: EmailTemplate, props: Record<string, string>, ctx: RenderContext): { subject: string; element: ReactElement } {
  const teamName = props.teamName ?? "your team";
  const code = props.code ?? "";
  const { siteUrl } = ctx;
  switch (template) {
    case "registration_confirmed":
      return { subject: `You're registered: your SLIoT team code`, element: <RegistrationConfirmed teamName={teamName} code={code} siteUrl={siteUrl} /> };
    case "code_reminder":
      return { subject: "Your SLIoT team code", element: <CodeReminder teamName={teamName} code={code} siteUrl={siteUrl} /> };
    case "proposal_received":
      return { subject: "We received your SLIoT proposal", element: <ProposalReceived teamName={teamName} siteUrl={siteUrl} /> };
    case "shortlisted":
      return {
        subject: "You're shortlisted for the SLIoT Challenge 2027",
        element: <Shortlisted teamName={teamName} prototypeDue={ctx.prototypeDue} siteUrl={siteUrl} />,
      };
    case "prototype_received":
      return { subject: "We received your SLIoT prototype", element: <PrototypeReceived teamName={teamName} siteUrl={siteUrl} /> };
    case "finalist":
      return { subject: "You're a SLIoT Challenge 2027 finalist!", element: <Finalist teamName={teamName} finale={ctx.finale} siteUrl={siteUrl} /> };
  }
}

export async function renderEmail(template: EmailTemplate, props: Record<string, string>, ctx: RenderContext): Promise<RenderedEmail> {
  const { subject, element } = build(template, props, ctx);
  const html = await render(element);
  return { subject, html, text: toPlainText(html) };
}
