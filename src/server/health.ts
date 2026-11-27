import { count, inArray } from "drizzle-orm";
import type { Db } from "./db/client";
import { emailOutbox } from "./db/schema";

// What GET /api/health reports (docs/architecture.md, section 10). The deploy fails when the
// database can't be read. Waiting and failed emails are only reported: a slow mailbox must
// not stop a deploy. The route is public, so it carries counts and nothing else.

export type Health =
  | { status: "ok"; outbox: { pending: number; failed: number } }
  | { status: "error" };

/** Takes a function so that failing to open the database is reported too */
export function checkHealth(openDb: () => Db, report: (error: unknown) => void = console.error): Health {
  try {
    const rows = openDb()
      .select({ status: emailOutbox.status, n: count() })
      .from(emailOutbox)
      .where(inArray(emailOutbox.status, ["pending", "failed"]))
      .groupBy(emailOutbox.status)
      .all();
    const of = (status: "pending" | "failed") => rows.find((row) => row.status === status)?.n ?? 0;
    return { status: "ok", outbox: { pending: of("pending"), failed: of("failed") } };
  } catch (error) {
    report(error);
    return { status: "error" };
  }
}
