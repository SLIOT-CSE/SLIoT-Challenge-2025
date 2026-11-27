import type { EmailTemplate, OutboxEmail } from "@/lib/data";

// What /admin/emails shows, with no React in it.

export type EmailView = "unsent" | "failed" | "sent" | "all";

export const EMAIL_VIEWS: readonly { id: EmailView; label: string }[] = [
  { id: "unsent", label: "Not sent" },
  { id: "failed", label: "Failed" },
  { id: "sent", label: "Sent" },
  { id: "all", label: "All" },
];

export const TEMPLATE_LABELS: Record<EmailTemplate, string> = {
  registration_confirmed: "Registration confirmed",
  code_reminder: "Team code reminder",
  proposal_received: "Proposal received",
  shortlisted: "Shortlisted",
  prototype_received: "Prototype received",
  prototype_reminder: "Prototype reminder",
  semifinalist: "Semi-finalist",
  finalist: "Finalist",
};

export function inView(email: OutboxEmail, view: EmailView): boolean {
  if (view === "all") return true;
  if (view === "unsent") return email.status !== "sent";
  return email.status === view;
}

/** Matches the team name or the address it went to */
export function searchEmails(emails: OutboxEmail[], view: EmailView, search: string): OutboxEmail[] {
  const needle = search.trim().toLowerCase();
  return emails.filter(
    (e) => inView(e, view) && (!needle || e.toEmail.includes(needle) || (e.props.teamName ?? "").toLowerCase().includes(needle)),
  );
}

export interface EmailStatusLabel {
  text: string;
  tone: "mint" | "warning" | "danger" | "neutral";
}

/** A waiting email with an error is being retried; without one it simply hasn't gone yet */
export function statusLabel(email: OutboxEmail): EmailStatusLabel {
  if (email.status === "sent") return { text: "Sent", tone: "mint" };
  if (email.status === "failed") return { text: "Failed", tone: "danger" };
  return email.lastError ? { text: "Retrying", tone: "warning" } : { text: "Waiting", tone: "neutral" };
}

export const failedIds = (emails: OutboxEmail[]): number[] => emails.filter((e) => e.status === "failed").map((e) => e.id);
