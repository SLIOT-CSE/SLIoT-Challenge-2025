import { describe, expect, it } from "vitest";
import type { OutboxEmail } from "@/lib/data";
import { failedIds, searchEmails, statusLabel } from "./emails-view";

const email = (id: number, over: Partial<OutboxEmail>): OutboxEmail => ({
  id,
  teamId: id,
  toEmail: `leader${id}@example.lk`,
  template: "registration_confirmed",
  props: { teamName: `Team ${id}` },
  status: "sent",
  attempts: 1,
  lastError: null,
  createdAt: id,
  sentAt: id,
  ...over,
});

const emails = [
  email(1, {}),
  email(2, { status: "failed", lastError: "550", sentAt: null }),
  email(3, { status: "pending", attempts: 0, sentAt: null }),
  email(4, { status: "pending", lastError: "timeout", sentAt: null }),
];
const ids = (list: OutboxEmail[]) => list.map((e) => e.id);

describe("searchEmails", () => {
  it("filters by view", () => {
    expect(ids(searchEmails(emails, "unsent", ""))).toEqual([2, 3, 4]);
    expect(ids(searchEmails(emails, "failed", ""))).toEqual([2]);
    expect(ids(searchEmails(emails, "sent", ""))).toEqual([1]);
    expect(ids(searchEmails(emails, "all", ""))).toEqual([1, 2, 3, 4]);
  });

  it("finds by team name or address, ignoring case", () => {
    expect(ids(searchEmails(emails, "all", " TEAM 3 "))).toEqual([3]);
    expect(ids(searchEmails(emails, "all", "leader4@"))).toEqual([4]);
  });
});

describe("statusLabel", () => {
  it("tells a retry apart from an email that hasn't been tried", () => {
    expect(emails.map((e) => statusLabel(e).text)).toEqual(["Sent", "Failed", "Waiting", "Retrying"]);
  });
});

describe("failedIds", () => {
  it("lists only the failed ones", () => {
    expect(failedIds(emails)).toEqual([2]);
  });
});
