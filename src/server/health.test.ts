import { describe, expect, it } from "vitest";
import { openDatabase, openTestDatabase } from "./db/client";
import { emailOutbox } from "./db/schema";
import { checkHealth } from "./health";

function email(status: "pending" | "sent" | "failed") {
  return {
    toEmail: "leader@example.lk",
    template: "registration_confirmed" as const,
    props: {},
    status,
    nextAttemptAt: 0,
    createdAt: 0,
  };
}

describe("checkHealth", () => {
  it("is ok with an empty outbox", () => {
    const db = openTestDatabase();
    expect(checkHealth(() => db)).toEqual({ status: "ok", outbox: { pending: 0, failed: 0 } });
  });

  it("counts waiting and failed emails without failing because of them", () => {
    const db = openTestDatabase();
    db.insert(emailOutbox).values([email("pending"), email("pending"), email("failed"), email("sent")]).run();
    expect(checkHealth(() => db)).toEqual({ status: "ok", outbox: { pending: 2, failed: 1 } });
  });

  it("reports an error, with no details, when the database can't be opened", () => {
    const logged: unknown[] = [];
    const health = checkHealth(
      () => {
        throw new Error("unable to open database file /var/lib/sliot/sliot.db");
      },
      (error) => logged.push(error),
    );
    expect(health).toEqual({ status: "error" });
    expect(logged).toHaveLength(1);
  });

  it("reports an error for a database that was never migrated", () => {
    const empty = openDatabase(":memory:");
    expect(checkHealth(() => empty, () => {})).toEqual({ status: "error" });
  });
});
