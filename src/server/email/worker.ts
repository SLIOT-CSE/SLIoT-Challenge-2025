import { and, asc, eq, lte } from "drizzle-orm";
import { formatDayMonth, TIME_ZONE } from "@/lib/competition";
import { renderEmail, type RenderedEmail } from "@/emails/render";
import { deleteExpiredSessions } from "../auth/sessions";
import type { Db } from "../db/client";
import { emailOutbox } from "../db/schema";
import { readDeadlines } from "../settings";

// The background worker (docs/architecture.md, section 7): sends pending emails from the
// outbox about one every two seconds and retries failures with growing gaps, then gives up and
// marks the email failed for the dashboard. Started once from instrumentation.ts.
//
// Times here are real time, never the dev clock: a new email is due at once (next_attempt_at 0)
// and retries are scheduled from the real clock.

/** Gaps before attempts 2 to 6. After the sixth failure the email is marked failed */
export const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 3600_000, 12 * 3600_000];
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;

export type SendEmail = (message: { to: string } & RenderedEmail) => Promise<void>;

export interface WorkerOptions {
  db: Db;
  /** null while SMTP isn't set up: emails wait as pending */
  send: SendEmail | null;
  /** What's still missing, for the pending emails' last_error */
  missing?: string[];
  siteUrl: string;
  now?: () => number;
}

const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TIME_ZONE });

/** Sends the next due email, if any. Returns false when nothing was due */
export async function sendNextEmail({ db, send, missing = [], siteUrl, now = Date.now }: WorkerOptions): Promise<boolean> {
  const at = now();
  const email = db
    .select()
    .from(emailOutbox)
    .where(and(eq(emailOutbox.status, "pending"), lte(emailOutbox.nextAttemptAt, at)))
    .orderBy(asc(emailOutbox.nextAttemptAt), asc(emailOutbox.id))
    .get();
  if (!email) return false;

  if (!send) {
    // No fallback: the email waits, and the dashboard says why. Checked again in a minute
    db.update(emailOutbox)
      .set({ lastError: `SMTP not configured (missing ${missing.join(", ")})`, nextAttemptAt: at + 60_000 })
      .where(eq(emailOutbox.id, email.id))
      .run();
    return true;
  }

  const deadlines = readDeadlines(db);
  try {
    const rendered = await renderEmail(email.template, email.props, {
      siteUrl,
      prototypeDue: `${timeFormat.format(new Date(deadlines.prototypeDue))}, ${formatDayMonth(deadlines.prototypeDue)}`,
      finale: formatDayMonth(deadlines.finale),
    });
    await send({ to: email.toEmail, ...rendered });
    db.update(emailOutbox)
      .set({ status: "sent", attempts: email.attempts + 1, sentAt: at, lastError: null })
      .where(eq(emailOutbox.id, email.id))
      .run();
  } catch (error) {
    const attempts = email.attempts + 1;
    const message = error instanceof Error ? error.message : String(error);
    const gaveUp = attempts >= MAX_ATTEMPTS;
    db.update(emailOutbox)
      .set({
        attempts,
        lastError: message.slice(0, 500),
        status: gaveUp ? "failed" : "pending",
        nextAttemptAt: gaveUp ? email.nextAttemptAt : at + RETRY_DELAYS_MS[attempts - 1],
      })
      .where(eq(emailOutbox.id, email.id))
      .run();
    console.error(`Email ${email.id} (${email.template}) failed, attempt ${attempts}: ${message}`);
  }
  return true;
}

const SEND_GAP_MS = 2000;
const IDLE_GAP_MS = 10_000;
const DAY_MS = 24 * 3600_000;

/** Runs forever: an email every two seconds while there are some, a check every ten seconds otherwise */
export function startEmailWorker(options: WorkerOptions): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastCleanup = 0;

  const tick = async () => {
    if (stopped) return;
    let sent = false;
    try {
      sent = await sendNextEmail(options);
      // Daily: drop expired sessions (architecture: "expired rows cleaned daily")
      const at = (options.now ?? Date.now)();
      if (at - lastCleanup > DAY_MS) {
        deleteExpiredSessions(options.db, at);
        lastCleanup = at;
      }
    } catch (error) {
      console.error("Email worker error", error);
    }
    if (!stopped) timer = setTimeout(tick, sent ? SEND_GAP_MS : IDLE_GAP_MS);
  };
  timer = setTimeout(tick, 1000);

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
