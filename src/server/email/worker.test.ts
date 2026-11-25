import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { renderEmail } from "@/emails/render";
import { EMAIL_TEMPLATES } from "../db/schema";
import { openTestDatabase } from "../db/client";
import { emailOutbox } from "../db/schema";
import { MAX_ATTEMPTS, RETRY_DELAYS_MS, sendNextEmail, type SendEmail } from "./worker";

const siteUrl = "https://sliot.example";

function dbWithEmail() {
  const db = openTestDatabase();
  db.insert(emailOutbox)
    .values({
      toEmail: "leader@example.lk",
      template: "registration_confirmed",
      props: { code: "SL27-7KQ4-M9XD", teamName: "Wave Riders" },
      nextAttemptAt: 0,
      createdAt: 0,
    })
    .run();
  return db;
}

const row = (db: ReturnType<typeof openTestDatabase>) => db.select().from(emailOutbox).get()!;

describe("email templates", () => {
  it("render every template to HTML and plain text with a subject", async () => {
    for (const template of EMAIL_TEMPLATES) {
      const email = await renderEmail(template, { teamName: "Wave Riders", code: "SL27-7KQ4-M9XD" }, {
        siteUrl,
        prototypeDue: "11:59 pm, 15 June",
        finale: "10 July",
      });
      expect(email.subject.length).toBeGreaterThan(5);
      expect(email.html).toContain("Wave Riders");
      expect(email.html).toContain(`${siteUrl}/team`);
      expect(email.text).toContain("Wave Riders");
    }
  });

  it("show the code large in the registration email", async () => {
    const email = await renderEmail("registration_confirmed", { teamName: "T", code: "SL27-7KQ4-M9XD" }, { siteUrl, prototypeDue: "", finale: "" });
    expect(email.text).toContain("SL27-7KQ4-M9XD");
  });
});

describe("email worker", () => {
  it("sends a due email and marks it sent", async () => {
    const db = dbWithEmail();
    const sent: { to: string; subject: string }[] = [];
    const send: SendEmail = async (m) => void sent.push(m);
    expect(await sendNextEmail({ db, send, siteUrl, now: () => 1000 })).toBe(true);
    expect(sent).toMatchObject([{ to: "leader@example.lk" }]);
    expect(row(db)).toMatchObject({ status: "sent", attempts: 1, sentAt: 1000, lastError: null });
    expect(await sendNextEmail({ db, send, siteUrl, now: () => 2000 })).toBe(false);
  });

  it("waits, without counting attempts, while SMTP isn't set up", async () => {
    const db = dbWithEmail();
    await sendNextEmail({ db, send: null, missing: ["SMTP_PASSWORD"], siteUrl, now: () => 1000 });
    expect(row(db)).toMatchObject({ status: "pending", attempts: 0, lastError: "SMTP not configured (missing SMTP_PASSWORD)" });
  });

  it("retries with growing gaps, then gives up", async () => {
    const db = dbWithEmail();
    const send: SendEmail = async () => {
      throw new Error("421 try later");
    };
    let at = 1000;
    for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt++) {
      await sendNextEmail({ db, send, siteUrl, now: () => at });
      expect(row(db)).toMatchObject({ status: "pending", attempts: attempt, nextAttemptAt: at + RETRY_DELAYS_MS[attempt - 1] });
      // Not due again before the gap
      expect(await sendNextEmail({ db, send, siteUrl, now: () => at + 1 })).toBe(false);
      at += RETRY_DELAYS_MS[attempt - 1];
    }
    await sendNextEmail({ db, send, siteUrl, now: () => at });
    expect(row(db)).toMatchObject({ status: "failed", attempts: MAX_ATTEMPTS, lastError: "421 try later" });
    db.update(emailOutbox).set({ nextAttemptAt: 0 }).where(eq(emailOutbox.id, 1)).run();
    expect(await sendNextEmail({ db, send, siteUrl, now: () => at + 1 })).toBe(false);
  });
});
